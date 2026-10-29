'use strict';
// Published data only. Neither the shortener nor a theme supplies executable tooling.
const crypto=require('node:crypto');
const START='<!-- cytv-theme-links:start -->',END='<!-- cytv-theme-links:end -->';
function canonical(value){
 if(typeof value!=='string'||value.length>1000)throw Error('Use a commit-pinned public theme descriptor.');
 const m=/^https:\/\/raw\.githubusercontent\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9_.-]+)\/([a-f0-9]{40})\/(.+\/)?cytv-theme\.json$/.exec(value);
 if(!m||[m[2],...(m[4]||'').split('/').filter(Boolean)].some(p=>p==='.'||p==='..'||!/^[A-Za-z0-9_.-]+$/.test(p)))throw Error('Use a commit-pinned public theme descriptor.');
 return {repository:('https://github.com/'+m[1]+'/'+m[2]).toLowerCase(),url:value};
}
async function bytes(url,options={},settings={}){
 const response=await (settings.fetcher||fetch)(url,{...options,redirect:'error',signal:AbortSignal.timeout(15000)});
 if(!response.ok){const e=Error('Published theme or link service is unavailable.');e.status=response.status;throw e;}
 let length=0,parts=[];
 for await(const chunk of response.body){length+=chunk.length;if(length>(settings.limit||65536))throw Error('Response exceeds its size limit.');parts.push(Buffer.from(chunk));}
 return Buffer.concat(parts);
}
async function json(url,options={},settings={}){const raw=await bytes(url,options,settings);return {value:JSON.parse(raw.toString('utf8')),raw};}
async function inspect(url,expected,settings={}){
 const origin=canonical(url),{value:m,raw}=await json(url,{},settings);
 if(!m||typeof m.id!=='string'||!m.id.startsWith('github:'+origin.repository.slice(19)+':')||m.source?.repository?.toLowerCase()!==origin.repository||!/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(m.themeVersion)||m.themeVersion.length>64||typeof m.title!=='string'||m.title.length>120)throw Error('Published theme identity is invalid.');
 if(expected&&(m.id!==expected.id||m.themeVersion!==expected.themeVersion||origin.repository!==expected.source.repository.toLowerCase()))throw Error('Publish this exact theme ID and version before creating its link.');
 return {id:m.id,title:m.title,version:m.themeVersion,url,descriptorSha256:crypto.createHash('sha256').update(raw).digest('hex')};
}
async function lookup(short,settings){
 if(!/^https:\/\/da\.gd\/[A-Za-z0-9_]{5,30}$/.test(short))throw Error('Invalid shortened link.');
 const raw=await bytes('https://da.gd/coshorten/'+short.split('/').pop(),{},{...settings,limit:4096});
 return raw.toString('utf8').trim();
}
async function shorten(url,expected,settings={}){
 const record=await inspect(url,expected,settings);
 if(settings.descriptorSha256&&record.descriptorSha256!==settings.descriptorSha256)throw Error('Published distribution differs from checkout.');
 try{
  const alias=crypto.createHash('sha256').update(url).digest('hex').slice(0,10);
  let short;
  try{short=(await bytes('https://da.gd/s',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({url,shorturl:alias}).toString()},{...settings,limit:4096})).toString('utf8').trim();}
  catch(e){if(e.status!==400)throw e;short='https://da.gd/'+alias;}
  // A taken immutable alias is reusable only when its exact destination matches.
  if(await lookup(short,settings)!==url)throw Error('Short link creation failed.');
  return {...record,shortUrl:short};
 }catch(_){return {...record,shortUrl:null,notice:'Short link unavailable. Use the full link or retry later.'};}
}
function records(body){
 const found=/<!-- cytv-theme-links-data:([A-Za-z0-9+/=]+) -->/.exec(body||'');if(!found)return [];
 if(found[1].length>100000)throw Error('Release link metadata is too large.');
 const data=JSON.parse(Buffer.from(found[1],'base64').toString());if(data.schemaVersion!==1||!Array.isArray(data.links)||data.links.length>50)throw Error('Invalid release link metadata.');return data.links;
}
function notes(body,entries){
 if(entries.length>50)throw Error('At most 50 themes per release.');
 const a=body.indexOf(START),b=body.indexOf(END);if(a>=0){if(b<a)throw Error('Incomplete release link block.');body=body.slice(0,a)+body.slice(b+END.length);}
 const rows=entries.map(e=>'| '+e.title.replace(/[|\r\n<>]/g,' ')+' | '+e.version+' | '+(e.shortUrl?'['+e.shortUrl.split('/').pop()+']('+e.shortUrl+')':e.url)+' |').join('\n');
 return body.trimEnd()+'\n\n'+START+'\n## Install on TV\n\nSettings → Appearance → More options → Add by URL. Enter the theme ID or full link below.\n\n| Theme | Version | TV link |\n| --- | --- | --- |\n'+rows+'\n\n<!-- cytv-theme-links-data:'+Buffer.from(JSON.stringify({schemaVersion:1,links:entries})).toString('base64')+' -->\n'+END+'\n';
}
async function published(expected,settings={}){
 const repository=expected.source.repository.replace('https://github.com/','');if(!/^[\w-]+\/[\w.-]+$/.test(repository))throw Error('Invalid source repository.');
 const {value}=await json('https://api.github.com/repos/'+repository+'/releases/tags/v'+expected.themeVersion,{headers:{Accept:'application/vnd.github+json'}},{...settings,limit:262144});
 const entry=records(value.body).find(e=>e.id===expected.id&&e.version===expected.themeVersion);if(!entry)throw Error('Publish a matching release first, or paste its full descriptor URL.');
 const checked=await inspect(entry.url,expected,settings);
 try{if(entry.shortUrl&&await lookup(entry.shortUrl,settings)===entry.url)return {...checked,shortUrl:entry.shortUrl};}catch(_){}
 return {...checked,shortUrl:null,notice:'Short link unavailable. Use the full link or retry later.'};
}
module.exports={canonical,inspect,shorten,published,notes,records,json};
