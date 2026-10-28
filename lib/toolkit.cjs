'use strict';

const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto'),
  http = require('node:http'),
  cp = require('node:child_process');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const encode = value => JSON.stringify(value, null, 2) + '\n';
function safe(name) {
  if (typeof name !== 'string' || !name || name.startsWith('/') || name.includes('\\') || name.split('/').some(p => !p || p === '.' || p === '..') || !/^[-a-zA-Z0-9_./]+$/.test(name)) throw Error('Unsafe relative path: ' + name);
  return name;
}
function read(root, name, max = 32 * 1024 * 1024) {
  safe(name);
  let current = path.resolve(root);
  for (const part of name.split('/')) {
    current = path.join(current, part);
    if (fs.lstatSync(current).isSymbolicLink()) throw Error('Symlink forbidden: ' + name);
  }
  const stat = fs.statSync(current);
  if (!stat.isFile() || stat.size > max) throw Error('File too large or not regular: ' + name);
  const data = fs.readFileSync(current);
  if (data.length > max) throw Error('File exceeds input limit: ' + name);
  return data;
}
function walk(root, base = '') {
  return fs.readdirSync(path.join(root, base), {
    withFileTypes: true
  }).flatMap(e => {
    const name = base + e.name;
    if (e.isSymbolicLink()) throw Error('Symlink forbidden: ' + name);
    return e.isDirectory() ? walk(root, name + '/') : [name];
  });
}
function runtime(directory) {
  if (!directory) throw Error('Runtime unavailable: pass --runtime PATH to a verified local candidate; no official runtime release is pinned yet.');
  const root = path.resolve(directory);
  let meta;
  try {
    meta = json(path.join(root, 'runtime.json'));
  } catch (e) {
    throw Error('Runtime manifest unavailable: ' + e.message);
  }
  if (meta.schemaVersion !== 1 || meta.themeApiVersion !== 1) throw Error('Unsupported runtime/API');
  if (meta.status !== 'candidate') throw Error('Only explicit local candidate runtimes are supported until a reviewed published runtime is pinned');
  const inventory = new Map();
  for (const f of meta.files || []) {
    safe(f.path);
    if (inventory.has(f.path)) throw Error('Duplicate runtime path');
    const data = read(root, f.path);
    if (data.length !== f.size || hash(data) !== f.sha256) throw Error('Runtime integrity mismatch: ' + f.path);
    inventory.set(f.path, f);
  }
  for (const f of walk(root)) {
    if (f !== 'runtime.json' && !inventory.has(f)) throw Error('Unlisted runtime file: ' + f);
  }
  for (const key of ['compiler', 'policy']) if (!inventory.has(meta[key])) throw Error('Runtime ' + key + ' unavailable');
  if (!meta.preview || !inventory.has(meta.preview['no-root']) || !inventory.has(meta.preview.root)) throw Error('Runtime reference renderer unavailable');
  return {
    root,
    meta,
    inventory,
    digest: hash(read(root, 'runtime.json', 1048576))
  };
}
function init(directory, options = {}) {
  const root = path.resolve(directory);
  if (fs.existsSync(root) && fs.readdirSync(root).length) throw Error('Destination must be empty; theme already exists.');
  const slug = path.basename(root);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw Error('Use a lowercase theme-slug directory');
  const repository = options.repository || 'https://github.com/YOUR-NAME/YOUR-THEMES';
  if (!/^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/.test(repository)) throw Error('Use a public GitHub repository URL');
  const [owner, repo] = new URL(repository).pathname.slice(1).toLowerCase().split('/');
  fs.mkdirSync(root, {
    recursive: true
  });
  const manifest = {
    schemaVersion: 1,
    themeApiVersion: 1,
    id: `github:${owner}/${repo}:${slug}`.toLowerCase(),
    title: options.name || slug,
    description: 'An original CSS theme for Clean Your TV.',
    author: {
      name: options.author || 'Theme author',
      url: `https://github.com/${owner}`
    },
    themeVersion: '1.0.0',
    layout: {
      preset: 'dock-grid',
      columns: 6,
      spacingScale: 1,
      textScale: 1,
      focusScale: 1.1
    },
    defaults: {
      wallpaperAssetId: null,
      dim: 0.2,
      accent: '#88bbff'
    },
    assets: [],
    previewAssetId: 'preview',
    license: {
      identifier: 'MIT',
      textPath: 'LICENSE.txt',
      creditsPath: 'CREDITS.txt'
    }
  };
  fs.writeFileSync(path.join(root, 'theme.json'), encode(manifest));
  fs.writeFileSync(path.join(root, 'theme.css'), '.ctv-card { background-color: #182330; border-color: #41546c; border-radius: 20px; }\n.ctv-clock { color: #f2f5fa; }\n');
  fs.mkdirSync(path.join(root, 'assets'));
  fs.writeFileSync(path.join(root, 'LICENSE.txt'), 'MIT License\n\nCopyright (c) ' + (options.author || 'Theme author') + '\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to inclusion of this copyright and permission notice.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.\n');
  fs.writeFileSync(path.join(root, 'CREDITS.txt'), '# Credits\n\nCSS: original work by ' + (options.author || 'Theme author') + '.\nPreview: original generated solid-color PNG, CC0-1.0. Replace with a browser preview before showcase review.\n');
  fs.writeFileSync(path.join(root, 'assets/preview.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==', 'base64'));
  manifest.assets = [{
    id: 'preview',
    path: 'assets/preview.png',
    mediaType: 'image/png',
    width: 1,
    height: 1
  }];
  fs.writeFileSync(path.join(root, 'theme.json'), encode(manifest));
  return manifest;
}
function source(directory) {
  const root = path.resolve(directory),
    manifest = JSON.parse(read(root, 'theme.json', 65536).toString('utf8'));
  if (!Array.isArray(manifest.assets) || manifest.assets.length > 16) throw Error('Theme needs at most 16 image assets');
  const assets = manifest.assets.map(a => ({
    ...a,
    data: read(root, a.path, 16 * 1024 * 1024)
  }));
  const documents = [...new Set([manifest.license.textPath, manifest.license.creditsPath])].map(p => ({
    path: p,
    data: read(root, p, 32768)
  }));
  return {
    manifest,
    css: read(root, 'theme.css', 262144).toString('utf8'),
    assets,
    documents
  };
}
async function compile(directory, rt, options = {}) {
  const compiler = require(path.join(rt.root, rt.meta.compiler));
  const input = source(directory);
  if (input.manifest.layout && (input.manifest.layout.spacingScale !== 1 || input.manifest.layout.textScale !== 1 || input.manifest.layout.focusScale !== 1.1)) throw Error('layout-invalid: this candidate supports spacingScale=1, textScale=1, focusScale=1.1 only');
  const repository = input.manifest.id.startsWith('github:') ? 'https://github.com/' + input.manifest.id.split(':')[1] : 'https://github.com/Razdva122/clean-your-tv-lg-webos';
  return compiler.compileSource({
    ...input,
    source: {
      repository: (options.repository || repository).toLowerCase(),
      commit: options.commit || '0'.repeat(40)
    },
    minimumHomeVersion: rt.meta.minimumHomeVersion
  });
}
function committed(directory, repository, commit) {
  if (!repository || !/^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/.test(repository)) throw Error('Build requires --source-repository https://github.com/OWNER/REPO');
  if (!/^[a-f0-9]{40}$/.test(commit || '')) throw Error('Build requires full --source-commit');
  const root = path.resolve(directory);
  const git = args => cp.execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
  if (git(['rev-parse', 'HEAD']) !== commit) throw Error('Source commit does not match HEAD');
  if (git(['status', '--porcelain', '--untracked-files=all', '--', '.'])) throw Error('Commit theme source before distribution build');
  for (const f of walk(root)) {
    if (f.startsWith('.git/')) continue;
    git(['ls-files', '--error-unmatch', '--', f]);
  }
  const m = json(path.join(root, 'theme.json'));
  const repo = new URL(repository).pathname.slice(1).toLowerCase();
  if (!m.id.startsWith('github:' + repo + ':')) throw Error('Theme identity does not match source repository');
}
async function build(directory, rt, options) {
  committed(directory, options.repository, options.commit);
  const output = await compile(directory, rt, options),
    out = path.resolve(options.out);
  if (out === path.resolve(directory) || out.startsWith(path.resolve(directory) + path.sep)) throw Error('Output must be outside theme source folder');
  if (fs.existsSync(out) && fs.readdirSync(out).length) throw Error('Output directory must be empty');
  fs.mkdirSync(out, {
    recursive: true
  });
  const write = (name, data) => {
    safe(name);
    const f = path.join(out, name);
    fs.mkdirSync(path.dirname(f), {
      recursive: true
    });
    fs.writeFileSync(f, data);
  };
  output.manifest.rules.path = 'rules/' + output.manifest.rules.sha256 + '.json';
  write(output.manifest.rules.path, JSON.stringify(output.rules) + '\n');
  for (const [group, files] of [['assets', output.assets], ['documents', output.documents]]) for (const f of files) {
    const original = f.path;
    const identity = group === 'assets' ? f.id : files.indexOf(f);
    const next = group + '/' + identity + '-' + f.sha256 + path.extname(f.path).toLowerCase();
    const meta = output.manifest[group].find(a => a.path === original);
    meta.path = next;
    if (output.manifest.license.textPath === original) output.manifest.license.textPath = next;
    if (output.manifest.license.creditsPath === original) output.manifest.license.creditsPath = next;
    write(next, f.data);
  }
  const descriptor = JSON.stringify(output.manifest) + '\n';
  require(path.join(rt.root, rt.meta.policy)).validateManifest(output.manifest);
  write('cytv-theme.json', descriptor);
  write('validation-report.json', encode({
    runtime: {
      status: rt.meta.status,
      source: rt.meta.source,
      manifestSha256: rt.digest
    },
    report: {
      ...output.report,
      manifestSha256: hash(descriptor)
    }
  }));
  return output.manifest;
}
function collection(distFolders, out, policy) {
  let repository;
  const themes = distFolders.map(folder => {
    const file = path.resolve(folder, 'cytv-theme.json'),
      data = fs.readFileSync(file),
      m = JSON.parse(data);
    if (policy) policy.validateManifest(m);
    if (repository && repository !== m.source.repository) throw Error('Collection must contain one source repository');
    repository = m.source.repository;
    const relative = path.relative(path.resolve(out), file).split(path.sep).join('/');
    safe(relative);
    return {
      id: m.id,
      title: m.title,
      themeVersion: m.themeVersion,
      path: relative,
      sha256: hash(data)
    };
  });
  if (!themes.length || themes.length > 32 || new Set(themes.map(t => t.id)).size !== themes.length) throw Error('Collection needs 1–32 unique theme identities');
  const index = {
    schemaVersion: 1,
    repository,
    themes
  };
  if (policy) policy.validateCollection(index);
  const data = encode(index);
  if (Buffer.byteLength(data) > 65536) throw Error('Collection exceeds 64 KiB');
  fs.mkdirSync(out, {
    recursive: true
  });
  fs.writeFileSync(path.join(out, 'cytv-themes.json'), data);
  return index;
}
const mime = name => ({
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf'
})[path.extname(name)] || 'application/octet-stream';
async function preview(directory, rt, options = {}) {
  const edition = options.edition || 'no-root';
  if (!rt.meta.preview[edition]) throw Error('Edition must be no-root or root');
  const policy = require(path.join(rt.root, rt.meta.policy));
  let state = {
      css: '',
      revision: 0,
      error: null,
      layout: null
    },
    fingerprint = '';
  let busy = false;
  async function refresh() {
    if (busy) return;
    busy = true;
    try {
      const s = source(directory),
        stamp = hash(s.css + encode(s.manifest) + s.assets.map(a => hash(a.data)).join('') + s.documents.map(d => hash(d.data)).join(''));
      if (stamp === fingerprint) {
        state = {
          ...state,
          error: null
        };
        return;
      }
      const output = await compile(directory, rt);
      state = {
        css: policy.serializeBundle(output.rules, Object.fromEntries(output.assets.map(a => [a.id, 'blob:ctv-preview/' + a.id]))),
        revision: state.revision + 1,
        error: null,
        layout: output.manifest.layout,
        input: {
          manifest: output.manifest,
          rules: output.rules,
          assets: output.assets.map(a => ({
            id: a.id,
            mediaType: a.mediaType,
            base64: a.data.toString('base64')
          }))
        }
      };
      fingerprint = stamp;
    } catch (e) {
      state = {
        ...state,
        error: e.message
      };
    } finally {
      busy = false;
    }
  }
  await refresh();
  if (state.error) throw Error('Initial theme compilation failed: ' + state.error);
  const runtimePrefix = '/runtime/';
  const inject = '<script src="/theme-preview.js"></script>';
  const client = '(' + require('./preview-client.cjs').toString() + ')();';
  const timer = setInterval(refresh, 350);
  const server = http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'");
    const respond = (code, data, type = 'text/plain') => {
      res.writeHead(code, {
        'Content-Type': type
      });
      res.end(data);
    };
    try {
      if (req.headers.host !== `127.0.0.1:${server.address().port}` && req.headers.host !== `localhost:${server.address().port}`) return respond(403, 'Invalid host');
      const url = new URL(req.url, 'http://localhost'),
        name = decodeURIComponent(url.pathname);
      if (name === '/') return respond(200, `<!doctype html>
<title>Theme browser preview</title>
<style>
  body { margin: 0; background: #111; color: #fff; font: 16px sans-serif; }
  #previewStatus { min-height: 55px; box-sizing: border-box; padding: 12px; margin: 0; }
  #screen { position: relative; margin: 0 auto; }
  iframe { position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; border: 0; transform-origin: top left; }
  #error { color: #ff9e9e; }
</style>
<p id="previewStatus">Browser preview · ${edition} · ${rt.meta.status} · <span id="error"></span></p>
<div id="screen"><iframe sandbox="allow-scripts allow-same-origin" src="${runtimePrefix + rt.meta.preview[edition]}"></iframe></div>
<script>
  var previewScreen = document.getElementById('screen');
  var previewFrame = previewScreen.querySelector('iframe');
  function fit() {
    var available = Math.max(0, innerHeight - document.getElementById('previewStatus').offsetHeight);
    var scale = Math.min(innerWidth / 1920, available / 1080);
    previewScreen.style.width = 1920 * scale + 'px';
    previewScreen.style.height = 1080 * scale + 'px';
    previewFrame.style.transform = 'scale(' + scale + ')';
  }
  addEventListener('resize', fit);
  addEventListener('message', function(e) {
    if (e.origin === location.origin && e.data.themePreview) {
      document.getElementById('error').textContent = e.data.error || 'CSS reloads on save';
      fit();
    }
  });
  fit();
</script>`, 'text/html');
      if (name === '/theme-state') {
        const unchanged = url.searchParams.get('revision') === String(state.revision);
        return respond(200, encode(unchanged ? {
          revision: state.revision,
          error: state.error
        } : state), 'application/json');
      }
      if (name === '/theme-preview.js') return respond(200, client, 'application/javascript');
      if (name.startsWith(runtimePrefix)) {
        const file = name.slice(runtimePrefix.length);
        if (!rt.inventory.has(file) || !/^(preview|renderer)\//.test(file)) return respond(404, 'Not found');
        let data = read(rt.root, file);
        if (file.endsWith('.html')) data = Buffer.from(data.toString().replace('</head>', inject + '</head>'));
        return respond(200, data, mime(file));
      }
      return respond(404, 'Not found');
    } catch (e) {
      return respond(404, 'Not found');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', error => {
      clearInterval(timer);
      reject(error);
    });
    server.listen(options.port || 0, '127.0.0.1', resolve);
  });
  server.on('close', () => clearInterval(timer));
  return {
    server,
    url: `http://127.0.0.1:${server.address().port}/`,
    state: () => state,
    refresh
  };
}
function submission(directory, options) {
  if (!options.evidence || !options.evidence.trim()) throw Error('Submission requires your actual browser/device review evidence');
  const root = path.resolve(directory),
    bytes = read(root, 'cytv-theme.json'),
    m = JSON.parse(bytes),
    digest = hash(bytes);
  if (!m || typeof m.id !== 'string' || !/^github:[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9._-]*:[a-z0-9][a-z0-9-]{0,63}$/.test(m.id)) throw Error('Invalid canonical theme identity');
  const key = m.id.slice(7).replace('/', '--').replace(':', '--');
  const prefix = 'https://raw.githubusercontent.com/' + m.id.split(':')[1] + '/';
  if (!options.url || !options.url.startsWith(prefix) || !new RegExp('^[a-f0-9]{40}/').test(options.url.slice(prefix.length)) || !options.url.endsWith('/cytv-theme.json')) throw Error('Use a matching commit-pinned descriptor URL');
  const date = options.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || new Date(date).toISOString().slice(0, 10) !== date) throw Error('Use --date YYYY-MM-DD for actual review date');
  const out = path.resolve(options.out),
    base = 'assets/' + key + '/' + digest + '/';
  if (fs.existsSync(out) && fs.readdirSync(out).length) throw Error('Submission output must be empty');
  const preview = m.assets.find(a => a.id === m.previewAssetId);
  if (!preview) throw Error('Descriptor preview missing');
  const record = {
    schemaVersion: 1,
    id: m.id,
    title: m.title,
    description: m.description,
    author: {
      name: m.author.name,
      sourceProfile: m.author.url
    },
    sourceRepository: m.source.repository,
    sourceCommit: m.source.commit,
    descriptorUrl: options.url,
    descriptorSha256: digest,
    themeVersion: m.themeVersion,
    themeApiVersion: m.themeApiVersion,
    license: m.license.identifier,
    creditsFile: base + m.license.creditsPath,
    previewFiles: [base + preview.path],
    tags: options.tags ? options.tags.split(',') : [],
    addedAt: date,
    reviewedAt: date,
    evidence: [{
      kind: 'browser',
      summary: options.evidence
    }]
  };
  const files = [{
    path: 'cytv-theme.json',
    data: bytes
  }, ...[m.rules, ...m.assets, ...m.documents].map(f => {
    const data = read(root, f.path);
    if (f.size !== undefined && (f.size !== data.length || f.sha256 !== hash(data))) throw Error('Distribution integrity mismatch: ' + f.path);
    return {
      path: f.path,
      data
    };
  })];
  for (const f of files) {
    const target = path.join(out, base + safe(f.path));
    fs.mkdirSync(path.dirname(target), {
      recursive: true
    });
    fs.writeFileSync(target, f.data);
  }
  fs.mkdirSync(path.join(out, 'registry'), {
    recursive: true
  });
  fs.writeFileSync(path.join(out, 'registry', key + '.json'), encode(record));
  fs.writeFileSync(path.join(out, 'SUBMISSION.md'), 'Draft only. Fork Razdva122/clean-your-tv-lg-webos, copy registry/ and assets/ into showcase/, and open a PR targeting release/next. Maintainers must review attribution, source control, images, actual evidence and dates before approval. No PR was posted.\n');
  return record;
}
module.exports = {
  init,
  runtime,
  source,
  compile,
  build,
  collection,
  preview,
  submission,
  hash,
  safe,
  encode
};
