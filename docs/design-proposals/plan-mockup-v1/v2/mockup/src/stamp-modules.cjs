// Stamps cache-busting versions so a normal reload always loads the current module code (python http.server sends only Last-Modified).
// 1) mockup/goods -> symlink to ops-modules-v2 (single source). 2) kpi/controller.mjs imports get ?v=<sha8> of their targets. 3) returns MOD_VER for the dashboard loader.
// Usage: required by build.cjs. CLI: node stamp-modules.cjs --check
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const mockup=path.resolve(__dirname,'..');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(mockup,f))).digest('hex').slice(0,8);
const FILES=['goods/app-ops.scoped.css','goods/engine.js','goods/data.js','goods/app.js','kpi/style.css','kpi/controller.mjs'];
function stampImports(check){
 const f=path.join(mockup,'kpi/controller.mjs');let s=fs.readFileSync(f,'utf8'),changed=false;
 for(const dep of ['model.mjs','view.mjs','income.mjs']){
  if(!fs.existsSync(path.join(mockup,'kpi',dep)))continue;
  const v=sha('kpi/'+dep),re=new RegExp("from '\\./"+dep.replace('.','\\.')+"(\\?v=[0-9a-f]{8})?'","g");
  const next=s.replace(re,`from './${dep}?v=${v}'`);if(next!==s){changed=true;s=next}
 }
 if(changed&&!check)fs.writeFileSync(f,s);
 return changed;
}
function stampViewImports(check){ // view.mjs and income.mjs import model.mjs
 let any=false;const v=sha('kpi/model.mjs');
 for(const dep of ['view.mjs','income.mjs']){const f=path.join(mockup,'kpi',dep);if(!fs.existsSync(f))continue;const s=fs.readFileSync(f,'utf8');
  const next=s.replace(/from '\.\/model\.mjs(\?v=[0-9a-f]{8})?'/g,`from './model.mjs?v=${v}'`);if(next!==s){any=true;if(!check)fs.writeFileSync(f,next)}}
 return any;
}
function versions(){stampViewImports(false);stampImports(false);const o={};for(const f of FILES)o[f]=sha(f);return o}
module.exports={versions,stampImports,stampViewImports};
if(require.main===module&&process.argv.includes('--check')){const a=stampViewImports(true),b=stampImports(true);if(a||b){console.log('module import stamps are stale');process.exit(1)}console.log('module stamps current')}
