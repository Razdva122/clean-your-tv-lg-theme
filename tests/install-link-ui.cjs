'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
test('TV link shows only last publication, honest lookup states and copyable verified fallback',{skip:!process.env.CYTV_THEME_RUNTIME||!process.env.CYTV_THEME_BROWSER},async()=>{
 const t=require('../lib/toolkit.cjs'),p=await t.preview(path.resolve('examples/terminal'),t.runtime(process.env.CYTV_THEME_RUNTIME)),browser=await require('playwright').chromium.launch({headless:true,executablePath:process.env.CYTV_THEME_BROWSER});
 try{
  const page=await browser.newPage();page.setDefaultTimeout(10000);
  const url='https://raw.githubusercontent.com/owner/themes/'+'a'.repeat(40)+'/dist/cytv-theme.json';let mode='published';
  await page.route('**/theme-install-link',async r=>{
   assert.ok(['GET','POST'].includes(r.request().method()));if(r.request().method()==='POST')assert.equal(r.request().postData(),null);
   if(mode==='unavailable')return r.fulfill({status:503,json:{entry:null,state:'unavailable',notice:'Could not verify the last publication. Check your connection and retry. This does not mean the theme is unpublished.'}});
   if(mode==='empty')return r.fulfill({json:{entry:null,state:'checked'}});
   return r.fulfill({json:{entry:{title:'Terminal',version:'1.3.3',publishedAt:'2026-10-29T12:00:00Z',url,shortUrl:mode==='fallback'?null:'https://da.gd/test12',notice:mode==='fallback'?'Installation ID unavailable. Use the verified full link or retry later.':null}}});
  });
  await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async value=>{window.copiedLink=value;}}}));
  await page.goto(p.url);await page.locator('#themeInstallLink').click();
  await page.waitForFunction(()=>document.getElementById('themeInstallID').value==='test12');
  assert.match(await page.locator('#installLinkTheme').innerText(),/Last published: Terminal · 1.3.3/);
  assert.match(await page.locator('#installLinkLocalNotice').innerText(),/Local edits.*not included/);
  assert.equal(await page.locator('#publishedThemeURL').getAttribute('readonly'),'');
  await page.locator('#copyThemeID').click();assert.equal(await page.evaluate(()=>window.copiedLink),'test12');
  await page.locator('#copyThemeLink').click();assert.equal(await page.evaluate(()=>window.copiedLink),'https://da.gd/test12');
  mode='fallback';await page.locator('#retryThemeLink').click();
  await page.waitForFunction(u=>document.getElementById('themeLinkResult').value===u,url);
  assert.equal(await page.locator('#copyThemeID').isDisabled(),true);assert.equal(await page.locator('#copyThemeLink').isDisabled(),false);
  assert.equal(await page.locator('#createThemeLink').isVisible(),true);mode='published';await page.locator('#createThemeLink').click();await page.waitForFunction(()=>document.getElementById('themeInstallID').value==='test12');
  mode='unavailable';await page.locator('#retryThemeLink').click();
  await page.waitForFunction(()=>document.getElementById('installLinkStatus').textContent.includes('does not mean'));
  assert.equal(await page.locator('#themeLinkResult').inputValue(),'');assert.equal(await page.locator('#copyThemeLink').isDisabled(),true);
  assert.equal(await page.locator('#installLinkTheme').innerText(),'');
  mode='empty';await page.locator('#retryThemeLink').click();await page.waitForFunction(()=>document.getElementById('installLinkStatus').textContent.includes('No published installation link'));
  assert.equal(await page.locator('#installLinkPublishHelp').isVisible(),true);
  assert.match(await page.locator('#installLinkPublishHelp').innerText(),/release-workflow/);
  await page.locator('#closeThemeLink').click();assert.equal(await page.locator('#themeInstallLink').evaluate(e=>e===document.activeElement),true);
 }finally{await browser.close();p.server.closeAllConnections();await new Promise(r=>p.server.close(r));}
});

test('publication lookup survives invalid local CSS and ID creation only uses reverified public URL',{skip:!process.env.CYTV_THEME_RUNTIME},async()=>{
 const fs=require('node:fs'),os=require('node:os'),crypto=require('node:crypto'),t=require('../lib/toolkit.cjs'),links=require('../lib/short-links.cjs');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'theme-published-link-')),originalFetch=global.fetch;
 let p;
 try{
  fs.cpSync(path.resolve('examples/terminal'),dir,{recursive:true});
  p=await t.preview(dir,t.runtime(process.env.CYTV_THEME_RUNTIME));
  fs.writeFileSync(path.join(dir,'theme.css'),'@import "https://invalid.test/forbidden.css";');
  const manifest={id:'github:razdva122/clean-your-tv-lg-theme:terminal',title:'Published Channel',themeVersion:'1.0.0',source:{repository:'https://github.com/razdva122/clean-your-tv-lg-theme'}};
  const url='https://raw.githubusercontent.com/razdva122/clean-your-tv-lg-theme/'+'a'.repeat(40)+'/distributions/terminal/1.0.0/cytv-theme.json';
  const entry={id:manifest.id,title:manifest.title,version:'1.0.0',url,descriptorSha256:crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex')};
  const targets=[];let created=false;
  global.fetch=async(u,o)=>{
   if(String(u).startsWith('http://127.0.0.1:'))return originalFetch(u,o);
   if(u==='https://da.gd/s'){targets.push(new URLSearchParams(o.body).get('url'));created=true;return {ok:true,status:200,body:[Buffer.from('https://da.gd/test12')]};}
   if(u.includes('/coshorten/'))return {ok:created,status:created?200:404,body:[Buffer.from(created?url:'missing')]};
   const value=String(u).startsWith('https://api.github')?[{published_at:'2026-10-29T12:00:00Z',body:links.notes('Published',[entry])}]:manifest;
   return {ok:true,status:200,body:[Buffer.from(JSON.stringify(value))]};
  };
  const response=await originalFetch(new URL('/theme-install-link',p.url));
  assert.equal(response.status,200);assert.equal((await response.json()).entry.version,'1.0.0');
  assert.equal((await originalFetch(new URL('/theme-install-link',p.url),{method:'POST'})).status,403);
  const origin=new URL(p.url).origin;
  const substituted=await originalFetch(new URL('/theme-install-link',p.url),{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({url:'https://evil.test/theme.json'})});
  assert.equal(substituted.status,400);assert.equal(targets.length,0);
  const generated=await originalFetch(new URL('/theme-install-link',p.url),{method:'POST',headers:{Origin:origin}});
  assert.equal(generated.status,200);assert.equal((await generated.json()).entry.shortUrl,'https://da.gd/test12');assert.deepEqual(targets,[url]);
 }finally{global.fetch=originalFetch;if(p){p.server.closeAllConnections();await new Promise(r=>p.server.close(r));}fs.rmSync(dir,{recursive:true,force:true});}
});
