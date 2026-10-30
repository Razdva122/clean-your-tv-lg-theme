'use strict';
// Private local preview data only. Never included in a theme distribution.
const fs=require('node:fs');
const MAX_BYTES=16*1024*1024,MAX_ICON=256*1024;
function load(file){
 const stat=fs.lstatSync(file);
 if(!stat.isFile()||stat.size>MAX_BYTES)throw Error('TV snapshot must be a regular JSON file up to 16 MiB');
 const bytes=fs.readFileSync(file);if(bytes.length>MAX_BYTES)throw Error('TV snapshot exceeds 16 MiB');
 const value=JSON.parse(bytes);
 if(!value||!Array.isArray(value.apps)||!value.apps.length||value.apps.length>200||!Array.isArray(value.inputs||[])||(value.inputs||[]).length>100)throw Error('Invalid TV snapshot inventory');
 const seen=new Set();
 const text=(v,label)=>{if(typeof v!=='string'||!v.length||v.length>256||/[\x00-\x1f\x7f]/.test(v))throw Error('Invalid TV snapshot '+label);return v;};
 const apps=value.apps.map(app=>{
  if(!app||typeof app!=='object')throw Error('Invalid TV snapshot app');
  const id=text(app.id,'app ID');if(!/^[a-zA-Z0-9._-]+$/.test(id)||seen.has(id))throw Error('Invalid or duplicate TV app ID');seen.add(id);
  const title=text(app.title,'app title');let icon=app.icon||'';
  if(typeof icon!=='string')throw Error('Invalid TV icon');
  if(icon){
   const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(icon);
   if(!match||match[2].length>Math.ceil(MAX_ICON/3)*4)throw Error('TV icon must be a bounded embedded PNG/JPEG/WebP');
   const data=Buffer.from(match[2],'base64');
   if(!data.length||data.length>MAX_ICON||data.toString('base64')!==match[2])throw Error('Invalid TV icon bytes');
   const kind=data.subarray(0,8).toString('hex')==='89504e470d0a1a0a'?'png':data.subarray(0,3).toString('hex')==='ffd8ff'?'jpeg':data.length>=12&&data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP'?'webp':'';
   if(kind!==match[1])throw Error('TV icon type does not match its original bytes');
  }
  const iconColor=/^#(?:[a-f0-9]{3}|[a-f0-9]{6})$/i.test(app.iconColor||'')?app.iconColor:'';
  return {id,title,icon,iconColor,hidden:app.hidden===true};
 }).filter(app=>!app.hidden).map(({hidden,...app})=>app);
 if(!apps.length)throw Error('TV snapshot has no visible apps');
 const inputs=(value.inputs||[]).map(input=>({appId:text(input.appId,'input ID'),label:text(input.label,'input label')}));
 return {apps,inputs};
}
// Adapt only the trusted browser mock; no real TV services are called.
function snapshotBridge(){
 var original=window.PalmServiceBridge.prototype.call;
 window.PalmServiceBridge.prototype.call=function(uri,raw){
  if(uri==='luna://com.local.nativehome.service/listApps'||uri==='luna://com.cleanyourtv.root.preview.service/listApps'){
   var bridge=this;bridge.timer=setTimeout(function(){if(bridge.onservicecallback)bridge.onservicecallback(JSON.stringify({returnValue:true,apps:window.TV_APPS.apps}));},30);return;
  }
  return original.call(this,uri,raw);
 };
}
function script(inventory){
 return 'window.TV_APPS = '+JSON.stringify(inventory).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+';\n('+snapshotBridge.toString()+')();\n';
}
module.exports={load,script};
