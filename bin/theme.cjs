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
  if (command === 'release-workflow') {
    const release=require('../lib/release-links.cjs'),destination=path.resolve(options.out||'.github/workflows/theme-links.yml');
    if(fs.existsSync(destination))throw Error('Workflow already exists; inspect it before replacing it.');
    fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,release.workflow(release.toolkitCommit()));console.log('Created '+destination);return;
  }
  if (command === 'release-notes') {if(!pos[0])throw Error('Use release-notes OUTPUT_DIRECTORY');require('../lib/release-links.cjs').finishNotes(pos[0]);return;}
  if (command === 'release-links') {
    if(!pos[0]||!options.out)throw Error('Use release-links REPOSITORY_DIRECTORY --repository OWNER/REPO --commit SHA --tag vX.Y.Z --out NEW_DIRECTORY');
    const entries=await require('../lib/release-links.cjs').generate(pos[0],options);console.log('Prepared installation links for '+entries.length+' themes.');return;
  }
  if (command === 'runtime:fetch') throw Error('No published runtime is pinned. Use an explicitly exported maintainer candidate with --runtime PATH. Never download or execute a theme repository as runtime tooling.');
  if (!['validate', 'build', 'preview', 'showcase', 'submission', 'screenshots', 'send'].includes(command) || !pos[0]) throw Error('Usage: theme {init|validate|preview|showcase|send|screenshots|build|collection|submission} DIRECTORY [--runtime PATH]');
  const rt = t.runtime(options.runtime || process.env.CYTV_THEME_RUNTIME);
  const sourceOptions = {
    repository: options['source-repository'],
    commit: options['source-commit'],
    out: options.out
  };
  if (command === 'send') {
    const sender = require('../lib/theme-send.cjs');
    sender.validate(options.tv, options.pin);
    await sender.send(await t.compile(pos[0], rt), options.tv, options.pin);
    console.log('Sent. Finish installation on TV, then choose Apply theme.');
    return;
  }
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
  if (command === 'preview' || command === 'showcase') {
    const port = options.port === undefined ? 8766 : Number(options.port);
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw Error('Invalid port');
    const p = await t[command](pos[0], rt, {
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
