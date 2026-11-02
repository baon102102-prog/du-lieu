/* Cache-busting for the static mockup: python's http.server sends only Last-Modified (no Cache-Control), so browsers may heuristically reuse
   an old app.js after a normal reload. This stamps every local asset URL in index.html with ?v=<first 8 hex of the file's sha256>.
   Run after editing any asset:  node qa/stamp-assets.mjs        (add --check to only verify; exits 1 if a stamp is stale)  */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..'),indexPath=path.join(root,'index.html');
const ASSETS=['app-v2-base.css','app-v2.css','app-ops.css','app-ops.scoped.css','engine.js','data.js','app.js'];
const sha=f=>createHash('sha256').update(readFileSync(path.join(root,f))).digest('hex').slice(0,8);
let html=readFileSync(indexPath,'utf8'),stale=[];
for(const f of ASSETS){
 const re=new RegExp(`((?:href|src)=")${f.replace(/\./g,'\\.')}(?:\\?v=[0-9a-f]+)?(")`,'g');
 if(!re.test(html))throw new Error('asset not referenced in index.html: '+f);
 const want=`?v=${sha(f)}`;
 html=html.replace(new RegExp(`((?:href|src)=")${f.replace(/\./g,'\\.')}(?:\\?v=[0-9a-f]+)?(")`,'g'),(m,a,b)=>{if(m!==`${a}${f}${want}${b}`)stale.push(f);return `${a}${f}${want}${b}`});
}
if(process.argv.includes('--check')){if(stale.length){console.log('STALE stamps: '+[...new Set(stale)].join(', '));process.exit(1)}console.log('asset stamps current');process.exit(0)}
writeFileSync(indexPath,html);console.log(stale.length?'restamped: '+[...new Set(stale)].join(', '):'stamps already current');
