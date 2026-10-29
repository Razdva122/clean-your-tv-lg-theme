'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),t=require('../lib/toolkit.cjs');
test('preview permits reviewed GitHub data without opening arbitrary network hosts',{skip:!process.env.CYTV_THEME_RUNTIME||!process.env.CYTV_THEME_BROWSER},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ctv-preview-network-'));let preview,browser;
 try{
  t.init(path.join(dir,'theme'));preview=await t.preview(path.join(dir,'theme'),t.runtime(process.env.CYTV_THEME_RUNTIME));
  browser=await require('playwright').chromium.launch({headless:true,executablePath:process.env.CYTV_THEME_BROWSER});const page=await browser.newPage();
  await page.route('https://api.github.com/**',r=>r.fulfill({body:'api fixture',headers:{'Access-Control-Allow-Origin':'*'}}));await page.route('https://raw.githubusercontent.com/**',r=>r.fulfill({body:'theme fixture',headers:{'Access-Control-Allow-Origin':'*'}}));
  let arbitrary=0;await page.route('https://example.com/**',r=>{arbitrary++;return r.fulfill({body:'must not load',headers:{'Access-Control-Allow-Origin':'*'}});});
  const header=(await fetch(preview.url)).headers.get('content-security-policy');assert(!header.includes('github.com'),'outer author UI retains its self-only network policy');await page.goto(preview.url);const frame=page.frames().find(f=>f.url().includes('/runtime/'));await frame.waitForFunction(()=>!!window.ThemeData);
  const get=url=>frame.evaluate(url=>new Promise(resolve=>{const x=new XMLHttpRequest();x.open('GET',url);x.onload=()=>resolve(x.responseText);x.onerror=()=>resolve('blocked');x.send();}),url);
  assert.equal(await get('https://api.github.com/repos/example/themes'),'api fixture');assert.equal(await get('https://raw.githubusercontent.com/example/themes/'+'a'.repeat(40)+'/cytv-theme.json'),'theme fixture');assert.equal(await get('https://example.com/untrusted'),'blocked');assert.equal(arbitrary,0,'CSP must reject arbitrary hosts before network dispatch');
 }finally{if(browser)await browser.close();if(preview){preview.server.closeAllConnections();await new Promise(r=>preview.server.close(r));}fs.rmSync(dir,{recursive:true,force:true});}
});
