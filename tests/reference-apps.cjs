'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../examples/reference-apps'),t=require('../lib/toolkit.cjs');
test('ten international TV reference apps preserve native metadata and exact original icon bytes',()=>{
 const meta=JSON.parse(fs.readFileSync(path.join(root,'metadata.json'))),inventory=require('../lib/preview-inventory.cjs').load(path.join(root,'inventory.json'));
 assert.equal(meta.apps.length,10);assert.equal(inventory.apps.length,10);const ids=new Set();
 for(const app of meta.apps){
  assert(!app.id.startsWith('preview.'));assert(!ids.has(app.id));ids.add(app.id);assert(app.version);assert(!['kinopoisk','okko','ivi'].includes(app.slug));
  const file=path.join(root,app.icon.path),data=fs.readFileSync(file);assert.equal(data.length,app.icon.size);assert.equal(crypto.createHash('sha256').update(data).digest('hex'),app.icon.sha256);
  const entry=inventory.apps.find(a=>a.id===app.id);assert(entry);assert.equal(entry.title,app.title);assert.deepEqual(Buffer.from(entry.icon.split(',')[1],'base64'),data);
  assert.equal(data.readUInt32BE(16),app.icon.width);assert.equal(data.readUInt32BE(20),app.icon.height);
 }
});
test('ordinary showcase serves original international TV resources by default',{skip:!process.env.CYTV_THEME_RUNTIME},async()=>{
 const p=await t.showcase(path.resolve('examples'),t.runtime(process.env.CYTV_THEME_RUNTIME));
 try{
  assert.match(await(await fetch(p.url)).text(),/Reference TV apps/);
  const script=await(await fetch(p.url+'runtime/preview/launcher/apps.js')).text();
  const vm=require('node:vm'),state={window:{},setTimeout,clearTimeout},rt=t.runtime(process.env.CYTV_THEME_RUNTIME);
  vm.runInNewContext(fs.readFileSync(path.join(rt.root,'preview/preview/bridge.js'),'utf8'),state);vm.runInNewContext(script,state);
  assert.equal(state.window.TV_APPS.apps.length,10);assert.equal(state.window.TV_APPS.apps[0].id,'youtube.leanback.v4');assert(state.window.TV_APPS.apps.every(a=>a.icon.startsWith('data:image/png;base64,')));
 }finally{p.server.closeAllConnections();await new Promise(r=>p.server.close(r));}
});
