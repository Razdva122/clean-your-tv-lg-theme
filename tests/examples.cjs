'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const toolkit = require('../lib/toolkit.cjs');
const root = path.resolve(__dirname, '../examples');
const names = fs.readdirSync(root).filter(name => fs.existsSync(path.join(root, name, 'theme.json')));

test('shipped examples have useful browser previews instead of scaffold pixels', () => {
  for (const name of names) {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, name, 'theme.json')));
    const asset = manifest.assets.find(asset => asset.id === manifest.previewAssetId);
    const image = fs.readFileSync(path.join(root, name, asset.path));
    assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', name);
    assert.equal(image.readUInt32BE(16), 960, name + ': full Home preview width');
    assert.equal(image.readUInt32BE(20), 540, name + ': full Home preview height');
    assert.ok(image.length <= 300 * 1024, name + ': preview budget');
    assert.equal(asset.width, 960, name + ': declared width matches capture');
    assert.equal(asset.height, 540, name + ': declared height matches capture');
  }
});

test('every shipped theme compiles against the actual shared contract', {
  skip: !process.env.CYTV_THEME_RUNTIME
}, async () => {
  const runtime = toolkit.runtime(process.env.CYTV_THEME_RUNTIME);
  for (const name of names) {
    const compiled = await toolkit.compile(path.join(root, name), runtime);
    assert.ok(compiled.manifest.layout.columns >= 1 && compiled.manifest.layout.columns <= 8);
    assert.ok(compiled.rules.rules.length > 0, name + ': usable rules');
  }
});
