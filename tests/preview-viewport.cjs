'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const t = require('../lib/toolkit.cjs');

test('desktop preview fits a complete TV canvas without shrinking its layout viewport', {
  skip: !process.env.CYTV_THEME_RUNTIME || !process.env.CYTV_THEME_BROWSER
}, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctv-viewport-'));
  let preview, browser;
  try {
    t.init(path.join(dir, 'test'));
    preview = await t.preview(path.join(dir, 'test'), t.runtime(process.env.CYTV_THEME_RUNTIME));
    browser = await require('playwright').chromium.launch({headless: true, executablePath: process.env.CYTV_THEME_BROWSER});
    const page = await browser.newPage({viewport: {width: 960, height: 595}});
    await page.goto(preview.url);
    const frame = page.frames().find(frame => frame.url().includes('/runtime/'));
    await frame.waitForFunction(() => window.HomeLayoutState && document.querySelector('#tiles .focused'));
    assert.deepEqual(await frame.evaluate(() => [innerWidth, innerHeight]), [1920, 1080]);
    const checkFit = async width => {
      await page.waitForFunction(() => {
        const box = document.querySelector('iframe').getBoundingClientRect();
        return box.x >= 0 && box.right <= innerWidth + 1 && box.bottom <= innerHeight + 1;
      });
      const box = await page.locator('iframe').boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width + 1, 'whole TV fits horizontally');
      assert.ok(Math.abs(box.width / box.height - 16 / 9) < .01, 'TV aspect ratio is preserved');
      assert.ok(box.y + box.height <= (await page.viewportSize()).height + 1, 'whole TV fits vertically');
    };
    await checkFit(960);
    await page.setViewportSize({width: 640, height: 400});
    await checkFit(640);
    assert.deepEqual(await frame.evaluate(() => [innerWidth, innerHeight]), [1920, 1080]);
    // Generic input belongs to this interaction test, not the captured app inventory.
    await frame.evaluate(() => { TV_APPS.inputs = [{label: 'HDMI 1', appId: 'preview.hdmi1'}]; });
    await frame.locator('#btnInputs').click();
    await frame.locator('#inputsPanel:not(.hidden)').waitFor();
  } finally {
    if (browser) await browser.close();
    if (preview) {preview.server.closeAllConnections(); await new Promise(resolve => preview.server.close(resolve));}
    fs.rmSync(dir, {recursive: true, force: true});
  }
});
