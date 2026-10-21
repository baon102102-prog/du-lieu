// v2 capture + checks. Renders the mockup from file:// (no server), writes screenshots, paused-animation frames,
// interaction videos and a JSON report into docs/design-proposals/plan-mockup-v1/v2/. Also verifies v1 is unchanged.
// Usage (repo root): NODE_PATH=frontend/node_modules PLAYWRIGHT_BROWSERS_PATH=frontend/.browsers .node/bin/node docs/design-proposals/plan-mockup-v1/v2/mockup/src/capture.cjs
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const crypto=require('crypto');
const root=path.resolve(__dirname,'..','..');const v1root=path.resolve(root,'..');
const file='file://'+path.join(root,'mockup','baoq-mockup-v2.html');const DAY='today=2026-10-21';
const out=d=>{const p=path.join(root,d);fs.mkdirSync(p,{recursive:true});return p};const SHOTS=out('screens'),FRAMES=out('motion/frames'),VIDEO=out('motion');
const report={captured_at:new Date().toISOString(),checks:[],errors:[],firstTaskTop:{}};
const check=(name,ok,detail)=>report.checks.push({name,result:ok?'PASS':'FAIL',detail});
const url=h=>`${file}#${DAY}&${h}`;
async function newPage(browser,w,h,extra={}){const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,...extra});const page=await ctx.newPage();
 const tc=page.textContent.bind(page);page.textContent=async(...a)=>{const v=await tc(...a);return v==null?v:v.replace(/\u00a0/g,' ')};
 page.on('pageerror',e=>report.errors.push(`${w}px pageerror: ${e.message}`));page.on('console',m=>{if(m.type()==='error')report.errors.push(`${w}px console: ${m.text()}`)});return {ctx,page}}
const settle=p=>p.waitForTimeout(380);
const load=async(p,h)=>{await p.goto(url(h));await p.reload();await settle(p)};
const overflow=p=>p.evaluate(w=>document.documentElement.scrollWidth<=w&&innerWidth===w,p.viewportSize().width);
const txt=(p,sel)=>p.locator(sel).allTextContents().then(a=>a.map(s=>s.replace(/\s+/g,' ').trim()));
const mob=w=>w<700?{isMobile:true,hasTouch:true}:{};
async function pausedFrames(p,name,h,code,times,before){for(const t of times){await load(p,h);if(before){await before(p);await settle(p)}
 await p.evaluate(async({code,t})=>{await (new Function('return (async()=>{'+code+'})()'))();document.body.offsetWidth;for(const a of document.getAnimations()){a.pause();a.currentTime=t}},{code,t});
 await p.screenshot({path:path.join(FRAMES,`${name}-t${String(t).padStart(3,'0')}.png`)})}}
const AUDIT=()=>{const parse=c=>{const p=(c.match(/rgba?\(([^)]+)\)/)?.[1]||'').split(/[ ,\/]+/).filter(Boolean).map(Number);return p.length>=3?{r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}:null};
 const lum=({r,g,b})=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
 const bg=el=>{for(let e=el;e;e=e.parentElement){const cs=getComputedStyle(e);if(cs.backgroundImage&&cs.backgroundImage.includes('gradient')&&e.classList.contains('hero'))return {r:39,g:26,b:7};const c=parse(cs.backgroundColor);if(c&&c.a>.5)return c}return {r:255,g:255,b:255}};
 const out=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
 while((n=w.nextNode())){const el=n.parentElement;if(!n.nodeValue.trim()||!el||el.closest('script,style,[hidden],.vh,.skip,svg'))continue;const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;
  const cs=getComputedStyle(el);if(cs.visibility==='hidden'||+cs.opacity===0)continue;const a=lum(parse(cs.color)),b=lum(bg(el)),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),size=parseFloat(cs.fontSize);
  if(ratio<((size>=24||(+cs.fontWeight>=700&&size>=18.66))?3:4.5))out.push(`${n.nodeValue.trim().slice(0,28)} ${ratio.toFixed(2)}`)}
 return out};
const atTop=async p=>{await p.evaluate(()=>{window.scrollTo(0,0);const t=document.getElementById('toast');t&&t.classList.remove('is-open');document.activeElement&&document.activeElement.blur&&document.activeElement.blur()});await p.waitForTimeout(300)};
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

(async()=>{
 // v1 must stay byte-identical (served at /mockup/baoq-mockup-v1.html for comparison)
 const v1sha=sha(path.join(v1root,'mockup','baoq-mockup-v1.html'));check('v1 mockup unchanged (sha256 2e0bef91…)',v1sha.startsWith('2e0bef91ec6286d9'),v1sha);
 const browser=await chromium.launch();

 // ---- Static screens + layout at 1440 / 768 / 390 ----
 for(const [w,h] of [[1440,900],[768,1024],[390,844]]){const {ctx,page:p}=await newPage(browser,w,h,mob(w));
  await load(p,'view=home');report.firstTaskTop[w]=await p.evaluate(()=>Math.round(document.querySelector('.row').getBoundingClientRect().top));
  check(`HOME ${w}px unchanged flow: 2 task rows, first task in first viewport`,await p.locator('.row').count()===2&&report.firstTaskTop[w]<h,`y=${report.firstTaskTop[w]}`);
  check(`HOME ${w}px no overflow`,await overflow(p));await p.screenshot({path:path.join(SHOTS,`home-${w}.png`),fullPage:true});
  for(const [hsh,name,full] of [['view=dashboard','dashboard',true],['view=tx&field=week&value=1','tx-week1',true],['view=inventory&age=90','inventory-90',true],['view=checks','checks',true],['view=costs','costs',true],['view=nc&page=cash','nc-cash',true],['view=policy&group=reconcile','policy-reconcile',true],['view=policy&group=pricing','policy-pricing',true],['view=policy&group=access','policy-access',true],['view=policy&group=commission','policy-commission',true],['view=policy&group=reminders','policy-reminders',true],['view=dashboard&alert=DEMO-E02','alert-priority',false],['view=dashboard&alert=aging','alert-aging',false],['view=inventory&item=DEMO-I4','item-dialog',false]]){
   await load(p,hsh);check(`${name} ${w}px no overflow, viewport not zoomed`,await overflow(p));
   if(w!==768||['dashboard','policy-reconcile','alert-priority'].includes(name))await p.screenshot({path:path.join(SHOTS,`${name}-${w}.png`),fullPage:full})}
  await ctx.close()}

 // ---- Numbers unchanged (demo data) + chart presence ----
 {const {ctx,page:p}=await newPage(browser,1440,900);await load(p,'view=dashboard');
  const k=await txt(p,'.kcard .kvalue');check('KPI values = demo (190.000.000 / 162.500.000 / 27.500.000 / 111.000.000 ₫)',JSON.stringify(k)===JSON.stringify(['190.000.000 ₫','162.500.000 ₫','27.500.000 ₫','111.000.000 ₫']),k.join(' | '));
  check('KPI context ratios derived from demo (85,53% and 14,47% of revenue)',(await p.textContent('.kpi-grid')).includes('85,53%')&&(await p.textContent('.kpi-grid')).includes('14,47%'));
  check('weekly chart: SVG with 3 week links, negative week label −14 tr below zero',await p.evaluate(()=>{const a=[...document.querySelectorAll('[data-chart="weekly"] a[data-week]')];const lab=[...document.querySelectorAll('[data-chart="weekly"] text.v')].map(t=>t.textContent);const zero=+document.querySelector('[data-chart="weekly"] .zero').getAttribute('y1');const negY=+[...document.querySelectorAll('[data-chart="weekly"] circle')][1].getAttribute('cy');return a.length===3&&lab.join('|')==='32 tr|−14 tr|9,5 tr'&&negY>zero}));
  const bridge=await p.evaluate(()=>[...document.querySelectorAll('[data-chart="bridge"] text.v')].map(t=>t.textContent).join('|'));check('bridge chart labels = 190 tr | −130,5 tr | −32 tr | 27,5 tr',bridge==='190 tr|−130,5 tr|−32 tr|27,5 tr',bridge);
  check('bridge readout formula exact',(await p.textContent('.row-1-1:nth-of-type(2) .readout, .readout.num')).replace(/\s/g,' ').includes('Doanh thu 190.000.000 ₫ − Giá vốn 130.500.000 ₫ − Vận hành 32.000.000 ₫ = Kết quả demo 27.500.000 ₫'));
  const ch=await txt(p,'section[aria-labelledby="channel-h"] .val');check('channel bars values exact',ch.join('|')==='105.000.000 ₫55,26%|65.000.000 ₫34,21%|20.000.000 ₫10,53%',ch.join('|'));
  const sl=await txt(p,'section[aria-labelledby="sale-h"] .val');check('sale bars values exact',sl.join('|')==='70.000.000 ₫36,84%|65.000.000 ₫34,21%|55.000.000 ₫28,95%',sl.join('|'));
  const cm=await txt(p,'section[aria-labelledby="cm-h"] .val');check('cost mix values exact (sorted by amount)',cm.join('|')==='130.500.000 ₫68,68% doanh thu|15.000.000 ₫7,89% doanh thu|12.000.000 ₫6,32% doanh thu|5.000.000 ₫2,63% doanh thu',cm.join('|'));
  await p.click('[data-table="weekly"]');await settle(p);const wt=await txt(p,'section[aria-labelledby="wk-h"] tbody td');
  check('weekly table view = 100.000.000/32.000.000, 60.000.000/−14.000.000, 30.000.000/9.500.000',wt.join('|')==='01–07/10|100.000.000 ₫|32.000.000 ₫|08–14/10|60.000.000 ₫|-14.000.000 ₫|15–19/10|30.000.000 ₫|9.500.000 ₫',wt.join('|'));
  check('table toggle keeps focus and aria-pressed',await p.evaluate(()=>document.activeElement.dataset.table==='weekly'&&document.activeElement.getAttribute('aria-pressed')==='true'));
  await atTop(p);await p.screenshot({path:path.join(SHOTS,'dashboard-table-view-1440.png'),fullPage:true});
  await load(p,'view=costs');check('costs formula + operating total 32.000.000 ₫',(await p.textContent('.formula')).includes('= Kết quả demo 27.500.000 ₫')&&(await p.textContent('tfoot')).includes('32.000.000 ₫'));
  await load(p,'view=inventory&age=90');check('inventory 90+ = 2 SKU, total 42.000.000 ₫',await p.locator('tbody tr').count()===2&&(await p.textContent('.toolbar-2')).includes('42.000.000 ₫'));
  await load(p,'view=nc&page=consignment');check('not-connected page: honest placeholder, no table or fake rows',await p.locator('table').count()===0&&(await p.textContent('.ops-main')).includes('Chưa kết nối'));
  await ctx.close()}

 // ---- Navigation, drilldown, alerts, Back/Forward, keyboard ----
 {const {ctx,page:p}=await newPage(browser,1440,900);await load(p,'view=dashboard');
  check('sidebar: Tổng quan active (aria-current), Kiểm tra badge 2',await p.evaluate(()=>document.querySelector('.ops-side [aria-current="page"]').textContent.includes('Tổng quan')&&document.querySelector('.ops-side .badge-n').textContent.includes('2')));
  for(const [i,view,h1] of [[0,'tx','Thu–bán'],[1,'costs','Chi phí'],[2,'costs','Chi phí'],[3,'inventory','Hàng tồn kho']]){await load(p,'view=dashboard');await p.locator('.kcard .klink').nth(i).click();await settle(p);
   check(`KPI ${i+1} "Xem chi tiết" opens ${view}`,p.url().includes('view='+view)&&(await p.textContent('h1'))===h1)}
  await p.click('.ghost-btn[href="#view=dashboard"]');await settle(p);check('"Quay lại tổng quan" returns to overview',(await p.textContent('h1'))==='Tổng quan điều hành');
  await p.click('.ops-side a[href="#view=checks"]');await settle(p);check('sidebar link → Kiểm tra, active state moves',(await p.textContent('h1'))==='Kiểm tra'&&await p.evaluate(()=>document.querySelector('.ops-side [aria-current="page"]').textContent.includes('Kiểm tra')));
  await p.click('.crumbs a[href="#view=dashboard"]');await settle(p);check('breadcrumb "Điều hành" → overview',(await p.textContent('h1'))==='Tổng quan điều hành');
  await p.click('a.link-btn[href="#view=checks"]');await settle(p);check('"Xem tất cả" (alerts) → Kiểm tra list (3 items)',await p.locator('.alert-btn').count()===3);
  await p.goBack();await settle(p);
  // alert panel via keyboard
  await p.focus('[data-alert="DEMO-E01"]');await p.keyboard.press('Enter');await settle(p);
  check('alert opens a detail panel with context (record, source, impact, steps, completion), focus inside',await p.evaluate(()=>{const s=document.querySelector('.sheet.is-open');return !!s&&s.contains(document.activeElement)&&s.textContent.replace(/\u00a0/g,' ').includes('DEMO-S002')&&s.textContent.replace(/\u00a0/g,' ').includes('demo:accounting')&&s.textContent.replace(/\u00a0/g,' ').includes('30.000.000 ₫')&&s.textContent.replace(/\u00a0/g,' ').includes('Điều kiện hoàn thành')}));
  await p.keyboard.press('Escape');await settle(p);check('Escape closes alert panel, focus returns to the alert button',await p.evaluate(()=>!document.querySelector('.sheet.is-open')&&document.activeElement.dataset.alert==='DEMO-E01'));
  await p.click('[data-alert="DEMO-E01"]');await settle(p);await p.click('.sheet-actions a.btn-primary');await settle(p);
  check('"Mở bản ghi liên quan" → Thu–bán record dialog DEMO-S002',p.url().includes('view=tx')&&await p.evaluate(()=>!!document.querySelector('.dialog.is-open')&&document.querySelector('.dialog').textContent.includes('DEMO-S002')));
  await p.goBack();await settle(p);check('Back → overview with the alert panel reopened (URL state)',await p.evaluate(()=>location.hash.includes('alert=DEMO-E01')&&!!document.querySelector('.sheet.is-open')));
  await p.keyboard.press('Escape');await settle(p);
  await p.click('[data-alert="aging"]');await settle(p);check('aging panel lists DEMO-I3 + DEMO-I4, total 42.000.000 ₫',await p.evaluate(()=>{const s=document.querySelector('.sheet.is-open');return s.textContent.replace(/\u00a0/g,' ').includes('D103')&&s.textContent.replace(/\u00a0/g,' ').includes('D104')&&s.querySelector('tfoot').textContent.replace(/\u00a0/g,' ').includes('42.000.000 ₫')}));
  await p.click('.sheet-actions a.btn-primary');await settle(p);check('aging panel → Tồn kho filtered 90+',p.url().includes('age=90')&&await p.locator('tbody tr').count()===2);
  await p.click('[data-item="DEMO-I3"]');await settle(p);check('inventory row → item dialog (DEMO-I3, 115 days, 30.000.000 ₫)',await p.evaluate(()=>{const d=document.querySelector('.dialog.is-open');return !!d&&d.textContent.replace(/\u00a0/g,' ').includes('115')&&d.textContent.replace(/\u00a0/g,' ').includes('30.000.000 ₫')}));
  await p.keyboard.press('Escape');await settle(p);
  // chart drilldown + readout
  await load(p,'view=dashboard');await p.focus('[data-week="1"]');await settle(p);
  check('chart: keyboard focus on week shows exact readout',(await p.textContent('#wk-readout')).includes('-14.000.000 ₫'));
  await p.keyboard.press('Enter');await settle(p);check('chart: Enter on week 2 → Thu–bán filtered by week (2 rows, chip 08–14/10)',p.url().includes('field=week&value=2')&&await p.locator('tbody tr').count()===2&&(await p.textContent('.filter-chip')).includes('08–14/10'));
  await p.goBack();await settle(p);await p.goForward();await settle(p);check('Back/Forward keep the week filter',p.url().includes('value=2')&&await p.locator('tbody tr').count()===2);
  await load(p,'view=dashboard');await p.click('section[aria-labelledby="channel-h"] .hbars a >> nth=1');await settle(p);check('channel bar Online → 3 rows',await p.locator('tbody tr').count()===3);
  // drawer has Chính sách
  await p.click('#menu-btn');await settle(p);await p.click('#level-1 a[data-nav="policy"]');await settle(p);check('drawer → Chính sách (same tab)',(await p.textContent('h1'))==='Chính sách & quy định'&&ctx.pages().length===1);
  await ctx.close()}

 // ---- Policy: empty by default, historical values never pre-filled, preview honest, draft save/restore/clear ----
 {const {ctx,page:p}=await newPage(browser,1440,900);await load(p,'view=policy&group=reconcile');await p.evaluate(()=>localStorage.removeItem('baoq-mockup-policy-draft-v2'));await load(p,'view=policy&group=reconcile');
  const empties=async()=>p.evaluate(()=>[...document.querySelectorAll('#pol-form [data-pol]')].every(i=>i.value===''));
  check('reconcile: all parameters empty by default (40/60, 0, 500000 NOT pre-filled)',await empties()&&(await p.textContent('#pol-form')).includes('hiện tại 40/60'));
  check('reconcile: preview says "Chưa đủ cấu hình" and bridge cannot be computed',(await p.textContent('#pol-preview')).includes('Chưa đủ cấu hình')&&(await p.textContent('#pol-preview')).includes('chưa kết nối nguồn'));
  check('all 5 groups start "Chờ cấu hình"',await p.evaluate(()=>[...document.querySelectorAll('.pol-link .sev')].map(s=>s.textContent).every(s=>s==='Chờ cấu hình')));
  await p.fill('#pf-reconcile-partner','30');await p.fill('#pf-reconcile-bao','50');
  check('validation: ratios must sum to 100 (error beside field, aria-invalid)',(await p.textContent('[data-field="bao"] .err')).includes('100%')&&await p.getAttribute('#pf-reconcile-bao','aria-invalid')==='true');
  await p.click('[data-focus="pol-save"]');await settle(p);check('save blocked while invalid; focus moves to the invalid field',await p.evaluate(()=>document.activeElement.id==='pf-reconcile-bao')&&await p.evaluate(()=>!localStorage.getItem('baoq-mockup-policy-draft-v2')));
  await p.fill('#pf-reconcile-bao','70');await p.fill('#pf-reconcile-tolerance','1000');await p.fill('#pf-reconcile-unit','100000');await p.fill('#pex-reconcile','1000000');
  const pv=await p.textContent('#pol-preview');check('preview with typed draft: 1.000.000 × 30% / 70% = 300.000 / 700.000 ₫, still "chưa kết nối nguồn"',pv.includes('300.000 ₫')&&pv.includes('700.000 ₫')&&pv.includes('chưa kết nối nguồn'),pv.slice(0,160));
  check('status shows unsaved changes',(await p.textContent('.pol-link[aria-current] .sev'))==='Có thay đổi chưa lưu');
  await atTop(p);await p.screenshot({path:path.join(SHOTS,'policy-reconcile-draft-1440.png'),fullPage:true});
  await p.click('[data-focus="pol-save"]');await settle(p);check('save: "Nháp DEMO đã lưu", stored only in localStorage',(await p.textContent('.pol-link[aria-current] .sev'))==='Nháp DEMO đã lưu'&&await p.evaluate(()=>JSON.parse(localStorage.getItem('baoq-mockup-policy-draft-v2')).reconcile.saved.partner==='30'));
  await p.reload();await settle(p);check('reload restores the DEMO draft',(await p.inputValue('#pf-reconcile-partner'))==='30'&&(await p.inputValue('#pf-reconcile-bao'))==='70');
  await p.click('[data-pol-reset]');await settle(p);check('clear draft empties fields',await empties());
  await p.click('#toast-undo');await settle(p);check('Undo restores the cleared draft',(await p.inputValue('#pf-reconcile-partner'))==='30');
  await p.click('[data-pol-reset]');await settle(p);
  await load(p,'view=policy&group=pricing');check('pricing: margin empty; bands and M0 shown as not decided; ready-date rule is OR (latest)',await empties()&&(await p.textContent('.pol-main')).includes('Chưa chốt')&&(await p.textContent('.pol-main')).includes('website HOẶC mạng xã hội'));
  await p.fill('#pf-pricing-margin','100');check('pricing: margin 100% rejected',(await p.textContent('[data-field="margin"] .err')).length>0);
  await p.fill('#pf-pricing-margin','25');await p.fill('#pex-pricing','750000');check('pricing preview: 750.000 / (1 − 25%) = 1.000.000 ₫ (typed example, no real SKU)',(await p.textContent('#pol-preview')).includes('1.000.000 ₫'));
  await load(p,'view=policy&group=access');check('access: approver empty ("hiện tại Bảo" only as reference), matrix drafts all unchecked',await empties()&&await p.evaluate(()=>[...document.querySelectorAll('[data-pol-grant]')].every(c=>!c.checked))&&(await p.textContent('.pol-main')).includes('hiện tại Bảo'));
  await p.check('[data-pol-grant="cofounder:overview"]');check('access: granting overview to Cofounder raises the CEO-only warning',(await p.textContent('#pol-preview')).includes('chỉ dành cho CEO'));
  await atTop(p);await p.screenshot({path:path.join(SHOTS,'policy-access-warning-1440.png'),fullPage:true});
  await load(p,'view=policy&group=commission');check('commission: always "không tính", even with a complete draft',(await p.textContent('#pol-preview')).includes('Không tính hoa hồng'));
  await load(p,'view=policy&group=reminders');await p.selectOption('#pf-reminders-before','1h');check('reminders: "1 giờ trước" on a date-only due → cannot determine',(await p.textContent('#pol-preview')).toLowerCase().includes('không xác định'));
  await p.selectOption('#pf-reminders-before','1d');await p.selectOption('#pf-reminders-cadence','day');await p.selectOption('#pf-reminders-limit','3');
  check('reminders preview: 20/10/2026 then 21/10/2026, 22/10/2026; "không gửi"',(await p.textContent('#pol-preview')).includes('20/10/2026')&&(await p.textContent('#pol-preview')).includes('22/10/2026')&&(await p.textContent('#pol-preview')).includes('không gửi'));
  await p.evaluate(()=>localStorage.removeItem('baoq-mockup-policy-draft-v2'));await ctx.close()}

 // ---- EN ----
 for(const [w,h] of [[1440,900],[390,844]]){const {ctx,page:p}=await newPage(browser,w,h);await load(p,'view=dashboard');await p.click(w<700?'.lang button[aria-pressed="false"]':'[data-lang="en"]');await settle(p);
  check(`EN ${w}px dashboard no overflow`,await overflow(p));const left=await p.evaluate(()=>['Xem chi tiết','Doanh thu thuần','Cần xử lý','Quay lại','Từ doanh thu','Cơ cấu chi phí','Đóng góp theo'].filter(s=>document.getElementById('main').innerText.includes(s)));
  check(`EN ${w}px dashboard: UI strings translated`,left.length===0,left.join(', '));await p.screenshot({path:path.join(SHOTS,`dashboard-en-${w}.png`),fullPage:true});
  await load(p,'view=policy&group=reconcile');const lp=await p.evaluate(()=>['Chờ cấu hình','Lưu nháp','Quy tắc đã ghi','Xem trước tác động'].filter(s=>document.getElementById('main').innerText.includes(s)));check(`EN ${w}px policy: UI strings translated`,lp.length===0,lp.join(', '));
  if(w>700)await p.screenshot({path:path.join(SHOTS,'policy-reconcile-en-1440.png'),fullPage:true});await p.evaluate(()=>localStorage.setItem('baoq-mockup-lang','vi'));await ctx.close()}

 // ---- Touch 390 ----
 {const {ctx,page:p}=await newPage(browser,390,844,mob(390));await load(p,'view=dashboard');
  const small=await p.evaluate(()=>[...document.querySelectorAll('main a, main button, main select, main input, header a, header button')].filter(n=>n.offsetParent&&!n.closest('svg')&&!n.closest('.ops-side')).map(n=>{const r=n.getBoundingClientRect();return {n:(n.textContent||n.getAttribute('aria-label')||'').trim().slice(0,24),h:Math.round(r.height),w:Math.round(r.width)}}).filter(x=>x.h<44||x.w<44));
  check('touch 390px dashboard: controls ≥ 44×44 px',small.length===0,JSON.stringify(small));
  await p.tap('[data-alert="DEMO-E02"]');await settle(p);check('tap alert → panel opens (bottom sheet)',await p.locator('.sheet.is-open').count()===1);await p.screenshot({path:path.join(SHOTS,'alert-priority-390-tap.png')});
  await p.tap('[data-close="alert"]');await settle(p);await p.tap('.ops-tabs a[href="#view=inventory"]');await settle(p);check('tap tab Tồn kho → active tab moves',await p.evaluate(()=>document.querySelector('.ops-tabs [aria-current="page"]').textContent.includes('Tồn kho')));
  await load(p,'view=policy&group=reconcile');const smallP=await p.evaluate(()=>[...document.querySelectorAll('main a, main button, main select, main input')].filter(n=>n.offsetParent).map(n=>{const r=n.getBoundingClientRect();return {n:(n.textContent||n.id||'').trim().slice(0,24),h:Math.round(r.height),w:Math.round(r.width)}}).filter(x=>x.h<44||x.w<44));
  check('touch 390px policy: controls ≥ 44×44 px',smallP.length===0,JSON.stringify(smallP));
  await load(p,'view=policy&group=access');const hits=await p.evaluate(()=>[...document.querySelectorAll('.matrix .hit44')].map(l=>{const r=l.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)]}).filter(([w,h])=>w<44||h<44));check('touch 390px access matrix: each checkbox target ≥ 44×44 px',hits.length===0,JSON.stringify(hits));await ctx.close()}

 // ---- Motion budget + reduced motion ----
 {const {ctx,page:p}=await newPage(browser,1440,900);await load(p,'view=dashboard');await p.hover('.kcard >> nth=0');await p.hover('[data-week="0"]');
  const max=await p.evaluate(()=>{const s=v=>v.split(',').map(x=>parseFloat(x)*(x.trim().endsWith('ms')?.001:1));let m=0;for(const el of document.querySelectorAll('*')){const cs=getComputedStyle(el);for(const d of [...s(cs.transitionDuration),...(cs.animationName==='none'?[]:s(cs.animationDuration))])m=Math.max(m,d)}return m});
  check('motion budget: no transition/animation > 280 ms',max<=.28,`max ${Math.round(max*1000)} ms`);
  check('KPI hover lifts the card only (no rotation/scale of text)',await p.evaluate(()=>{const t=getComputedStyle(document.querySelector('.kcard')).transform;if(t==='none')return false;const m=t.match(/matrix\(([^)]+)\)/);if(!m)return false;const v=m[1].split(',').map(Number);return v[0]===1&&v[1]===0&&v[2]===0&&v[3]===1}));
  check('KPI values render final immediately (no count-up animations on numbers)',await p.evaluate(()=>document.querySelector('.kcard .kvalue').getAnimations().length===0));
  await ctx.close();
  const r=await newPage(browser,390,844,{reducedMotion:'reduce',...mob(390)});await load(r.page,'view=dashboard');await r.page.tap('[data-alert="aging"]');await r.page.waitForSelector('.sheet');
  check('reduced motion: alert panel opens without animation',await r.page.evaluate(()=>document.getAnimations().length===0&&getComputedStyle(document.querySelector('.sheet')).transform==='none'));
  await r.page.screenshot({path:path.join(SHOTS,'reduced-motion-alert-390.png')});await r.ctx.close();
  const r2=await newPage(browser,1440,900,{reducedMotion:'reduce'});await load(r2.page,'view=dashboard');await r2.page.hover('.kcard >> nth=0');await r2.page.waitForTimeout(250);
  check('reduced motion: KPI hover has no lift',await r2.page.evaluate(()=>getComputedStyle(document.querySelector('.kcard')).transform==='none'));await r2.ctx.close()}

 // ---- Contrast AA ----
 {const {ctx,page:p}=await newPage(browser,1440,900);for(const h of ['view=dashboard','view=dashboard&alert=DEMO-E02','view=inventory','view=checks','view=costs','view=nc&page=cash','view=policy&group=reconcile','view=policy&group=access','view=home']){await load(p,h);const f=await p.evaluate(AUDIT);check(`contrast AA: ${h}`,f.length===0,f.join(' | '))}await ctx.close()}

 // ---- Motion frames (paused real transitions) ----
 {const {ctx,page:p}=await newPage(browser,1440,900);
  await pausedFrames(p,'alert-panel-1440','view=dashboard',"document.querySelector('[data-alert=\"DEMO-E02\"]').click();await new Promise(r=>setTimeout(r,30))",[0,80,160,240]);
  // hover transitions start on mouse move; pause them right away at t (no settle in between)
  const hoverFrames=async(name,sel,times,clip)=>{for(const t of times){await load(p,'view=dashboard');await p.mouse.move(5,890);const b=await p.locator(sel).boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);
   await p.evaluate(t=>{document.body.offsetWidth;for(const a of document.getAnimations()){a.pause();a.currentTime=t}},t);await p.screenshot({path:path.join(FRAMES,`${name}-t${String(t).padStart(3,'0')}.png`),clip})}};
  await hoverFrames('kpi-hover-1440','.kcard >> nth=2',[0,60,120,180],{x:340,y:180,width:1020,height:230});
  await hoverFrames('chart-hover-1440','[data-week="1"] .hit',[0,60,120],{x:340,y:390,width:680,height:480});
  await ctx.close()}
 // KPI hover frames need the hover to start after the pause hook: capture hover end-state separately for clarity
 {const {ctx,page:p}=await newPage(browser,1440,900);await load(p,'view=dashboard');await p.hover('.kcard >> nth=2');await p.waitForTimeout(260);await p.screenshot({path:path.join(FRAMES,'kpi-hover-end-1440.png'),clip:{x:340,y:180,width:1020,height:230}});
  await p.hover('[data-week="1"] .hit');await p.waitForTimeout(200);await p.screenshot({path:path.join(FRAMES,'chart-hover-end-1440.png'),clip:{x:340,y:390,width:680,height:480}});await ctx.close()}

 // ---- Interaction videos ----
 for(const [w,h,name,m] of [[1440,900,'v2-interactions-1440.webm',false],[390,844,'v2-interactions-390.webm',true]]){const dir=fs.mkdtempSync(path.join(require('os').tmpdir(),'baoq-v2-video-'));
  const ctx=await browser.newContext({viewport:{width:w,height:h},recordVideo:{dir,size:{width:w,height:h}},...(m?mob(390):{})});const p=await ctx.newPage();const tap=s=>m?p.tap(s):p.click(s);const pause=ms=>p.waitForTimeout(ms);
  await p.goto(url('view=dashboard'));await pause(900);if(!m){await p.hover('.kcard >> nth=0');await pause(500);await p.hover('.kcard >> nth=2');await pause(500);await p.hover('[data-week="1"] .hit');await pause(700)}
  await tap('[data-alert="DEMO-E02"]');await pause(900);await tap('[data-close="alert"]');await pause(600);
  await tap('[data-alert="aging"]');await pause(800);await tap('.sheet-actions a.btn-primary');await pause(900);
  await p.goto(url('view=dashboard'));await pause(600);await p.evaluate(()=>window.scrollTo({top:900}));await pause(600);await tap('section[aria-labelledby="channel-h"] .hbars a >> nth=1');await pause(900);
  await p.goto(url('view=policy&group=reconcile'));await pause(700);await tap('.pol-link[data-group="pricing"]');await pause(700);await p.fill('#pf-pricing-margin','25');await p.fill('#pex-pricing','750000');await pause(900);
  const v=p.video();await ctx.close();await v.saveAs(path.join(VIDEO,name));fs.rmSync(dir,{recursive:true,force:true})}

 await browser.close();
 check('no page or console errors',report.errors.length===0,report.errors.join(' | '));
 fs.writeFileSync(path.join(root,'mockup','capture-report.json'),JSON.stringify(report,null,2));
 for(const c of report.checks)console.log(c.result.padEnd(4),c.name,c.detail&&c.result==='FAIL'?'— '+c.detail:'');
 console.log('PASS',report.checks.filter(c=>c.result==='PASS').length,'FAIL',report.checks.filter(c=>c.result==='FAIL').length,'firstTaskTop',JSON.stringify(report.firstTaskTop));
})().catch(e=>{console.error(e);process.exit(1)});
