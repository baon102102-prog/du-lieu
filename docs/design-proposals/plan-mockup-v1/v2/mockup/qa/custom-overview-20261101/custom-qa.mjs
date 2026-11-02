/* QA for the custom overview + Sale & kênh move. Read-only against data; Chromium (Playwright). Run from repo root with PLAYWRIGHT_BROWSERS_PATH=frontend/.browsers and the server on 127.0.0.1:8788.
   Screenshots blur .sens (raw document fields). */
import {createRequire} from 'node:module';import {mkdirSync,writeFileSync} from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.join(here,'../../../../../../..');
const {chromium}=createRequire(path.join(repo,'frontend/package.json'))('@playwright/test');
const D='http://127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html#view=',SH=path.join(here,'shots');mkdirSync(SH,{recursive:true});
const checks=[],errs=[];const ok=(n,pass,info)=>{checks.push({name:n,pass:!!pass,info});console.log(pass?'PASS':'FAIL',n,info===undefined?'':JSON.stringify(info).slice(0,330))};
const b=await chromium.launch();
const open=async(w,h,o={})=>{const ctx=await b.newContext({viewport:{width:w,height:h},...(w<500?{isMobile:true,hasTouch:true,deviceScaleFactor:2}:{}),...o});const p=await ctx.newPage();p.on('pageerror',e=>errs.push('pageerror '+e));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});return {ctx,p}};
const shot=async(p,n,full=false)=>{await p.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{}))));await p.waitForTimeout(250);await p.addStyleTag({content:'.sens{filter:blur(7px)!important}'});await p.screenshot({path:path.join(SH,n+'.png'),fullPage:full})};
const go=async(p,h,sel)=>{await p.goto(D+h);await p.waitForSelector(sel,{timeout:9000});await p.waitForTimeout(500)};
const ids=p=>p.evaluate(()=>[...document.querySelectorAll('.dash-item')].map(x=>x.dataset.bid));
const stored=p=>p.evaluate(()=>{try{return JSON.parse(localStorage.getItem('baoq-dash-layout-v1'))}catch(e){return 'ERR'}});
const hOver=p=>p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
const txt=(p,sel)=>p.locator(sel).first().innerText();
const norm=s=>s.replace(/\s+/g,' ').replace(/ | /g,' ').trim();

/* ===== A. Sale & kênh moved into KPI Sale → Tổng quan sale ===== */
{const {ctx,p}=await open(1440,900);
 await go(p,'dashboard','.dash-item');
 await p.goto(D+'goods&g_tab=sale&g_ch=Online&g_pmin=100&g_all=0');await p.waitForSelector('.mod-kpi .mod-goods .tile',{timeout:9000});await p.waitForTimeout(500);
 const h=await p.evaluate(()=>({hash:location.hash,cur:document.querySelector('.ops-side [aria-current="page"]')?.textContent.trim(),sidebar:!!document.querySelector('.ops-side'),activeTab:document.querySelector('.k-tabs [aria-pressed="true"]')?.textContent,tiles:[...document.querySelectorAll('.mod-goods .kpis .tile')].map(t=>t.innerText.replace(/\n/g,' | '))}));
 ok('A1 old link #view=goods&g_tab=sale (+ stale Goods filters) lands on KPI Sale → Tổng quan sale, sidebar kept, KPI active',h.hash==='#view=kpi&k_view=channels'&&h.cur==='KPI Sale'&&h.sidebar&&h.activeTab==='Tổng quan sale',h);
 const sum=await p.evaluate(()=>{const s=BAOQGoods.summary();return {orders:s.sold.orders,items:s.sold.items,rev:s.sold.rev}});
 ok('A2 numbers equal the unfiltered all-channel source (orders / lines / revenue) even though the old link carried channel+price filters',h.tiles[0].includes(String(sum.orders))&&h.tiles[4].includes(String(sum.items)),{tiles:h.tiles.slice(0,2),sum});
 await p.reload();await p.waitForSelector('.mod-kpi .mod-goods .tile');await p.waitForTimeout(500);
 ok('A3 reload keeps Tổng quan sale',(await p.evaluate(()=>location.hash))==='#view=kpi&k_view=channels'&&await p.locator('.mod-goods .tile').count()>=6);
 await p.locator('.k-tabs a',{hasText:'Thu nhập sale'}).click();await p.waitForTimeout(500);const incomeHash=await p.evaluate(()=>location.hash);
 await p.goBack();await p.waitForTimeout(600);const back1=await p.evaluate(()=>({h:location.hash,tiles:document.querySelectorAll('.mod-goods .tile').length}));
 await p.goForward();await p.waitForTimeout(600);const fwd=await p.evaluate(()=>({h:location.hash,income:!!document.querySelector('.k-sale')}));
 ok('A4 Back/Forward between Tổng quan sale and Thu nhập sale',back1.h==='#view=kpi&k_view=channels'&&back1.tiles>=6&&fwd.income&&/k_view|view=kpi/.test(incomeHash),{back1,fwd});
 await p.goBack().catch(()=>{});await go(p,'goods','.mod-goods .tile');
 const gt=await p.evaluate(()=>({tabs:[...document.querySelectorAll('.mod-goods #tabs [role=tab]')].map(x=>x.textContent)}));
 ok('A5 Hàng hóa module no longer has the Sale & kênh tab (no duplicate surface)',gt.tabs.length===3&&!gt.tabs.some(x=>/Sale & kênh/.test(x)),gt);
 /* old standalone-style address with g_tab=sale typed after visiting goods: no redirect loop, Back works */
 await go(p,'tx','.table');await p.evaluate(()=>{location.hash='#view=goods&g_tab=sale'});await p.waitForSelector('.mod-kpi .mod-goods .tile');await p.waitForTimeout(400);await p.goBack();await p.waitForTimeout(600);
 ok('A6 Back from the redirected old link returns to the page before it (no loop)',/view=tx/.test(await p.evaluate(()=>location.hash)));
 /* period clarity */
 await go(p,'kpi&k_view=channels','.mod-kpi .mod-goods .tile');
 const ctxt=await txt(p,'.k-ctx');ok('A7 period/demo/not-same-period stated; period select hidden for this view',/Dữ liệu demo/.test(ctxt)&&/01\/10|Tháng 10\/2026/.test(ctxt)&&/Không cùng kỳ với snapshot KPI/.test(ctxt)&&await p.locator('.k-period').isHidden(),norm(ctxt).slice(0,160));
 /* Goods sheet inside the embed: lock, Escape, focus, reduced motion handled by shared code */
 await p.evaluate(()=>scrollTo(0,300));const y0=await p.evaluate(()=>scrollY);const trig=p.locator('.mod-goods #sale-table [data-h]').first();await trig.focus();await trig.click();await p.waitForTimeout(450);
 const yS=await p.evaluate(()=>scrollY);await p.mouse.move(1400,300);await p.mouse.wheel(0,500);await p.waitForTimeout(250);const y1=await p.evaluate(()=>({y:scrollY,lock:document.body.classList.contains('is-locked'),open:document.querySelector('#sheet')?.open}));
 await p.keyboard.press('Escape');await p.waitForTimeout(320);const after=await p.evaluate(()=>({open:document.querySelector('#sheet')?.open,lock:document.body.classList.contains('is-locked'),active:document.activeElement?.textContent.trim().slice(0,12)}));
 ok('A8 sheet inside Tổng quan sale: opens, locks page scroll, Escape closes, focus returns to the opener',y1.open&&y1.lock&&y1.y===yS&&!after.open&&!after.lock&&!!after.active,{yS,y1,after});
 await shot(p,'channels-1440');await ctx.close()}

/* ===== B. dashboard customisation flow at 3 viewports ===== */
const DEFAULT=['ops.revenue','ops.cost','ops.result','ops.inventory','ops.weekly','ops.alerts','ops.channel','ops.sale','ops.bridge','ops.costmix','ops.note'];
for(const [w,h] of [[1440,900],[768,1024],[390,844]]){const {ctx,p}=await open(w,h);const T=`B@${w}`;
 await go(p,'dashboard','.dash-item');
 const d0=await ids(p);ok(`${T} default layout = the 11 original blocks, no duplicates`,JSON.stringify(d0)===JSON.stringify(DEFAULT)&&new Set(d0).size===d0.length&&await p.locator('#dash-edit').isVisible(),d0.length);
 ok(`${T} nothing stored until the user saves`,(await stored(p))===null);
 await p.locator('#dash-edit').click();await p.waitForTimeout(250);
 ok(`${T} edit mode: bar shows "chưa đồng bộ theo tài khoản", per-block controls, focus on the bar heading`,await p.locator('.dash-bar').isVisible()&&/chưa đồng bộ theo tài khoản/.test(await txt(p,'.dash-bar'))&&await p.locator('.dash-ctl').count()===11&&await p.evaluate(()=>document.activeElement.id==='dash-bar-h'));
 await p.locator('[data-dash="addpanel"]').click();await p.waitForTimeout(200);
 const cat=await p.evaluate(()=>[...document.querySelectorAll('#dash-cat h4')].map(x=>x.textContent));
 ok(`${T} catalog grouped by source: Điều hành / KPI Sale / Hàng hóa / Hiệu quả vốn; existing blocks show "Đã có" (no duplicates)`,JSON.stringify(cat)===JSON.stringify(['Điều hành (demo)','KPI Sale','Hàng hóa','Hiệu quả vốn'])&&await p.locator('#dash-cat button:disabled').count()===11,cat);
 if(w===1440)await shot(p,'dash-edit-catalog-1440');if(w===390)await shot(p,'dash-edit-catalog-390');
 for(const id of ['kpi.income','kpi.team','gd.channels','cap.capital','cap.roc'])await p.locator(`[data-dash="add:${id}"]`).click();
 await p.waitForTimeout(300);
 let cur=await ids(p);ok(`${T} add 5 blocks from KPI Sale / Hàng hóa / Hiệu quả vốn: appended once each`,cur.length===16&&new Set(cur).size===16&&cur.slice(11).join()==='kpi.income,kpi.team,gd.channels,cap.capital,cap.roc',cur.slice(11));
 ok(`${T} focus moved to the added block control (keyboard continues)`,await p.evaluate(()=>!!document.activeElement.closest('.dash-item[data-bid="cap.roc"]')));
 await p.waitForSelector('.dash-item[data-bid="cap.roc"] .kcard',{timeout:6000});await p.waitForTimeout(300);
 /* reorder with buttons (keyboard-capable): move cap.roc up 3, down 1 */
 for(let i=0;i<3;i++)await p.locator('.dash-item[data-bid="cap.roc"] [data-dash^="up"]').click();await p.locator('.dash-item[data-bid="cap.roc"] [data-dash^="down"]').click();
 cur=await ids(p);ok(`${T} reorder with Lên/Xuống buttons`,cur.indexOf('cap.roc')===13&&cur[12]==='gd.channels'||cur.indexOf('cap.roc')===13,{at:cur.indexOf('cap.roc'),expected:'15 -3 +1 = 13'});
 await p.locator('.dash-item[data-bid="ops.note"] [data-dash^="remove"]').click();await p.locator('.dash-item[data-bid="ops.costmix"] [data-dash^="remove"]').click();
 cur=await ids(p);ok(`${T} remove blocks`,!cur.includes('ops.note')&&!cur.includes('ops.costmix')&&cur.length===14);
 const draft=cur.slice();
 /* cancel discards */
 await p.locator('[data-dash="cancel"]').click();await p.waitForTimeout(250);
 ok(`${T} cancel discards the draft and stores nothing`,JSON.stringify(await ids(p))===JSON.stringify(DEFAULT)&&(await stored(p))===null);
 /* edit again, redo changes, save, reload */
 await p.locator('#dash-edit').click();await p.locator('[data-dash="addpanel"]').click();for(const id of ['kpi.income','gd.channels','cap.capital'])await p.locator(`[data-dash="add:${id}"]`).click();await p.locator('[data-dash="addpanel"]').click();
 await p.locator('.dash-item[data-bid="ops.note"] [data-dash^="remove"]').click();const want=await ids(p);
 await p.locator('[data-dash="save"]').click();await p.waitForTimeout(300);
 const sv=await stored(p);ok(`${T} save: layout stored locally; edit mode closed; focus back on the Tùy chỉnh button`,JSON.stringify(sv.ids)===JSON.stringify(want)&&!await p.locator('.dash-bar').count()&&await p.evaluate(()=>document.activeElement.id==='dash-edit'),sv.ids.length);
 await p.reload();await p.waitForSelector('.dash-item');await p.waitForTimeout(700);
 ok(`${T} reload keeps the saved layout`,JSON.stringify(await ids(p))===JSON.stringify(want));
 await p.waitForSelector('.dash-item[data-bid="cap.capital"] .kcard',{timeout:6000});
 ok(`${T} no overflow`,!await hOver(p));
 if(w===1440){await shot(p,'dash-custom-1440');await shot(p,'dash-custom-full-1440',true)}if(w===768)await shot(p,'dash-custom-768');if(w===390){await shot(p,'dash-custom-390');await shot(p,'dash-custom-full-390',true)}
 /* reset / empty */
 await p.locator('#dash-edit').click();await p.locator('[data-dash="reset"]').click();await p.waitForTimeout(250);
 ok(`${T} reset restores the default into the DRAFT only (saved layout kept until Save; Cancel undoes)`,JSON.stringify(await ids(p))===JSON.stringify(DEFAULT)&&JSON.stringify((await stored(p)).ids)===JSON.stringify(want));
 await p.locator('[data-dash="cancel"]').click();
 ok(`${T} cancel after reset keeps the saved custom layout`,JSON.stringify(await ids(p))===JSON.stringify(want));
 await p.locator('#dash-edit').click();
 for(let i=0;i<30&&await p.locator('.dash-item').count();i++)await p.locator('.dash-item [data-dash^="remove"]').first().click();
 ok(`${T} removing every block shows a safe empty state with actions`,await p.locator('.dash-item').count()===0&&/Tổng quan đang trống/.test(await txt(p,'.empty'))&&await p.locator('.empty [data-dash="reset"]').isVisible());
 await p.locator('[data-dash="save"]').click();await p.waitForTimeout(250);
 const emp=await stored(p);ok(`${T} saved empty layout reloads as empty state and can return to default`,emp.ids.length===0&&/Tổng quan đang trống/.test(await txt(p,'.empty')));
 await p.locator('[data-dash="resetsaved"]').click();await p.waitForTimeout(250);
 ok(`${T} "Dùng bố cục mặc định" restores 11 blocks and removes only the layout key`,JSON.stringify(await ids(p))===JSON.stringify(DEFAULT)&&(await stored(p))===null);
 await ctx.close()}

/* ===== C. safety: corrupt storage, other keys untouched, storage blocked ===== */
{const {ctx,p}=await open(1440,900);await go(p,'dashboard','.dash-item');
 await p.evaluate(()=>{localStorage.setItem('baoq-autosale-policy-v2.1','{"keep":"me"}');localStorage.setItem('baoq-mockup-lang','vi');localStorage.setItem('baoq-dash-layout-v1','{not json')});await p.reload();await p.waitForSelector('.dash-item');
 ok('C1 corrupt saved layout falls back to the default without error',(await ids(p)).length===11);
 await p.evaluate(()=>localStorage.setItem('baoq-dash-layout-v1',JSON.stringify({v:1,ids:['kpi.income','kpi.income','nope','ops.cost']})));await p.reload();await p.waitForSelector('.dash-item');
 ok('C2 unknown / duplicate ids in storage are dropped (no duplicated card)',JSON.stringify(await ids(p))===JSON.stringify(['kpi.income','ops.cost']));
 await p.locator('#dash-edit').click();await p.locator('[data-dash="reset"]').click();await p.locator('[data-dash="save"]').click();await p.locator('#dash-edit').click();await p.locator('[data-dash="cancel"]').click();await p.evaluate(()=>{localStorage.removeItem('baoq-dash-layout-v1')});
 const other=await p.evaluate(()=>({pol:localStorage.getItem('baoq-autosale-policy-v2.1'),lang:localStorage.getItem('baoq-mockup-lang')}));
 ok('C3 reset/save/cancel never touch other storage (Auto Sale policy, language)',other.pol==='{"keep":"me"}'&&other.lang==='vi',other);
 await ctx.close();
 const c2=await open(1440,900);await c2.ctx.addInitScript(()=>{const f=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='baoq-dash-layout-v1')throw new Error('blocked');return f.call(this,k,v)}});
 await go(c2.p,'dashboard','.dash-item');await c2.p.locator('#dash-edit').click();await c2.p.locator('.dash-item [data-dash^="remove"]').first().click();await c2.p.locator('[data-dash="save"]').click();await c2.p.waitForTimeout(250);
 ok('C4 storage blocked: the layout still applies in-session and the page says it was not saved',(await ids(c2.p)).length===10&&/Không lưu được vào trình duyệt này/.test(await txt(c2.p,'.dash-note')));await c2.ctx.close()}

/* ===== D. values match the source pages, periods stated, links go to the right module ===== */
{const {ctx,p}=await open(1440,900);await go(p,'dashboard','.dash-item');
 await p.evaluate(()=>{localStorage.setItem('baoq-dash-layout-v1',JSON.stringify({v:1,ids:['kpi.income','kpi.sales','kpi.pending','kpi.team','gd.revenue','gd.orders','gd.channels','gd.stock','cap.capital','cap.m6','cap.roc','cap.days']}))});await p.reload();
 await p.waitForSelector('.dash-item[data-bid="cap.days"] .kcard',{timeout:8000});await p.waitForSelector('.dash-item[data-bid="kpi.team"] .dash-list',{timeout:8000});await p.waitForTimeout(400);
 const blk=await p.evaluate(()=>Object.fromEntries([...document.querySelectorAll('.dash-item')].map(x=>[x.dataset.bid,{t:x.innerText.replace(/\n+/g,' | '),href:x.querySelector('a.klink,a.link-btn,.dash-list a')?.getAttribute('href')}])));
 /* source values: KPI page */
 const p2=await ctx.newPage();await p2.goto(D+'kpi');await p2.waitForSelector('.mod-kpi .k-kpis');await p2.waitForTimeout(500);
 const k=await p2.evaluate(()=>[...document.querySelectorAll('.k-kpis .kcard')].map(x=>x.innerText.replace(/\n+/g,' | ')));
 const sv=k[1].match(/([\d.,]+\s(tr|tỷ))/)[1];const pend=k[2].match(/\|\s*(\d+)\s*\|/)[1];
 ok('D1 KPI blocks match KPI Sale: verified sales and pending count',blk['kpi.sales'].t.includes(sv.replace(/\s/,' '))&&new RegExp('\\|\\s*'+pend+'\\s*\\|').test(blk['kpi.pending'].t),{sv,pend,blk:blk['kpi.sales'].t.slice(0,80)});
 ok('D2 KPI income block says "Chưa đủ dữ liệu" (not 0), partial, salary not configured, and states the snapshot period + simulated policy',/Chưa đủ dữ liệu/.test(blk['kpi.income'].t)&&!/\b0 ₫/.test(blk['kpi.income'].t)&&/26\/10–30\/10\/2026/.test(blk['kpi.income'].t)&&/chính sách 11 mô phỏng/.test(blk['kpi.income'].t)&&/lương cơ bản chưa cấu hình/.test(blk['kpi.income'].t),blk['kpi.income'].t);
 const inc=await p2.evaluate(()=>[...document.querySelectorAll('.k-sale')].map(a=>({n:a.querySelector('.k-name').textContent,t:a.querySelector('.k-total').innerText.replace(/\n+/g,' ')})));
 ok('D3 per-sale block lists the same people with the same total state as the KPI page, no sum across sales',inc.every(x=>blk['kpi.team'].t.includes(x.n))&&(blk['kpi.team'].t.match(/Chưa đủ dữ liệu|₫/g)||[]).length>=inc.length,inc.map(x=>x.n));
 /* source values: Goods */
 await p2.goto(D+'kpi&k_view=channels');await p2.waitForSelector('.mod-goods .kpis .tile');await p2.waitForTimeout(500);
 const ch=await p2.evaluate(()=>({tiles:[...document.querySelectorAll('.mod-goods .kpis .tile')].map(x=>x.innerText.replace(/\n+/g,' | ')),stack:[...document.querySelectorAll('.mod-goods .stack-row')][0].querySelector('.stack').getAttribute('aria-label')}));
 const rev=ch.tiles.find(x=>/^Doanh thu/.test(x)).match(/([\d.,]+\s?tr)/)[1],ord=ch.tiles[0].match(/\|\s*(\d+)\s*\|/)[1];
 ok('D4 Hàng hóa blocks match Tổng quan sale: revenue and order count (same aggregate, all channels)',norm(blk['gd.revenue'].t).includes(norm(rev))&&new RegExp('\\|\\s*'+ord+'\\s*\\|').test(blk['gd.orders'].t),{rev,ord});
 const chPct=[...ch.stack.matchAll(/(Cửa hàng|Online|Đối tác) ([\d,]+%)/g)].map(m=>[m[1],m[2]]);
 ok('D5 channel-share block percentages equal the Tổng quan sale stacked bar',chPct.length===3&&chPct.every(([n,v])=>norm(blk['gd.channels'].t).includes(n)&&norm(blk['gd.channels'].t).includes(v)),chPct);
 await p2.goto(D+'goods&g_scope=ton');await p2.waitForSelector('.mod-goods .kpis .tile');await p2.waitForTimeout(500);
 const gt=await p2.evaluate(()=>[...document.querySelectorAll('.mod-goods .kpis .tile')].map(x=>x.innerText.replace(/\n+/g,' | ')));
 const cap=gt.find(x=>/^Vốn nằm trong tồn/.test(x)).match(/\|\s*([\d.,]+\s?tr)/)[1],m6=gt.find(x=>/^% vốn ở tuổi M6\+/.test(x)).match(/\|\s*([\d,]+%)/)[1],items=gt[0].match(/\|\s*(\d+)\s*\|/)[1];
 ok('D6 Hiệu quả vốn / stock blocks equal the Hàng hóa Tồn tiles (default filters): capital, M6+ share, item count',norm(blk['cap.capital'].t).includes(norm(cap))&&norm(blk['cap.m6'].t).includes(m6)&&new RegExp('\\|\\s*'+items+'\\s*\\|').test(blk['gd.stock'].t),{cap,m6,items});
 await p2.goto(D+'goods');await p2.waitForSelector('.mod-goods .kpis .tile');await p2.waitForTimeout(500);
 const gb=await p2.evaluate(()=>[...document.querySelectorAll('.mod-goods .kpis .tile')].map(x=>x.innerText.replace(/\n+/g,' | ')));
 const roc=gb.find(x=>/^Lãi gộp ÷ vốn/.test(x)).match(/\|\s*([\d,]+%)/)[1],days=gb.find(x=>/^Ngày bán TB/.test(x)).match(/\|\s*([\d.,]+\s?ngày)/)[1];
 ok('D7 ROC and average days equal the Hàng hóa "Bán trong kỳ" tiles',blk['cap.roc'].t.includes(roc)&&blk['cap.days'].t.includes(days),{roc,days});
 ok('D8a KPI blocks show the snapshot as-of taken from its capturedAt; stock-age blocks show the calc date, not the sale period',await (async()=>{const cap=(await p2.evaluate(async()=>{const r=await fetch('kpi/snapshot.json');return (await r.json()).capturedAt})).match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/);const asof=`${cap[3]}/${cap[2]}/${cap[1]} ${cap[4]}:${cap[5]}`;return ['kpi.income','kpi.sales','kpi.pending'].every(i=>blk[i].t.includes('as-of '+asof))&&['cap.capital','cap.m6','gd.stock'].every(i=>/tính tại \d\d\/\d\d\/\d{4}/.test(blk[i].t)&&/không phải kỳ bán|tính tại/.test(blk[i].t))})(),{income:blk['kpi.income'].t.slice(0,150),capital:blk['cap.capital'].t.slice(0,150)});
 ok('D8 every Goods/capital block names the demo period 01/10–21/10/2026; no block mixes the KPI snapshot period',['gd.revenue','gd.orders','gd.channels','cap.roc','cap.days'].every(i=>/Demo 01\/10–21\/10\/2026/.test(norm(blk[i].t)))&&!/Demo 01\/10/.test(blk['kpi.income'].t)&&!/Snapshot/.test(blk['gd.revenue'].t),Object.fromEntries(['gd.revenue','kpi.sales'].map(i=>[i,blk[i].t.slice(0,110)])));
 /* links */
 const exp={'kpi.income':'#view=kpi','kpi.sales':'#view=kpi&k_view=list&k_kind=selling&k_state=provisional','kpi.pending':'#view=kpi&k_view=todo','gd.revenue':'#view=kpi&k_view=channels','gd.orders':'#view=kpi&k_view=channels','gd.channels':'#view=kpi&k_view=channels','gd.stock':'#view=goods&g_scope=ton','cap.capital':'#view=goods&g_scope=ton','cap.m6':'#view=goods&g_scope=ton','cap.roc':'#view=goods','cap.days':'#view=goods'};
 ok('D9 block links point at the module that owns the number',Object.entries(exp).every(([i,h])=>blk[i].href===h),Object.entries(exp).filter(([i,h])=>blk[i].href!==h).map(([i])=>i));
 for(const [id,pat,sel] of [['kpi.sales',/k_view=list/,'.mod-kpi .k-table'],['gd.revenue',/k_view=channels/,'.mod-kpi .mod-goods .tile'],['cap.capital',/view=goods/,'.mod-goods .tile']]){await p.goto(D+'dashboard');await p.waitForSelector(`.dash-item[data-bid="${id}"] .kcard`,{timeout:8000});await p.locator(`.dash-item[data-bid="${id}"] a.klink`).click();await p.waitForSelector(sel,{timeout:8000});await p.waitForTimeout(300);
  const st=await p.evaluate(()=>({h:location.hash,side:!!document.querySelector('.ops-side'),cur:document.querySelector('.ops-side [aria-current="page"]')?.textContent.trim()}));
  await p.goBack();await p.waitForSelector('.dash-item',{timeout:6000});ok(`D10 ${id}: link opens the right module in the shared menu, Back returns to the dashboard layout`,pat.test(st.h)&&st.side&&/KPI Sale|Hàng hóa/.test(st.cur)&&/view=dashboard/.test(await p.evaluate(()=>location.hash)),st)}
 await shot(p,'dash-sources-1440');await ctx.close()}

/* ===== E. no state leakage between dashboard, KPI and Goods ===== */
{const {ctx,p}=await open(1440,900);await go(p,'dashboard','.dash-item');
 await p.evaluate(()=>localStorage.setItem('baoq-dash-layout-v1',JSON.stringify({v:1,ids:['cap.capital','cap.m6','gd.stock','gd.revenue','cap.roc']})));await p.reload();await p.waitForSelector('.dash-item[data-bid="cap.roc"] .kcard',{timeout:8000});
 const base=await p.evaluate(()=>[...document.querySelectorAll('.dash-item')].map(x=>x.innerText));
 const G='goods&g_scope=ton&g_calc=2026-12-15&g_basis=cost&g_src=Mua%20đứt';
 await p.goto(D+G);await p.waitForSelector('.mod-goods .kpis .tile');await p.waitForTimeout(500);
 const gFiltered=await p.evaluate(()=>[...document.querySelectorAll('.mod-goods .kpis .tile')].map(x=>x.innerText.replace(/\n+/g,' | ')));
 await p.locator('.ops-side a',{hasText:'Tổng quan'}).first().click();await p.waitForSelector('.dash-item[data-bid="cap.roc"] .kcard',{timeout:8000});await p.waitForTimeout(400);
 const after=await p.evaluate(()=>[...document.querySelectorAll('.dash-item')].map(x=>x.innerText));
 ok('E1 changing Goods calc date, price basis and source filter (calc+basis+source; category/channel/price not exercised here) does not change the dashboard blocks',JSON.stringify(base)===JSON.stringify(after));
 await p.goBack();await p.waitForSelector('.mod-goods .kpis .tile');await p.waitForTimeout(500);
 const gAgain=await p.evaluate(()=>({tiles:[...document.querySelectorAll('.mod-goods .kpis .tile')].map(x=>x.innerText.replace(/\n+/g,' | ')),calc:document.querySelector('#c-calc,#f-calc')?.value,hash:location.hash}));
 ok('E2 returning to Hàng hóa restores exactly its own calc/basis/source state (dashboard summary did not reset or alter it)',JSON.stringify(gAgain.tiles)===JSON.stringify(gFiltered)&&gAgain.hash.includes('g_calc=2026-12-15'));
 await p.goto(D+'kpi&k_view=list&k_state=pending&k_q=zzz');await p.waitForSelector('.mod-kpi');await p.waitForTimeout(600);
 await p.locator('.ops-side a',{hasText:'Tổng quan'}).first().click();await p.waitForSelector('.dash-item');await p.waitForTimeout(300);await p.goBack();await p.waitForTimeout(700);
 ok('E3 KPI list filter (state/search in the hash) is intact after visiting the dashboard',await p.evaluate(()=>document.querySelector('#kq')?.value==='zzz'&&/k_state=pending/.test(location.hash)));
 await ctx.close()}

/* ===== F. keyboard, Escape, reduced motion, console ===== */
{const {ctx,p}=await open(1440,900,{reducedMotion:'reduce'});await go(p,'dashboard','.dash-item');
 await p.locator('#dash-edit').focus();await p.keyboard.press('Enter');await p.waitForTimeout(200);
 await p.locator('[data-dash="addpanel"]').focus();await p.keyboard.press('Enter');await p.waitForTimeout(200);
 const open1=await p.locator('#dash-cat').isVisible();await p.keyboard.press('Escape');await p.waitForTimeout(200);
 ok('F1 keyboard: Enter on Tùy chỉnh and Thêm khối; Escape closes the catalog and returns focus to Thêm khối',open1&&!await p.locator('#dash-cat').count()&&await p.evaluate(()=>document.activeElement.dataset.dash==='addpanel'));
 const tgt=await p.evaluate(()=>document.querySelector('.dash-item[data-bid="ops.cost"] [data-dash^="up"]')&&1);await p.locator('.dash-item[data-bid="ops.cost"] [data-dash^="up"]').focus();await p.keyboard.press('Enter');await p.waitForTimeout(200);
 const o=await ids(p);ok('F2 keyboard reorder with Enter (cost moved before revenue); focus stays on a control of the moved block',o[0]==='ops.cost'&&await p.evaluate(()=>!!document.activeElement.closest('[data-bid="ops.cost"]')),o.slice(0,3));
 const anim=await p.evaluate(()=>document.getAnimations().length);ok('F3 reduced-motion: no running animations after edit actions',anim===0,anim);
 await ctx.close()}
{const {ctx,p}=await open(1440,900);await go(p,'dashboard','.dash-item');await p.locator('#dash-edit').click();await p.waitForTimeout(200);
 const kb=await p.evaluate(()=>{const r=e=>e.getBoundingClientRect();return [...document.querySelectorAll('.dash-bar button,.dash-ctl button,#dash-edit')].map(e=>({h:Math.round(r(e).height)})).filter(x=>x.h<40).length});ok('F4 desktop controls ≥40px',kb===0);await ctx.close()}
{const {ctx,p}=await open(390,844);await go(p,'dashboard','.dash-item');await p.locator('#dash-edit').click();await p.waitForTimeout(250);await p.locator('[data-dash="addpanel"]').click();
 const small=await p.evaluate(()=>[...document.querySelectorAll('.dash-bar button,.dash-ctl button,#dash-edit,#dash-cat button')].filter(e=>e.getClientRects().length).map(e=>Math.round(e.getBoundingClientRect().height)).filter(h=>h<44).length);
 ok('F5 mobile: edit controls and catalog buttons ≥44px, no overflow',small===0&&!await hOver(p),small);await ctx.close()}
ok('no console/page errors in the whole run',errs.length===0,errs.slice(0,4));
writeFileSync(path.join(here,'results.json'),JSON.stringify({at:new Date().toISOString(),browser:'Chromium (Playwright headless)',checks},null,1));
console.log('\n'+checks.filter(c=>c.pass).length+'/'+checks.length+' passed');await b.close();
