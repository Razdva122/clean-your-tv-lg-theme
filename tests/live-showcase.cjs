'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const t=require('../lib/toolkit.cjs');
const fs=require('node:fs'),os=require('node:os');
test('showcase rejects copied themes with duplicate identities before serving',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'ctv-showcase-'));
 try {t.init(path.join(root,'one'));fs.cpSync(path.join(root,'one'),path.join(root,'two'),{recursive:true});await assert.rejects(t.showcase(root,null),/Duplicate theme identity/);}
 finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('live showcase switches themes on one renderer and retains user column choice',{
 skip:!process.env.CYTV_THEME_RUNTIME||!process.env.CYTV_THEME_BROWSER
},async()=>{
 const preview=await t.showcase(path.resolve('examples'),t.runtime(process.env.CYTV_THEME_RUNTIME));
 const browser=await require('playwright').chromium.launch({headless:true,executablePath:process.env.CYTV_THEME_BROWSER});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});await page.goto(preview.url);
  assert.equal(await page.locator('#themePicker strong').textContent(),'Темы','picker uses UTF-8');
  const frame=page.frames().find(f=>f.url().includes('/runtime/'));
  await page.getByRole('button',{name:'Classic',exact:true}).waitFor();
  await frame.waitForFunction(()=>window.HomeLayoutState);
  assert.equal(await frame.locator('#ctv-theme-style').count(),0,'Classic uses the built-in renderer styles');
  await frame.evaluate(()=>{window.sameHome=true;HomeLayoutState.setColumns(4);});
  for(const [title,preset] of [['Pure','icon-grid'],['Index','side-grid'],['Channel','channel-list'],['Postcard','dock-grid']]){
   await page.getByRole('button',{name:title,exact:true}).click();
   await frame.waitForFunction(preset=>HomeLayoutState.state().preset===preset,preset);
   assert.equal(await frame.evaluate(()=>window.sameHome),true,'renderer is not reloaded');
   assert.equal(await frame.evaluate(()=>HomeLayoutState.state().columns),4,'user override is retained');
   await page.waitForFunction(title=>[...document.querySelectorAll('[data-theme-id]')].some(b=>b.textContent===title&&b.getAttribute('aria-pressed')==='true'),title);
  }
  await page.getByRole('button',{name:'Classic',exact:true}).click();
  await frame.waitForFunction(()=>!document.getElementById('ctv-theme-style'));
  assert.equal(await frame.evaluate(()=>HomeLayoutState.state().preset),'dock-grid');
  assert.equal(await frame.evaluate(()=>HomeLayoutState.state().columns),4,'Classic keeps the user override');
  assert.equal(await frame.evaluate(()=>window.sameHome),true);
  await frame.evaluate(()=>HomeLayoutState.setColumns(null));
  assert.equal(await frame.evaluate(()=>HomeLayoutState.state().columns),5,'Classic default is five columns');
  await page.getByRole('button',{name:'Index',exact:true}).click();
  await frame.waitForFunction(()=>HomeLayoutState.state().preset==='side-grid');
  await page.getByRole('button',{name:'Postcard',exact:true}).click();
  await frame.waitForFunction(()=>HomeLayoutState.state().preset==='dock-grid'&&document.getElementById('ctv-theme-style'));
  await frame.locator('#btnInputs').click();await frame.locator('#inputsPanel:not(.hidden)').waitFor();
  await frame.locator('#btnSettings').click();await frame.waitForFunction(()=>document.getElementById('ctv-theme-style').disabled);
  const origin=new URL(preview.url).origin;
  const post=(body,from=origin)=>fetch(preview.url+'theme-selection',{method:'POST',headers:{origin:from,'content-type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await post({theme:'../../private'})).status,400);
  assert.equal((await post({theme:'minimal'},'https://example.com')).status,403);
  assert.equal((await fetch(preview.url+'theme-selection')).status,405);
  assert.equal(preview.state().input.manifest.title,'Postcard');
 }finally{await browser.close();preview.server.closeAllConnections();await new Promise(resolve=>preview.server.close(resolve));}
});

test('a rejected source keeps built-in Classic and clears its transient error', {skip:!process.env.CYTV_THEME_RUNTIME}, async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'ctv-classic-'));let preview;
 try {
  t.init(path.join(root,'broken'));fs.writeFileSync(path.join(root,'broken/theme.css'),'body { display: none; }');
  preview=await t.showcase(root,t.runtime(process.env.CYTV_THEME_RUNTIME));
  const response=await fetch(preview.url+'theme-selection',{method:'POST',headers:{origin:new URL(preview.url).origin,'content-type':'application/json'},body:JSON.stringify({theme:'broken'})});
  assert.equal(response.status,422);assert.equal(preview.state().classic,true);
  await preview.refresh();assert.equal(preview.state().error,null);assert.equal(preview.state().input,null);
 } finally {if(preview){preview.server.closeAllConnections();await new Promise(r=>preview.server.close(r));}fs.rmSync(root,{recursive:true,force:true});}
});
