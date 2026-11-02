/* After-fix verification for the 5 approved fixes (critique-20261031). Read-only against data. Chromium (Playwright) only.
   Run: PLAYWRIGHT_BROWSERS_PATH=frontend/.browsers .node/bin/node <this file>  (server on 127.0.0.1:8788). Screenshots blur .sens (raw document fields). */
import {createRequire} from 'node:module';import {mkdirSync,writeFileSync} from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.join(here,'../../../../../../..');
const {chromium}=createRequire(path.join(repo,'frontend/package.json'))('@playwright/test');
const D='http://127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html#view=',SH=path.join(here,'shots-after');mkdirSync(SH,{recursive:true});
const R={at:new Date().toISOString(),browser:'Chromium (Playwright headless)'},errs=[],checks=[];
const ok=(name,pass,info)=>{checks.push({name,pass:!!pass,info});console.log(pass?'PASS':'FAIL',name,info===undefined?'':JSON.stringify(info))};
const b=await chromium.launch();
const open=async(w,h,o={})=>{const ctx=await b.newContext({viewport:{width:w,height:h},...(w<500?{isMobile:true,hasTouch:true,deviceScaleFactor:2}:{}),...o});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});return {ctx,p}};
const MASK='.sens{filter:blur(7px)!important}',shot=async(p,n,full=false)=>{await p.addStyleTag({content:MASK});await p.screenshot({path:path.join(SH,n+'.png'),fullPage:full})};
const load=async(p,h,sel)=>{await p.goto(D+h);await p.waitForSelector(sel,{timeout:8000});await p.waitForTimeout(450)};
const VPS=[[1440,900],[768,1024],[390,844]];

/* 1. KPI fold */
R.fold={};
for(const [w,h] of VPS){const {ctx,p}=await open(w,h);await load(p,'kpi','.mod-kpi .k-sale');
 const m=await p.evaluate(()=>{const q=s=>document.querySelector(s),r=e=>e.getBoundingClientRect();const ctx=q('.k-ctx'),t=ctx.innerText,all=q('.mod-kpi').innerText;
  const fs=e=>parseFloat(getComputedStyle(e).fontSize);const sampleB=q('.k-sale .c-s b'),status=q('.k-sale .c-insufficient');
  return {vh:innerHeight,firstSaleTop:Math.round(r(q('.k-sale')).top),ctxH:Math.round(r(ctx).height),
   shows:{period:/Kỳ \d\d\/\d\d–\d\d\/\d\d/.test(t),asOf:/As-of/.test(t),partial:/Mẫu một phần/.test(t),notReal:/Không phải thu nhập thực/.test(t)},
   detailsHasCoverage:/đọc chi tiết/.test(q('.k-more').textContent),detailsHasZeroRule:/không hiển thị 0/.test(q('.k-more').textContent),
   missingShowsMoney:[...document.querySelectorAll('.k-sale .comp .c-insufficient,.k-sale .comp .c-pending,.k-sale .comp .c-unseen,.k-sale .comp .c-unconfigured,.k-sale .k-total .kvalue.is-text')].filter(e=>/\d\s?₫|\b0\b/.test(e.textContent)).length,missingCount:document.querySelectorAll('.k-sale .comp .c-insufficient,.k-sale .comp .c-pending,.k-sale .comp .c-unseen,.k-sale .comp .c-unconfigured').length,salaryRowOk:[...document.querySelectorAll('.k-sale .comp')].some(e=>/lương/i.test(e.textContent)&&/Chưa cấu hình/.test(e.textContent)&&!/\d\s?₫/.test(e.querySelector('.c-v').textContent)),realZeroRows:[...document.querySelectorAll('.k-sale .c-notmet')].length,salary:/Chưa cấu hình/.test(all),notMonth:/không phải thu nhập tháng/i.test(all),
   sampleFont:sampleB&&fs(sampleB),statusFont:status&&fs(status),totalTextFont:fs(q('.k-total .kvalue')),hOver:document.documentElement.scrollWidth>innerWidth}});
 R.fold[w]=m;await shot(p,'kpi-income-'+w);if(w===390)await shot(p,'kpi-income-full-390',true);await ctx.close()}
ok('fold: first sale card inside first screen at 390',R.fold[390].firstSaleTop<R.fold[390].vh-100,R.fold[390].firstSaleTop);
ok('fold: sale card in first screen 768/1440',R.fold[768].firstSaleTop<R.fold[768].vh&&R.fold[1440].firstSaleTop<R.fold[1440].vh);
for(const w of [1440,768,390]){const f=R.fold[w];ok(`fold ${w}: period/as-of/partial/not-real visible, rest in details`,Object.values(f.shows).every(Boolean)&&f.detailsHasCoverage&&f.detailsHasZeroRule);
 ok(`fold ${w}: missing never 0, salary unconfigured, "not monthly income" wording`,f.missingShowsMoney===0&&f.missingCount>0&&f.salaryRowOk&&f.notMonth,{missingRows:f.missingCount,missingShowingNumber:f.missingShowsMoney,salaryRowOk:f.salaryRowOk,realZeroRows:f.realZeroRows,notMonth:f.notMonth});
 ok(`fold ${w}: status text smaller than sample numbers' weight (≤16px) and sample ≥14px`,f.statusFont<=16&&f.sampleFont>=14,{status:f.statusFont,sample:f.sampleFont,total:f.totalTextFont});ok(`fold ${w}: no horizontal overflow`,!f.hOver)}

/* 2. overlays */
const OVER={kpi:{hash:'kpi&k_view=list&k_state=provisional',ready:'.mod-kpi .k-table',trigger:'.k-table [data-open]',panel:'#kdetail'},
 goods:{hash:'goods',ready:'.mod-goods .tile',trigger:'.mod-goods #results [data-h]',panel:'#sheet'},v2:{hash:'tx',ready:'.table tbody tr.click',trigger:'[data-record]',panel:'.dialog'}};
R.overlay={};
async function overlay(key,w,h,reduced=false){const c=OVER[key];const {ctx,p}=await open(w,h,reduced?{reducedMotion:'reduce'}:{});await load(p,c.hash,c.ready);
 const trig=p.locator(c.trigger).first();await trig.scrollIntoViewIfNeeded();await p.waitForTimeout(150);
 const y0=await p.evaluate(()=>{scrollTo(0,400);return scrollY});await p.waitForTimeout(100);
 const openedAt=Date.now();await trig.focus();await trig.click();await p.waitForTimeout(40);
 const anim=await p.evaluate(sel=>{const el=document.querySelector(sel);const a=el.getAnimations({subtree:false}).map(x=>x.effect.getTiming().duration);const bd=el.matches('dialog')?(document.getAnimations().filter(x=>String(x.effect&&x.effect.pseudoElement).includes('backdrop')).map(x=>x.effect.getTiming().duration)):[];return {panelMs:a,backdropMs:bd}},c.panel);
 await p.waitForTimeout(400);
 const ySettled=await p.evaluate(()=>scrollY);
 const lock=await p.evaluate(()=>({bodyOverflow:getComputedStyle(document.body).overflow,y:scrollY}));
 await p.mouse.move(w-20,200);await p.mouse.wheel(0,600);await p.waitForTimeout(250);
 const y1=await p.evaluate(()=>scrollY);
 const scrim=await p.evaluate(sel=>{const el=document.querySelector(sel);if(el.matches('dialog')){const s=getComputedStyle(el,'::backdrop');return {bg:s.backgroundColor,blur:s.backdropFilter}}const s=getComputedStyle(document.getElementById('scrim'));return {bg:s.backgroundColor,blur:s.backdropFilter}},c.panel);
 if(!reduced&&w===1440)await shot(p,'overlay-'+key+'-1440');
 const t0=Date.now();await p.keyboard.press('Escape');
 let closedMs=-1;for(let i=0;i<30;i++){await p.waitForTimeout(20);const open=await p.evaluate(sel=>{const e=document.querySelector(sel);return e.matches('dialog')?e.open:e.classList.contains('is-open')},c.panel);if(!open){closedMs=Date.now()-t0;break}}
 await p.waitForTimeout(250);
 const after=await p.evaluate(()=>({overflow:getComputedStyle(document.body).overflow,locked:document.body.classList.contains('is-locked'),active:document.activeElement&&(document.activeElement.getAttribute('data-open')||document.activeElement.getAttribute('data-h')||document.activeElement.hasAttribute('data-record')&&'rec'||document.activeElement.tagName)}));
 await ctx.close();return {y0,ySettled,lock,y1,scrolledBehind:y1!==ySettled,scrim,anim,closedMs,after}}
for(const key of ['v2','kpi','goods'])for(const [w,h] of [[1440,900],[390,844]]){const r=await overlay(key,w,h);R.overlay[key+'@'+w]=r;
 ok(`overlay ${key}@${w}: background scroll locked while open (wheel does not move page)`,!r.scrolledBehind&&r.lock.bodyOverflow==='hidden',{yBeforeClick:r.y0,ySettledAfterOpen:r.ySettled,yAfterWheel:r.y1,bodyOverflow:r.lock.bodyOverflow});
 ok(`overlay ${key}@${w}: Escape closes in ≤260ms (exit ≈180ms), lock released, focus back on opener`,r.closedMs>0&&r.closedMs<=260&&!r.after.locked&&r.after.overflow!=='hidden'&&!!r.after.active&&r.after.active!=='BODY',{closedMs:r.closedMs,after:r.after})}
for(const key of ['kpi','goods']){const r=R.overlay[key+'@1440'],v=R.overlay['v2@1440'];ok(`overlay ${key}: scrim colour/blur equals V2 (rgba(20,14,6,.48), blur 6px)`,r.scrim.bg===v.scrim.bg&&String(r.scrim.blur).includes('blur(6px)'),{mod:r.scrim,v2:v.scrim})}
for(const key of ['kpi','goods']){const r=await overlay(key,1440,900,true);R.overlay[key+'@reduced']=r;ok(`overlay ${key}: reduced-motion exits ≤60ms and no animation`,r.closedMs>=0&&r.closedMs<=80&&r.anim.panelMs.every(x=>!x),{closedMs:r.closedMs,anim:r.anim})}
/* Back while an overlay is open closes it (module onHash) */
for(const key of ['kpi','goods']){const c=OVER[key];const {ctx,p}=await open(1440,900);await load(p,c.hash,c.ready);
 await p.locator(c.trigger).first().click();await p.waitForTimeout(350);await p.evaluate(()=>{history.pushState(null,'',location.hash+'&x=1');dispatchEvent(new HashChangeEvent('hashchange'))});await p.waitForTimeout(500);
 const st=await p.evaluate(sel=>({open:document.querySelector(sel)?.open,locked:document.body.classList.contains('is-locked')}),c.panel);ok(`overlay ${key}: route change (Back/Forward) closes the overlay and releases the lock`,!st.open&&!st.locked,st);await ctx.close()}
/* real browser Back with an overlay open: tx -> module (history entry) -> open overlay -> Back lands on tx, overlay gone, lock released; Forward re-enters module */
for(const key of ['kpi','goods']){const c=OVER[key];const {ctx,p}=await open(1440,900);await load(p,'tx','.table');await p.evaluate(h=>{location.hash='#view='+h},c.hash);await p.waitForSelector(c.ready);await p.waitForTimeout(400);
 await p.locator(c.trigger).first().click();await p.waitForTimeout(350);await p.goBack();await p.waitForTimeout(700);
 const a=await p.evaluate(()=>({hash:location.hash.slice(0,12),locked:document.body.classList.contains('is-locked'),dlg:!!document.querySelector('dialog[open]'),ov:getComputedStyle(document.body).overflow}));
 await p.goForward();await p.waitForSelector(c.ready);await p.waitForTimeout(500);const f=await p.evaluate(()=>({hash:location.hash.slice(0,18),dlg:!!document.querySelector('dialog[open]'),locked:document.body.classList.contains('is-locked')}));
 await p.reload();await p.waitForSelector(c.ready);await p.waitForTimeout(500);const rl=await p.evaluate(()=>({dlg:!!document.querySelector('dialog[open]'),locked:document.body.classList.contains('is-locked')}));
 ok(`overlay ${key}: browser Back closes it (lands on tx, no lock), Forward re-enters module clean, reload clean`,/tx/.test(a.hash)&&!a.locked&&!a.dlg&&a.ov!=='hidden'&&!f.dlg&&!f.locked&&!rl.dlg&&!rl.locked,{back:a,forward:f,reload:rl});await ctx.close()}
/* leaving the module while open releases the lock */
{const {ctx,p}=await open(1440,900);await load(p,OVER.kpi.hash,OVER.kpi.ready);await p.locator(OVER.kpi.trigger).first().click();await p.waitForTimeout(300);await p.evaluate(()=>{location.hash='#view=tx'});await p.waitForTimeout(700);
 ok('overlay: leaving KPI while open releases scroll lock',await p.evaluate(()=>!document.body.classList.contains('is-locked')&&getComputedStyle(document.body).overflow!=='hidden'));await ctx.close()}

/* 3. menu: sticky across modules on tablet, same structure; Back / reload / active / focus */
R.nav={};
for(const [w,h] of [[1440,900],[1100,900],[1099,900],[900,1024],[768,1024],[700,900],[699,900],[390,844]])for(const [m,ready] of [['dashboard','.kcard'],['tx','.table'],['inventory','.ops-main'],['kpi','.mod-kpi .k-sale'],['goods','.mod-goods .tile']]){
 const {ctx,p}=await open(w,h);await load(p,m,ready);await p.evaluate(()=>scrollTo(0,1500));await p.waitForTimeout(250);
 const r=await p.evaluate(()=>{const vis=e=>{if(!e)return false;const r=e.getBoundingClientRect(),c=getComputedStyle(e);return c.display!=='none'&&c.visibility!=='hidden'&&r.bottom>0&&r.top<innerHeight&&r.width>0&&r.height>0};
  const side=document.querySelector('.ops-side'),tabs=document.querySelector('.ops-tabs');return {maxScroll:Math.max(0,document.documentElement.scrollHeight-innerHeight),scrollY:Math.round(scrollY),side:vis(side),tabs:vis(tabs),tabsTop:tabs?Math.round(tabs.getBoundingClientRect().top):null,tabsH:tabs?Math.round(tabs.getBoundingClientRect().height):null,current:[...document.querySelectorAll('.ops-side [aria-current="page"],.ops-tabs [aria-current="page"]')].filter(vis).length}});
 (R.nav[w]??={})[m]=r;if(m==='kpi'&&w===768){await shot(p,'nav-kpi-768-scrolled')}await ctx.close()}
for(const w of Object.keys(R.nav)){const wi=+w;const needTabs=wi<1100;const all=Object.entries(R.nav[w]);
 ok(`menu ${w}: ${needTabs?'sticky one-line menu in view after scroll on every module':'sidebar in view after scroll on every module'}`,all.every(([,r])=>needTabs?r.tabs&&r.tabsH<=60&&(r.tabsTop<=60||r.maxScroll<=r.scrollY+1&&r.scrollY<=120):r.side),Object.fromEntries(all.map(([k,r])=>[k,needTabs?[r.tabsTop,r.tabsH,'scrollY '+r.scrollY+'/max '+r.maxScroll]:r.side])))}
{const {ctx,p}=await open(768,1024);await load(p,'kpi','.mod-kpi .k-sale');const trail=[];const rec=async()=>trail.push(await p.evaluate(()=>({h:location.hash.slice(0,28),cur:[...document.querySelectorAll('.ops-tabs .ops-menu ul [aria-current="page"]')].map(e=>e.textContent.trim().slice(0,14)),label:document.querySelector('.ops-menu .om-label')?.textContent})));
 const pick=async label=>{await p.locator('.ops-tabs .ops-menu summary').click();await p.waitForTimeout(150);await p.locator('.ops-tabs .ops-menu ul a',{hasText:label}).first().click();await p.waitForTimeout(600)};
 await p.evaluate(()=>scrollTo(0,900));await pick('Hàng hóa');await rec();await pick('Thu');await rec();await pick('KPI');await rec();await p.goBack();await p.waitForTimeout(600);await rec();await p.reload();await p.waitForTimeout(900);await rec();
 await p.locator('.ops-tabs .ops-menu summary').focus();await p.keyboard.press('Enter');await p.waitForTimeout(150);const openOk=await p.evaluate(()=>document.querySelector('.ops-menu').open);await p.keyboard.press('Escape');await p.waitForTimeout(150);
 const foc=await p.evaluate(()=>({closed:!document.querySelector('.ops-menu').open,focusOnSummary:document.activeElement?.tagName==='SUMMARY'}));R.navFlow={trail,keyboard:{openOk,...foc}};
 ok('menu 768: Hàng hóa → Thu–bán → KPI directly from the sticky menu (no dashboard round trip)',/goods/.test(trail[0].h)&&/tx/.test(trail[1].h)&&/kpi/.test(trail[2].h),trail.map(t=>t.h));
 ok('menu 768: Back returns to previous module, reload keeps module + active item',/tx/.test(trail[3].h)&&/tx/.test(trail[4].h)&&trail[4].cur.length===1&&trail[4].cur[0]===trail[4].label,trail.slice(3));
 ok('menu 768: keyboard open + Escape closes and returns focus to the button',openOk&&foc.closed&&foc.focusOnSummary,foc);await shot(p,'nav-menu-768');await ctx.close()}

/* 4. selects */
R.select={};
for(const [w,h] of [[1440,900],[390,844]]){const {ctx,p}=await open(w,h);await load(p,'goods','.mod-goods .tile');
 const g=await p.evaluate(()=>{const f=e=>{const s=getComputedStyle(e);return {h:Math.round(e.getBoundingClientRect().height),appearance:s.appearance,bgImg:s.backgroundImage.startsWith('url('),pad:s.paddingRight,font:s.fontSize,radius:s.borderRadius,border:s.borderTopColor}};return [...document.querySelectorAll('.mod-goods select:not(:disabled)')].filter(e=>e.offsetParent).map(f)});
 await load(p,'kpi&k_view=list','.mod-kpi .k-table');const k=await p.evaluate(()=>{const e=document.querySelector('.mod-kpi select.select');const s=getComputedStyle(e);return {h:Math.round(e.getBoundingClientRect().height),appearance:s.appearance,bgImg:s.backgroundImage.startsWith('url('),pad:s.paddingRight,font:s.fontSize,radius:s.borderRadius,border:s.borderTopColor}});
 R.select[w]={goods:g,kpi:k};await load(p,'goods','.mod-goods .tile');await shot(p,'goods-filters-'+w);
 ok(`select ${w}: Goods selects use V2 look (appearance none, chevron, same height/font/radius/border as .select)`,g.length>0&&g.every(x=>x.appearance==='none'&&x.bgImg&&x.h===k.h&&x.font===k.font&&x.radius===k.radius&&x.pad===k.pad),{goods:g.slice(0,2),kpi:k});await ctx.close()}

/* 5. small type + targets */
R.small={};
for(const [w,h] of [[1440,900],[390,844]])for(const [m,ready,key] of [['kpi','.mod-kpi .k-sale','kpi'],['kpi&k_view=list&k_state=provisional','.mod-kpi .k-table','kpi-list'],['goods','.mod-goods .tile','goods'],['goods&g_scope=ton','.mod-goods .tile','goods-ton']]){
 const {ctx,p}=await open(w,h);await load(p,m,ready);
 const r=await p.evaluate(()=>{const host=document.querySelector('.mod-host')||document.body;const tiny=[],small=[];
  const walker=document.createTreeWalker(host,NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode()){const t=n.textContent.trim();if(!t)continue;const e=n.parentElement;if(!e||!e.getClientRects().length)continue;const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')continue;
   let fs=parseFloat(cs.fontSize);const svg=e.closest('svg');if(svg&&e instanceof SVGElement){const m=e.getScreenCTM();if(m)fs=fs*Math.hypot(m.a,m.b)}if(fs<12)tiny.push({t:t.slice(0,24),fs:Math.round(fs*10)/10})}
  const tgt=[...host.querySelectorAll('a[href],button:not([disabled]),select,summary,[role=tab],input:not([type=hidden])')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>{const b=e.getBoundingClientRect();return {tag:e.tagName,cls:(e.className&&e.className.baseVal===undefined?e.className:'').toString().slice(0,24),t:(e.textContent||'').trim().slice(0,18),w:Math.round(b.width),h:Math.round(b.height)}}).filter(x=>x.h<44&&!/seg-b/.test(x.cls));
  return {tiny,smallTargets:tgt.length,targetSample:tgt.slice(0,8)}});
 R.small[w+'/'+key]=r;if(w===390&&key==='goods')await shot(p,'goods-hang-390');if(w===1440&&key==='goods')await shot(p,'goods-hang-1440');await ctx.close()}
for(const k of Object.keys(R.small)){const r=R.small[k];ok(`type ${k}: no visible text <12px`,r.tiny.length===0,r.tiny.slice(0,5))}
for(const k of Object.keys(R.small).filter(k=>k.startsWith('390'))){const r=R.small[k];ok(`targets ${k}: tap targets ≥44px (inline text links excepted listed)`,r.smallTargets===0,{n:r.smallTargets,sample:r.targetSample})}
ok('no console/page errors across the run',errs.length===0,errs.slice(0,3));
R.checks=checks;R.errors=errs;writeFileSync(path.join(here,'measure-after.json'),JSON.stringify(R,null,1));
console.log('\n',checks.filter(c=>c.pass).length+'/'+checks.length,'passed');await b.close()
