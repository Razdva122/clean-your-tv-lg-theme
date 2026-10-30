'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),path=require('node:path');
test('author CLI help succeeds before option parsing and exposes the publish flow',()=>{
 for(const args of [[],['--help'],['help'],['preview','--help'],['release-workflow','--help']]){
  const r=spawnSync(process.execPath,[path.resolve('bin/theme.cjs'),...args],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/source A/);assert.match(r.stdout,/release-workflow/);assert.match(r.stdout,/distributions\/SLUG\/VERSION/);
 }
});
