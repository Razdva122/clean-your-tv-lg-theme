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

test('example focus keeps Add app and missing-icon glyphs readable', {
  skip: !process.env.CYTV_THEME_RUNTIME || !process.env.CYTV_THEME_BROWSER
}, async () => {
  const runtime = toolkit.runtime(process.env.CYTV_THEME_RUNTIME);
  const browser = await require('playwright').chromium.launch({headless:true,executablePath:process.env.CYTV_THEME_BROWSER});
  try {
    for (const name of names) {
      const preview = await toolkit.preview(path.join(root,name),runtime);
      const page = await browser.newPage({viewport:{width:960,height:595}});
      try {
        await page.goto(preview.url);
        const frame = page.frames().find(f=>f.url().includes('/runtime/'));
        await frame.waitForFunction(()=>document.getElementById('ctv-theme-style') && document.querySelector('#tiles .focused'));
        const contrast = async selector => frame.locator(selector).evaluate(el=>{
          const card=el.closest('.card'),style=getComputedStyle(card);
          const color=el.tagName.toLowerCase()==='svg'?getComputedStyle(el).stroke:getComputedStyle(card,'::after').color;
          let background=style.backgroundColor;
          if(background==='rgba(0, 0, 0, 0)') background=getComputedStyle(document.getElementById('glass')).backgroundImage.match(/rgba?\([^)]+\)/)[0];
          const luminance=value=>{const rgb=value.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4);});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
          const a=luminance(color),b=luminance(background);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
        });
        await frame.locator('.add-app').dispatchEvent('mouseover');
        assert.ok(await contrast('.add-app svg')>=4.5,name+': selected Add icon contrast');
        await frame.locator('#tiles .item:not(.add-app) .ctv-icon').first().evaluate(img=>{img.src='/missing-demo-icon.svg';});
        await frame.locator('.card.missing-icon').first().waitFor();
        await frame.locator('#tiles .item:not(.add-app)').first().dispatchEvent('mouseover');
        assert.ok(await contrast('.card.missing-icon')>=4.5,name+': selected missing-icon initial contrast');
      } finally {
        await page.close();preview.server.closeAllConnections();await new Promise(resolve=>preview.server.close(resolve));
      }
    }
  } finally {await browser.close();}
});
