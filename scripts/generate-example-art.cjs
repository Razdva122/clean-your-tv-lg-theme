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
const mix = (a, b, amount) => a.map((value, index) => value * (1 - amount) + b[index] * amount);
function aurora(x, y) {
  let color = mix([7, 16, 29], [13, 29, 38], y / height);
  const mint = 1470 - y * .34 + Math.sin(y / 230) * 150;
  const violet = 1850 - y * .83 + Math.sin(y / 190 + 1) * 90;
  const first = Math.exp(-Math.pow((x - mint) / 155, 2)) * (.24 + y / height * .3);
  const second = Math.exp(-Math.pow((x - violet) / 220, 2)) * .37;
  color = mix(color, [92, 183, 158], first);
  return mix(color, [124, 103, 167], second);
}
function gallery(x, y) {
  let color = mix([238, 239, 226], [216, 225, 205], y / height);
  if (y > 620 + Math.sin(x / 410) * 46 + Math.cos(x / 670) * 24) color = [195, 207, 181];
  if (y > 750 + Math.sin(x / 390 + .8) * 76) color = [147, 172, 148];
  if (y > 880 + Math.sin(x / 470 + 2) * 72) color = [91, 126, 107];
  if (y > 1000 + Math.sin(x / 640 + 1) * 60) color = [53, 86, 70];
  const grain = ((x * 13 + y * 7) % 19 - 9) * .12;
  return color.map(value => value + grain);
}
for (const [name, paint] of Object.entries({aurora, gallery})) {
  const file = path.resolve(__dirname, '../examples', name, 'assets/wallpaper.png');
  const bytes = png(paint);
  assert.ok(bytes.length <= 2 * 1024 * 1024, 'wallpaper image budget');
  fs.writeFileSync(file, bytes);
  console.log(name + ': original 1920x1080 PNG, ' + bytes.length + ' bytes');
}
