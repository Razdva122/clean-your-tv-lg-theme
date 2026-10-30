'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const t=require('../lib/toolkit.cjs');
const icon='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==';
const fixture=()=>({apps:[{id:'com.example.actual',title:'Actual TV app',icon,iconColor:'#abcdef',privateKey:'must not be exposed'}],inputs:[]});
test('private preview inventory keeps original bytes and rejects network paths and malformed data',()=>{
 const load=require('../lib/preview-inventory.cjs').load,dir=fs.mkdtempSync(path.join(os.tmpdir(),'ctv-inventory-')),file=path.join(dir,'inventory.json');
 try{
  fs.writeFileSync(file,JSON.stringify(fixture()));const out=load(file);assert.equal(out.apps[0].icon,icon);assert.equal(out.apps[0].privateKey,undefined);
  for(const bad of ['https://example.com/icon.png','file:///private/icon.png','data:image/svg+xml;base64,PHN2Zz4=','data:image/png;base64,bm90LXBuZw==']){const x=fixture();x.apps[0].icon=bad;fs.writeFileSync(file,JSON.stringify(x));assert.throws(()=>load(file),/icon/i);}
  const duplicate=fixture();duplicate.apps.push({...duplicate.apps[0]});fs.writeFileSync(file,JSON.stringify(duplicate));assert.throws(()=>load(file),/duplicate/i);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('private TV snapshot replaces demo inventory in both renderers and blocks cross-origin scripts',{skip:!process.env.CYTV_THEME_RUNTIME},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ctv-inventory-route-')),file=path.join(dir,'inventory.json');fs.writeFileSync(file,JSON.stringify(fixture()));
 try{for(const edition of ['no-root','root']){
  const rt=t.runtime(process.env.CYTV_THEME_RUNTIME),p=await t.showcase(path.resolve('examples'),rt,{edition,inventory:file});
  try{
   const html=await(await fetch(p.url)).text();assert.match(html,/TV snapshot/);
   const base=edition==='root'?'root-launcher':'launcher',url=p.url+'runtime/preview/'+base+'/apps.js';
   const response=await fetch(url);assert.equal(response.headers.get('cross-origin-resource-policy'),'same-origin');
   const state={window:{},setTimeout,clearTimeout};vm.runInNewContext(fs.readFileSync(path.join(rt.root,'preview/preview/bridge.js'),'utf8'),state,{timeout:100});vm.runInNewContext(await response.text(),state,{timeout:100});
   assert.equal(state.window.TV_APPS.apps.length,1);assert.equal(state.window.TV_APPS.apps[0].id,'com.example.actual');assert.equal(state.window.TV_APPS.apps[0].icon,icon);assert.equal(state.window.TV_APPS.apps[0].privateKey,undefined);
   assert.equal((await fetch(url,{headers:{'Sec-Fetch-Site':'cross-site'}})).status,403);
   assert.equal((await fetch(url,{headers:{Origin:'https://example.com'}})).status,403);
  }finally{p.server.closeAllConnections();await new Promise(r=>p.server.close(r));}
 }}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('snapshot app renders with its exact original icon across theme changes',{skip:!process.env.CYTV_THEME_RUNTIME||!process.env.CYTV_THEME_BROWSER},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ctv-inventory-browser-')),file=path.join(dir,'inventory.json');fs.writeFileSync(file,JSON.stringify(fixture()));
 let p,browser;
 try{
  p=await t.showcase(path.resolve('examples'),t.runtime(process.env.CYTV_THEME_RUNTIME),{inventory:file});browser=await require('playwright').chromium.launch({headless:true,executablePath:process.env.CYTV_THEME_BROWSER});
  const page=await browser.newPage();await page.goto(p.url);const frame=page.frames().find(f=>f.url().includes('/runtime/'));await frame.locator('[data-app-id="com.example.actual"] img').waitFor();
  assert.equal(await frame.locator('[data-app-id="com.example.actual"] img').getAttribute('src'),icon);
  assert.equal(await frame.locator('#tiles .item:not(.add-app)').count(),1,'no demo apps mixed into the snapshot');
  const discovery=await frame.evaluate(()=>new Promise(resolve=>{const bridge=new PalmServiceBridge();bridge.onservicecallback=raw=>resolve(JSON.parse(raw));bridge.call('luna://com.local.nativehome.service/listApps','{}');}));
  assert.equal(discovery.apps.length,1,'Add app discovery must not introduce synthetic apps');assert.equal(discovery.apps[0].icon,icon);
  for(const key of ['itachi','terminal','']){
   await page.locator('[data-key="'+key+'"]').click();await page.locator('[data-key="'+key+'"][aria-pressed="true"]').waitFor();
   assert.equal(await frame.locator('[data-app-id="com.example.actual"] img').getAttribute('src'),icon);
  }
 }finally{if(browser)await browser.close();if(p){p.server.closeAllConnections();await new Promise(r=>p.server.close(r));}fs.rmSync(dir,{recursive:true,force:true});}
});
