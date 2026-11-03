'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const t=require('../lib/toolkit.cjs'),sender=require('../lib/theme-send.cjs');
const runtimePath=process.env.CYTV_THEME_RUNTIME;
test('embedded media survives compilation, transfer snapshot and hashed distribution build',{skip:!runtimePath},async()=>{
 const rt=t.runtime(runtimePath),data=require(path.join(rt.root,'launcher/theme-data.js'));
 for(const slug of ['glasshouse','ribbon']){
  const out=await t.compile(path.resolve('examples',slug),rt);
  assert(out.manifest.requires.capabilities.includes('video-wallpaper-v1'));
  const pack=JSON.parse(sender.snapshot(out));
  const verified=data.unpackEnvelope(pack,'99.0.0');
  assert.equal(data.verify(verified,'99.0.0').manifest.wallpaperVideo.variants.length,2);
  assert.deepEqual(out.videos.map(v=>[v.quality,v.width,v.height]),[['4k',3840,2160],['1080p',1920,1080]]);
 }
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'ctv-wallpaper-build-'));
 try{
  const src=path.join(root,'source');fs.cpSync(path.resolve('examples/glasshouse'),src,{recursive:true});
  const git=args=>cp.execFileSync('git',['-C',src,...args],{stdio:'ignore'});
  git(['init']);git(['add','.']);git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','fixture']);
  const commit=cp.execFileSync('git',['-C',src,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const out=path.join(root,'distribution');await t.build(src,rt,{repository:'https://github.com/razdva122/clean-your-tv-lg-theme',commit,out});
  const descriptor=fs.readFileSync(path.join(out,'cytv-theme.json')),m=JSON.parse(descriptor),pack={descriptor,digest:data.hash(descriptor),files:{}};
  for(const f of [m.rules,...m.assets,...m.documents,...m.wallpaperVideo.variants])pack.files[f.path]=fs.readFileSync(path.join(out,f.path));
  data.verify(pack,'99.0.0');assert(m.wallpaperVideo.variants.every(v=>v.path.startsWith('videos/')&&v.path.includes(v.sha256)));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('real browser decodes UHD and releases image fallback in both editions',{skip:!runtimePath||!process.env.CYTV_THEME_BROWSER},async()=>{
 const rt=t.runtime(runtimePath),browser=await require('playwright').chromium.launch({headless:true,executablePath:process.env.CYTV_THEME_BROWSER});
 try{for(const edition of ['root','no-root']){
  const p=await t.preview(path.resolve('examples/ribbon'),rt,{edition});
  try{const page=await browser.newPage();await page.goto(p.url);const frame=page.frames().find(f=>f!==page.mainFrame());
   await frame.waitForFunction(()=>window.HomeWallpaper?.state().actualQuality==='1080p');
   await frame.evaluate(()=>HomeWallpaper.setQuality('4k'));
   await frame.waitForFunction(()=>HomeWallpaper.state().actualQuality==='4k');
   assert.deepEqual(await frame.evaluate(()=>{const v=document.querySelector('video');return [v.videoWidth,v.videoHeight,v.duration]}),[3840,2160,20]);
   await frame.evaluate(()=>HomeWallpaper.setQuality('image'));assert.equal(await frame.locator('video').count(),0);
   await page.close();
  }finally{p.server.closeAllConnections();await new Promise(r=>p.server.close(r));}
 }}finally{await browser.close();}
});
