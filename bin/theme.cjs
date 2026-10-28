#!/usr/bin/env node
'use strict';

const path = require('node:path'),
  fs = require('node:fs'),
  t = require('../lib/toolkit.cjs');
const args = process.argv.slice(2),
  command = args.shift(),
  pos = [],
  options = {};
while (args.length) {
  const arg = args.shift();
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    if (!args.length || args[0].startsWith('--')) throw Error('Missing value for ' + arg);
    options[key] = args.shift();
  } else pos.push(arg);
}
async function main() {
  if (command === 'init') {
    if (!pos[0]) throw Error('Usage: init DIRECTORY --repository https://github.com/OWNER/REPO');
    t.init(pos[0], {
      name: options.name,
      repository: options.repository,
      author: options.author
    });
    console.log('Created ' + path.resolve(pos[0]));
    return;
  }
  if (command === 'collection') {
    if (!options.out || !pos.length) throw Error('Usage: collection DIST... --out COLLECTION_ROOT');
    const rt = t.runtime(options.runtime || process.env.CYTV_THEME_RUNTIME);
    t.collection(pos, options.out, require(path.join(rt.root, rt.meta.policy)));
    console.log(path.resolve(options.out, 'cytv-themes.json'));
    return;
  }
  if (command === 'runtime:fetch') throw Error('No published runtime is pinned. Use an explicitly exported maintainer candidate with --runtime PATH. Never download or execute a theme repository as runtime tooling.');
  if (!['validate', 'build', 'preview', 'submission', 'screenshots'].includes(command) || !pos[0]) throw Error('Usage: theme {init|validate|preview|screenshots|build|collection|submission} DIRECTORY [--runtime PATH]');
  const rt = t.runtime(options.runtime || process.env.CYTV_THEME_RUNTIME);
  const sourceOptions = {
    repository: options['source-repository'],
    commit: options['source-commit'],
    out: options.out
  };
  if (command === 'screenshots') {
    const report = await require('../lib/screenshots.cjs').screenshots(pos[0], rt, {
      out: options.out,
      edition: options.edition,
      executable: options['browser-executable']
    });
    console.log(t.encode(report));
  }
  if (command === 'submission') {
    if (!options.out) throw Error('Submission needs --out OUTPUT');
    const record = t.submission(pos[0], {
      out: options.out,
      url: options.source,
      evidence: options.evidence,
      date: options.date,
      tags: options.tags
    });
    const validator = require(path.join(rt.root, rt.meta.submissionValidator));
    validator.validateRecord(record);
    validator.validateFiles(record, path.resolve(options.out));
    console.log('Validated submission draft: ' + path.resolve(options.out) + ' (no PR posted)');
  }
  if (command === 'validate') {
    const result = await t.compile(pos[0], rt, sourceOptions);
    console.log(t.encode(result.report || {
      valid: true
    }));
  }
  if (command === 'build') {
    if (!options.out) throw Error('Build requires --out OUTPUT');
    const m = await t.build(pos[0], rt, sourceOptions);
    console.log(m.id + ' ' + m.themeVersion + ' → ' + path.resolve(options.out));
  }
  if (command === 'preview') {
    const port = options.port === undefined ? 8766 : Number(options.port);
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw Error('Invalid port');
    const p = await t.preview(pos[0], rt, {
      edition: options.edition,
      port
    });
    console.log('Open ' + p.url + ' in your browser. Save theme.css to reload. Ctrl+C stops preview.');
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => p.server.close());
  }
}
main().catch(e => {
  console.error('Theme toolkit: ' + e.message);
  process.exitCode = 1;
});
