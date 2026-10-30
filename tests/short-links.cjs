'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const links=require('../lib/short-links.cjs');
const url='https://raw.githubusercontent.com/owner/themes/'+'a'.repeat(40)+'/distributions/forest/1.0.0/cytv-theme.json';
const manifest={id:'github:owner/themes:forest',title:'Forest',themeVersion:'1.0.0',source:{repository:'https://github.com/owner/themes'}};
function fixture(mode){const calls=[];return {calls,fetcher:async(u,options={})=>{calls.push({url:String(u),options});let value=JSON.stringify(manifest),status=200;if(String(u)==='https://da.gd/s'){status=mode==='limited'?429:mode==='collision'?400:200;value='https://da.gd/test12\n';}if(String(u).includes('/coshorten/'))value=mode==='wrong-target'?'https://evil.test/':mode==='oversized'?'x'.repeat(4097):url+'\n';if(mode==='bad-theme'&&String(u).startsWith('https://raw.'))value=JSON.stringify({...manifest,id:'github:other/themes:forest'});return {ok:status===200,status,body:[Buffer.from(value)]};}};}
test('shortens public pinned descriptor without a token and verifies its lookup',async()=>{const f=fixture(),r=await links.shorten(url,manifest,f);assert.equal(r.shortUrl,'https://da.gd/test12');assert.equal(r.url,url);const body=new URLSearchParams(f.calls.find(c=>c.url==='https://da.gd/s').options.body);assert.match(body.get('shorturl'),/^[a-f0-9]{10}$/);assert.equal(body.get('url'),url);for(const c of f.calls){assert.equal(c.options.redirect,'error');assert.equal(c.options.headers?.Authorization,undefined);}});
test('rejects mutable, private and unrelated URLs before a provider call',async()=>{for(const bad of [url.replace('a'.repeat(40),'main'),'http://192.168.1.2/theme','https://evil.test/theme']){const f=fixture();await assert.rejects(links.shorten(bad,manifest,f));assert.equal(f.calls.length,0);}const f=fixture('bad-theme');await assert.rejects(links.shorten(url,manifest,f));assert.equal(f.calls.length,1);});
test('provider limits preserve a usable full link and do not retry',async()=>{const f=fixture('limited'),r=await links.shorten(url,manifest,f);assert.equal(r.shortUrl,null);assert.equal(r.url,url);assert.equal(f.calls.length,2);});
test('wrong provider destination is never offered as an install link',async()=>{const r=await links.shorten(url,manifest,fixture('wrong-target'));assert.equal(r.shortUrl,null);});
test('release notes preserve user text and round-trip one record per theme',()=>{const record={id:manifest.id,title:'Forest | new',version:'1.0.0',url,shortUrl:'https://da.gd/test12',descriptorSha256:'f'.repeat(64)},body=links.notes('User notes',[record]);assert.match(body,/User notes/);assert.deepEqual(links.records(body),[record]);assert.equal((links.notes(body,[record]).match(/cytv-theme-links:start/g)||[]).length,1);});
test('release workflow pins trusted toolkit and needs no author API secret',()=>{const release=require('../lib/release-links.cjs'),workflow=release.workflow('b'.repeat(40));assert.match(workflow,/ref: b{40}/);assert.match(workflow,/types: \[published\]/);assert.match(workflow,/contents: write/);assert.doesNotMatch(workflow,/BITLY|IS_GD|SHORTENER_TOKEN/);assert.match(workflow,/github.token/);assert.match(workflow,/persist-credentials: false/);assert.throws(()=>release.workflow('main'));});

test('release rerun merges current notes instead of the original publication snapshot',()=>{const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),release=require('../lib/release-links.cjs'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'theme-link-notes-'));try{const entry={id:manifest.id,title:manifest.title,version:'1.0.0',url,shortUrl:'https://da.gd/test12'};fs.writeFileSync(path.join(dir,'tv-links.json'),JSON.stringify({schemaVersion:1,links:[entry]}));fs.writeFileSync(path.join(dir,'current-notes.json'),JSON.stringify({body:links.notes('Maintainer edits after publication',[entry])}));release.finishNotes(dir);const notes=fs.readFileSync(path.join(dir,'notes.md'),'utf8');assert.match(notes,/Maintainer edits after publication/);assert.equal((notes.match(/cytv-theme-links:start/g)||[]).length,1);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('release generator reads committed matching versions and keeps independent theme links',async()=>{const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process'),release=require('../lib/release-links.cjs'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'theme-release-links-'));try{cp.execFileSync('git',['init','-q',dir]);const manifests={};for(const slug of ['forest','ocean']){const name='distributions/'+slug+'/1.0.0/cytv-theme.json',m={...manifest,id:'github:owner/themes:'+slug,title:slug,themeVersion:'1.0.0-beta.1'};manifests[name]=JSON.stringify(m)+'\n';fs.mkdirSync(path.dirname(path.join(dir,name)),{recursive:true});fs.writeFileSync(path.join(dir,name),manifests[name]);}cp.execFileSync('git',['-C',dir,'add','.']);cp.execFileSync('git',['-C',dir,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Fixture']);const commit=cp.execFileSync('git',['-C',dir,'rev-parse','HEAD'],{encoding:'utf8'}).trim();let target;const fetcher=async(u,options={})=>{let value;if(u.startsWith('https://raw.')){target=u;const text=manifests[u.split('/').slice(6).join('/')];return {ok:true,status:200,body:[Buffer.from(text)]};}if(u==='https://da.gd/s')value='https://da.gd/test12\n';else value=target+'\n';return {ok:true,status:200,body:[Buffer.from(value)]};};const entries=await release.generate(dir,{repository:'owner/themes',commit,tag:'v1.0.0-beta.1',out:path.join(dir,'result'),fetcher});assert.equal(entries.length,2);assert.notEqual(entries[0].url,entries[1].url);assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'result/tv-links.json'))).links.length,2);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('mismatched published bytes never reach the shortener',async()=>{const f=fixture();await assert.rejects(links.shorten(url,manifest,{...f,descriptorSha256:'0'.repeat(64)}));assert.equal(f.calls.length,1);});
test('verified published release keeps its full URL when lookup is unavailable',async()=>{const entry={id:manifest.id,title:manifest.title,version:'1.0.0',url,shortUrl:'https://da.gd/test12',descriptorSha256:crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex')},fetcher=async u=>{if(u.includes('/coshorten/'))throw Error('provider unavailable');const value=u.startsWith('https://api.github')?[{published_at:'2026-10-29T12:00:00Z',body:links.notes('Release notes',[entry])}]:manifest;return {ok:true,status:200,body:[Buffer.from(JSON.stringify(value))]};};const result=await links.published(manifest,{fetcher});assert.equal(result.url,url);assert.equal(result.shortUrl,null);assert.match(result.notice,/full link/i);});

test('reuses a taken alias only when its lookup matches the pinned descriptor',async()=>{const f=fixture('collision'),r=await links.shorten(url,manifest,f);assert.equal(r.shortUrl,'https://da.gd/'+crypto.createHash('sha256').update(url).digest('hex').slice(0,10));assert.equal(f.calls.length,3);const wrong=fixture('collision');const fetcher=wrong.fetcher;wrong.fetcher=async(u,o)=>u.includes('/coshorten/')?{ok:true,status:200,body:[Buffer.from('https://evil.test/')]}:fetcher(u,o);assert.equal((await links.shorten(url,manifest,wrong)).shortUrl,null);});
test('lookup larger than 4 KiB never becomes an install link',async()=>{assert.equal((await links.shorten(url,manifest,fixture('oversized'))).shortUrl,null);});

function publicationFixture(releases, options={}) {
 const calls=[];
 const fetcher=async u=>{calls.push(u);if(options.offline)throw Error('offline');let value;
 if(u.includes('/commits/HEAD'))return {ok:true,status:200,body:[Buffer.from(JSON.stringify({sha:'b'.repeat(40)}))]};
 if(u.endsWith('/cytv-themes.json'))return {ok:false,status:404,body:[]};
 if(u.startsWith('https://api.github')){if(options.status)return {ok:false,status:options.status,body:[]};value=releases;}
 else if(u.includes('/coshorten/'))value=url;
 else value=JSON.stringify(manifest);
 return {ok:true,status:200,body:[Buffer.from(typeof value==='string'?value:JSON.stringify(value))]};};
 return {calls,fetcher};
}
function publication(version=manifest.themeVersion, extra={}) {
 return {published_at:'2026-10-29T12:00:00Z',body:links.notes('Published',[{id:manifest.id,title:manifest.title,version,url,shortUrl:'https://da.gd/test12',descriptorSha256:crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex'),...extra}])};
}
test('latest published selected theme is independent of local edits/version and release list order',async()=>{
 const older={...publication(),published_at:'2026-10-28T12:00:00Z'};
 const latest=publication();
 const f=publicationFixture([older,{...publication(),draft:true,published_at:'2026-10-30T12:00:00Z'},latest]);
 const r=await links.published({...manifest,themeVersion:'9.0.0'},f);
 assert.equal(r.version,'1.0.0');assert.equal(r.shortUrl,'https://da.gd/test12');
 assert.equal(r.publishedAt,latest.published_at);assert.match(f.calls[0],/releases\?per_page=100&page=1$/);
});
test('no published installation metadata is distinct from offline and lookup errors',async()=>{
 assert.equal(await links.published(manifest,publicationFixture([])),null);
 assert.equal(await links.published(manifest,publicationFixture([{published_at:'2026-10-29T12:00:00Z',body:'No theme metadata'}])),null);
 await assert.rejects(links.published(manifest,publicationFixture([],{offline:true})),/offline/);
 await assert.rejects(links.published(manifest,publicationFixture([],{status:404})));
 await assert.rejects(links.published(manifest,publicationFixture([],{status:429})));
});
test('published metadata requires matching digest, repository, version and immutable revision',async()=>{
 for(const extra of [{descriptorSha256:'0'.repeat(64)},{descriptorSha256:undefined},{url:url.replace('owner/themes','other/themes')},{version:'2.0.0'},{url:url.replace('a'.repeat(40),'main')}])
  await assert.rejects(links.published(manifest,publicationFixture([publication('1.0.0',extra)])));
});

function collectionFixture(change={}, mode=''){
 const commit='b'.repeat(40),pinned=url.replace('a'.repeat(40),commit),calls=[];
 const entry={id:manifest.id,title:manifest.title,themeVersion:manifest.themeVersion,path:'distributions/forest/1.0.0/cytv-theme.json',sha256:crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex'),...change};
 const catalog={schemaVersion:1,repository:manifest.source.repository,themes:[entry]};
 return {calls,pinned,fetcher:async u=>{
  calls.push(String(u));let value;
  if(u.includes('/commits/HEAD'))value={sha:mode==='mutable'?'main':commit};
  else if(u.endsWith('/cytv-themes.json')){
   if(mode==='offline')throw Error('offline');
   if(mode==='missing')return {ok:false,status:404,body:[]};
   if(mode==='wrong-repository')catalog.repository='https://github.com/other/themes';
   if(mode==='schema')catalog.schemaVersion=2;
   if(mode==='duplicate')catalog.themes.push(entry);
   value=catalog;
  }else if(u.startsWith('https://api.github'))value=[];
  else if(u.includes('/coshorten/')){if(mode==='no-id')return {ok:false,status:404,body:[]};value=pinned;}
  else value=manifest;
  return {ok:true,status:200,body:[Buffer.from(typeof value==='string'?value:JSON.stringify(value))]};
 }};
}
test('public root collection resolves HEAD once and verifies pinned selected theme independent of local version',async()=>{
 const f=collectionFixture(),r=await links.published({...manifest,themeVersion:'9.0.0'},f);
 assert.equal(r.version,'1.0.0');assert.equal(r.url,f.pinned);assert.match(r.shortUrl,/https:\/\/da\.gd\/[a-f0-9]{10}$/);
 assert.equal(r.publicationSource,'collection');assert.equal(f.calls.filter(u=>u.includes('/commits/HEAD')).length,1);
 assert.ok(f.calls.some(u=>u.includes('/'+'b'.repeat(40)+'/cytv-themes.json')));
 assert.ok(f.calls.every(u=>u!=='https://da.gd/s'));
});
test('public collection keeps verified full URL when no existing alias and does not claim unpublished',async()=>{
 const f=collectionFixture({},'no-id'),r=await links.published(manifest,f);
 assert.equal(r.url,f.pinned);assert.equal(r.shortUrl,null);assert.match(r.notice,/published.*ID unavailable/i);
 assert.equal(await links.published(manifest,collectionFixture({},'missing')),null);
 assert.equal(await links.published({...manifest,id:'github:owner/themes:another'},collectionFixture()),null);
});
test('invalid or unavailable public collection never silently becomes unpublished or a link',async()=>{
 for(const mode of ['offline','mutable','wrong-repository','schema','duplicate'])await assert.rejects(links.published(manifest,collectionFixture({},mode)));
 for(const change of [{path:'../cytv-theme.json'},{path:'https://evil.test/cytv-theme.json'},{sha256:'0'.repeat(64)},{themeVersion:'9.0.0'},{id:'github:other/themes:forest'}])await assert.rejects(links.published(manifest,collectionFixture(change)));
});
