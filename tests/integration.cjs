'use strict';

const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path'),
  cp = require('node:child_process'),
  t = require('../lib/toolkit.cjs');
const runtimePath = process.env.CYTV_THEME_RUNTIME;
test('real pinned renderer: valid reload, last-valid retention, isolated allowlist and both editions', {
  skip: !runtimePath
}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ctv-preview-'));
  try {
    const theme = path.join(root, 'ocean');
    t.init(theme, {
      repository: 'https://github.com/example/themes'
    });
    const rt = t.runtime(runtimePath);
    for (const edition of ['no-root', 'root']) {
      const p = await t.preview(theme, rt, {
        edition
      });
      try {
        assert.match(await (await fetch(p.url)).text(), /Theme preview/);
        const renderer = await fetch(p.url + 'runtime/' + rt.meta.preview[edition]);
        assert.equal(renderer.status, 200);
        assert.match(await renderer.text(), /theme-preview.js/);
        for (const name of ['.git/config', 'theme.json', 'runtime/theme-api/compile.cjs', 'runtime/package.json', 'runtime/preview/../../package.json']) assert.equal((await fetch(p.url + name)).status, 404);
        const before = p.state();
        fs.writeFileSync(path.join(theme, 'theme.css'), '.ctv-clock { color: #abcdef; }');
        await p.refresh();
        assert.equal(p.state().revision, before.revision + 1);
        assert.match(p.state().css, /171,205,239/);
        const valid = p.state().css;
        fs.writeFileSync(path.join(theme, 'theme.css'), 'body { position: fixed; }');
        await p.refresh();
        assert.ok(p.state().error);
        assert.equal(p.state().css, valid);
        fs.writeFileSync(path.join(theme, 'theme.css'), '.ctv-clock { color: #ffffff; }');
        await p.refresh();
        assert.equal(p.state().error, null);
      } finally {
        await new Promise(r => p.server.close(r));
      }
    }
  } finally {
    fs.rmSync(root, {
      recursive: true,
      force: true
    });
  }
});
test('committed source builds are deterministic; rule and descriptor hashes match real bytes', {
  skip: !runtimePath
}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ctv-build-'));
  try {
    const theme = path.join(root, 'source', 'themes', 'ocean');
    t.init(theme, {
      repository: 'https://github.com/example/themes'
    });
    const git = (...args) => cp.execFileSync('git', ['-C', path.join(root, 'source'), ...args], {
      encoding: 'utf8'
    }).trim();
    git('init', '-q');
    git('add', '.');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'theme source');
    const commit = git('rev-parse', 'HEAD'),
      rt = t.runtime(runtimePath);
    for (const n of ['one', 'two']) {
      const out = path.join(root, n),
        m = await t.build(theme, rt, {
          repository: 'https://github.com/example/themes',
          commit,
          out
        });
      assert.equal(t.hash(fs.readFileSync(path.join(out, m.rules.path))), m.rules.sha256);
      assert.equal(m.source.commit, commit);
      assert.ok(m.rules.path.includes(m.rules.sha256));
      for (const asset of m.assets) assert.ok(asset.path.includes(asset.sha256));
    }
    assert.deepEqual(fs.readFileSync(path.join(root, 'one/cytv-theme.json')), fs.readFileSync(path.join(root, 'two/cytv-theme.json')));
    const draft = path.join(root, 'submission');
    const record = t.submission(path.join(root, 'one'), {
      out: draft,
      url: 'https://raw.githubusercontent.com/example/themes/' + 'b'.repeat(40) + '/dist/ocean/cytv-theme.json',
      evidence: 'Browser: Home, Inputs and standard Settings checked in local renderer.',
      date: '2026-10-28'
    });
    const validator = require(path.join(rt.root, rt.meta.submissionValidator));
    validator.validateRecord(record);
    validator.validateFiles(record, draft);
    const collection = t.collection([path.join(root, 'one')], root);
    require(path.join(rt.root, rt.meta.policy)).validateCollection(collection);
    fs.appendFileSync(path.join(theme, 'theme.css'), '\n');
    await assert.rejects(t.build(theme, rt, {
      repository: 'https://github.com/example/themes',
      commit,
      out: path.join(root, 'dirty')
    }), /Commit/);
  } finally {
    fs.rmSync(root, {
      recursive: true,
      force: true
    });
  }
});
test('real browser captures Home, Inputs and unthemed Settings', {
  skip: !runtimePath || !process.env.CYTV_THEME_BROWSER
}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ctv-shots-'));
  try {
    const theme = path.join(root, 'ocean');
    t.init(theme, {
      repository: 'https://github.com/example/themes'
    });
    const report = await require('../lib/screenshots.cjs').screenshots(theme, t.runtime(runtimePath), {
      out: path.join(root, 'shots'),
      executable: process.env.CYTV_THEME_BROWSER
    });
    assert.equal(report.settingsThemeSuspended, true);
    for (const name of ['home', 'inputs', 'settings']) assert.ok(fs.statSync(path.join(root, 'shots', name + '.png')).size > 1000);
  } finally {
    fs.rmSync(root, {
      recursive: true,
      force: true
    });
  }
});
test('distinct asset identities keep unique distribution paths for identical image bytes', {
  skip: !runtimePath
}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ctv-identical-assets-'));
  try {
    const theme = path.join(root, 'source', 'themes', 'ocean');
    t.init(theme, {
      repository: 'https://github.com/example/themes'
    });
    const manifestFile = path.join(theme, 'theme.json');
    const manifest = JSON.parse(fs.readFileSync(manifestFile));
    fs.copyFileSync(path.join(theme, 'assets/preview.png'), path.join(theme, 'assets/wallpaper.png'));
    manifest.assets.push({
      ...manifest.assets[0],
      id: 'wallpaper',
      path: 'assets/wallpaper.png'
    });
    fs.writeFileSync(manifestFile, JSON.stringify(manifest));
    const git = (...args) => cp.execFileSync('git', ['-C', path.join(root, 'source'), ...args], {
      encoding: 'utf8'
    }).trim();
    git('init', '-q');
    git('add', '.');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'identical images with distinct identities');
    const out = path.join(root, 'dist');
    const built = await t.build(theme, t.runtime(runtimePath), {
      repository: 'https://github.com/example/themes',
      commit: git('rev-parse', 'HEAD'),
      out
    });
    assert.equal(built.assets.length, 2);
    assert.equal(built.assets[0].sha256, built.assets[1].sha256);
    assert.notEqual(built.assets[0].path, built.assets[1].path);
    for (const asset of built.assets) {
      assert.equal(t.hash(fs.readFileSync(path.join(out, asset.path))), asset.sha256);
    }
  } finally {
    fs.rmSync(root, {
      recursive: true,
      force: true
    });
  }
});
test('restoring identical preview asset bytes clears a transient read error', {
  skip: !runtimePath
}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ctv-recovered-asset-'));
  let preview;
  try {
    const theme = path.join(root, 'ocean');
    t.init(theme, {
      repository: 'https://github.com/example/themes'
    });
    preview = await t.preview(theme, t.runtime(runtimePath));
    const file = path.join(theme, 'assets/preview.png');
    const bytes = fs.readFileSync(file);
    const before = preview.state();
    fs.unlinkSync(file);
    await preview.refresh();
    assert.match(preview.state().error, /ENOENT/);
    assert.equal(preview.state().css, before.css);
    fs.writeFileSync(file, bytes);
    await preview.refresh();
    assert.equal(preview.state().error, null);
    assert.equal(preview.state().css, before.css);
    assert.equal(preview.state().revision, before.revision);
  } finally {
    if (preview) {
      preview.server.closeAllConnections();
      await new Promise(resolve => preview.server.close(resolve));
    }
    fs.rmSync(root, {
      recursive: true,
      force: true
    });
  }
});
function noisePng(width, height) {
  const zlib = require('node:zlib');
  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = crc >>> 1 ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }
  function chunk(type, bytes) {
    const name = Buffer.from(type),
      size = Buffer.alloc(4),
      crc = Buffer.alloc(4);
    size.writeUInt32BE(bytes.length);
    crc.writeUInt32BE(crc32(Buffer.concat([name, bytes])));
    return Buffer.concat([size, name, bytes, crc]);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  let seed = 0x12345678;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const at = y * (width * 4 + 1) + 1 + x * 4;
    for (let channel = 0; channel < 3; channel++) {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      scanlines[at + channel] = seed & 255;
    }
    scanlines[at + 3] = 255;
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(scanlines)), chunk('IEND', Buffer.alloc(0))]);
}
test('large valid wallpaper uses bounded Blob CSS and runtime releases replaced/reset handles', {
  skip: !runtimePath || !process.env.CYTV_THEME_BROWSER
}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ctv-large-wallpaper-'));
  let preview, browser;
  try {
    const theme = path.join(root, 'ocean');
    t.init(theme, {
      repository: 'https://github.com/example/themes'
    });
    const png = noisePng(640, 360);
    assert.ok(png.length > 256 * 1024 && png.length < 2 * 1024 * 1024);
    fs.writeFileSync(path.join(theme, 'assets/wallpaper.png'), png);
    const manifestFile = path.join(theme, 'theme.json');
    const manifest = JSON.parse(fs.readFileSync(manifestFile));
    manifest.assets.push({
      id: 'wallpaper',
      path: 'assets/wallpaper.png',
      mediaType: 'image/png',
      width: 640,
      height: 360
    });
    manifest.defaults.wallpaperAssetId = 'wallpaper';
    fs.writeFileSync(manifestFile, JSON.stringify(manifest));
    fs.writeFileSync(path.join(theme, 'theme.css'), '.ctv-home { background-image: url(assets/wallpaper.png); }');
    preview = await t.preview(theme, t.runtime(runtimePath));
    browser = await require('playwright').chromium.launch({
      headless: true,
      executablePath: process.env.CYTV_THEME_BROWSER
    });
    const page = await browser.newPage();
    await page.addInitScript(() => {
      window.ctvBlobAudit = {
        created: [],
        revoked: []
      };
      const create = URL.createObjectURL.bind(URL),
        revoke = URL.revokeObjectURL.bind(URL);
      URL.createObjectURL = blob => {
        const url = create(blob);
        ctvBlobAudit.created.push(url);
        return url;
      };
      URL.revokeObjectURL = url => {
        ctvBlobAudit.revoked.push(url);
        revoke(url);
      };
    });
    await page.goto(preview.url);
    const frame = page.frames().find(f => f.url().includes('/runtime/'));
    await frame.waitForFunction(() => document.getElementById('ctv-theme-style'));
    const accepted = await frame.evaluate(async () => {
      const css = document.getElementById('ctv-theme-style').textContent;
      const image = new Image();
      image.src = css.match(/blob:[^"\)]+/)[0];
      await image.decode();
      return {
        css,
        width: image.naturalWidth,
        height: image.naturalHeight,
        created: ctvBlobAudit.created.slice()
      };
    });
    assert.ok(accepted.css.length < 256 * 1024);
    assert.ok(!accepted.css.includes('data:image'));
    assert.equal(accepted.width, 640);
    assert.equal(accepted.height, 360);
    fs.appendFileSync(path.join(theme, 'theme.css'), '\n.ctv-clock { color: #abcdef; }');
    await preview.refresh();
    await frame.waitForFunction(() => ctvBlobAudit.created.length >= 4);
    const replaced = await frame.evaluate(() => ctvBlobAudit.revoked.slice());
    for (const url of accepted.created) assert.ok(replaced.includes(url));
    const unchanged = await (await fetch(preview.url + 'theme-state?revision=' + preview.state().revision)).json();
    assert.deepEqual(Object.keys(unchanged).sort(), ['error', 'revision']);
    const previousCss = await frame.evaluate(() => document.getElementById('ctv-theme-style').textContent);
    await frame.evaluate(() => {
      window.savedThemeApply = ThemeRuntime.apply;
      ThemeRuntime.apply = function () {
        throw new Error('Injected candidate rejection');
      };
    });
    fs.appendFileSync(path.join(theme, 'theme.css'), '\n.ctv-label { color: #ffffff; }');
    await preview.refresh();
    await frame.waitForFunction(() => ctvBlobAudit.created.length >= 6);
    const rejected = await frame.evaluate(() => ({
      created: ctvBlobAudit.created.slice(),
      revoked: ctvBlobAudit.revoked.slice(),
      css: document.getElementById('ctv-theme-style').textContent
    }));
    assert.equal(rejected.css, previousCss);
    for (const url of rejected.created.slice(4)) assert.ok(rejected.revoked.includes(url));
    await frame.evaluate(() => {
      ThemeRuntime.apply = window.savedThemeApply;
    });
    await frame.waitForFunction(count => ctvBlobAudit.created.length >= count + 2, rejected.created.length);
    const reset = await frame.evaluate(() => {
      ThemeRuntime.reset();
      return {
        created: ctvBlobAudit.created,
        revoked: ctvBlobAudit.revoked
      };
    });
    for (const url of reset.created) assert.ok(reset.revoked.includes(url));
  } finally {
    if (browser) await browser.close();
    if (preview) {
      preview.server.closeAllConnections();
      await new Promise(resolve => preview.server.close(resolve));
    }
    fs.rmSync(root, {
      recursive: true,
      force: true
    });
  }
});
