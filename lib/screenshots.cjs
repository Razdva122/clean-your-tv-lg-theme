'use strict';

const fs = require('node:fs');
const path = require('node:path');
const toolkit = require('./toolkit.cjs');
async function screenshots(directory, runtime, options) {
  if (!options.out) throw Error('Screenshots require --out OUTPUT');
  const out = path.resolve(options.out);
  if (fs.existsSync(out) && fs.readdirSync(out).length) throw Error('Screenshot output must be empty');
  const {
    chromium
  } = require('playwright');
  const preview = await toolkit.preview(directory, runtime, {
    edition: options.edition
  });
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(options.executable ? {
        executablePath: options.executable
      } : {})
    });
    const context = await browser.newContext({
      viewport: {
        width: 960,
        height: 595
      },
      locale: 'en-US',
      timezoneId: 'UTC',
      deviceScaleFactor: 1
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-01-01T12:00:00Z'));
    await page.goto(preview.url);
    const frame = page.frames().find(f => f.url().includes('/runtime/'));
    if (!frame) throw Error('Actual reference renderer did not load');
    await frame.waitForFunction(() => window.ThemeRuntime && window.HomeLayoutState && document.getElementById('ctv-theme-style'));
    const columns = await frame.evaluate(() => HomeLayoutState.state());
    if (columns.themeColumns !== preview.state().input.manifest.layout.columns) throw Error('Renderer did not apply theme column defaults');
    fs.mkdirSync(out, {
      recursive: true
    });
    const capture = name => page.locator('iframe').screenshot({
      path: path.join(out, name + '.png'),
      animations: 'disabled'
    });
    await capture('home');
    await frame.locator('#btnInputs').click();
    await capture('inputs');
    // Start the same deterministic scene again before opening trusted Settings.
    await frame.goto(frame.url());
    await frame.waitForFunction(() => document.getElementById('ctv-theme-style'));
    await frame.locator('#btnSettings').click();
    await frame.waitForFunction(() => document.getElementById('ctv-theme-style').disabled);
    await capture('settings');
    if (errors.length) throw Error('Renderer errors: ' + errors.join('; '));
    const report = {
      kind: 'browser-preview',
      hardwareVerified: false,
      edition: options.edition || 'no-root',
      locale: 'en-US',
      clock: '2026-01-01T12:00:00Z',
      browser: browser.version(),
      customExecutable: !!options.executable,
      runtime: {
        status: runtime.meta.status,
        source: runtime.meta.source,
        manifestSha256: runtime.digest
      },
      themeApiVersion: 1,
      scenarios: ['home', 'inputs', 'settings'],
      columns,
      settingsThemeSuspended: true
    };
    fs.writeFileSync(path.join(out, 'provenance.json'), toolkit.encode(report));
    return report;
  } catch (error) {
    if (/Executable doesn't exist/.test(error.message)) throw Error('Pinned Chromium unavailable. Run: npm exec playwright install chromium');
    throw error;
  } finally {
    if (browser) await browser.close();
    preview.server.closeAllConnections();
    await new Promise(resolve => preview.server.close(resolve));
  }
}
module.exports = {
  screenshots
};
