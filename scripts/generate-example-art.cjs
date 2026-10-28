'use strict';

// Original procedural artwork; no downloaded photographs or competitor assets.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const width = 1920, height = 1080;
const table = Array.from({length: 256}, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = table[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
assert.equal(crc32(Buffer.from('123456789')), 0xcbf43926);
function chunk(name, data) {
  const type = Buffer.from(name), header = Buffer.alloc(4), checksum = Buffer.alloc(4);
  header.writeUInt32BE(data.length);
  checksum.writeUInt32BE(crc32(Buffer.concat([type, data])));
  return Buffer.concat([header, type, data, checksum]);
}
function png(pixel) {
  const stride = width * 3 + 1, scanlines = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = pixel(x, y), offset = y * stride + 1 + x * 3;
      for (let channel = 0; channel < 3; channel++) scanlines[offset + channel] = Math.round(Math.max(0, Math.min(255, color[channel])));
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4);
  header[8] = 8; header[9] = 2;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(scanlines, {level: 9})), chunk('IEND', Buffer.alloc(0))]);
}
// Original cut-paper landscape. Flat colors are intentional: no gradients or glow.
const sky = [215, 230, 233], sun = [231, 163, 76];
const layers = [
  {color: [168, 197, 204], points: [[0,280],[145,209],[279,260],[411,201],[522,236],[680,177],[803,229],[960,198]]},
  {color: [113, 156, 169], points: [[0,361],[125,282],[261,326],[381,298],[538,356],[674,287],[816,302],[960,264]]},
  {color: [48, 94, 118], points: [[0,464],[166,375],[288,417],[444,376],[617,432],[795,353],[960,401]]}
];
function edge(points, x) {
  for (let i = 1; i < points.length; i++) if (x <= points[i][0]) {
    const a = points[i - 1], b = points[i];
    return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
  }
  return points[points.length - 1][1];
}
const bytes = png((px, py) => {
  const x = px / 2, y = py / 2;
  let color = (x - 742) ** 2 + (y - 131) ** 2 <= 53 ** 2 ? sun : sky;
  for (const layer of layers) if (y >= edge(layer.points, x)) color = layer.color;
  return color;
});
assert.ok(bytes.length <= 2 * 1024 * 1024, 'wallpaper image budget');
const file = path.resolve(__dirname, '../examples/aurora/assets/wallpaper.png');
fs.writeFileSync(file, bytes);
console.log('Postcard: original 1920x1080 PNG, ' + bytes.length + ' bytes');
