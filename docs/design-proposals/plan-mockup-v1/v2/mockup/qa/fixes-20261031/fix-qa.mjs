/* Measurements + before/after screenshots for the five approved fixes (critique-20261031). Read-only against data: no business mutation.
   Usage (repo root, server on 127.0.0.1:8788):  .node/bin/node docs/design-proposals/plan-mockup-v1/v2/mockup/qa/fixes-20261031/fix-qa.mjs before|after
   Writes measure-<phase>.json and shots-<phase>/*.png here. Screenshots blur every .sens (raw-document fields). */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const phase=process.argv[2]||'after';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.join(here,'../../../../../../..');
const require=createRequire(path.join(repo,'frontend/package.json'));
const {chromium}=require('@playwright/test');
const D='http://127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html#view=';
const SHOTS=path.join(here,'shots-'+phase);mkdirSync(SHOTS,{recursive:true});
const R={phase,at:new Date().toISOString()},errors=[];
const browser=await chromium.launch();
async function open(w,h,o={}){const ctx=await browser.newContext({viewport:{width:w,height:h},...(w<500?{isMobile:true,hasTouch:true,deviceScaleFactor:2}:{}),...o});const p=await ctx.newPage();p.on('pageerror',e=>errors.push(w+': pageerror '+e.message));p.on('console',m=>{if(m.type()==='error')errors.push(w+': console.error '+m.text())});return {ctx,p}}
const MASK='.sens{filter:blur(7px)!important}';
const shot=async(p,name,full=false)=>{await p.addStyleTag({content:MASK});await p.screenshot({path:path.join(SHOTS,name+'.png'),fullPage:full})};
const load=async(p,hash,ready)=>{await p.goto(D+hash);await p.waitForSelector(ready,{timeout:8000});await p.waitForTimeout(450)};
const VPS=[[1440,900],[768,1024],[390,844]];

/* ---- 1. KPI first screen ---- */
R.fold={};
for(const [w,h] of VPS){const {ctx,p}=await open(w,h);await load(p,'kpi','.mod-kpi .k-sale');
 R.fold[w]=await p.evaluate(()=>{const q=s=>document.querySelector(s),r=e=>e&&e.getBoundingClientRect();const ctx=q('.k-ctx'),sale=q('.k-sale'),txt=q('.mod-kpi').innerText;
  const ctxTxt=ctx.innerText;return {vh:innerHeight,ctxHeight:Math.round(r(ctx).height),ctxTop:Math.round(r(ctx).top),firstSaleTop:Math.round(r(sale).top),firstSaleHeight:Math.round(r(sale).height),
   firstSaleVisibleInFirstScreen:r(sale).top<innerHeight-60,missingPhraseCount:(txt.match(/Chưa đủ dữ liệu/g)||[]).length,
   ctxShows:{period:/Mẫu \d\d\/\d\d–\d\d\/\d\d/.test(ctxTxt),asOf:/As-of/.test(ctxTxt),partial:/Mẫu một phần/.test(ctxTxt),notReal:/Không phải thu nhập thực/.test(ctxTxt),policy:/Mô phỏng chính sách/.test(ctxTxt),coverage:/đơn đọc chi tiết/.test(ctxTxt)},
   salaryUnconfigured:/Chưa cấu hình/.test(txt),zeroMoneyAsMissing:/0 ₫/.test(q('.k-sale-grid').innerText)}});
 await shot(p,'kpi-income-'+w);await shot(p,'kpi-income-full-'+w,true);await ctx.close()}

/* ---- 2. navigation: sticky after scroll, same structure across modules ---- */
R.nav={};
for(const [w,h] of [[1440,900],[1100,900],[1099,900],[900,1024],[768,1024],[700,900],[699,900],[390,844]]){
 R.nav[w]={};
 for(const [m,ready] of [['dashboard','.kcard'],['tx','.table'],['inventory','.ops-main'],['kpi','.mod-kpi .k-sale'],['goods','.mod-goods .tile']]){
  const {ctx,p}=await open(w,h);await load(p,m,ready);await p.evaluate(()=>scrollTo(0,1200));await p.waitForTimeout(250);
  R.nav[w][m]=await p.evaluate(()=>{const vis=e=>{if(!e)return false;const r=e.getBoundingClientRect(),c=getComputedStyle(e);return c.display!=='none'&&c.visibility!=='hidden'&&r.bottom>0&&r.top<innerHeight&&r.width>0&&r.height>0};
   const tabs=document.querySelector('.ops-tabs'),side=document.querySelector('.ops-side'),menu=document.querySelector('.ops-tabs .ops-menu'),main=document.querySelector('.ops-tabs .tabs-main');
   return {scrollY:Math.round(scrollY),sidebarInView:vis(side),tabsBarInView:vis(tabs),tabsBarHeight:tabs&&Math.round(tabs.getBoundingClientRect().height),tabsBarTop:tabs&&Math.round(tabs.getBoundingClientRect().top),oneLineMenuShown:vis(menu),wrappedTabsShown:vis(main),position:tabs&&getComputedStyle(tabs).position,
    currentItems:[...document.querySelectorAll('.ops-side [aria-current],.ops-tabs [aria-current]')].filter(vis).length}});
  if(m==='kpi'&&(w===768||w===1440||w===390)){await p.evaluate(()=>scrollTo(0,0));await shot(p,'nav-kpi-top-'+w);await p.evaluate(()=>scrollTo(0,1200));await p.waitForTimeout(200);await shot(p,'nav-kpi-scrolled-'+w)}
  await ctx.close()}}
/* direct module navigation from the tablet bar (no round trip through the dashboard) + reload + Back + active state */
{R.navFlow={};const {ctx,p}=await open(768,1024);await load(p,'kpi','.mod-kpi .k-sale');
 const trail=[];const rec=async()=>{trail.push(await p.evaluate(()=>({hash:location.hash.slice(0,40),current:[...document.querySelectorAll('.ops-tabs [aria-current="page"],.ops-side [aria-current="page"]')].filter(e=>e.getBoundingClientRect().width>0).map(e=>e.textContent.replace(/\s+/g,' ').trim().slice(0,30))})))};
 const pick=async label=>{const menu=p.locator('.ops-tabs .ops-menu');const wrapped=p.locator('.ops-tabs .tabs-main a',{hasText:label}).first();
  if(await menu.isVisible()){await menu.locator('summary').click();await menu.locator('ul a',{hasText:label}).first().click()}else await wrapped.click();await p.waitForTimeout(500)};
 await p.evaluate(()=>scrollTo(0,900));await pick('Hàng hóa');await rec();await pick('Thu');await rec();await pick('KPI');await rec();
 await p.goBack();await p.waitForTimeout(500);await rec();await p.reload();await p.waitForTimeout(700);await rec();
 await p.keyboard.press('Tab');R.navFlow.trail=trail;R.navFlow.reloadActive=trail[trail.length-1];
 R.navFlow.backDashboardWorkflowAdded=false;await ctx.close()}

/* ---- 3. overlays ---- */
const OVER={kpi:{hash:'kpi&k_view=list&k_state=provisional',ready:'.mod-kpi .k-table',trigger:'.k-table [data-open]',panel:'#kdetail'},
 goods:{hash:'goods',ready:'.mod-goods .tile',trigger:'.mod-goods #results [data-h]',panel:'#sheet'},
 v2:{hash:'tx',ready:'.table tbody tr.click',trigger:'[data-record]',panel:'.dialog'}};
async function overlay(key,w,h,o={}){const c=OVER[key];const {ctx,p}=await open(w,h,o);await load(p,c.hash,c.ready);
 const trig=p.locator(c.trigger).first();await trig.scrollIntoViewIfNeeded();await p.waitForTimeout(150);
 await p.evaluate(()=>{window.__s=[];});
 /* frame sampler: opacity/transform/visibility of panel + backdrop opacity proxy each frame */
 await p.evaluate(sel=>{const t0=performance.now();const el=()=>document.querySelector(sel);(function tick(){const e=el();if(e){const c=getComputedStyle(e),b=getComputedStyle(e,'::backdrop');window.__s.push({t:Math.round(performance.now()-t0),open:e.open===true||e.classList.contains('is-open'),op:+(+c.opacity).toFixed(2),tf:c.transform==='none'?'none':c.transform.slice(0,40),bd:b.backgroundColor})}window.__raf=requestAnimationFrame(tick)})()},c.panel);
 const tClick=await p.evaluate(()=>performance.now());await trig.focus();await p.keyboard.press('Enter');await p.waitForTimeout(600);
 const geo=await p.evaluate(({sel,key})=>{const e=document.querySelector(sel),b=e.getBoundingClientRect(),cs=getComputedStyle(e),bd=getComputedStyle(e,'::backdrop'),scrimEl=document.querySelector('.scrim');
  const anims=e.getAnimations().map(a=>({n:a.animationName||a.transitionProperty,d:Math.round(a.effect.getTiming().duration),e:a.effect.getTiming().easing}));
  return {w:Math.round(b.width),h:Math.round(b.height),left:Math.round(b.left),top:Math.round(b.top),radius:cs.borderRadius,pad:cs.paddingTop,
   scrimColor:key==='v2'?getComputedStyle(scrimEl).backgroundColor:bd.backgroundColor,scrimBlur:key==='v2'?getComputedStyle(scrimEl).backdropFilter:bd.backdropFilter,
   bodyOverflow:getComputedStyle(document.body).overflow,bodyLocked:document.body.classList.contains('is-locked'),runningAnims:anims}},c.panel);
 await shot(p,'overlay-'+key+'-open-'+w);
 const y0=await p.evaluate(()=>scrollY);await p.mouse.move(Math.min(60,w/2),Math.round(h*.35));await p.mouse.wheel(0,700);await p.waitForTimeout(300);const y1=await p.evaluate(()=>scrollY);
 await p.mouse.move(w/2,h/2);await p.mouse.wheel(0,700);await p.waitForTimeout(250);const y2=await p.evaluate(()=>scrollY);
 const tEsc=await p.evaluate(()=>performance.now());await p.keyboard.press('Escape');await p.waitForTimeout(500);
 const focusBack=await p.evaluate(()=>({tag:document.activeElement.tagName,isOpener:document.activeElement.matches('[data-open],[data-h],[data-record]')}));
 const lockedAfter=await p.evaluate(()=>document.body.classList.contains('is-locked')||getComputedStyle(document.body).overflow==='hidden');
 const y3=await p.evaluate(()=>scrollY);await p.mouse.wheel(0,300);await p.waitForTimeout(250);const y4=await p.evaluate(()=>scrollY);
 const s=await p.evaluate(()=>{cancelAnimationFrame(window.__raf);return window.__s});
 /* entry: first open frame -> last frame whose opacity/transform still changing; exit: Escape -> first closed frame */
 const entryStart=s.find(x=>x.open),entryEndIdx=(()=>{let last=-1;for(let i=0;i<s.length;i++){if(s[i].open&&(s[i].op<1||s[i].tf!=='none'&&!/matrix\(1, 0, 0, 1, 0, 0\)/.test(s[i].tf)))last=i;if(s[i].t>entryStart.t+700)break}return last})();
 const entryMs=entryEndIdx<0?0:s[entryEndIdx].t-entryStart.t;
 const tEscRel=Math.round(tEsc-tClick)+(entryStart?entryStart.t:0);
 const closedAfter=s.find(x=>x.t>=tEscRel&&!x.open);
 const exitMs=closedAfter?closedAfter.t-tEscRel:null;
 const out={w,h,geo,wheelOnBackdrop:{before:y0,after:y1,scrolled:y1!==y0},wheelOnPanel:{after:y2},afterClose:{bodyStillLocked:lockedAfter,scrollsAgain:y4!==y3},focusReturnedToOpener:focusBack,entryMsObserved:entryMs,exitMsObserved:exitMs,frames:s.length};
 await ctx.close();return out}
R.overlay={};
for(const k of ['kpi','goods','v2'])for(const [w,h] of [[1440,900],[390,844]]){R.overlay[k+'@'+w]=await overlay(k,w,h).catch(e=>'ERR '+e.message.split('\n')[0]);R.overlay[k+'@'+w+'@reduced']=await overlay(k,w,h,{reducedMotion:'reduce'}).catch(e=>'ERR '+e.message.split('\n')[0])}
/* backdrop click + close button also return focus */
R.overlayAlt={};
for(const k of ['kpi','goods']){const c=OVER[k];const {ctx,p}=await open(1440,900);await load(p,c.hash,c.ready);const t=p.locator(c.trigger).first();await t.scrollIntoViewIfNeeded();await t.focus();await p.keyboard.press('Enter');await p.waitForTimeout(500);
 await p.mouse.click(40,450);await p.waitForTimeout(500);R.overlayAlt[k+':backdropClick']=await p.evaluate(sel=>({closed:!document.querySelector(sel).open,opener:document.activeElement.matches('[data-open],[data-h],[data-record]'),locked:document.body.classList.contains('is-locked')}),c.panel);
 await t.focus();await p.keyboard.press('Enter');await p.waitForTimeout(500);await p.locator(k==='kpi'?'#kclose':'#sheet-close').click();await p.waitForTimeout(500);R.overlayAlt[k+':closeButton']=await p.evaluate(sel=>({closed:!document.querySelector(sel).open,opener:document.activeElement.matches('[data-open],[data-h],[data-record]'),locked:document.body.classList.contains('is-locked')}),c.panel);
 /* open, navigate away with Back while open -> lock must not leak */
 await t.focus();await p.keyboard.press('Enter');await p.waitForTimeout(400);await p.evaluate(()=>{location.hash='#view=dashboard'});await p.waitForTimeout(700);R.overlayAlt[k+':navigateWhileOpen']=await p.evaluate(()=>({locked:document.body.classList.contains('is-locked'),overflow:getComputedStyle(document.body).overflow}));
 await ctx.close()}

/* ---- 4. selects ---- */
R.selects={};
for(const [w,h] of [[1440,900],[390,844]]){const {ctx,p}=await open(w,h);await load(p,'tx','.table');
 const v2=await p.evaluate(()=>{const e=document.querySelector('select.select, .select');if(!e)return null;const c=getComputedStyle(e);return {h:Math.round(e.getBoundingClientRect().height),radius:c.borderRadius,border:c.borderTopWidth+' '+c.borderTopColor,pad:c.paddingLeft+'/'+c.paddingRight,fs:c.fontSize,appearance:c.appearance,chevron:/svg/.test(c.backgroundImage),bgPos:c.backgroundPosition,bg:c.backgroundColor}});
 await load(p,'goods','.mod-goods .fbar');
 const goods=await p.evaluate(()=>[...document.querySelectorAll('.mod-goods .fbar select, .mod-goods .card-tools select')].map(e=>{const c=getComputedStyle(e);return {id:e.id,h:Math.round(e.getBoundingClientRect().height),radius:c.borderRadius,border:c.borderTopWidth+' '+c.borderTopColor,pad:c.paddingLeft+'/'+c.paddingRight,fs:c.fontSize,appearance:c.appearance,chevron:/svg/.test(c.backgroundImage),bgPos:c.backgroundPosition,bg:c.backgroundColor}}));
 await load(p,'kpi','.mod-kpi #kperiod');const kpi=await p.evaluate(()=>{const e=document.querySelector('#kperiod'),c=getComputedStyle(e);return {h:Math.round(e.getBoundingClientRect().height),appearance:c.appearance,chevron:/svg/.test(c.backgroundImage)}});
 R.selects[w]={v2,goods,kpi};await load(p,'goods','.mod-goods .fbar');await shot(p,'goods-filters-'+w);await ctx.close()}
/* goods select still works + focus ring */
{const {ctx,p}=await open(1440,900);await load(p,'goods','.mod-goods .fbar');const before=await p.locator('.mod-goods .tile').first().innerText();await p.selectOption('#f-src','Ký gửi');await p.waitForTimeout(400);
 const after=await p.locator('.mod-goods .tile').first().innerText();await p.locator('#f-cat').focus();R.selects.behaviour={changedResults:before!==after,hash:await p.evaluate(()=>location.hash),focusRing:await p.evaluate(()=>{const c=getComputedStyle(document.querySelector('#f-cat'));return c.boxShadow.slice(0,50)+' | '+c.borderTopColor})};await ctx.close()}

/* ---- 5. small text + hit targets ---- */
const scan=()=>{const root=document.querySelector('.ops-main');const out={smallText:[],smallTargets:[]};
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);for(let n=w.nextNode();n;n=w.nextNode()){const t=n.textContent.trim();if(!t)continue;const e=n.parentElement;if(!e.checkVisibility?.({checkVisibilityCSS:true})||e.closest('.vh,[hidden]'))continue;
  let fs=parseFloat(getComputedStyle(e).fontSize);const svg=e.closest('svg');if(svg){const vb=svg.viewBox.baseVal;if(vb&&vb.width){const f=parseFloat(e.getAttribute('font-size')||fs);fs=f*svg.getBoundingClientRect().width/vb.width}}
  if(fs<12)out.smallText.push({t:t.slice(0,24),fs:+fs.toFixed(1),cls:(svg?'svg ':'')+String(e.className.baseVal??e.className).slice(0,22)})}
 for(const e of root.querySelectorAll('a[href],button,select,input:not([type=hidden]),summary,[role=tab],[tabindex="0"]')){if(!e.checkVisibility?.({checkVisibilityCSS:true})||e.closest('.vh,[hidden]')||e.matches(':disabled'))continue;const r=e.getBoundingClientRect();if(r.width===0||r.height===0)continue;
  if(e.tagName==='A'&&getComputedStyle(e).display==='inline'&&e.closest('p,li,dd,td,small')&&!e.closest('.comp'))continue; /* inline text link in a sentence */
  if(e.matches('input[type=checkbox],input[type=radio]'))continue;
  if(r.height<44||(r.width<44&&r.width<e.scrollWidth+1&&!e.textContent.trim()))out.smallTargets.push({tag:e.tagName.toLowerCase(),cls:String(e.className).slice(0,22),t:(e.textContent||e.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,22),w:Math.round(r.width),h:Math.round(r.height)})}
 return out};
R.small={};
const SCANS=[['kpi-income','kpi','.mod-kpi .k-sale'],['kpi-sale','kpi&k_view=sale&k_sale=unknown','.mod-kpi .k-comp'],['kpi-todo','kpi&k_view=todo','.mod-kpi .k-todo'],['kpi-list','kpi&k_view=list','.mod-kpi .k-table'],['kpi-rules','kpi&k_view=rules','.mod-kpi .k-rules'],
 ['goods-hang','goods','.mod-goods .tile'],['goods-tuoi','goods&g_tab=tuoi','.mod-goods table.an'],['goods-chinhsach','goods&g_tab=chinhsach','.mod-goods .pol-grid, .mod-goods .calc-grid'],['goods-sale','goods&g_tab=sale','.mod-goods .tile']];
for(const [w,h] of [[390,844],[1440,900]]){R.small[w]={};for(const [n,hash,ready] of SCANS){const {ctx,p}=await open(w,h);try{await load(p,hash,ready);R.small[w][n]=await p.evaluate(scan)}catch(e){R.small[w][n]='ERR '+e.message.split('\n')[0]}
  if(n==='goods-hang'||n==='kpi-list')await shot(p,n+'-'+w);await ctx.close()}}

/* ---- 6. overflow + console ---- */
R.overflow={};
for(const [w,h] of VPS){R.overflow[w]={};for(const [n,hash,ready] of [['dashboard','dashboard','.kcard'],['tx','tx','.table'],['kpi','kpi','.mod-kpi .k-sale'],['kpi-list','kpi&k_view=list','.mod-kpi .k-table'],['goods','goods','.mod-goods .tile'],['goods-tuoi','goods&g_tab=tuoi','.mod-goods table.an']]){const {ctx,p}=await open(w,h);await load(p,hash,ready);R.overflow[w][n]=await p.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,over:document.documentElement.scrollWidth>document.documentElement.clientWidth}));await ctx.close()}}
R.consoleErrors=errors;
await browser.close();
writeFileSync(path.join(here,'measure-'+phase+'.json'),JSON.stringify(R,null,1));
console.log('wrote measure-'+phase+'.json; console errors:',errors.length);
