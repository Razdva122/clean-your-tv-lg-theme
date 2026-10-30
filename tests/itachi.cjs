'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto');
const toolkit=require('../lib/toolkit.cjs'),source=path.resolve(__dirname,'../examples/itachi');
const repository='https://github.com/razdva122/clean-your-tv-lg-theme';
test('Sharingan builds a verified data package using the toolkit identity and explicit modern capability',{skip:!process.env.CYTV_THEME_RUNTIME},async()=>{
 const rt=toolkit.runtime(process.env.CYTV_THEME_RUNTIME),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ctv-itachi-build-'));
 try{
  const repo=path.join(tmp,'source');fs.cpSync(source,repo,{recursive:true});
  const git=args=>cp.execFileSync('git',['-C',repo,...args],{encoding:'utf8'}).trim();
  git(['init','-q']);git(['add','.']);git(['-c','user.name=Theme test','-c','user.email=theme@example.test','-c','commit.gpgsign=false','commit','-qm','Commit author source']);
  const commit=git(['rev-parse','HEAD']),out=path.join(tmp,'distribution');
  const manifest=await toolkit.build(repo,rt,{repository,commit,out});
  assert.equal(manifest.id,'github:razdva122/clean-your-tv-lg-theme:itachi');
  assert.equal(manifest.source.commit,commit);assert.deepEqual(manifest.requires.capabilities,['modern-icon-css-v1']);
  assert.equal(manifest.layout.columns,5);assert.equal(manifest.assets.length,2,'wallpaper and preview only; no replacement app images');
  for(const file of [manifest.rules,...manifest.assets,...manifest.documents]){
   const bytes=fs.readFileSync(path.join(out,file.path));assert.equal(bytes.length,file.size);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),file.sha256);
  }
  const compiled=await toolkit.compile(source,rt),policy=require(path.join(rt.root,rt.meta.policy));
  const css=policy.serializeBundle(compiled.rules,Object.fromEntries(compiled.assets.map(a=>[a.id,'blob:ctv-preview/'+a.id])));
  assert.match(css,/font-size:\s*48px/);assert.match(css,/mix-blend-mode:\s*screen/);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
test('Sharingan renders and switches back to Classic in both editions without replacing native app images',{skip:!process.env.CYTV_THEME_RUNTIME||!process.env.CYTV_THEME_BROWSER},async()=>{
 const rt=toolkit.runtime(process.env.CYTV_THEME_RUNTIME),manifest=JSON.parse(fs.readFileSync(path.join(source,'theme.json')));
 const browser=await require('playwright').chromium.launch({headless:true,executablePath:process.env.CYTV_THEME_BROWSER});
 try{for(const edition of ['no-root','root']){
  const preview=await toolkit.preview(null,rt,{edition,themes:[{key:'itachi',directory:source,manifest}]});
  const page=await browser.newPage({viewport:{width:1100,height:900}});page.setDefaultTimeout(10000);
  try{
   await page.goto(preview.url);const frame=page.frames().find(f=>f.url().includes('/runtime/'));
   await frame.waitForFunction(()=>window.ThemeRuntime&&document.querySelector('#tiles .item img'));
   const native=await frame.locator('#tiles .item img').evaluateAll(images=>images.map(image=>image.getAttribute('src')));
   await page.locator('[data-key="itachi"]').click();await page.locator('[data-key="itachi"][aria-pressed="true"]').waitFor();
   await frame.waitForFunction(()=>document.getElementById('ctv-theme-style')&&getComputedStyle(document.querySelector('.ctv-clock')).fontSize==='48px');
   assert.deepEqual(await frame.locator('#tiles .item img').evaluateAll(images=>images.map(image=>image.getAttribute('src'))),native);
   assert.equal(await page.locator('#error').getAttribute('role'),'status');
   if(process.env.ITACHI_REVIEW_DIR){fs.mkdirSync(process.env.ITACHI_REVIEW_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.ITACHI_REVIEW_DIR,edition+'.png')});}
   await page.locator('[data-key=""]').click();await page.locator('[data-key=""][aria-pressed="true"]').waitFor();
   await frame.waitForFunction(()=>!document.getElementById('ctv-theme-style')||document.getElementById('ctv-theme-style').disabled||!document.getElementById('ctv-theme-style').textContent);
  }finally{await page.close();preview.server.closeAllConnections();await new Promise(resolve=>preview.server.close(resolve));}
 }}finally{await browser.close();}
});
