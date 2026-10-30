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
  assert.equal(await page.locator('#themePicker strong').textContent(),'Themes','author picker uses English');
  assert.deepEqual(await page.locator('#themePicker .ctv-theme-card__name').allTextContents(),['Classic','Alpine','Itachi · Sharingan','Ribbon','Channel']);
  assert.equal(await page.locator('#themePicker img').count(),5,'each theme has a preview image');
  for(const img of await page.locator('#themePicker img').all()) {await img.evaluate(el=>el.decode());assert.ok(await img.evaluate(el=>el.naturalWidth>1));}
  assert.equal(await page.locator('#themePicker .ctv-theme-card').count(),5);
  assert.equal((await fetch(preview.url+'theme-thumbnail?theme=../private')).status,404);
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(()=>document.getElementById('screen').getBoundingClientRect().width<=innerWidth);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'narrow page contains its horizontal card strip');
  for(const name of await page.locator('#themePicker .ctv-theme-card__name').all()) assert.ok(await name.evaluate(el=>el.offsetHeight<=parseFloat(getComputedStyle(el).lineHeight)*2+1),'theme name stays within two readable lines');
  assert.equal(await page.locator('.theme-card-strip').evaluate(el=>el.scrollWidth>el.clientWidth),true,'narrow picker can scroll through image cards');
  await page.setViewportSize({width:1280,height:900});
  const frame=page.frames().find(f=>f.url().includes('/runtime/'));
  await page.getByRole('button',{name:'Classic',exact:true}).waitFor();
  await frame.waitForFunction(()=>window.HomeLayoutState);
  assert.equal(await frame.locator('#ctv-theme-style').count(),0,'Classic uses the built-in renderer styles');
  assert.equal(await frame.evaluate(()=>window.CYTV_THEME_AUTHOR_PREVIEW),true,'trusted author wrapper controls preview selection');
  await frame.evaluate(async()=>{if(window.ThemeManager){await ThemeManager.start();if(ThemeManager.current().id!=='builtin:classic')throw Error('author startup restored persisted TV appearance');}});
  await page.getByRole('button',{name:'Alpine',exact:true}).press('Enter');
  await frame.waitForFunction(()=>HomeLayoutState.state().preset==='scenic-grid');
  await page.getByRole('button',{name:'Classic',exact:true}).press('Space');
  await frame.waitForFunction(()=>!document.getElementById('ctv-theme-style'));
  const thumbnail=page.locator('button[data-key="terminal"] img');
  await thumbnail.evaluate(img=>{img.src='/theme-thumbnail?theme=missing';});
  await page.locator('button[data-key="terminal"] .ctv-theme-card__fallback:not([hidden])').waitFor();
  await frame.evaluate(()=>{window.sameHome=true;HomeLayoutState.setColumns(4);});
  for(const [title,preset,columns] of [['Alpine','scenic-grid',8],['Channel','channel-list',4]]){
   await page.getByRole('button',{name:title,exact:true}).click();
   await frame.waitForFunction(preset=>HomeLayoutState.state().preset===preset,preset);
   for(const part of ['input-icon','network-icon','settings-icon']) {
    const icon=frame.locator('.ctv-'+part);
    assert.equal(await icon.count(),1,'dedicated decorative icon hook');
    assert.equal(await icon.evaluate(el=>getComputedStyle(el).fill),'rgba(0, 0, 0, 0)','original SVG fill is replaced');
    assert.match(await icon.evaluate(el=>getComputedStyle(el).backgroundImage),/url\(/,'custom local artwork is applied');
   }
   if(title==='Alpine') {
    await frame.locator('body').press('ArrowLeft');await frame.locator('.add-app.focused').waitFor();await page.keyboard.press('Enter');await frame.locator('#appPicker:not([hidden])').waitFor();
    const overlay=await frame.locator('.ctv-library').evaluate(el=>{const s=getComputedStyle(el);return {color:s.backgroundColor,image:s.backgroundImage};});
    assert.match(overlay.color,/rgba\([^,]+,[^,]+,[^,]+, 0\.[1-4]\)/,'Alpine library leaves wallpaper visible behind its panel');
    assert.doesNotMatch(overlay.image,/rgb\(/,'library backdrop has no opaque gradient');
    assert.equal(await frame.locator('.ctv-library :focus').count(),1,'library keeps visible focus');
    await page.keyboard.press('Escape');await frame.locator('#appPicker').waitFor({state:'hidden'});
   }
   await frame.locator('#btnInputs').hover();
   assert.notEqual(await frame.locator('#btnInputs').evaluate(el=>getComputedStyle(el).color),'rgba(0, 0, 0, 0)','button label remains readable');
   await page.mouse.move(0,0);
   assert.equal(await frame.evaluate(()=>window.sameHome),true,'renderer is not reloaded');
   assert.equal(await frame.evaluate(()=>HomeLayoutState.state().columns),columns,'fixed theme uses author columns; adjustable theme restores user override');
   await page.waitForFunction(title=>[...document.querySelectorAll('[data-theme-id]')].some(b=>b.dataset.themeTitle===title&&b.getAttribute('aria-pressed')==='true'),title);
  }
  await page.getByRole('button',{name:'Classic',exact:true}).click();
  await frame.waitForFunction(()=>!document.getElementById('ctv-theme-style'));
  assert.equal(await frame.locator('.ctv-input-icon').evaluate(el=>getComputedStyle(el).backgroundImage),'none','Classic restores original artwork');
  assert.notEqual(await frame.locator('.ctv-input-icon').evaluate(el=>getComputedStyle(el).fill),'rgba(0, 0, 0, 0)');
  assert.equal(await frame.evaluate(()=>HomeLayoutState.state().preset),'dock-grid');
  assert.equal(await frame.evaluate(()=>HomeLayoutState.state().columns),4,'Classic keeps the user override');
  assert.equal(await frame.evaluate(()=>window.sameHome),true);
  await frame.evaluate(()=>HomeLayoutState.setColumns(null));
  assert.equal(await frame.evaluate(()=>HomeLayoutState.state().columns),5,'Classic default is five columns');
  await page.getByRole('button',{name:'Channel',exact:true}).click();
  await frame.waitForFunction(()=>HomeLayoutState.state().preset==='channel-list'&&document.getElementById('ctv-theme-style'));
  // Generic input belongs to this interaction test, not the captured app inventory.
  await frame.evaluate(() => { TV_APPS.inputs = [{label: 'HDMI 1', appId: 'preview.hdmi1'}]; });
  await frame.locator('#btnInputs').click();await frame.locator('#inputsPanel:not(.hidden)').waitFor();
  await frame.locator('#btnSettings').click();await frame.waitForFunction(()=>document.getElementById('ctv-theme-style').disabled);
  const origin=new URL(preview.url).origin;
  const post=(body,from=origin)=>fetch(preview.url+'theme-selection',{method:'POST',headers:{origin:from,'content-type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await post({theme:'../../private'})).status,400);
  assert.equal((await post({theme:'terminal'},'https://example.com')).status,403);
  assert.equal((await fetch(preview.url+'theme-selection')).status,405);
  assert.equal(preview.state().input.manifest.title,'Channel');
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
