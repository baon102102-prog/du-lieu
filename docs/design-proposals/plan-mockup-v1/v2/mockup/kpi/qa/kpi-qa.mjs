/* KPI module QA, inside the dashboard V2 shell (server on 127.0.0.1:8788). The real snapshot is only READ; scenario tests inject synthetic
   data in the browser (route interception), so the snapshot file never changes.
   PLAYWRIGHT_BROWSERS_PATH=$PWD/frontend/.browsers .node/bin/node docs/design-proposals/plan-mockup-v1/v2/mockup/kpi/qa/kpi-qa.mjs */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const here=path.dirname(fileURLToPath(import.meta.url)),kpi=path.join(here,'..'),repo=path.join(here,'../../../../../../..');
const require=createRequire(path.join(repo,'frontend/package.json'));
const {chromium}=require('@playwright/test');
const {analyze}=await import(pathToFileURL(path.join(kpi,'income.mjs')));
const D='http://127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html#view=kpi';
const SHOTS=path.join(here,'shots');mkdirSync(SHOTS,{recursive:true});
const snap=JSON.parse(readFileSync(path.join(kpi,'snapshot.json'),'utf8'));
const results=[],errors=[];
const check=async(name,fn)=>{try{const d=await fn();results.push({name,ok:true,detail:d||''});console.log('PASS  '+name+(d?'  → '+d:''))}catch(e){const m=String(e.message).split('\n').slice(0,3).join(' | ');results.push({name,ok:false,detail:m});console.log('FAIL  '+name+'\n      '+m)}};
const eq=(a,b,m='')=>{if(a!==b)throw new Error(`${m} expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`)};
const ok=(c,m)=>{if(!c)throw new Error(m)};
const browser=await chromium.launch();
async function open(w=1440,h=900,o={},route){const ctx=await browser.newContext({viewport:{width:w,height:h},...(w<500?{isMobile:true,hasTouch:true,deviceScaleFactor:2}:{}),...o});const p=await ctx.newPage();p.on('pageerror',e=>errors.push('pageerror: '+e.message));p.on('console',m=>{if(m.type()==='error')errors.push('console.error: '+m.text())});if(route)await p.route('**/kpi/snapshot.json*',route);return {ctx,p}}
const ready=async p=>{await p.waitForSelector('.mod-kpi #kview[aria-busy=false] > *',{timeout:8000});await p.waitForTimeout(80)};
const go=async(p,h='')=>{await p.goto(D+(h?'&'+h:''));await p.reload();await ready(p)};
const txt=async(p,s)=>(await p.locator(s).first().innerText()).replace(/\s+/g,' ').trim();
const mask=p=>p.addStyleTag({content:'.sens{filter:blur(7px)!important}.site-header{position:static!important}'});
const shot=async(p,n,full=false)=>{try{await mask(p);await p.screenshot({path:path.join(SHOTS,n+'.png'),fullPage:full})}catch(e){results.push({name:'screenshot '+n,ok:false,detail:e.message})}};
const A=analyze(snap),cnt=s=>A.records.filter(r=>r.state===s).length;
const card=(p,n)=>p.locator('.k-sale',{has:p.locator('.k-name',{hasText:new RegExp('^'+n+'$')})});
const row=(p,n,label)=>card(p,n).locator('.comp',{hasText:label});

/* ---------- income-first overview (real snapshot) ---------- */
{const {ctx,p}=await open(1512,827);await go(p);
 await check('income first: sale cards come before the four totals and the first card is on screen at 1512×827',async()=>{
  const r=await p.evaluate(()=>{const s=document.querySelector('.k-sale').getBoundingClientRect(),k=document.querySelector('.k-kpis').getBoundingClientRect();return {saleTop:Math.round(s.top),saleBottom:Math.round(s.bottom),kpiTop:Math.round(k.top),vh:innerHeight}});
  ok(r.saleTop<r.vh-200&&r.saleTop<r.kpiTop,JSON.stringify(r));return `sale top ${r.saleTop} < viewport ${r.vh}; totals at ${r.kpiTop}`});
 await check('metadata is one short strip (period, as-of, coverage, partial-sample warning); long text sits behind details',async()=>{
  const t=await txt(p,'.k-strip');ok(/Mô phỏng chính sách 11\/2026/.test(t)&&/26\/10–30\/10 · 5 ngày/.test(t)&&/As-of 31\/10\/2026 00:01 \(UTC\+7\)/.test(t)&&/6\/134 đơn đọc chi tiết/.test(t)&&/1\/47 phiếu có sale/.test(t)&&/Mẫu một phần/.test(t)&&/Không phải thu nhập thực/.test(t),t);
  eq(await p.locator('.k-more').evaluate(d=>d.open),false);const h=await p.locator('.k-ctx').evaluate(e=>e.getBoundingClientRect().height);ok(h<=140,'strip height '+h);
  await p.locator('.k-more summary').click();ok(/lương cơ bản chưa cấu hình/.test(await txt(p,'.k-more')),'details text');await p.locator('.k-more summary').click()});
 await check('every sale card: thresholds say "Chưa đủ dữ liệu" (never 0), money mechanisms are separate rows, salary is "Chưa cấu hình"',async()=>{
  eq(await p.locator('.k-sale').count(),A.sales.length);
  for(const s of A.sales){for(const l of ['Hoa hồng bán lũy tiến','Thưởng cá nhân 1%','Cross-sale'])ok(/Chưa đủ dữ liệu/.test(await row(p,s.name,l).innerText()),s.name+' '+l);
   ok(/Chưa cấu hình/.test(await row(p,s.name,'Lương cơ bản').innerText()),s.name+' salary');eq(await card(p,s.name).locator('.comp.is-static',{hasText:'Lương cơ bản'}).count(),1,'salary row is not a link');
   const tot=await card(p,s.name).locator('.k-total .kvalue').innerText();eq(tot.trim(),'Chưa đủ dữ liệu',s.name+' total')}});
 await check('purchase / adjustment wording: waiting = "Chờ xác minh"; nothing in the sample = "Chưa thấy trong mẫu" (never "Không có", never 0)',async()=>{
  ok(/Chờ xác minh/.test(await row(p,'Linh','Thu mua').innerText()));ok(/Chưa thấy trong mẫu/.test(await row(p,'My','Thu mua').innerText()));ok(/Chưa thấy trong mẫu/.test(await row(p,'My','Điều chỉnh').innerText()));
  const all=await p.locator('.mod-kpi').innerText();ok(!/Không có\b/.test(all.replace(/Không có khoản|Không có bản ghi/g,'')),'no "Không có" claim')});
 await check('the "no 0" explanation appears once, not on every card; the partial-income warning is kept',async()=>{
  const cnt0=async()=>((await p.locator('.mod-kpi').innerText()).match(/không hiển thị 0/gi)||[]).length;eq(await cnt0(),0,'closed: explanation stays inside the details, not on cards');await p.locator('.k-more summary').click();await p.waitForTimeout(150);eq(await cnt0(),1,'opened details: exactly one explanation');await p.locator('.k-more summary').click();await p.waitForTimeout(100);eq(await cnt0(),0,'closed again');ok(/Chưa phải toàn bộ thu nhập|không phải toàn bộ thu nhập/i.test(await p.locator('.k-more').innerHTML()),'income warning kept')});
 await check('four totals: hero "Chưa đủ dữ liệu" (not 0), verified sales 101,8 tr, waiting and excluded counts equal the model',async()=>{
  const k=await p.locator('.k-kpis .kcard').allInnerTexts();eq(k.length,4);ok(/Chưa đủ dữ liệu/.test(k[0])&&!/\b0 ₫/.test(k[0]),k[0]);ok(k[1].includes('101,8 tr'),k[1]);ok(k[2].includes(String(cnt('pending'))),k[2]);ok(k[3].includes(String(cnt('excluded'))),k[3]);
  await p.locator('.kcard.hero .klink').click();await p.waitForTimeout(250);ok(!/k_view=/.test(p.url()),'hero link scrolls, does not navigate')});
 await shot(p,'income-1512x827');await ctx.close()}

/* ---------- drilldown: component → documents → source ---------- */
{const {ctx,p}=await open();await go(p);const linhOrder=A.records.find(r=>r.sale==='Linh'&&r.kind==='selling'&&r.state==='provisional');
 await check('click a money line → exactly the documents behind it; record → exact source link; Escape; Back to the same place',async()=>{
  await row(p,'Linh','Hoa hồng bán lũy tiến').click();await p.waitForTimeout(150);ok(/k_view=list/.test(p.url())&&/k_sale=Linh/.test(p.url())&&/k_state=provisional/.test(p.url()),p.url());eq(await p.locator('.k-table tbody tr').count(),1);
  ok(/Quay lại Thu nhập sale/.test(await txt(p,'.k-back')),'back label');await p.locator('.k-table [data-open]').click();await p.waitForTimeout(320);
  const a=p.locator('dialog[open] a.btn-primary');eq(await a.getAttribute('href'),linhOrder.url);eq(await a.getAttribute('rel'),'noopener noreferrer');ok(await p.locator('dialog[open] .checks li').count()>=4,'conditions');await shot(p,'kpi-record-1440');
  await p.keyboard.press('Escape');await p.waitForTimeout(300);eq(await p.locator('dialog[open]').count(),0);eq(await p.evaluate(()=>document.activeElement.dataset.open),linhOrder.code);
  await p.locator('.k-back').click();await p.waitForTimeout(200);ok(await p.locator('.k-sale-grid').count()===1,'income again')});
 await check('thu mua line opens the receipt that is waiting; adjustments with nothing seen do not link anywhere',async()=>{
  await row(p,'Linh','Thu mua').click();await p.waitForTimeout(150);eq(await p.locator('.k-table tbody tr').count(),1);ok(/Chờ xác minh/.test(await txt(p,'.k-table tbody tr')),'pending receipt');await p.goBack();await p.waitForTimeout(150);
  eq(await row(p,'My','Điều chỉnh').evaluate(e=>e.tagName),'DIV','static row')});
 await ctx.close()}

/* ---------- profile ---------- */
{const {ctx,p}=await open();await go(p,'k_view=sale&k_sale=Linh');
 await check('profile: one grand line (Chưa đủ dữ liệu), each mechanism its own card with rule + status; salary separate',async()=>{
  eq(await txt(p,'.k-grand .kvalue'),'Chưa đủ dữ liệu');const h=await p.locator('.k-comp h3').allInnerTexts();eq(h.join('|'),'Hoa hồng / thưởng đã xác minh|Hoa hồng bán lũy tiến|Thưởng cá nhân 1%|Cross-sale|Thu mua 1,5%|Điều chỉnh (hoàn / hủy / quay đầu)|Lương cơ bản');
  ok(/Chưa kết luận/.test(await txt(p,'.and-result')),'AND banner not a verdict');eq(await p.locator('.and-block [role=progressbar]').count(),2);ok(/Chưa phải kết luận/.test(await txt(p,'.k-comp:has(.and-block)')),'sample caption');
  eq(await p.locator('.table:not(.k-table) tbody tr').count(),6,'6 tiers');const rates=(await p.locator('.table:not(.k-table) tbody tr').allInnerTexts()).map(t=>t.match(/(\d+(?:,\d+)?)%/)[1]);eq(rates.join(' '),'0,5 0,75 1 1,25 1,35 1,5')});
 await check('profile: Bán shop drills to shop-only, Bán cá nhân to personal-only (empty on the real sample, never a fake 0 total)',async()=>{
  await p.locator('.k-stat',{hasText:'Bán shop'}).click();await p.waitForTimeout(150);ok(/k_pers=0/.test(p.url()),p.url());ok(/Chỉ nguồn shop/.test(await txt(p,'.k-active')),'tag');eq(await p.locator('.k-table tbody tr').count(),1)});
 await ctx.close()}

/* ---------- todo / list / period / states ---------- */
{const {ctx,p}=await open();await go(p,'k_view=todo');
 await check('todo: groups sum to every waiting record, each with missing evidence and next step; "Nhận việc" locked with a reason',async()=>{
  const c=(await p.locator('.k-todo .k-count').allInnerTexts()).map(Number);eq(c.reduce((a,b)=>a+b,0),cnt('pending'));const b=p.locator('.k-todo button').first();ok(await b.isDisabled());ok(/Chưa có hệ thống giao việc/.test(await txt(p,'#'+await b.getAttribute('aria-describedby'))),'reason');
  const first=p.locator('.k-todo').first(),n=Number(await first.locator('.k-count').innerText());await first.locator('a.btn-primary').click();await p.waitForTimeout(150);eq(await p.locator('.k-table tbody tr').count(),n);ok(/Quay lại Cần xử lý/.test(await txt(p,'.k-back')),'back')});
 await go(p,'k_view=list');
 await check('list: chips keep focus and URL; search keeps focus without growing history; empty state is not "no data"; table scrolls in its own region',async()=>{
  await p.locator('.k-seg2 a',{hasText:'Chờ xác minh'}).click();await p.waitForTimeout(100);eq(await p.locator('.k-table tbody tr').count(),cnt('pending'));ok(/k_state=pending/.test(p.url()));eq(await p.evaluate(()=>document.activeElement.dataset.fid),'st-pending');
  await go(p,'k_view=list');const h0=await p.evaluate(()=>history.length);await p.locator('#kq').click();await p.keyboard.type('livestream',{delay:15});await p.waitForTimeout(100);eq(await p.evaluate(()=>document.activeElement.id),'kq');eq(await p.evaluate(()=>history.length),h0);
  await p.locator('#kq').fill('khongtontai999');await p.waitForTimeout(100);ok(/Không có bản ghi khác với chưa có dữ liệu/.test(await txt(p,'#kresults')),'empty wording');await p.locator('#kresults a.btn').click();await p.waitForTimeout(100);eq(await p.locator('.k-table tbody tr').count(),A.records.length);
  const r=await p.evaluate(()=>{const t=document.querySelector('.k-scroll');return {more:t.scrollHeight>t.clientHeight,tab:t.tabIndex}});ok(r.more&&r.tab===0,'scroll region')});
 await check('period without a snapshot: empty state with no figures; Oct is "not recalculated"; rules stay readable',async()=>{
  await p.locator('#kperiod').selectOption('nov');await p.waitForTimeout(100);const t=await txt(p,'#kview');ok(/Chưa có snapshot cho tháng 11\/2026/.test(t)&&!/\d+ ₫/.test(t),t.slice(0,120));await p.locator('#kperiod').selectOption('oct');await p.waitForTimeout(100);ok(/không tính lại/.test(await txt(p,'#kview')));
  await p.locator('.k-tabs a',{hasText:'Cách tính'}).click();await p.waitForTimeout(100);eq(await p.locator('.k-rules li').count(),6);ok(/Chưa thấy trong mẫu/.test(await txt(p,'.k-bullets')),'wording explained')});
 await ctx.close()}
{const {ctx,p}=await open(1440,900,{},async r=>{await new Promise(x=>setTimeout(x,700));await r.continue()});
 await check('loading shows a message that ends (no endless spinner)',async()=>{await p.goto(D);await p.waitForSelector('.mod-kpi .mod-loading',{timeout:4000});await ready(p);eq(await p.locator('.mod-kpi .mod-loading').count(),0)});await ctx.close()}
{let fail=true;const {ctx,p}=await open(1440,900,{},async r=>{if(fail)await r.fulfill({status:500,body:'x'});else await r.continue()});
 await check('error names the problem; "Thử lại" really reloads the snapshot',async()=>{await p.goto(D);await p.locator('#kretry').waitFor();ok(/Không tải được snapshot/.test(await txt(p,'#kview')));fail=false;await p.locator('#kretry').click();await ready(p);ok(await p.locator('.k-sale').count()>0,'cards back')});await ctx.close()}

/* ---------- scenarios on synthetic data (browser-only) ---------- */
const mk=(code,sale,amount,personal,items=1)=>({code,id:code,date:'2026-10-28',source:personal?'Instagram':'Facebook',amount,status:'Đã thanh toán',sale,personal,paid:amount,items,detail:true,url:'https://baoqluxury.mysapo.net/admin/orders/'+code,creator:sale,sku:['QA'],evidence:'synthetic'});
const rc=(code,sale,amt)=>({code,date:'2026-10-29',amount:amt,status:'Đã nhập hàng',sale,paid:amt,paymentVerified:true,allocations:[{id:'P-'+code,amount:amt,paymentAmount:amt}],url:'https://baoqluxury.kiotviet.vn/x/'+code,evidence:'synthetic'});
const fixture=(mut)=>async r=>{const j=JSON.parse(readFileSync(path.join(kpi,'snapshot.json'),'utf8'));mut(j);await r.fulfill({json:j})};
const prof=async(p,s)=>{await p.goto(D+'&k_view=sale&k_sale='+encodeURIComponent(s));await p.reload();await ready(p);return txt(p,'.mod-kpi')};
{const {ctx,p}=await open(1440,900,{},fixture(j=>{j.orders.push(mk('QA-A1','QA Alpha',1e8,true),mk('QA-A2','QA Alpha',4e8,false,12));j.receipts.push(rc('QA-R1','QA Alpha',1e7))}));
 await check('thresholds met on a partial sample are real evidence: amounts equal the model; salary and unverified parts stay out of the total',async()=>{
  await go(p);const c=card(p,'QA Alpha');const t=await c.innerText();ok(t.includes('2.500.000 ₫')&&t.includes('1.000.000 ₫')&&t.includes('150.000 ₫'),t.replace(/\s+/g,' ').slice(0,300));
  eq((await c.locator('.k-total .kvalue').innerText()).trim(),'4.650.000 ₫');ok(/Chưa phải toàn bộ thu nhập/.test(await c.locator('.k-total').innerText()),'not whole income');ok(/Chưa cấu hình/.test(await c.locator('.comp.is-static',{hasText:'Lương cơ bản'}).innerText()),'salary');
  ok(/4\.650\.000/.test(await p.locator('.kcard.hero').innerText()),'hero total uses verified parts only')});
 await check('profile: Bán shop drills to shop-only (400 tr), Bán cá nhân to personal-only (100 tr); mixed lists never add bán + thu mua',async()=>{
  await prof(p,'QA Alpha');await p.locator('.k-stat',{hasText:'Bán shop'}).click();await p.waitForTimeout(150);eq((await p.locator('.k-table [data-open]').allInnerTexts()).join(),'QA-A2');ok((await txt(p,'#result-count')).includes('400.000.000')&&!(await txt(p,'#result-count')).includes('500.000.000'),'sum');
  await p.locator('.k-back').click();await p.waitForTimeout(150);await p.locator('.k-stat',{hasText:'Bán cá nhân'}).click();await p.waitForTimeout(150);eq((await p.locator('.k-table [data-open]').allInnerTexts()).join(),'QA-A1');
  await p.goto(D+'&k_view=list&k_state=provisional&k_sale=QA%20Alpha');await p.reload();await ready(p);eq(await p.locator('.k-table tbody tr').count(),3);const t=await txt(p,'#result-count');ok(/Bán: doanh số tính vào KPI 500\.000\.000 ₫/.test(t)&&/Thu mua: tiền đã đối soát làm nền 1,5% 10\.000\.000 ₫/.test(t)&&/không cộng chung/.test(t)&&!t.includes('510.000.000'),t)});
 await check('cross-sale: both branches met still show one 1.000.000 ₫, never 2',async()=>{const t=await prof(p,'QA Alpha');ok(t.includes('1.000.000 ₫')&&!t.includes('2.000.000 ₫'),'one million');eq(await p.locator('.and-grid.or [role=progressbar]').count(),2)});
 await ctx.close()}
{const {ctx,p}=await open(1440,900,{},fixture(j=>{j.orders.push(mk('QA-B1','QA Beta',99999999,true),mk('QA-B2','QA Beta',29e7,false),mk('QA-B3','QA Beta',29e7,false),mk('QA-E1','QA Eps',1e6,false));j.receipts.push(rc('QA-R2','QA Eps',35e7))}));
 await check('personal 99.999.999 on a partial sample: "Chưa đủ dữ liệu", not 0 and not "chưa đạt"; no thưởng amount shown',async()=>{
  await go(p);const c=card(p,'QA Beta');ok(/Chưa đủ dữ liệu/.test(await c.locator('.comp',{hasText:'Thưởng cá nhân'}).innerText()),'personal');eq((await c.locator('.k-total .kvalue').innerText()).trim(),'Chưa đủ dữ liệu');ok(!/Chưa đạt/.test(await c.innerText()),'no verdict')});
 await check('cross-sale branch B ignores purchase receipts: a 350 tr verified receipt is not a ≥300 tr order',async()=>{
  const t=await prof(p,'QA Eps');ok(!/Được 1 triệu|1\.000\.000 ₫/.test(await txt(p,'.and-grid.or')+await txt(p,'.k-comp:nth-of-type(4)')),'no reward');const m=await p.locator('.and-grid.or .meter').nth(1).innerText();ok(/1 tr \/ 300 tr/.test(m.replace(/\s+/g,' ')),m)});
 await ctx.close()}
{const {ctx,p}=await open(1440,900,{},fixture(j=>{j.period=['2026-10-20','2026-11-16'];j.orders=[mk('QA-C1','QA Cee',1e6,false),mk('QA-C2','QA Cee',2e6,true)];j.receipts=[];j.events=[]}));
 await check('28 days cutting a month, every order read: still "Chưa đủ dữ liệu" (coverage is never inferred from days or counts)',async()=>{await go(p);const c=card(p,'QA Cee');ok(/Chưa đủ dữ liệu/.test(await c.locator('.comp',{hasText:'Hoa hồng bán'}).innerText()),'selling');ok(!/Chưa đạt/.test(await c.innerText()),'no verdict');ok(/Chưa thấy trong mẫu/.test(await c.locator('.comp',{hasText:'Thu mua'}).innerText()),'acq unseen')});await ctx.close()}
{const {ctx,p}=await open(1440,900,{},fixture(j=>{j.orders=[mk('QA-D1','QA Dee',1e6,false),{...mk('QA-D2','QA Dee',2e6,false),status:'Thanh toán một phần',paid:1e6}];j.receipts=[];j.events=[];j.proof={mechanisms:{selling:true,personal:true,cross:true,acq:true,adjust:true}}}));
 await check('detail=true but a record is still pending: even with proof the answer stays "Chưa đủ dữ liệu"',async()=>{await go(p);const c=card(p,'QA Dee');ok(/Chưa đủ dữ liệu/.test(await c.locator('.comp',{hasText:'Hoa hồng bán'}).innerText())&&!/Chưa đạt/.test(await c.innerText()),(await c.innerText()).slice(0,200))});await ctx.close()}
{const {ctx,p}=await open(1440,900,{},fixture(j=>{j.orders=[mk('QA-N1','QA Nil',1e6,false)];j.receipts=[];j.events=[];j.proof={mechanisms:{selling:true,personal:true,cross:true,acq:true,adjust:true}}}));
 await check('only explicit proof with nothing pending allows "Chưa đạt" / "Không có" (and then amount 0 is honest)',async()=>{await go(p);const c=card(p,'QA Nil');const t=await c.innerText();ok(/Chưa đạt · 0 ₫/.test(t)&&/Không có/.test(t),t.replace(/\s+/g,' ').slice(0,300));eq((await c.locator('.k-total .kvalue').innerText()).trim(),'0 ₫','total 0 only with proof')});await ctx.close()}

/* ---------- a11y ---------- */
const contrastJS=()=>{const parse=s=>{const m=s.match(/rgba?\(([^)]+)\)/);if(!m)return [0,0,0,0];const a=m[1].split(/[ ,\/]+/).map(Number);return [a[0],a[1],a[2],a[3]??1]};const blend=(f,b)=>{const a=f[3];return [f[0]*a+b[0]*(1-a),f[1]*a+b[1]*(1-a),f[2]*a+b[2]*(1-a),1]};
 const lum=c=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2])};
 const bgOf=e=>{const st=[];for(let n=e;n;n=n.parentElement)st.push(parse(getComputedStyle(n).backgroundColor));let b=[255,255,255,1];for(const c of st.reverse())if(c[3]>0)b=blend(c,b);return b};
 const bad=[];const w=document.createTreeWalker(document.querySelector('.mod-kpi'),NodeFilter.SHOW_TEXT);
 for(let n=w.nextNode();n;n=w.nextNode()){if(!n.textContent.trim())continue;const e=n.parentElement;if(!e.checkVisibility?.()||e.closest('[disabled],.vh,.sens'))continue;const c=getComputedStyle(e);const bg=bgOf(e),fg=blend(parse(c.color),bg);const L1=lum(fg),L2=lum(bg),r=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);const big=parseFloat(c.fontSize)>=24||(parseFloat(c.fontSize)>=18.66&&+c.fontWeight>=700);if(r<(big?3:4.5))bad.push(`${r.toFixed(2)} ${e.tagName}.${e.className} "${n.textContent.trim().slice(0,24)}"`)}
 return [...new Set(bad)].slice(0,6)};
{const {ctx,p}=await open();for(const [n,h] of [['income',''],['sale','k_view=sale&k_sale=Linh'],['todo','k_view=todo'],['list','k_view=list'],['rules','k_view=rules']])await check('text contrast AA: '+n,async()=>{await go(p,h);const b=await p.evaluate(contrastJS);eq(b.length,0,b.join(' ; '))});
 await go(p,'k_view=list&k_state=provisional');await p.locator('.k-table [data-open]').first().click();await p.waitForTimeout(320);await check('text contrast AA: dialog',async()=>{const b=await p.evaluate(contrastJS);eq(b.length,0,b.join(' ; '))});await p.keyboard.press('Escape');
 await check('focus ring visible on money lines, links, selects and inputs',async()=>{await go(p);const bad=[];for(const sel of ['.k-sale a.comp','.k-sale a.klink','.k-tabs a','#kperiod']){const e=p.locator(sel).first();await e.focus();await p.keyboard.press('Shift+Tab');await p.keyboard.press('Tab');const o=await e.evaluate(n=>{const c=getComputedStyle(n);return c.outlineStyle!=='none'&&parseFloat(c.outlineWidth)>=2});if(!o)bad.push(sel)}eq(bad.length,0,'no ring: '+bad)});await ctx.close()}
await check('no console errors or page errors in the whole run',()=>eq(errors.filter(e=>!/status of 500|Failed to load resource/.test(e)).length,0,errors.slice(0,3).join(' | ')));
await browser.close();
const f=results.filter(r=>!r.ok);console.log(`\nKPI QA: ${results.length-f.length} passed, ${f.length} failed`);
writeFileSync(path.join(here,'kpi-results.json'),JSON.stringify(results,null,1));process.exit(f.length?1:0);
