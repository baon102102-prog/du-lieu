/* Shell QA: KPI Sale and Hàng hóa & hiệu quả vốn live INSIDE the dashboard V2 "Điều hành" menu (one shell, one menu).
   Run from repo root (server on 127.0.0.1:8788):
   PLAYWRIGHT_BROWSERS_PATH=$PWD/frontend/.browsers .node/bin/node docs/design-proposals/plan-mockup-v1/v2/mockup/qa/shell-qa.mjs
   Screenshots mask raw-document fields (.sens). Nothing here writes data. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync,readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import path from 'node:path';
const here=path.dirname(fileURLToPath(import.meta.url)),mockup=path.join(here,'..'),repo=path.join(here,'../../../../../..');
const require=createRequire(path.join(repo,'frontend/package.json'));
const {chromium}=require('@playwright/test');
const D='http://127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html';
const SHOTS=path.join(here,'shots');mkdirSync(SHOTS,{recursive:true});
const results=[],errors=[];
const check=async(name,fn)=>{try{const d=await fn();results.push({name,ok:true,detail:d||''});console.log('PASS  '+name+(d?'  → '+d:''))}catch(e){const m=String(e.message).split('\n').slice(0,3).join(' | ');results.push({name,ok:false,detail:m});console.log('FAIL  '+name+'\n      '+m)}};
const eq=(a,b,m='')=>{if(a!==b)throw new Error(`${m} expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`)};
const ok=(c,m)=>{if(!c)throw new Error(m)};
const browser=await chromium.launch();
async function open(w=1440,h=900,o={}){const ctx=await browser.newContext({viewport:{width:w,height:h},...(w<500?{isMobile:true,hasTouch:true,deviceScaleFactor:2}:{}),...o});const p=await ctx.newPage();p.on('pageerror',e=>errors.push('pageerror: '+e.message));p.on('console',m=>{if(m.type()==='error')errors.push('console.error: '+m.text())});return {ctx,p}}
const hash=h=>h;const modReady=async(p,sel)=>{await p.waitForSelector(sel,{timeout:8000});await p.waitForTimeout(60)};
const go=async(p,h,sel)=>{await p.goto(D+'#'+h);await p.reload();if(sel)await modReady(p,sel);else await p.waitForTimeout(300)};
const mask=async p=>p.addStyleTag({content:'.sens{filter:blur(7px)!important}.site-header{position:static!important}'});
const shot=async(p,name,full=false)=>{try{await mask(p);await p.screenshot({path:path.join(SHOTS,name+'.png'),fullPage:full})}catch(e){results.push({name:'screenshot '+name,ok:false,detail:e.message});console.log('FAIL  screenshot '+name)}};
const side=p=>p.locator('.ops-side .side-link');
const MODS=['Tổng quan','Thu–bán','Tồn kho','Kiểm tra','Chi phí','Hàng hóa & hiệu quả vốn','KPI Sale'];

/* ---------- 0. invariants ---------- */
await check('model, snapshot, engine, data hashes equal the pre-change baseline',()=>{
 const snaps=path.join(repo,'docs/design-proposals/_snapshots');const dir=readdirSync(snaps).filter(d=>d.startsWith('v2-format-before-')&&!d.endsWith('.sha256')).sort().pop();
 const lines=readFileSync(path.join(snaps,dir,'INVARIANT-HASH.sha256'),'utf8').trim().split('\n').map(l=>l.split(/\s+/));
 const where=f=>f==='engine.js'||f==='data.js'?path.join(repo,'docs/design-proposals/ops-modules-v2',f):path.join(mockup,'kpi',f);
 for(const [h,f] of lines)eq(createHash('sha256').update(readFileSync(where(f))).digest('hex'),h,f);return lines.length+' files match '+dir});

/* ---------- 1. one menu: direct switching, no standalone shell ---------- */
{const {ctx,p}=await open();await go(p,'view=dashboard');
 await check('menu lists KPI Sale and Hàng hóa & hiệu quả vốn with the other Điều hành items; no tag, no separate group',async()=>{
  const t=(await side(p).allInnerTexts()).map(x=>x.replace(/\s+/g,' ').trim());for(const m of MODS)ok(t.some(x=>x.startsWith(m)),'missing '+m);
  const ops=await p.locator('.ops-side ul').first().locator('a').allInnerTexts();eq(ops.length,7,'7 items in the Điều hành group');ok(!/Prototype riêng/.test(await p.content()),'no "Prototype riêng"')});
 await check('no standalone leftovers: no KPI box in the header, no :8790 link, no "Quay lại dashboard V2"',async()=>{
  eq(await p.locator('.site-header a[href*="kpi"]').count(),0);const html=await p.content();ok(!html.includes(':8790'),'8790 referenced');ok(!/Quay lại dashboard V2/.test(html),'standalone back button')});
 await check('Tổng quan → KPI → Hàng hóa → Thu–bán → Tồn kho straight from the menu; menu stays, active follows',async()=>{
  const seq=[['KPI Sale','kpi','.mod-kpi .k-sale'],['Hàng hóa & hiệu quả vốn','goods','.mod-goods .tile'],['Thu–bán','tx',null],['Tồn kho','inventory',null],['KPI Sale','kpi','.mod-kpi .k-sale']];
  for(const [label,view,sel] of seq){await p.locator('.ops-side a',{hasText:label}).first().click();if(sel)await modReady(p,sel);else await p.waitForTimeout(250);
   ok(new RegExp('view='+view).test(p.url()),'url '+p.url());eq(await p.locator('.ops-side').isVisible(),true,'sidebar visible in '+view);
   const cur=(await p.locator('.ops-side [aria-current=page]').first().innerText()).replace(/\s+/g,' ').trim();ok(cur.startsWith(label),`active "${cur}" for ${label}`);
   eq(await p.locator('.ops-side .side-link').count(),14,'sidebar item count in '+view)}});
 await check('repeated navigation x4 does not duplicate modules, stylesheets, dialogs or handlers',async()=>{
  await p.evaluate(()=>{window.__sm=0;const o=HTMLDialogElement.prototype.showModal;HTMLDialogElement.prototype.showModal=function(){window.__sm++;return o.apply(this,arguments)}});
  for(let i=0;i<4;i++){await p.locator('.ops-side a',{hasText:'Hàng hóa & hiệu quả vốn'}).first().click();await modReady(p,'.mod-goods .tile');await p.locator('.ops-side a',{hasText:'KPI Sale'}).first().click();await modReady(p,'.mod-kpi .k-sale')}
  eq(await p.locator('.mod-host').count(),1);eq(await p.locator('link[data-mod-css]').count(),2);eq(await p.locator('script[data-mod-js]').count(),3);eq(await p.locator('main dialog').count(),1,'one dialog (KPI) in main');
  await p.locator('.k-sale').first().locator('a.comp').first().click();await p.waitForTimeout(80);await p.locator('.k-table [data-open]').first().click();await p.waitForTimeout(300);
  eq(await p.evaluate(()=>window.__sm),1,'showModal calls');eq(await p.locator('dialog[open]').count(),1);await p.keyboard.press('Escape');await p.waitForTimeout(260);
  await p.locator('.ops-side a',{hasText:'Hàng hóa & hiệu quả vốn'}).first().click();await modReady(p,'.mod-goods .tile');await p.locator('.mod-goods .tile').first().scrollIntoViewIfNeeded();
  const n0=await p.evaluate(()=>window.__sm);await p.locator('.mod-goods #results [data-h]').first().click();await p.waitForTimeout(300);eq(await p.evaluate(()=>window.__sm),n0+1,'Goods drilldown opens one sheet');await p.keyboard.press('Escape')});
 await check('footer names this module\'s data and no longer calls KPI data a demo copy',async()=>{
  await p.locator('.ops-side a',{hasText:'KPI Sale'}).first().click();await modReady(p,'.mod-kpi .k-sale');const f=(await p.locator('.site-foot').innerText());ok(/snapshot cục bộ/.test(f)&&!/bản sao của dữ liệu demo/.test(f),f);
  await p.locator('.ops-side a',{hasText:'Hàng hóa & hiệu quả vốn'}).first().click();await modReady(p,'.mod-goods .tile');ok(/dữ liệu tổng hợp/.test(await p.locator('.site-foot').innerText()),'goods footer');
  await p.locator('.ops-side a',{hasText:'Tổng quan'}).first().click();await p.waitForTimeout(250);{const f=await p.locator('.site-foot').innerText();ok(/mỗi khối|các khối có nguồn và kỳ riêng/i.test(f)&&/snapshot KPI Sale/.test(f)&&!/bản sao của dữ liệu demo/.test(f),'dashboard footer names each block source/period (custom overview)')}});
 await ctx.close()}

/* ---------- 2. deep links, reload, Back / Forward, focus ---------- */
{const {ctx,p}=await open();
 await check('deep link + reload keep KPI state (view, sale, filter) under the shell',async()=>{
  await go(p,'view=kpi&k_view=list&k_state=pending&k_sale=unknown','.mod-kpi .k-table');const n=await p.locator('.k-table tbody tr').count();ok(n>100,'rows '+n);
  ok(await p.locator('.k-seg2 [aria-pressed=true]').first().innerText().then(t=>/Chờ xác minh/.test(t)),'chip');await p.reload();await modReady(p,'.mod-kpi .k-table');eq(await p.locator('.k-table tbody tr').count(),n);eq(await p.locator('.ops-side [aria-current=page]').first().innerText().then(t=>t.trim().startsWith('KPI Sale')),true)});
 await check('deep link + reload keep Hàng hóa state (tab, scope, brand)',async()=>{
  await go(p,'view=goods&g_scope=ton&g_brand=Dior','.mod-goods .tile');eq(await p.inputValue('#f-brand'),'Dior');eq(await p.getAttribute('#scope-ton','aria-pressed'),'true');
  await p.reload();await modReady(p,'.mod-goods .tile');eq(await p.inputValue('#f-brand'),'Dior');await go(p,'view=goods&g_tab=tuoi','.mod-goods #view *');eq(await p.getAttribute('#tab-tuoi','aria-selected'),'true')});
 await check('old addresses forward into the shell: 8790 root and /kpi/ (state keys mapped)',async()=>{
  await p.goto('http://127.0.0.1:8790/#scope=ton&brand=Dior');await p.waitForURL(/baoq-mockup-v2\.html#view=goods/);ok(/g_scope=ton/.test(p.url())&&/g_brand=Dior/.test(p.url()),p.url());
  await p.goto('http://127.0.0.1:8788/v2/mockup/kpi/#view=todo');await p.waitForURL(/baoq-mockup-v2\.html#view=kpi/);ok(/k_view=todo/.test(p.url()),p.url())});
 await check('Back / Forward walk menu → profile → list and restore each state',async()=>{
  await go(p,'view=dashboard');await p.locator('.ops-side a',{hasText:'KPI Sale'}).first().click();await modReady(p,'.mod-kpi .k-sale');const h1=p.url();
  await p.locator('.k-sale').first().locator('a.klink').click();await p.waitForTimeout(150);ok(/k_view=sale/.test(p.url()),'profile '+p.url());const h2=p.url();
  await p.locator('.k-comp a.link-btn').first().click();await p.waitForTimeout(150);ok(/k_view=list/.test(p.url()),'list '+p.url());
  await p.goBack();await p.waitForTimeout(200);eq(p.url(),h2,'back 1');ok(await p.locator('.k-phead').count()===1,'profile shown');
  await p.goBack();await p.waitForTimeout(200);eq(p.url(),h1,'back 2');ok(await p.locator('.k-sale-grid').count()===1,'income shown');
  await p.goForward();await p.waitForTimeout(200);eq(p.url(),h2,'forward');ok(await p.locator('.k-phead').count()===1)});
 await check('focus: a menu switch focuses the page heading; a module drilldown focuses the module heading; Escape returns focus',async()=>{
  await go(p,'view=dashboard');await p.locator('.ops-side a',{hasText:'KPI Sale'}).first().click();await modReady(p,'.mod-kpi .k-sale');await p.waitForTimeout(120);eq(await p.evaluate(()=>document.activeElement.tagName),'H1','shell heading');
  await p.locator('.k-sale').first().locator('a.klink').click();await p.waitForTimeout(250);eq(await p.evaluate(()=>document.activeElement.tagName+':'+document.activeElement.hasAttribute('data-heading')),'H2:true','module heading');
  await p.locator('.k-back').click();await p.waitForTimeout(200);await p.locator('.k-sale').first().locator('a.comp').first().click();await p.waitForTimeout(200);
  const b=p.locator('.k-table [data-open]').first();await b.focus();await p.keyboard.press('Enter');await p.waitForTimeout(300);eq(await p.evaluate(()=>document.activeElement.id),'kd-title');
  await p.keyboard.press('Escape');await p.waitForTimeout(300);eq(await p.locator('dialog[open]').count(),0);ok(await b.evaluate(n=>n===document.activeElement),'focus returned to opener')});
 await ctx.close()}

/* ---------- 3. breakpoint matrix: same viewport, same navigation in every Điều hành view ---------- */
const table=[];
for(const w of [1512,1440,1280,1100,1099,1024,900,768,700,699,390]){
 const {ctx,p}=await open(w,860);const types={};
 for(const [v,sel] of [['dashboard',null],['tx',null],['inventory',null],['kpi','.mod-kpi .k-sale'],['goods','.mod-goods .tile']]){
  await p.goto(D+'#view='+v);if(sel)await modReady(p,sel);else await p.waitForTimeout(300);await p.waitForTimeout(100);
  types[v]=await p.evaluate(()=>{const vis=e=>e&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>0;
   if(vis(document.querySelector('.ops-side')))return 'sidebar';if(vis(document.querySelector('.ops-menu')))return 'menu';if(vis(document.querySelector('.ops-tabs .tabs-main')))return 'tabs';return 'none'})}
 const kinds=[...new Set(Object.values(types))];const expect=w>=1100?'sidebar':'menu';
 await check(`@${w}: every Điều hành view shows the same navigation (${expect}) and no label is cut or missing`,async()=>{
  eq(kinds.length,1,JSON.stringify(types));eq(kinds[0],expect,'type');
  const r=await p.evaluate(({type,MODS})=>{const bad=[];const need=MODS;const chk=(els,kind)=>{const labels=[...els].map(e=>e.innerText.replace(/\s+/g,' ').trim());for(const m of need)if(!labels.some(l=>l.startsWith(m)))bad.push('missing '+m+' in '+kind);for(const e of els){const r=e.getBoundingClientRect();if(r.left<-1||r.right>innerWidth+1)bad.push('outside viewport: '+e.innerText.trim().slice(0,20));const s=e.querySelector('span:not(.vh):not(.badge-n)')||e;if(s.scrollWidth>s.clientWidth+1)bad.push('clipped: '+e.innerText.trim().slice(0,20))}};
   if(type==='sidebar')chk(document.querySelectorAll('.ops-side ul:first-of-type a'),'sidebar');
   else if(type==='tabs')chk(document.querySelectorAll('.ops-tabs .tabs-main a'),'tabs');
   else{const d=document.querySelector('.ops-menu');d.open=true;chk(d.querySelectorAll('ul a'),'menu');d.open=false}
   return {bad,sw:document.documentElement.scrollWidth}},{type:expect,MODS});
  eq(r.bad.length,0,r.bad.join('; '));ok(r.sw<=w,'page overflow '+r.sw);table.push({w,types:kinds[0]});return kinds[0]});
 await ctx.close()}
writeFileSync(path.join(here,'breakpoint-table.json'),JSON.stringify(table,null,1));

/* ---------- 4. responsive menu behaviour ---------- */
{const {ctx,p}=await open(390,844);await go(p,'view=kpi','.mod-kpi .k-sale');
 await check('phone: one menu button names the current page; opening lists every item; Escape closes and returns focus',async()=>{
  const sum=p.locator('.ops-menu summary');eq((await sum.innerText()).trim(),'KPI Sale');await sum.click();await p.waitForTimeout(120);ok(await p.locator('.ops-menu ul a').count()>=13,'items');
  await shot(p,'menu-open-390');await p.keyboard.press('Escape');await p.waitForTimeout(100);eq(await p.locator('.ops-menu').evaluate(d=>d.open),false);eq(await p.evaluate(()=>document.activeElement.tagName),'SUMMARY')});
 await check('phone: choosing Hàng hóa from the menu switches content and the menu label',async()=>{
  await p.locator('.ops-menu summary').click();await p.locator('.ops-menu ul a',{hasText:'Hàng hóa & hiệu quả vốn'}).click();await modReady(p,'.mod-goods .tile');eq((await p.locator('.ops-menu summary').innerText()).trim(),'Hàng hóa & hiệu quả vốn')});
 await ctx.close()}

/* ---------- 5. V2 format: computed roles, shell parity ---------- */
{const {ctx,p}=await open(1440,900);
 const read=async(h,sel)=>{await p.goto(D+'#view='+h);if(sel)await modReady(p,sel);else await p.waitForTimeout(300);return p.evaluate(()=>{const cs=(s,props)=>{const e=document.querySelector(s);if(!e)return null;const c=getComputedStyle(e),o={};for(const k of props)o[k]=c[k];return o};
  const fam=s=>{const e=document.querySelector(s);return e?getComputedStyle(e).fontFamily.split(',')[0].replace(/["']/g,''):null};
  return {h1:cs('h1',['fontSize','fontWeight','fontFamily']),h1fam:fam('h1'),band:cs('.band',['paddingTop','paddingBottom']),ops:cs('.ops-layout',['gridTemplateColumns','maxWidth']),side:cs('.ops-side',['position']),
   kval:cs('.kcard .kvalue:not(.is-text)',['fontSize','fontWeight']),kfam:fam('.kcard .kvalue:not(.is-text)'),kcard:cs('.kcard',['borderRadius','paddingTop','paddingLeft','boxShadow','backgroundImage']),body:fam('body'),
   btn:cs('.btn',['minHeight','fontSize','fontWeight','borderRadius']),tbl:cs('.table td',['fontSize']),th:cs('.table th',['fontSize','fontWeight']),foot:cs('.site-foot',['fontSize'])}})};
 const dash=await read('dashboard'),kpi=await read('kpi','.mod-kpi .k-sale'),goods=await read('goods','.mod-goods .tile');
 await check('shell parity: band, title role, sidebar width and container are identical for dashboard, KPI and Hàng hóa',async()=>{
  for(const [n,x] of [['kpi',kpi],['goods',goods]]){eq(x.h1.fontSize,dash.h1.fontSize,n+' h1 size');eq(x.h1fam,'Baskerville',n+' h1 serif');eq(JSON.stringify(x.band),JSON.stringify(dash.band),n+' band');eq(JSON.stringify(x.ops),JSON.stringify(dash.ops),n+' layout')}
  eq(dash.h1.fontSize,'32px');return 'h1 32px serif · 232px sidebar + 1320 container'});
 await check('KPI numbers are sans 28/600; titles serif; KPI card radius, padding, gradient and shadow equal the dashboard\'s',async()=>{
  eq(kpi.kfam,'-apple-system','KPI value font is sans');eq(kpi.kval.fontSize,dash.kval.fontSize);eq(kpi.kval.fontWeight,'600');eq(dash.kval.fontSize,'28px');
  for(const k of ['borderRadius','paddingTop','paddingLeft','boxShadow','backgroundImage'])eq(kpi.kcard[k],dash.kcard[k],'kcard '+k)});
 await check('Hàng hóa tiles use the same 28/600 sans value role; buttons 44px/15px/600; table cell 14px, header 500',async()=>{
  await p.goto(D+'#view=goods');await modReady(p,'.mod-goods .tile');const g=await p.evaluate(()=>{const v=getComputedStyle(document.querySelector('.mod-goods .tile .v'));return {size:v.fontSize,w:v.fontWeight,fam:v.fontFamily.split(',')[0]}});eq(g.size,'28px');eq(g.w,'600');ok(!/Baskerville|Georgia/.test(g.fam),'sans');
  await p.goto(D+'#view=kpi&k_view=todo');await modReady(p,'.mod-kpi .btn');const b=await p.evaluate(()=>{const e=document.querySelector('.mod-kpi .btn-primary');const c=getComputedStyle(e);return {h:parseFloat(c.minHeight),f:c.fontSize,w:c.fontWeight,r:c.borderRadius}});ok(b.h>=44&&b.f==='15px'&&b.w==='600'&&b.r==='6px',JSON.stringify(b));
  await p.goto(D+'#view=kpi&k_view=list');await modReady(p,'.mod-kpi .k-table');const t=await p.evaluate(()=>({td:getComputedStyle(document.querySelector('.k-table td.num')).fontSize,th:getComputedStyle(document.querySelector('.k-table th')).fontWeight,thSize:getComputedStyle(document.querySelector('.k-table th')).fontSize}));eq(t.td,'14px');eq(t.th,'500')});
 await check('record dialog follows the V2 spec: centred, max 560px, 16px radius; bottom sheet on phones',async()=>{
  await p.goto(D+'#view=kpi&k_view=list&k_state=provisional');await modReady(p,'.mod-kpi .k-table');await p.locator('.k-table [data-open]').first().click();await p.waitForTimeout(320);
  const r=await p.evaluate(()=>{const d=document.querySelector('dialog[open]'),b=d.getBoundingClientRect(),c=getComputedStyle(d);return {w:Math.round(b.width),maxh:c.maxHeight,rad:c.borderRadius,padd:c.paddingTop,cx:Math.round(b.left+b.width/2)}});ok(r.w<=560&&r.rad==='16px'&&r.padd==='24px'&&Math.abs(r.cx-720)<=2,JSON.stringify(r));await shot(p,'kpi-dialog-1440');await p.keyboard.press('Escape')});
 await check('motion: shell, KPI and Hàng hóa use only the V2 tokens 120/180/240/280 ms (shimmer excluded)',async()=>{
  const dur=async()=>p.evaluate(()=>{const ok=new Set([0,120,180,240,280]),bad=new Set();for(const e of document.querySelectorAll('*')){const c=getComputedStyle(e);for(const v of (c.transitionDuration+','+c.animationDuration).split(',')){const ms=Math.round(parseFloat(v)*(v.includes('ms')?1:1000));if(!ok.has(ms)&&!e.classList.contains('sk-line'))bad.add(e.className+':'+v)}}return [...bad].slice(0,5)});
  for(const [h,sel] of [['dashboard',null],['kpi','.mod-kpi .k-sale'],['goods','.mod-goods .tile']]){await p.goto(D+'#view='+h);if(sel)await modReady(p,sel);else await p.waitForTimeout(250);const b=await dur();eq(b.length,0,h+': '+b.join(','))}});
 await ctx.close()}
{const {ctx,p}=await open(1440,900,{reducedMotion:'reduce'});await p.goto(D+'#view=kpi&k_view=list');await modReady(p,'.mod-kpi .k-table');await p.locator('.k-table [data-open]').first().click();await p.waitForTimeout(60);
 await check('reduced motion: no running transitions/animations in shell or modules; dialog content present at once',async()=>{
  const n=await p.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>{const c=getComputedStyle(e);return parseFloat(c.transitionDuration)>0||(c.animationName!=='none'&&parseFloat(c.animationDuration)>0)}).length);eq(n,0);ok(await p.locator('dialog[open] #kd-title').isVisible(),'dialog visible')});await ctx.close()}

/* ---------- 6. no overflow, screenshots ---------- */
for(const [w,h] of [[1440,900],[768,1024],[390,844]]){
 const {ctx,p}=await open(w,h);
 for(const [n,hh,sel] of [['dashboard','view=dashboard',null],['kpi-income','view=kpi','.mod-kpi .k-sale'],['kpi-sale','view=kpi&k_view=sale&k_sale=Linh','.mod-kpi .k-comp'],['kpi-todo','view=kpi&k_view=todo','.mod-kpi .k-todo'],['kpi-list','view=kpi&k_view=list&k_state=pending','.mod-kpi .k-table'],['kpi-rules','view=kpi&k_view=rules','.mod-kpi .k-rules'],['kpi-empty','view=kpi&k_period=nov','.mod-kpi .k-empty'],['goods-hang','view=goods','.mod-goods .tile'],['goods-ton','view=goods&g_scope=ton','.mod-goods .tile'],['goods-tuoi','view=goods&g_tab=tuoi','.mod-goods #age-bars'],['goods-chinhsach','view=goods&g_tab=chinhsach','.mod-goods #pol-table'],['goods-sale','view=goods&g_tab=sale','.mod-goods #sale-table']]){
  await check(`no horizontal overflow @${w}: ${n}`,async()=>{await p.goto(D+'#'+hh);if(sel)await modReady(p,sel);else await p.waitForTimeout(300);await p.waitForTimeout(120);const sw=await p.evaluate(()=>document.documentElement.scrollWidth);ok(sw<=w,`scrollWidth ${sw} > ${w}`);
   if(['dashboard','kpi-income','goods-hang'].includes(n)||(w===1440&&['kpi-sale','kpi-todo','kpi-list'].includes(n)))await shot(p,`${n}-${w}`)})}
 await ctx.close()}
await check('no console errors or page errors in the whole run',()=>eq(errors.length,0,errors.slice(0,3).join(' | ')));
await browser.close();
const f=results.filter(r=>!r.ok);console.log(`\nShell QA: ${results.length-f.length} passed, ${f.length} failed`);
writeFileSync(path.join(here,'shell-results.json'),JSON.stringify(results,null,1));process.exit(f.length?1:0);
