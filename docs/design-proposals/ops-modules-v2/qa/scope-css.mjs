/* Generates app-ops.scoped.css: app-ops.css wrapped under .mod-goods so it can live inside the dashboard shell without touching its CSS,
   plus the native-dialog sheet rules (460px right sheet, bottom sheet on phones) the V2 shell does not define for <dialog>.
   Usage: node qa/scope-css.mjs [--check]   (run after editing app-ops.css; --check exits 1 if the generated file is stale) */
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const SC='.mod-goods';
function blocks(css){const out=[];let depth=0,start=0,head='';for(let i=0;i<css.length;i++){const c=css[i];if(c==='{'){if(depth===0){head=css.slice(start,i).trim()}depth++}else if(c==='}'){depth--;if(depth===0){out.push({head,body:css.slice(css.indexOf('{',start)+1,i),raw:css.slice(start,i+1).trim()});start=i+1}}}return out}
const scopeSel=sel=>sel.split(',').map(x=>x.trim()).filter(Boolean).map(x=>x===':root'?SC:/^(main|html|body)$/.test(x)?null:`${SC} ${x}`).filter(Boolean).join(',');
function scope(css){return blocks(css.replace(/\/\*[\s\S]*?\*\//g,'')).map(b=>{
 if(b.head.startsWith('@media')||b.head.startsWith('@supports'))return `${b.head}{${scope(b.body)}}`;
 if(b.head.startsWith('@keyframes'))return b.raw;
 const s=scopeSel(b.head);return s?`${s}{${b.body}}`:''}).filter(Boolean).join('\n')}
const ops=readFileSync(path.join(root,'app-ops.css'),'utf8');
const sheet=`
/* native <dialog> sheet (from app-v2.css), renamed keyframes so nothing global is overridden */
${SC} dialog.side-sheet{position:fixed;inset:0 0 0 auto;margin:0;width:min(460px,100vw);height:100%;max-height:100%;max-width:none;padding:0;border:0;background:var(--paper);color:var(--ink);box-shadow:var(--shadow-sheet);overscroll-behavior:contain}
${SC} dialog.side-sheet[open]{display:flex;flex-direction:column;animation:goods-sheet-in var(--dur-3) var(--ease-out)}
${SC} dialog.side-sheet::backdrop{background:rgba(20,14,6,.48);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
${SC} dialog.side-sheet[open]::backdrop{animation:goods-scrim-in var(--dur-3) var(--ease-out)}
${SC} dialog.side-sheet.is-closing{animation:goods-sheet-out var(--dur-2) var(--ease-in) forwards}
${SC} dialog.side-sheet.is-closing::backdrop{animation:goods-scrim-out var(--dur-2) var(--ease-in) forwards}
${SC} .side-sheet .sev{margin-bottom:var(--s3)}
${SC} .side-sheet h3{font:600 14px/1.4 var(--sans);margin:0 0 var(--s2)}
${SC} .sheet-head{display:flex;align-items:center;justify-content:space-between;gap:var(--s3);padding:var(--s3) var(--s4) var(--s3) var(--s6);border-bottom:1px solid var(--line)}
${SC} .sheet-head p{margin:0;font-size:14px;color:var(--muted)}
${SC} .sheet-body{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:var(--s6)}
${SC} .sheet-body h2{font-family:var(--serif);font-weight:400;font-size:28px;line-height:1.2;margin:0 0 var(--s5)}
${SC} .icon-btn{display:inline-grid;place-items:center;width:44px;height:44px;border-radius:var(--r-sm);color:var(--ink);transition:background-color var(--dur-1) var(--ease-std)}
${SC} .icon-btn:hover{background:var(--mist)}
@keyframes goods-sheet-in{from{transform:translateX(100%)}}
@keyframes goods-sheet-out{to{transform:translateX(100%)}}
@keyframes goods-sheet-down{to{transform:translateY(100%)}}
@keyframes goods-scrim-in{from{opacity:0}}
@keyframes goods-scrim-out{to{opacity:0}}
body.is-locked{overflow:hidden}
@keyframes goods-sheet-up{from{transform:translateY(100%)}}
@media (max-width:699px){${SC} dialog.side-sheet{inset:auto 0 0 0;width:100%;height:92vh;max-height:92vh;border-radius:var(--r-lg) var(--r-lg) 0 0}${SC} dialog.side-sheet[open]{animation-name:goods-sheet-up}${SC} dialog.side-sheet.is-closing{animation-name:goods-sheet-down}}
@media (prefers-reduced-motion:reduce){${SC} dialog,${SC} dialog::backdrop{animation:none!important}}
/* selects share the V2 .select look (custom chevron, 42px; 44px on phones) instead of the OS-native control */
${SC} .fbar select,${SC} .field-in select,${SC} .card-tools select,${SC} .calc-grid select,${SC} .pol-grid select{appearance:none;-webkit-appearance:none;min-height:42px;padding:0 32px 0 var(--s3);border:1px solid var(--line);border-radius:var(--r-sm);color:var(--ink);font-size:14px;background:var(--paper) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%235f5850' stroke-width='1.5'/%3E%3C/svg%3E") no-repeat right 12px center}
${SC} .fbar select:disabled{background-color:var(--mist);color:var(--muted)}
@media (max-width:699px){${SC} .fbar select,${SC} .field-in select,${SC} .card-tools select,${SC} .calc-grid select,${SC} .pol-grid select{min-height:44px}}
${SC}{min-width:0}
/* embedded in the V2 shell: the shell supplies width, gutter and the page title, so drop the standalone layout and align type with V2 roles */
${SC} .an-tabs{position:static;background:none;-webkit-backdrop-filter:none;backdrop-filter:none;border:0;margin:0 0 var(--s4)}
${SC} .an-tabs .row{max-width:none;margin:0;padding:0;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:var(--s3)}
${SC} .an-tabs .seg{flex-wrap:wrap;overflow:visible}
${SC} .seg button{min-height:38px;padding:0 var(--s3);font-size:14px;border-radius:var(--r-sm)}
${SC} .mock-note{max-width:none;margin:0 0 var(--s4);padding:0}
${SC} .an-wrap{max-width:none;margin:0;padding:0}
${SC} .chip-status{display:inline-flex;align-items:center;min-height:32px;padding:0 var(--s3);border:1px solid var(--line);border-radius:999px;color:var(--muted);font-size:13px}
${SC} .kpis{grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--s4)}
${SC} .tile .l{font-size:14px}${SC} .tile .v{font-size:28px;font-weight:600;line-height:1.15;letter-spacing:-.01em}${SC} .tile .c{font-size:13px}
@media (max-width:1099px){${SC} .kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:699px){${SC} .seg button{min-height:44px}${SC} .kpis{gap:var(--s3)}${SC} .tile .v{font-size:18px}${SC} .tile .c{font-size:12px}}
`;
const out=`/* GENERATED by qa/scope-css.mjs from app-ops.css: do not edit. */\n${scope(ops)}\n${sheet}`;
const f=path.join(root,'app-ops.scoped.css');
if(process.argv.includes('--check')){let cur='';try{cur=readFileSync(f,'utf8')}catch{}if(cur!==out){console.log('app-ops.scoped.css is stale');process.exit(1)}console.log('app-ops.scoped.css current')}
else{writeFileSync(f,out);console.log('wrote app-ops.scoped.css',out.length,'bytes')}
