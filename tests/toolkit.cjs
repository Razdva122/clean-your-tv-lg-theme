'use strict';

const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path');
const dir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'ctv-theme-'));
const toolkit = () => require('../lib/toolkit.cjs');
test('scaffold creates independent theme identity and refuses overwrite', () => {
  const root = dir();
  try {
    toolkit().init(path.join(root, 'themes', 'ocean'), {
      name: 'Ocean',
      repository: 'https://github.com/example/themes'
    });
    const m = JSON.parse(fs.readFileSync(path.join(root, 'themes/ocean/theme.json')));
    assert.equal(m.id, 'github:example/themes:ocean');
    assert.equal(m.themeVersion, '1.0.0');
    assert.throws(() => toolkit().init(path.join(root, 'themes/ocean'), {}), /empty|exists/);
  } finally {
    fs.rmSync(root, {
      recursive: true,
      force: true
    });
  }
});
test('runtime absent fails clearly; candidate files must match pinned hashes', () => {
  assert.throws(() => toolkit().runtime('/missing'), /runtime/i);
  const root = dir();
  try {
    fs.writeFileSync(path.join(root, 'runtime.json'), JSON.stringify({
      schemaVersion: 1,
      themeApiVersion: 1,
      status: 'candidate',
      files: [{
        path: 'compiler.cjs',
        size: 1,
        sha256: '0'.repeat(64)
      }]
    }));
    fs.writeFileSync(path.join(root, 'compiler.cjs'), 'x');
    assert.throws(() => toolkit().runtime(root), /integrity|hash/i);
  } finally {
    fs.rmSync(root, {
      recursive: true,
      force: true
    });
  }
});
test('runtime rejects traversal and unlisted files before loading executable compiler', () => {
  const root = dir();
  try {
    fs.writeFileSync(path.join(root, 'runtime.json'), JSON.stringify({
      schemaVersion: 1,
      themeApiVersion: 1,
      status: 'candidate',
      files: [{
        path: '../escape',
        size: 1,
        sha256: '0'.repeat(64)
      }]
    }));
    assert.throws(() => toolkit().runtime(root), /path/i);
  } finally {
    fs.rmSync(root, {
      recursive: true,
      force: true
    });
  }
});
test('collection forbids duplicate identities and points to descriptors beneath root', () => {
  const root = dir();
  try {
    for (const n of ['one', 'two']) {
      fs.mkdirSync(path.join(root, n));
      fs.writeFileSync(path.join(root, n, 'cytv-theme.json'), JSON.stringify({
        id: 'github:a/b:' + n,
        title: n,
        themeVersion: '1.0.0',
        source: {
          repository: 'https://github.com/a/b'
        }
      }));
    }
    const index = toolkit().collection(['one', 'two'].map(n => path.join(root, n)), root);
    assert.equal(index.themes.length, 2);
    assert.equal(index.themes[0].path, 'one/cytv-theme.json');
    assert.throws(() => toolkit().collection([path.join(root, 'one'), path.join(root, 'one')], root), /unique/);
    assert.throws(() => toolkit().collection([path.join(root, 'one')], path.join(root, 'outside')), /path/);
  } finally {
    fs.rmSync(root, {
      recursive: true,
      force: true
    });
  }
});
test('source loading rejects asset symlink and traversal', () => {
  const root = dir();
  try {
    toolkit().init(path.join(root, 'theme'));
    const file = path.join(root, 'theme/theme.json'),
      m = JSON.parse(fs.readFileSync(file));
    m.assets[0].path = '../secret';
    fs.writeFileSync(file, JSON.stringify(m));
    assert.throws(() => toolkit().source(path.join(root, 'theme')), /path/);
    m.assets[0].path = 'assets/link.png';
    fs.writeFileSync(file, JSON.stringify(m));
    fs.symlinkSync(path.join(root, 'theme/LICENSE.txt'), path.join(root, 'theme/assets/link.png'));
    assert.throws(() => toolkit().source(path.join(root, 'theme')), /Symlink/);
  } finally {
    fs.rmSync(root, {
      recursive: true,
      force: true
    });
  }
});
test('submission draft requires real review evidence and preserves source/distribution revisions', () => {
  const root = dir();
  try {
    const dist = path.join(root, 'dist');
    fs.mkdirSync(dist);
    const m = {
      id: 'github:example/themes:ocean',
      title: 'Ocean',
      description: 'Blue theme',
      author: {
        name: 'Example',
        url: 'https://github.com/example'
      },
      themeVersion: '1.0.0',
      themeApiVersion: 1,
      source: {
        repository: 'https://github.com/example/themes',
        commit: 'a'.repeat(40)
      },
      license: {
        identifier: 'MIT',
        textPath: 'LICENSE',
        creditsPath: 'CREDITS.md'
      },
      rules: {
        path: 'rules.json'
      },
      assets: [{
        id: 'preview',
        path: 'preview.png'
      }],
      documents: [{
        path: 'LICENSE'
      }, {
        path: 'CREDITS.md'
      }],
      previewAssetId: 'preview'
    };
    for (const name of ['rules.json', 'LICENSE', 'CREDITS.md', 'preview.png']) fs.writeFileSync(path.join(dist, name), 'data');
    fs.writeFileSync(path.join(dist, 'cytv-theme.json'), JSON.stringify(m));
    assert.throws(() => toolkit().submission(dist, {
      out: path.join(root, 'draft')
    }), /evidence/);
    const r = toolkit().submission(dist, {
      out: path.join(root, 'draft'),
      url: 'https://raw.githubusercontent.com/example/themes/' + 'b'.repeat(40) + '/dist/ocean/cytv-theme.json',
      evidence: 'Browser: Home, Inputs and standard Settings checked.',
      date: '2026-10-28'
    });
    assert.equal(r.sourceCommit, 'a'.repeat(40));
    assert.ok(r.descriptorUrl.includes('b'.repeat(40)));
    assert.ok(fs.existsSync(path.join(root, 'draft', 'registry', 'example--themes--ocean.json')));
  } finally {
    fs.rmSync(root, {
      recursive: true,
      force: true
    });
  }
});
test('source input ceilings reject oversized images before allocating their bytes', () => {
  const root = dir();
  try {
    toolkit().init(path.join(root, 'theme'));
    const image = path.join(root, 'theme/assets/preview.png');
    fs.truncateSync(image, 16 * 1024 * 1024 + 1);
    assert.throws(() => toolkit().source(path.join(root, 'theme')), /large|limit/);
  } finally {
    fs.rmSync(root, {
      recursive: true,
      force: true
    });
  }
});
test('submission rejects identity traversal before creating review output', () => {
  const root = dir();
  try {
    const dist = path.join(root, 'dist');
    fs.mkdirSync(dist);
    fs.writeFileSync(path.join(dist, 'cytv-theme.json'), JSON.stringify({
      id: 'github:../../escape:bad'
    }));
    assert.throws(() => toolkit().submission(dist, {
      out: path.join(root, 'draft'),
      evidence: 'Actual browser result',
      date: '2026-10-28',
      url: 'https://raw.githubusercontent.com/../../' + 'a'.repeat(40) + '/cytv-theme.json'
    }), /identity/);
    assert.equal(fs.existsSync(path.join(root, 'draft')), false);
  } finally {
    fs.rmSync(root, {
      recursive: true,
      force: true
    });
  }
});
