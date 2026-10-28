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
        assert.match(await (await fetch(p.url)).text(), /Browser preview/);
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
