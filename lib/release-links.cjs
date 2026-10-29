'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),links=require('./short-links.cjs');
function workflow(commit){
 if(!/^[a-f0-9]{40}$/.test(commit))throw Error('An exact published toolkit commit is required.');
 return `name: Theme installation links
on:
  release:
    types: [published]
permissions:
  contents: write
jobs:
  links:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: \${{ github.sha }}
          path: theme-source
          persist-credentials: false
      - uses: actions/checkout@v4
        with:
          repository: Razdva122/clean-your-tv-lg-theme
          ref: ${commit}
          path: theme-tools
          persist-credentials: false
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Generate keyless installation links
        env:
          THEME_TAG: \${{ github.event.release.tag_name }}
        run: node theme-tools/bin/theme.cjs release-links theme-source --repository "$GITHUB_REPOSITORY" --commit "$GITHUB_SHA" --tag "$THEME_TAG" --out theme-release
      - name: Attach links and preserve release notes
        env:
          GH_TOKEN: \${{ github.token }}
          THEME_TAG: \${{ github.event.release.tag_name }}
        run: |
          gh release upload "$THEME_TAG" theme-release/tv-links.json --clobber --repo "$GITHUB_REPOSITORY"
          gh release view "$THEME_TAG" --json body --repo "$GITHUB_REPOSITORY" > theme-release/current-notes.json
          node theme-tools/bin/theme.cjs release-notes theme-release
          gh release edit "$THEME_TAG" --notes-file theme-release/notes.md --repo "$GITHUB_REPOSITORY"
`;
}
function toolkitCommit(){
 const root=path.resolve(__dirname,'..'),file=path.join(root,'toolkit-source.json');
 if(fs.existsSync(file)){const value=JSON.parse(fs.readFileSync(file));if(/^[a-f0-9]{40}$/.test(value.commit))return value.commit;throw Error('Invalid toolkit source provenance.');}
 if(!fs.existsSync(path.join(root,'.git')))throw Error('Use the candidate bundle or a trusted toolkit checkout.');
 return cp.execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
}
async function generate(directory,options){
 if(!/^[\w-]+\/[\w.-]+$/.test(options.repository)||!/^[a-f0-9]{40}$/.test(options.commit)||!/^v\d+\.\d+\.\d+$/.test(options.tag))throw Error('Use OWNER/REPO, an exact distribution commit and a vX.Y.Z release tag.');
 const root=path.resolve(directory),out=path.resolve(options.out);if(fs.existsSync(out))throw Error('Output must be a new directory.');
 const actual=cp.execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();if(actual!==options.commit)throw Error('Release checkout differs from the supplied commit.');
 const files=cp.execFileSync('git',['-C',root,'ls-files','--','distributions/**/cytv-theme.json'],{encoding:'utf8',maxBuffer:1048576}).trim().split('\n').filter(Boolean),entries=[];
 for(const file of files){
  if(!/^distributions\/(?:[\w.-]+\/)+cytv-theme\.json$/.test(file)||file.split('/').some(p=>p==='.'||p==='..'))throw Error('Invalid distribution path.');
  let leaf=root;for(const part of file.split('/')){leaf=path.join(leaf,part);if(fs.lstatSync(leaf).isSymbolicLink())throw Error('Indirect distribution file.');}
  const stat=fs.statSync(leaf);if(!stat.isFile()||stat.size>65536)throw Error('Descriptor too large or not regular.');
  const raw=fs.readFileSync(leaf);if(raw.length>65536)throw Error('Descriptor too large.');const m=JSON.parse(raw);
  if(m.themeVersion!==options.tag.slice(1))continue;
  if(entries.some(e=>e.id===m.id))throw Error('Duplicate theme ID/version in release.');
  const url='https://raw.githubusercontent.com/'+options.repository+'/'+options.commit+'/'+file;
  const entry=await links.shorten(url,m,{...options,descriptorSha256:require('node:crypto').createHash('sha256').update(raw).digest('hex')});
  if(entry.descriptorSha256!==require('node:crypto').createHash('sha256').update(raw).digest('hex'))throw Error('Published distribution differs from checkout.');
  entries.push(entry);if(entries.length>50)throw Error('At most 50 themes per release.');
 }
 if(!entries.length)throw Error('Commit distributions matching this release version before publishing the release.');
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'tv-links.json'),JSON.stringify({schemaVersion:1,links:entries},null,2)+'\n');return entries;
}
function finishNotes(directory){
 const root=path.resolve(directory),current=JSON.parse(fs.readFileSync(path.join(root,'current-notes.json'))),data=JSON.parse(fs.readFileSync(path.join(root,'tv-links.json')));
 if(typeof current.body!=='string'||data.schemaVersion!==1||!Array.isArray(data.links))throw Error('Invalid release note inputs.');
 fs.writeFileSync(path.join(root,'notes.md'),links.notes(current.body,data.links));
}
module.exports={workflow,toolkitCommit,generate,finishNotes};
