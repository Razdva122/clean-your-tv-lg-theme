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
  assert.equal(state.window.TV_APPS.apps.length,10);assert.equal(state.window.TV_APPS.apps[0].id,'netflix');assert(state.window.TV_APPS.apps.every(a=>a.icon.startsWith('data:image/png;base64,')));
 }finally{p.server.closeAllConnections();await new Promise(r=>p.server.close(r));}
});

test('default reference order remains consistent across author theme switches',{skip:!process.env.CYTV_THEME_RUNTIME||!process.env.CYTV_THEME_BROWSER},async()=>{
 const p=await t.showcase(path.resolve('examples'),t.runtime(process.env.CYTV_THEME_RUNTIME));
 const browser=await require('playwright').chromium.launch({headless:true,executablePath:process.env.CYTV_THEME_BROWSER});
 try{
  const page=await browser.newPage();await page.goto(p.url);let frame=page.frames().find(f=>f.url().includes('/runtime/'));
  await frame.locator('#tiles .item[data-app-id]').first().waitFor();
  const order=()=>frame.locator('#tiles .item[data-app-id]').evaluateAll(items=>items.slice(0,5).map(el=>el.dataset.appId));
  const expected=['netflix','youtube.leanback.v4','com.apple.appletv','com.apple.applemusic','tv.twitch.tv.starshot.lg'];
  assert.deepEqual(await order(),expected);
  await frame.locator('#btnInputs').click();await frame.locator('#inputsPanel:not(.hidden)').waitFor();
  assert.equal(await frame.locator('#inputsPanel .ctv-input-row').count(),2,'default author preview offers two generic HDMI inputs');
  await frame.locator('body').press('Escape');
  for(const key of ['itachi','terminal','']){
   await page.locator('[data-key="'+key+'"]').click();await page.locator('[data-key="'+key+'"][aria-pressed="true"]').waitFor();
   assert.deepEqual(await order(),expected);
  }
  await page.reload();frame=page.frames().find(f=>f.url().includes('/runtime/'));await frame.locator('#tiles .item[data-app-id]').first().waitFor();
  assert.deepEqual(await order(),expected);
 }finally{await browser.close();p.server.closeAllConnections();await new Promise(r=>p.server.close(r));}
});
