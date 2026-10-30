'use strict';
const http = require('node:http');
const MAX_BODY = 10 * 1024 * 1024;
function snapshot(output) {
  const files = {};
  files[output.manifest.rules.path] = Buffer.from(JSON.stringify(output.rules) + '\n').toString('base64');
  for (const item of [...output.assets, ...output.documents]) files[item.path] = Buffer.from(item.data).toString('base64');
  return JSON.stringify({schemaVersion: 1, descriptor: Buffer.from(JSON.stringify(output.manifest) + '\n').toString('base64'), files});
}
function validate(tv, pin) {
  if (typeof tv !== 'string' || !/^(0|[1-9]\d{0,2})\.(0|[1-9]\d{0,2})\.(0|[1-9]\d{0,2})\.(0|[1-9]\d{0,2})$/.test(tv)) throw Error('Enter the TV private IPv4 address without a URL or port.');
  const p = tv.split('.').map(Number);
  if (p.some(n => n > 255) || !(p[0] === 10 || p[0] === 192 && p[1] === 168 || p[0] === 172 && p[1] >= 16 && p[1] <= 31)) throw Error('Enter the TV private IPv4 address without a URL or port.');
  if (typeof pin !== 'string' || !/^\d{6}$/.test(pin)) throw Error('Enter the six-digit PIN shown on TV.');
}
async function send(output, tv, pin, options = {}) {
  validate(tv, pin);
  const body = snapshot(output);
  if (Buffer.byteLength(body) > MAX_BODY) throw Error('Theme exceeds the 10 MiB transfer limit.');
  // Internal test seam only: CLI and preview never expose destination overrides.
  const destination = options.testDestination || {host: tv, port: 8879};
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error) => {if (settled) return; settled = true; clearTimeout(timer); if (error) {req.destroy(); reject(Error(error));} else resolve({sent: true});};
    const req = http.request({hostname: destination.host, port: destination.port, path: '/v1/theme', method: 'POST', agent: false, headers: {'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'X-CYTV-PIN': pin}}, res => {
      let bytes = 0;
      res.on('data', chunk => {bytes += chunk.length; if (bytes > 65536) finish('TV response exceeded its limit.');});
      res.on('aborted', () => finish('Could not send theme. Reopen Receive from computer on TV and retry.'));
      res.on('error', () => finish('Could not send theme. Reopen Receive from computer on TV and retry.'));
      res.on('end', () => finish(res.statusCode === 202 ? null : res.statusCode === 401 || res.statusCode === 403 ? 'Check the PIN on TV and retry.' : 'TV did not receive the theme. Reopen Receive from computer and retry.'));
    });
    const timer = setTimeout(() => finish('Send timed out. Reopen Receive from computer on TV and retry.'), Math.min(20000, Math.max(1, options.timeout || 20000)));
    req.on('error', () => finish('Could not send theme. Check the TV receiver and home network, then retry.'));
    req.end(body);
  });
}
module.exports = {send, validate, snapshot};
