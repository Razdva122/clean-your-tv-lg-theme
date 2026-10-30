'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const toolkit=require('../lib/toolkit.cjs'),source=path.resolve(__dirname,'../candidate-examples/ribbon');
const manifest=JSON.parse(fs.readFileSync(path.join(source,'theme.json')));
const runtime=process.env.CYTV_THEME_RUNTIME ? toolkit.runtime(process.env.CYTV_THEME_RUNTIME) : null;
const contract=runtime && runtime.meta.contract && runtime.inventory.has(runtime.meta.contract) ? JSON.parse(fs.readFileSync(path.join(runtime.root,runtime.meta.contract))) : null;
const supportsRibbon=!!(contract && contract.optionalCapabilities && contract.optionalCapabilities['ribbon-layout-v1']);
const featureSkip=!runtime ? 'CYTV_THEME_RUNTIME is not configured' : !supportsRibbon ? 'verified runtime lacks ribbon-layout-v1; use the explicit feature candidate' : false;

test('an explicit older verified runtime refuses Ribbon with update-runtime',{skip:!runtime ? 'CYTV_THEME_RUNTIME is not configured' : supportsRibbon ? 'feature runtime supports ribbon-layout-v1' : false},async()=>{
 await assert.rejects(toolkit.compile(source,runtime),/update-runtime:.*ribbon-layout-v1/);
});

test('Ribbon requires a runtime contract advertising ribbon-layout-v1 before compilation',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'ctv-ribbon-old-'));
 try{
  fs.writeFileSync(path.join(root,'compiler.cjs'),"exports.compileSource=()=>{throw Error('compiler must not run');};");
  fs.writeFileSync(path.join(root,'contract.json'),JSON.stringify({optionalCapabilities:{'modern-icon-css-v1':{}}}));
  const rt={root,meta:{compiler:'compiler.cjs',contract:'contract.json'},inventory:new Map([['contract.json',{}]])};
  await assert.rejects(toolkit.compile(source,rt),/update-runtime:.*ribbon-layout-v1.*--runtime PATH/);
  delete rt.meta.contract;
  await assert.rejects(toolkit.compile(source,rt),/update-runtime:/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('Ribbon refuses a mismatched compiler that silently drops optional geometry',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'ctv-ribbon-mismatch-'));
 try{
  fs.writeFileSync(path.join(root,'compiler.cjs'),"exports.compileSource=()=>({manifest:{layout:{preset:'scenic-grid'},requires:{capabilities:[]}}});");
  fs.writeFileSync(path.join(root,'contract.json'),JSON.stringify({optionalCapabilities:{'ribbon-layout-v1':{}}}));
  const rt={root,meta:{compiler:'compiler.cjs',contract:'contract.json'},inventory:new Map([['contract.json',{}]])};
  await assert.rejects(toolkit.compile(source,rt),/update-runtime:.*did not preserve/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('Ribbon compiles and exports through the main candidate without losing geometry',{skip:featureSkip},async()=>{
 const rt=toolkit.runtime(process.env.CYTV_THEME_RUNTIME),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ctv-ribbon-build-'));
 try{
  const compiled=await toolkit.compile(source,rt);
  assert.deepEqual(compiled.manifest.layout.ribbon,manifest.layout.ribbon);
  assert.equal(compiled.manifest.layout.allowColumnOverride,false);
  assert.deepEqual(compiled.manifest.requires.capabilities,['ribbon-layout-v1']);
  const repo=path.join(tmp,'source');fs.cpSync(source,repo,{recursive:true});
  const git=args=>cp.execFileSync('git',['-C',repo,...args],{encoding:'utf8'}).trim();
  git(['init','-q']);git(['add','.']);git(['-c','user.name=Theme test','-c','user.email=theme@example.test','-c','commit.gpgsign=false','commit','-qm','Commit Ribbon source']);
  const result=await toolkit.build(repo,rt,{repository:'https://github.com/razdva122/clean-your-tv-lg-theme',commit:git(['rev-parse','HEAD']),out:path.join(tmp,'distribution')});
  assert.deepEqual(result.layout.ribbon,manifest.layout.ribbon);
  assert.deepEqual(result.requires.capabilities,['ribbon-layout-v1']);
  assert.equal(result.title,'Ribbon');
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});

test('Ribbon preview carries the compiled geometry to both real renderer editions',{skip:featureSkip || (!process.env.CYTV_THEME_BROWSER && 'CYTV_THEME_BROWSER is not configured')},async()=>{
 const rt=toolkit.runtime(process.env.CYTV_THEME_RUNTIME),browser=await require('playwright').chromium.launch({headless:true,executablePath:process.env.CYTV_THEME_BROWSER});
 try{for(const edition of ['no-root','root']){
  const preview=await toolkit.preview(source,rt,{edition}),page=await browser.newPage();
  try{
   assert.deepEqual(preview.state().input.manifest.layout.ribbon,manifest.layout.ribbon);
   await page.goto(preview.url);const frame=page.frames().find(f=>f.url().includes('/runtime/'));
   await frame.waitForFunction(()=>document.getElementById('ctv-theme-style')&&document.querySelector('#tiles .focused'));
   assert.equal(await frame.locator('.ctv-clock').isVisible(),false);
   const box=await frame.locator('#tiles .focused .card').boundingBox();assert.ok(box&&box.height>0);
  }finally{await page.close();preview.server.closeAllConnections();await new Promise(r=>preview.server.close(r));}
 }}finally{await browser.close();}
});
