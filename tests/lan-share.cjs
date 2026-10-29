'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict'), http=require('node:http');
const lan=require('../lib/lan-share.cjs');
function get(session, route, headers={}) {return new Promise((resolve,reject)=>{http.get({host:'127.0.0.1',port:session.server.address().port,path:route,headers},r=>{let body='';r.on('data',x=>body+=x);r.on('end',()=>resolve({status:r.statusCode,body,headers:r.headers}));}).on('error',reject);});}
const output=()=>({manifest:{rules:{path:'rules.json'},assets:[{path:'assets/a.png'}],documents:[{path:'LICENSE'}]},rules:{hello:'world'},assets:[{path:'assets/a.png',data:Buffer.from('image')}],documents:[{path:'LICENSE',data:Buffer.from('license')}]});
test('LAN session serves immutable compiled bytes only, validates host and expires',async()=>{const compiled=output();const session=await lan.start(compiled,{port:0,ttl:100});try{assert.match(session.pin,/^\d{6}$/);compiled.assets[0].data.fill(0);const r=await get(session,'/'+session.pin+'/package.json',{Origin:'null'});assert.equal(r.status,200);assert.equal(r.headers['access-control-allow-origin'],'null');const p=JSON.parse(r.body);assert.equal(p.schemaVersion,1);assert.equal(Buffer.from(p.files['assets/a.png'],'base64').toString(),'image');assert.equal(Buffer.from(p.files['rules.json'],'base64').toString(),JSON.stringify(compiled.rules)+'\n');assert.equal((await get(session,'/'+session.pin+'/package.json',{Host:'evil.test'})).status,403);assert.equal((await get(session,'/theme.css')).status,404);await new Promise(r=>setTimeout(r,150));assert.equal(session.server.listening,false);}finally{await session.stop();}});
test('LAN globally bounds wrong PIN attempts and rejects browser origins',async()=>{const s=await lan.start(output(),{port:0,maxAttempts:2});try{assert.equal((await get(s,'/'+s.pin+'/package.json',{Origin:'https://evil.test'})).status,403);assert.equal((await get(s,'/000000/package.json')).status,404);assert.equal((await get(s,'/000000/package.json')).status,404);await new Promise(r=>setTimeout(r,10));assert.equal(s.server.listening,false);}finally{await s.stop();}});
test('preview exposes same-origin share controls and cleans up LAN session', {skip:!process.env.CYTV_THEME_RUNTIME}, async()=>{
 const t=require('../lib/toolkit.cjs'),path=require('node:path');
 const p=await t.preview(path.resolve('examples/glasshouse'),t.runtime(process.env.CYTV_THEME_RUNTIME));
 try {assert.match(await (await fetch(p.url)).text(),/Send to TV/);assert.equal((await fetch(p.url+'theme-share',{method:'POST',headers:{Origin:'https://evil.test'}})).status,403);
 const r=await fetch(p.url+'theme-share',{method:'POST',headers:{Origin:new URL(p.url).origin}});assert.equal(r.status,200);const info=await r.json();assert.match(info.pin,/^\d{6}$/);assert.ok(Array.isArray(info.addresses));
 assert.equal((await fetch(p.url+'theme-share/stop',{method:'POST',headers:{Origin:new URL(p.url).origin}})).status,200);
 }finally{await new Promise(r=>p.server.close(r));}
});
test('showcase refuses built-in Classic and transfers selected compiled theme with matching hashes', {skip:!process.env.CYTV_THEME_RUNTIME}, async()=>{
 const t=require('../lib/toolkit.cjs'),path=require('node:path'),crypto=require('node:crypto');const p=await t.showcase(path.resolve('examples'),t.runtime(process.env.CYTV_THEME_RUNTIME));
 const post=route=>fetch(p.url+route,{method:'POST',headers:{Origin:new URL(p.url).origin}});
 try {
 assert.equal((await post('theme-share')).status,422);
 await fetch(p.url+'theme-selection',{method:'POST',headers:{Origin:new URL(p.url).origin},body:JSON.stringify({theme:'glasshouse'})});
 const info=await (await post('theme-share')).json();
 const packet=await (await fetch('http://127.0.0.1:8879/'+info.pin+'/package.json')).json();
 const manifest=JSON.parse(Buffer.from(packet.descriptor,'base64'));
 for(const f of [manifest.rules,...manifest.assets,...manifest.documents]) {const bytes=Buffer.from(packet.files[f.path],'base64');assert.equal(bytes.length,f.size);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),f.sha256);}
 const info2=await (await post('theme-share')).json();assert.match(info2.pin,/^\d{6}$/);
 await post('theme-share/stop');
 }finally{await new Promise(r=>p.server.close(r));}
});
test('LAN connection boundary rejects public peers and destinations even with allowed Host',async()=>{
 const s=await lan.start(output(),{port:0});
 try {
 const handler=s.server.listeners('request')[0];
 for(const [localAddress,remoteAddress,expected] of [['8.8.8.8','192.168.1.2',403],['192.168.1.2','8.8.8.8',403],['::ffff:127.0.0.1','::ffff:127.0.0.1',200]]) {
  let status;const req={socket:{localAddress,remoteAddress},headers:{host:'127.0.0.1:'+s.server.address().port},method:'GET',url:'/'+s.pin+'/package.json'};
  const res={setHeader(){},writeHead(code){status=code;},end(){}};handler(req,res);assert.equal(status,expected);
 }
 }finally{await s.stop();}
});
test('file-origin browser imports the real LAN compiled package through ThemeData', {skip:!process.env.CYTV_THEME_RUNTIME||!process.env.CYTV_THEME_BROWSER||!process.env.CYTV_THEME_MAIN},async()=>{
 const t=require('../lib/toolkit.cjs'),path=require('node:path'),fs=require('node:fs'),os=require('node:os');
 const rt=t.runtime(process.env.CYTV_THEME_RUNTIME),compiled=await t.compile(path.resolve('examples/glasshouse'),rt),s=await lan.start(compiled);
 let browser;const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ctv-lan-browser-'));
 try {
 // Loopback isolates CORS from host VPN routing; lanSource private-IP validation is tested in main.


 browser=await require('playwright').chromium.launch({headless:true,executablePath:process.env.CYTV_THEME_BROWSER,args:['--no-proxy-server']});
 const page=await browser.newPage();fs.writeFileSync(path.join(tmp,'index.html'),'<!doctype html><title>LAN import</title>');await page.goto(require('node:url').pathToFileURL(path.join(tmp,'index.html')).href);
 await page.addScriptTag({path:path.join(process.env.CYTV_THEME_MAIN,'launcher/theme-policy.js')});await page.addScriptTag({path:path.join(process.env.CYTV_THEME_MAIN,'launcher/theme-data.js')});
 let observedOrigin; s.server.on('request',req=>{if(req.method==='GET') observedOrigin=req.headers.origin;});
 const result=await page.evaluate(async input=>{const bytes=await new Promise((resolve,reject)=>{const x=new XMLHttpRequest();x.open('GET','http://127.0.0.1:8879/'+input.pin+'/package.json');x.responseType='arraybuffer';x.onload=()=>x.status===200?resolve(new Uint8Array(x.response)):reject(Error('HTTP '+x.status));x.onerror=()=>reject(Error('LAN network error'));x.send();});const pack=ThemeData.unpackLan(JSON.parse(ThemeData.decode(bytes)),input.version);return {id:JSON.parse(ThemeData.decode(pack.descriptor)).id,count:Object.keys(pack.files).length};},{pin:s.pin,version:rt.meta.minimumHomeVersion});
 assert.equal(result.id,compiled.manifest.id);assert.equal(result.count,1+compiled.assets.length+compiled.documents.length);assert.equal(observedOrigin,'null');
 }finally{if(browser)await browser.close();await s.stop();fs.rmSync(tmp,{recursive:true,force:true});}
});
test('closing preview closes its active LAN listener', {skip:!process.env.CYTV_THEME_RUNTIME},async()=>{
 const t=require('../lib/toolkit.cjs'),path=require('node:path');const p=await t.preview(path.resolve('examples/glasshouse'),t.runtime(process.env.CYTV_THEME_RUNTIME));
 try {const info=await (await fetch(p.url+'theme-share',{method:'POST',headers:{Origin:new URL(p.url).origin}})).json();assert.match(info.pin,/^\d{6}$/);await new Promise(r=>p.server.close(r));await new Promise(r=>setTimeout(r,25));await assert.rejects(fetch('http://127.0.0.1:8879/'+info.pin+'/package.json'));}finally{if(p.server.listening)await new Promise(r=>p.server.close(r));}
});
test('Send to TV opens an accessible installation dialog with real session lifecycle', {skip:!process.env.CYTV_THEME_RUNTIME||!process.env.CYTV_THEME_BROWSER},async()=>{
 const t=require('../lib/toolkit.cjs'),path=require('node:path'),p=await t.showcase(path.resolve('examples'),t.runtime(process.env.CYTV_THEME_RUNTIME));
 const browser=await require('playwright').chromium.launch({headless:true,executablePath:process.env.CYTV_THEME_BROWSER});
 try {const page=await browser.newPage({viewport:{width:390,height:844}});await page.clock.install();await page.goto(p.url);
 await page.locator('[data-key="glasshouse"]').click();await page.waitForFunction(()=>document.querySelector('[data-key="glasshouse"]').getAttribute('aria-pressed')==='true');
 let release;await page.route('**/theme-share',async route=>{await new Promise(r=>{release=r;});await route.continue();});
 await page.locator('#sendToTV').click();await page.getByRole('dialog',{name:'Установить тему на ТВ'}).waitFor();assert.match(await page.locator('#shareDialogStatus').textContent(),/Создаём/);await page.keyboard.press('Escape');assert.equal(await page.locator('#sendToTV').evaluate(el=>el===document.activeElement),true,'close while pending returns focus');await page.locator('#sendToTV').click();await page.waitForFunction(()=>document.querySelector('#shareDialog').open);while(!release)await new Promise(r=>setTimeout(r,10));release();await page.locator('#sharePin').waitFor();await page.waitForFunction(()=>/^\d{6}$/.test(document.getElementById('sharePin').textContent));
 await page.unroute('**/theme-share');assert.match(await page.locator('#shareSnapshot').textContent(),/Alpine/);assert.match(await page.locator('#shareDialog').textContent(),/Настройки → Темы → Получить с компьютера/);assert.match(await page.locator('#shareDialog').textContent(),/Применить тему/);assert.ok(await page.locator('#shareAddresses li').count()>0);assert.equal(await page.locator('#shareDialog').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
 for(let i=0;i<10;i++)await page.keyboard.press('Tab');assert.equal(await page.locator('#shareDialog').evaluate(el=>el.contains(document.activeElement)),true,'native modal traps focus');
 const pin=await page.locator('#sharePin').textContent();await page.keyboard.press('Escape');assert.equal(await page.locator('#shareDialog').evaluate(el=>el.open),false);assert.equal(await page.locator('#sendToTV').evaluate(el=>el===document.activeElement),true);assert.equal((await fetch('http://127.0.0.1:8879/'+pin+'/package.json')).status,200,'closing instructions retains session');
 let reopenedRequests=0;page.on('request',r=>{if(r.url().endsWith('/theme-share'))reopenedRequests++;});await page.locator('#sendToTV').click();assert.equal(await page.locator('#sharePin').textContent(),pin,'reopening guide retains PIN');assert.equal(reopenedRequests,0,'reopening guide makes no request');await page.locator('#shareDialogStop').click();await page.waitForFunction(()=>document.getElementById('shareDialogStatus').textContent.includes('остановлена'));assert.equal(await page.locator('#shareDialogStop').isVisible(),false);
 await page.locator('#shareNewPin').click();await page.waitForFunction(()=>/^\d{6}$/.test(document.getElementById('sharePin').textContent));let requests=0;page.on('request',r=>{if(r.url().includes('/theme-share'))requests++;});await page.clock.fastForward(600100);assert.match(await page.locator('#shareDialogStatus').textContent(),/истёк/);assert.equal(requests,0,'expiry makes no request');assert.equal(await page.locator('#stopShare').isVisible(),false);
 await page.locator('#shareDialogClose').click();await page.locator('[data-key=""]').click();await page.waitForFunction(()=>document.querySelector('[data-key=""]').getAttribute('aria-pressed')==='true');await page.locator('#sendToTV').click();await page.waitForFunction(()=>document.getElementById('shareDialogStatus').textContent.includes('Classic'));assert.equal(await page.locator('#shareDialogStop').isVisible(),false);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 }finally{await browser.close();await new Promise(r=>p.server.close(r));}
});
test('installation guide handles missing address and provides synthetic visual QA', {skip:!process.env.CYTV_THEME_RUNTIME||!process.env.CYTV_THEME_BROWSER},async()=>{
 const t=require('../lib/toolkit.cjs'),path=require('node:path'),fs=require('node:fs'),p=await t.preview(path.resolve('examples/glasshouse'),t.runtime(process.env.CYTV_THEME_RUNTIME));
 const browser=await require('playwright').chromium.launch({headless:true,executablePath:process.env.CYTV_THEME_BROWSER});
 try {const page=await browser.newPage({viewport:{width:1100,height:900}});let noAddress=false;await page.route('**/theme-share',r=>r.fulfill({json:{title:'Alpine · пример',pin:'123456',addresses:noAddress?[]:['192.168.1.20','10.0.0.20'],expiresAt:Date.now()+600000}}));await page.goto(p.url);await page.locator('#sendToTV').click();await page.waitForFunction(()=>document.getElementById('sharePin').textContent==='123456');
 if(process.env.CYTV_THEME_SHARE_SCREENSHOTS){fs.mkdirSync(process.env.CYTV_THEME_SHARE_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.CYTV_THEME_SHARE_SCREENSHOTS,'synthetic-desktop.png')});await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);await page.screenshot({path:path.join(process.env.CYTV_THEME_SHARE_SCREENSHOTS,'synthetic-mobile.png')});}
 noAddress=true;await page.locator('#shareNewPin').click();await page.waitForFunction(()=>document.getElementById('shareDialogStatus').textContent.includes('IP не найден'));assert.equal(await page.locator('#shareInstructions').isVisible(),false);assert.equal(await page.locator('#shareDialogStop').isVisible(),true,'no-address server can still be stopped');
 }finally{await browser.close();await new Promise(r=>p.server.close(r));}
});
