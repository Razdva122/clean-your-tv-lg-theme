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
  if (input.manifest.layout && Object.hasOwn(input.manifest.layout, 'ribbon')) {
    const contract = rt.meta.contract && rt.inventory.has(rt.meta.contract) ? json(path.join(rt.root, rt.meta.contract)) : null;
    if (!contract || !contract.optionalCapabilities || !contract.optionalCapabilities['ribbon-layout-v1']) throw Error('update-runtime: layout.ribbon requires a trusted candidate runtime with ribbon-layout-v1; pass the reviewed PR candidate export with --runtime PATH.');
  }
  const repository = input.manifest.id.startsWith('github:') ? 'https://github.com/' + input.manifest.id.split(':')[1] : 'https://github.com/Razdva122/clean-your-tv-lg-webos';
  const compiled = await compiler.compileSource({
    ...input,
    source: {
      repository: (options.repository || repository).toLowerCase(),
      commit: options.commit || '0'.repeat(40)
    },
    minimumHomeVersion: rt.meta.minimumHomeVersion
  });
  if (input.manifest.layout && Object.hasOwn(input.manifest.layout, 'ribbon') &&
      (!compiled.manifest.layout.ribbon || !compiled.manifest.requires.capabilities.includes('ribbon-layout-v1'))) throw Error('update-runtime: runtime did not preserve layout.ribbon and ribbon-layout-v1; obtain the complete matching PR candidate export.');
  return compiled;
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
async function showcase(directory, rt, options = {}) {
  const themes = fs.readdirSync(directory, {withFileTypes: true})
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(directory, entry.name, 'theme.json')))
    .map(entry => ({key: entry.name, directory: path.resolve(directory, entry.name), manifest: source(path.join(directory, entry.name)).manifest}));
  if (!themes.length || themes.length > 64) throw Error('Showcase requires 1–64 local themes');
  const identities = new Set(['builtin:classic']);
  for (const theme of themes) {
    if (identities.has(theme.manifest.id)) throw Error('Duplicate theme identity: ' + theme.manifest.id);
    identities.add(theme.manifest.id);
  }
  return preview(null, rt, {...options, themes});
}
async function preview(directory, rt, options = {}) {
  const tvInventory = require('./preview-inventory.cjs').load(options.inventory || path.join(__dirname, '../examples/reference-apps/inventory.json'));
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
  const choices = options.themes ? [{key: '', directory: null, manifest: {id: 'builtin:classic', title: 'Classic'}}].concat(options.themes) : [];
  const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  if (choices.length && (!rt.inventory.has('preview/theme-card.css') || !rt.inventory.has('preview/classic-preview.png'))) throw Error('Showcase image cards require a refreshed candidate runtime');
  const picker = choices.length ? '<section id="themePicker" aria-label="Themes"><div class="theme-picker-heading"><strong>Themes</strong><span>Choose a theme to preview Home.</span></div><div class="theme-card-strip">' + choices.map(theme =>
    '<button class="ctv-theme-card" type="button" data-key="' + escape(theme.key) + '" data-theme-id="' + escape(theme.manifest.id) + '" data-theme-title="' + escape(theme.manifest.title) + '" aria-label="' + escape(theme.manifest.title) + '" aria-pressed="false"><span class="ctv-theme-card__preview"><img class="ctv-theme-card__image" src="/theme-thumbnail?theme=' + encodeURIComponent(theme.key) + '" alt="" width="960" height="540"><span class="ctv-theme-card__fallback" hidden aria-hidden="true">No preview</span></span><span class="ctv-theme-card__footer"><span class="ctv-theme-card__name">' + escape(theme.manifest.title) + '</span><span class="ctv-theme-card__state" aria-hidden="true"></span></span></button>').join('') + '</div></section>' : '';
  let inFlight = null, selectionQueue = Promise.resolve();
  async function refresh() {
    if (inFlight) return inFlight;
    inFlight = refreshNow();
    try { await inFlight; } finally { inFlight = null; }
  }
  async function refreshNow() {
    try {
      if (directory === null && choices.length) {
        if (fingerprint !== 'builtin:classic') {
          state = {css: '', revision: state.revision + 1, error: null, classic: true, input: null,
            layout: {preset: 'dock-grid', columns: 5, spacingScale: 1, textScale: 1, focusScale: 1.1}};
          fingerprint = 'builtin:classic';
        }
        state = {...state, error: null};
        return;
      }
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
    }
  }
  await refresh();
  if (state.error) throw Error('Initial theme compilation failed: ' + state.error);
  const shareDialog = require('./share-dialog.cjs');
  const installLinkDialog = require('./install-link-dialog.cjs');
  const runtimePrefix = '/runtime/';
  const inject = '<script>window.CYTV_THEME_AUTHOR_PREVIEW=true;</script><script src="/theme-preview.js"></script>';
  const client = '(' + require('./preview-client.cjs').toString() + ')();';
  const timer = setInterval(refresh, 350);
  const server = http.createServer(async (req, res) => {
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
      if (Object.values(rt.meta.preview).some(file => name === runtimePrefix + file)) res.setHeader('Content-Security-Policy', "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.github.com https://raw.githubusercontent.com https://da.gd; frame-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'");
      if (name === '/theme-install-link') {
        if (!['GET','POST'].includes(req.method)) return respond(405,'Use GET or POST');
        if (req.method==='POST') {
          if(req.headers.origin!=='http://'+req.headers.host)return respond(403,'Invalid origin');
          let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>4096)return respond(413,'Request too large.');}
          if(body.trim())return respond(400,encode({error:'ID creation accepts no URL or local content; it uses only the selected public publication.'}),'application/json');
        }
        await selectionQueue;
        if (!directory) return respond(422,encode({error:'Classic is already included on TV.'}),'application/json');
        try {
          // Publication identity does not depend on whether unfinished local CSS compiles.
          const manifest=JSON.parse(read(path.resolve(directory),'theme.json',65536).toString('utf8'));
          if(typeof manifest.id!=='string'||!/^github:[\w-]+\/[\w.-]+:[\w.-]+$/.test(manifest.id))throw Error('Invalid theme identity.');
          const selected={id:manifest.id,source:{repository:'https://github.com/'+manifest.id.split(':')[1]}};
          const links=require('./short-links.cjs');let entry=await links.published(selected);
          if(req.method==='POST'&&entry&&!entry.shortUrl)entry=await links.shorten(entry.url,{...selected,themeVersion:entry.version},{descriptorSha256:entry.descriptorSha256});
          return respond(200,encode({entry,state:'checked'}),'application/json');
        } catch(_) {
          return respond(503,encode({entry:null,state:'unavailable',notice:'Could not verify the last publication. Check your connection and retry. This does not mean the theme is unpublished.'}),'application/json');
        }
      }
      if (name === '/theme-send') {
        if (req.method !== 'POST') return respond(405, 'Use POST');
        if (req.headers.origin !== 'http://' + req.headers.host) return respond(403, 'Invalid origin');
        let body = '';
        for await (const chunk of req) {
          body += chunk;
          if (Buffer.byteLength(body) > 4096) return respond(413, encode({error: 'Send request is too large.'}), 'application/json');
        }
        let input;
        try { input = JSON.parse(body); } catch (_) { return respond(400, encode({error: 'Invalid send request.'}), 'application/json'); }
        const sender = require('./theme-send.cjs');
        try { sender.validate(input && input.tv, input && input.pin); }
        catch (error) { return respond(422, encode({error: error.message}), 'application/json'); }
        await selectionQueue;
        if (!directory) return respond(422, encode({error: 'Classic is built in. Select a local theme to send to TV.'}), 'application/json');
        let snapshot;
        try { snapshot = await compile(directory, rt); }
        catch (_) { return respond(422, encode({error: 'Could not compile the selected theme. Fix preview errors and retry.'}), 'application/json'); }
        try { return respond(200, encode(await sender.send(snapshot, input.tv, input.pin)), 'application/json'); }
        catch (error) { return respond(422, encode({error: error.message}), 'application/json'); }
      }
      if (name === '/theme-thumbnail' && choices.length) {
        if (req.method !== 'GET') return respond(405, 'Use GET');
        const theme = choices.find(choice => choice.key === url.searchParams.get('theme'));
        if (!theme) return respond(404, 'Unknown theme');
        if (theme.directory === null) return respond(200, read(rt.root, 'preview/classic-preview.png'), 'image/png');
        const compiled = await compile(theme.directory, rt);
        const asset = compiled.assets.find(image => image.id === compiled.manifest.previewAssetId);
        if (!asset) return respond(404, 'No preview');
        return respond(200, asset.data, asset.mediaType);
      }
      if (name === '/theme-selection' && choices.length) {
        if (req.method !== 'POST') return respond(405, 'Use POST');
        if (req.headers.origin !== 'http://' + req.headers.host) return respond(403, 'Invalid origin');
        let body = '';
        for await (const chunk of req) {
          body += chunk;
          if (Buffer.byteLength(body) > 1024) return respond(413, 'Selection too large');
        }
        let requested;
        try { requested = JSON.parse(body); } catch (_) { return respond(400, 'Invalid selection'); }
        const theme = requested && choices.find(choice => choice.key === requested.theme);
        if (!theme) return respond(400, 'Unknown theme');
        const selection = selectionQueue.then(async () => {
          await refresh();
          const previous = directory, previousFingerprint = fingerprint;
          directory = theme.directory; fingerprint = '';
          await refresh();
          if (state.error) { directory = previous; fingerprint = previousFingerprint; }
          return {themeId: state.classic ? 'builtin:classic' : state.input.manifest.id, error: state.error};
        });
        selectionQueue = selection.catch(() => {});
        const result = await selection;
        return respond(result.error ? 422 : 200, encode(result), 'application/json');
      }
      if (name === '/') return respond(200, `<!doctype html><html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Theme browser preview</title>
${choices.length ? '<link rel="stylesheet" href="/runtime/preview/theme-card.css">' : ''}
<style>
${shareDialog.styles}
${installLinkDialog.styles}
  * { box-sizing:border-box; }
  body { margin:0; background:#121411; color:#eeeae1; font:14px/1.4 system-ui,sans-serif; }
  #authorHeader { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px 24px; padding:16px 20px; border-bottom:1px solid #34392e; background:#1a1d17; }
  #authorHeader h1 { margin:0 0 3px; font-size:18px; line-height:1.3; font-weight:600; letter-spacing:-.3px; }
  #previewStatus { margin:0; color:#a9afa1; font-size:12px; }
  #error { display:inline; color:#a9afa1; font-size:12px; overflow-wrap:anywhere; }
  #error[role="alert"] { color:#ffaaa0; }
  #lanShare { display:flex; align-items:center; flex-wrap:wrap; justify-content:flex-end; gap:10px; }
  #lanShare button { min-height:36px; padding:7px 13px; border:1px solid #59634d; border-radius:6px; background:transparent; color:#e7ebdf; font:inherit; font-size:13px; cursor:pointer; }
  #lanShare #sendToTV, #lanShare #themeInstallLink { display:inline-flex; align-items:center; justify-content:center; gap:12px; min-height:56px; min-width:210px; padding:14px 24px; background:#d8f69c; color:#17220c; border-color:#d8f69c; border-radius:9px; font-size:18px; font-weight:700; }
  #lanShare #themeInstallLink { background:#eeeae1; color:#20251a; border-color:#eeeae1; }
  #lanShare svg { width:26px; height:26px; flex:none; }
  #lanShare button:hover { filter:brightness(1.12); }
  #lanShare button:focus-visible { outline:2px solid #e1f4c7; outline-offset:3px; }
  #themePicker { padding:12px 20px 10px; border-bottom:1px solid #2c3226; }
  .theme-picker-heading { display:flex; align-items:baseline; flex-wrap:wrap; gap:6px 12px; margin-bottom:6px; }
  .theme-picker-heading strong { font-size:13px; font-weight:600; }
  .theme-picker-heading span { font-size:12px; color:#a9afa1; }
  .theme-card-strip { display:flex; gap:10px; overflow-x:auto; padding:5px 4px; margin:0 -4px; }
  #themePicker .ctv-theme-card { flex:0 0 148px; cursor:pointer; }
  #themePicker .ctv-theme-card__state::before { content:'Select'; }
  #themePicker .ctv-theme-card[aria-pressed="true"] .ctv-theme-card__state::before { content:'Selected'; }
  #screen { position:relative; margin:0 auto; overflow:hidden; }
  iframe { position:absolute; top:0; left:0; width:1920px; height:1080px; border:0; transform-origin:top left; }
  @media(max-width:560px) { #authorHeader { padding:12px 16px; gap:10px; } #lanShare { width:100%; flex-wrap:wrap; justify-content:flex-start; } #lanShare #sendToTV, #lanShare #themeInstallLink { flex:1 1 100%; width:100%; } #lanShare button { flex-shrink:0; } #themePicker { padding:10px 16px; } #themePicker .ctv-theme-card { flex-basis:136px; } }

</style>
<body class="${choices.length ? 'has-picker' : ''}">
<header id="authorHeader"><div><h1>Theme preview</h1><p id="previewStatus">${edition === 'root' ? 'Root' : 'No-root'} · ${rt.meta.status === 'candidate' ? 'Candidate' : escape(rt.meta.status)} · ${options.inventory ? 'TV snapshot' : 'Reference TV apps'} · <span id="error" role="status">CSS reloads on save</span></p></div><div id="lanShare"><button id="sendToTV" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4M9 10h6m-3-3 3 3-3 3"/></svg><span>Send to TV</span></button><button id="themeInstallLink" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4M12 6v8m-3-3 3 3 3-3"/></svg><span>TV link</span></button></div></header>
${shareDialog.html}
${installLinkDialog.html}
${picker}
<div id="screen"><iframe sandbox="allow-scripts allow-same-origin" src="${runtimePrefix + rt.meta.preview[edition]}"></iframe></div>
<script>
  var previewScreen = document.getElementById('screen');
  var previewFrame = previewScreen.querySelector('iframe');
  function fit() {
    var picker = document.getElementById('themePicker');
    var available = Math.max(0, innerHeight - document.getElementById('authorHeader').offsetHeight - (picker ? picker.offsetHeight : 0));
    var scale = Math.min(innerWidth / 1920, available / 1080);
    previewScreen.style.width = 1920 * scale + 'px';
    previewScreen.style.height = 1080 * scale + 'px';
    previewFrame.style.transform = 'scale(' + scale + ')';
  }
  function previewStatus(text,failed) {
    var target=document.getElementById('error'),role=failed?'alert':'status';
    if(target.getAttribute('role')!==role)target.setAttribute('role',role);
    if(target.textContent!==text)target.textContent=text;
    fit();
  }
  addEventListener('resize', fit);
  addEventListener('message', function(e) {
    if (e.origin === location.origin && e.source === previewFrame.contentWindow && e.data && e.data.themePreview) {
      document.querySelectorAll('[data-theme-id]').forEach(function(button) { button.setAttribute('aria-pressed', String(button.dataset.themeId === e.data.themeId)); });
      previewStatus(e.data.error || 'CSS reloads on save',!!e.data.error);
      fit();
    }
  });
  document.querySelectorAll('#themePicker img').forEach(function(img) {
    function unavailable() { img.hidden = true; img.nextElementSibling.hidden = false; }
    img.addEventListener('error', unavailable);
    if (img.complete && !img.naturalWidth) unavailable();
  });
  document.querySelectorAll('[data-key]').forEach(function(button) {
    button.addEventListener('click', function() {
      previewStatus('Applying ' + button.dataset.themeTitle + '…',false);
      fetch('/theme-selection', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({theme:button.dataset.key})})
        .then(function(response) { return response.json(); })
        .then(function(result) { if (result.error) previewStatus(result.error,true); else previewFrame.focus(); })
        .catch(function(error) { previewStatus(error.message,true); });
    });
  });
  (${shareDialog.client.toString()})(fit);
  (${installLinkDialog.client.toString()})();
  fit();
</script>`, 'text/html; charset=utf-8');
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
        if (tvInventory && /^preview\/(launcher|root-launcher)\/apps\.js$/.test(file)) {
          res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
          if (req.headers.origin && req.headers.origin !== 'http://' + req.headers.host || ['cross-site', 'same-site'].includes(req.headers['sec-fetch-site'])) return respond(403, 'Private TV snapshot');
          return respond(200, require('./preview-inventory.cjs').script(tvInventory), 'application/javascript');
        }
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
  server.on('close', () => { clearInterval(timer); });
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
  showcase,
  submission,
  hash,
  safe,
  encode
};
