'use strict';
const http = require('node:http'), os = require('node:os'), crypto = require('node:crypto');
function privateIPv4(address) {
  const p = address.split('.').map(Number);
  return p.length === 4 && p.every(n => Number.isInteger(n) && n >= 0 && n <= 255) &&
    (p[0] === 10 || p[0] === 192 && p[1] === 168 || p[0] === 172 && p[1] >= 16 && p[1] <= 31);
}
function localIPv4(address) {
  address = String(address || '').replace(/^::ffff:/i, '');
  return address === '127.0.0.1' || privateIPv4(address);
}
async function start(output, options = {}) {
  const addresses = [...new Set(Object.values(os.networkInterfaces()).flat().filter(i => i.family === 'IPv4' && !i.internal && privateIPv4(i.address)).map(i => i.address))];
  const files = {}, manifest = output.manifest;
  files[manifest.rules.path] = Buffer.from(JSON.stringify(output.rules) + '\n').toString('base64');
  for (const item of [...output.assets, ...output.documents]) files[item.path] = Buffer.from(item.data).toString('base64');
  const snapshot = JSON.stringify({schemaVersion: 1, descriptor: Buffer.from(JSON.stringify(manifest) + '\n').toString('base64'), files});
  const pin = String(crypto.randomInt(100000, 1000000));
  let attempts = 0, timer;
  const stop = () => new Promise(resolve => {
    clearTimeout(timer);
    server.close(() => resolve());
    server.closeAllConnections();
  });
  const server = http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const reply = (status, body = '') => {res.writeHead(status, {'Content-Type':'application/json'});res.end(body);};
    if (!localIPv4(req.socket.localAddress) || !localIPv4(req.socket.remoteAddress)) return reply(403);
    const allowedHosts = [...addresses, '127.0.0.1'].map(ip => ip + ':' + server.address().port);
    if (!allowedHosts.includes(req.headers.host)) return reply(403);
    const origin = req.headers.origin;
    if (origin && origin !== 'null' && origin !== 'file://') return reply(403);
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    if (req.method === 'OPTIONS') {res.setHeader('Access-Control-Allow-Methods','GET');return reply(204);}
    if (req.method !== 'GET') return reply(405);
    if (req.url !== '/' + pin + '/package.json') {
      reply(404);
      if (++attempts >= (options.maxAttempts || 20)) res.once('finish', () => stop());
      return;
    }
    reply(200, snapshot);
  });
  await new Promise((resolve, reject) => {server.once('error', reject);server.listen(options.port === undefined ? 8879 : options.port, '0.0.0.0', resolve);});
  const expiresAt = Date.now() + (options.ttl === undefined ? 600000 : options.ttl);
  timer = setTimeout(stop, Math.max(0, expiresAt - Date.now()));
  timer.unref();
  return {server, pin, addresses, expiresAt, stop};
}
module.exports = {start};
