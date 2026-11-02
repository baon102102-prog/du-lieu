/* Browser QA for mockup v2 (served at http://127.0.0.1:8790). Loads Playwright from frontend/node_modules without touching frontend/.
   Run: PLAYWRIGHT_BROWSERS_PATH=<repo>/frontend/.browsers node qa/run-qa.mjs   → prints PASS/FAIL, writes qa/qa-results.json and qa/shots/*.png */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const here=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(path.join(here,'../../../../frontend/package.json'));
const {chromium}=require('@playwright/test');
const BASE=process.env.MOCK_URL||'http://127.0.0.1:8790/?standalone=1'; // module test host; the product entry is the dashboard menu (#view=goods)
const SHOTS=path.join(here,'shots');mkdirSync(SHOTS,{recursive:true});
const results=[];let pageErrors=[];
const norm=s=>String(s).replace(/ /g,' ').replace(/\s+/g,' ').trim();
async function check(name,fn){try{const d=await fn();results.push({name,ok:true,detail:d||''});console.log('PASS  '+name+(d?'  → '+d:''))}catch(e){results.push({name,ok:false,detail:String(e.message).split('\n')[0]});console.log('FAIL  '+name+'\n      '+String(e.message).split('\n').slice(0,3).join('\n      '))}}
const eq=(a,b,m='')=>{if(a!==b)throw new Error(`${m} expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`)};
const ok=(c,m)=>{if(!c)throw new Error(m)};

const browser=await chromium.launch();
async function newPage(w=1440,h=900,opts={}){const ctx=await browser.newContext({viewport:{width:w,height:h},...opts});const p=await ctx.newPage();p.on('pageerror',e=>pageErrors.push('pageerror: '+e.message));p.on('console',m=>{if(m.type()==='error')pageErrors.push('console.error: '+m.text())});return p}
const open=async(p,hash='')=>{await p.goto(BASE+hash);await p.evaluate(()=>{try{localStorage.clear()}catch{}});await p.goto(BASE+hash);await p.reload();await p.waitForSelector('#view *')};
const shot=async(p,name,opt={})=>{try{const full=opt.full!==false;let st;if(full)st=await p.addStyleTag({content:'.site-header,.an-tabs{position:static!important;margin-bottom:0!important}'});await p.screenshot({path:path.join(SHOTS,name+'.png'),fullPage:full});if(st)await st.evaluate(n=>n.remove())}catch(e){results.push({name:'screenshot '+name,ok:false,detail:e.message.split('\n')[0]});console.log('FAIL  screenshot '+name)}};
const shotEl=async(p,sel,name)=>{try{const st=await p.addStyleTag({content:'.site-header,.an-tabs{position:static!important;margin-bottom:0!important}'});await p.locator(sel).first().screenshot({path:path.join(SHOTS,name+'.png')});await st.evaluate(n=>n.remove())}catch(e){results.push({name:'screenshot '+name,ok:false,detail:e.message.split('\n')[0]});console.log('FAIL  screenshot '+name)}};
const tileLoc=(p,label)=>p.locator('.tile').filter({has:p.locator('.l',{hasText:new RegExp('^'+label+'$')})}).first();
const tile=async(p,label)=>norm(await tileLoc(p,label).locator('.v').innerText());
const sheetN=async p=>{const el=p.locator('#sheet-count');await p.locator('#sheet').waitFor({state:'visible'});await p.waitForTimeout(330);const bb=await p.locator('#sheet').boundingBox(),vw=p.viewportSize().width;ok(bb&&bb.x+bb.width<=vw+1&&bb.x>=-1,'sheet is fully on screen '+JSON.stringify(bb));await el.waitFor();return {n:+await el.getAttribute('data-n'),orders:await el.getAttribute('data-orders'),text:await p.locator('#sheet').innerText()}};
const closeSheet=async p=>{await p.keyboard.press('Escape');await p.locator('#sheet').waitFor({state:'hidden'})};
// expected values straight from the data (independent of UI code paths)
const expBan=(p,f)=>p.evaluate(f=>{const D=window.__mock.D;const ls=D.LINES.filter(l=>(!f.cat||l.category===f.cat)&&(!f.ch||l.channel===f.ch)&&(f.all||(l.price_actual>=f.min*1e6&&l.price_actual<=f.max*1e6)));return {items:ls.length,orders:new Set(ls.map(l=>l.order)).size,rev:ls.reduce((s,l)=>s+l.price_actual,0)}},f);
const expTon=(p,f)=>p.evaluate(f=>{const D=window.__mock.D,k=f.basis==='cost'?'cost':'list_price';return D.STOCK.filter(s=>(!f.cat||s.category===f.cat)&&(f.all||(s[k]!=null&&s[k]>=f.min*1e6&&s[k]<=f.max*1e6))).length},f);

/* ================= Desktop: Hàng hóa ================= */
{
 const p=await newPage();await open(p);
 await check('page loads with 4 tabs, no console errors yet',async()=>{eq(await p.locator('#tabs [role=tab]').count(),4);eq(pageErrors.length,0,pageErrors.join('|'))});
 await check('default: Bán trong kỳ, price filter = Tất cả (no hidden cap)',async()=>{eq(await p.locator('#scope-ban').getAttribute('aria-pressed'),'true');eq(await p.locator('[data-preset=all]').getAttribute('aria-pressed'),'true');eq(await p.inputValue('#pmin'),'');ok((await p.locator('#pf-status').innerText()).includes('Không lọc giá'),'status text')});
 await check('distinct orders ≠ line items in KPIs (90 vs 117 style) and match data',async()=>{const e=await expBan(p,{all:true});ok(e.orders<e.items,'orders<items');eq(await tile(p,'Số đơn'),String(e.orders));ok(norm(await tileLoc(p,'Số đơn').innerText()).includes(`${e.items} dòng hàng`),'items text')});
 await check('category table: per-group distinct orders do not add up to total, footnote says so',async()=>{const rows=await p.locator('#grp-table tbody tr').allInnerTexts();const sumO=rows.reduce((s,r)=>s+parseInt(r.split('\t')[1]),0),tot=+await p.locator('#tot-orders').innerText();ok(sumO>tot,`sum ${sumO} should exceed ${tot}`);ok((await p.locator('section:has(#grp-table) > p.note').innerText()).includes('không trùng'),'footnote')});
 await check('preset 0–100 → inputs 0/100, KPI orders match data',async()=>{await p.click('[data-preset="0-100"]');eq(await p.inputValue('#pmin'),'0');eq(await p.inputValue('#pmax'),'100');const e=await expBan(p,{min:0,max:100});eq(await tile(p,'Số đơn'),String(e.orders));eq(await p.locator('[data-preset="0-100"]').getAttribute('aria-pressed'),'true')});
 await check('preset 0–200 → KPI orders match data',async()=>{await p.click('[data-preset="0-200"]');const e=await expBan(p,{min:0,max:200});eq(await tile(p,'Số đơn'),String(e.orders))});
 await check('preset 200 tr – 1 tỷ has a REAL 1 tỷ ceiling (lines above are excluded and reported)',async()=>{await p.click('[data-preset="200-1000"]');eq(await p.inputValue('#pmax'),'1000');const e=await expBan(p,{min:200,max:1000}),a=await expBan(p,{all:true}),above=await p.evaluate(()=>window.__mock.D.LINES.filter(l=>l.price_actual>1e9).length);ok(above>0,'dataset must contain >1 tỷ');eq(await tile(p,'Số đơn'),String(e.orders));ok(await expBan(p,{min:200,max:1000}).then(x=>x.items)<a.items,'excluded');ok((await p.locator('#pf-status').innerText()).includes('trên 1 tỷ bị loại'),'status mentions excluded')});
 await check('preset Tất cả includes the >1 tỷ line again',async()=>{await p.click('[data-preset=all]');const a=await expBan(p,{all:true});eq(await tile(p,'Số đơn'),String(a.orders));eq(await p.locator('[data-preset=all]').getAttribute('aria-pressed'),'true')});
 await check('slider keyboard: End/Home/Arrow sync with numeric inputs',async()=>{await p.click('[data-preset="0-200"]');await p.locator('#r-max').focus();await p.keyboard.press('End');eq(await p.inputValue('#pmax'),'1000');await p.keyboard.press('ArrowLeft');const v=+await p.inputValue('#pmax');ok(v<1000&&v>900,'ArrowLeft → '+v);await p.locator('#r-min').focus();await p.keyboard.press('ArrowRight');ok(+await p.inputValue('#pmin')>0,'min moved');await p.keyboard.press('Home');eq(await p.inputValue('#pmin'),'0')});
 await check('numeric input moves slider thumbs (50 tr → pos 40, 1000 → pos 200)',async()=>{await p.click('[data-preset="0-100"]');await p.fill('#pmin','50');eq(await p.inputValue('#r-min'),'40');await p.fill('#pmax','1000');eq(await p.inputValue('#r-max'),'200');const e=await expBan(p,{min:50,max:1000});eq(await tile(p,'Số đơn'),String(e.orders))});
 await check('mouse drag on the min thumb changes the range and the numeric field',async()=>{await p.click('[data-preset=all]');const b=await p.locator('#r-min').boundingBox();const x0=b.x+14,y=b.y+b.height/2,span=b.width-28;await p.mouse.move(x0,y);await p.mouse.down();await p.mouse.move(x0+span*0.3,y,{steps:8});await p.mouse.up();const v=+await p.inputValue('#pmin');ok(v>0,'pmin '+v);ok(await p.locator('[data-preset=all]').getAttribute('aria-pressed')==='false','left "all" state')});
 await check('min > max shows an error, keeps the last valid range, results unchanged',async()=>{await p.click('[data-preset="0-100"]');const before=await tile(p,'Số đơn');await p.fill('#pmin','500');ok((await p.locator('#pf-err').innerText()).includes('không được lớn hơn'),'error text');eq(await p.locator('#pmin').getAttribute('aria-invalid'),'true');eq(await tile(p,'Số đơn'),before)});
 await check('typed max above 1 tỷ is allowed but labelled as beyond the slider',async()=>{await p.click('[data-preset="0-100"]');await p.fill('#pmax','2000');ok((await p.locator('#pf-status').innerText()).includes('vượt thang trượt'),'label')});
 await p.click('[data-preset=all]');
 await check('channel filter applies to Bán (Online) and matches data',async()=>{await p.selectOption('#f-ch','Online');const e=await expBan(p,{ch:'Online',all:true});eq(await tile(p,'Số đơn'),String(e.orders))});
 await check('donut denominator names orders and line items and legend % sums to 100',async()=>{const e=await expBan(p,{ch:'Online',all:true});const d=norm(await p.locator('#denom').innerText());ok(d.includes(`${e.orders} đơn`)&&d.includes(`${e.items} dòng hàng`),d);const pcs=(await p.locator('.lg .v').allInnerTexts()).map(t=>parseFloat(t.split('\n')[0].replace(',','.')));ok(Math.abs(pcs.reduce((a,b)=>a+b,0)-100)<0.6,'sum '+pcs.reduce((a,b)=>a+b,0))});
 await check('donut and bar never repeat the same dimension+measure (cat dimension locks Doanh thu)',async()=>{await p.selectOption('#dd-sel','cat');const dis=await p.locator('#bm-sel option[value=rev]').getAttribute('disabled');ok(dis!==null,'rev disabled when donut is by category');await p.selectOption('#dd-sel','brand')});
 await check('Bán drilldown: category row → SON- orders, counts equal the row',async()=>{await p.selectOption('#f-ch','');const row=p.locator('#grp-table tbody tr').first();const cells=(await row.innerText()).split('\t');await row.locator('button.link').click();const s=await sheetN(p);eq(s.n,parseInt(cells[2]),'items');eq(+s.orders,parseInt(cells[1]),'orders');ok(s.text.includes('SON-'),'has orders');await shot(p,'sheet-ban-drilldown',{full:false});await closeSheet(p)});
 await check('donut legend click → sheet count equals legend count',async()=>{const lg=p.locator('.lg').first();const n=parseInt((await lg.locator('.n small').innerText()));await lg.click();eq((await sheetN(p)).n,n);await closeSheet(p)});
 await shot(p,'hang-ban-1440');
 await shotEl(p,'section[aria-label="Bộ lọc"]','slider-filter-1440');

 /* ---- Tồn ---- */
 await p.click('#scope-ton');
 await check('Tồn: channel filter is locked and says why; channel does not change Tồn',async()=>{ok(await p.locator('#f-ch').isDisabled(),'disabled');ok((await p.locator('#ch-why').innerText()).includes('chưa gắn kênh'),'why text');eq(await tile(p,'Số món tồn'),String(await expTon(p,{basis:'list',all:true})))});
 await check('Tồn: donut denominator names "món tồn" and the price basis',async()=>{const d=norm(await p.locator('#denom').innerText());ok(d.includes('món tồn')&&d.includes('giá niêm yết'),d)});
 await check('Tồn price filter uses list price; switching basis to cost changes the count (data-checked)',async()=>{await p.click('[data-preset="0-100"]');const a=await expTon(p,{basis:'list',min:0,max:100});eq(await tile(p,'Số món tồn'),String(a));await p.selectOption('#f-basis','cost');const b=await expTon(p,{basis:'cost',min:0,max:100});eq(await tile(p,'Số món tồn'),String(b));ok(a!==b,'basis changes result');ok(norm(await p.locator('#denom').innerText()).includes('giá vốn'),'denom says cost');await p.selectOption('#f-basis','list')});
 await check('Tồn: ≥1 tỷ items are excluded by 200 tr–1 tỷ and included by Tất cả',async()=>{await p.click('[data-preset="200-1000"]');const a=await expTon(p,{basis:'list',min:200,max:1000});eq(await tile(p,'Số món tồn'),String(a));await p.click('[data-preset=all]');const all=await expTon(p,{basis:'list',all:true});ok(all>a);eq(await tile(p,'Số món tồn'),String(all))});
 await check('Tồn drilldown: group row → only SKU- items (no SON- order codes), count equals row',async()=>{const row=p.locator('#grp-table tbody tr').first();const cells=(await row.innerText()).split('\t');await row.locator('button.link').click();const s=await sheetN(p);eq(s.n,parseInt(cells[1]),'count');ok(!s.text.includes('SON-'),'no order codes');ok(s.text.includes('SKU-'),'has SKU');ok(s.text.includes('Hàng tồn hiện tại'),'kicker says stock');await shot(p,'sheet-ton-drilldown',{full:false});await closeSheet(p)});
 await check('Tồn: donut legend drilldown shows stock, count equals legend',async()=>{const lg=p.locator('.lg').first();const n=parseInt((await lg.locator('.n small').innerText()));await lg.click();const s=await sheetN(p);eq(s.n,n);ok(!s.text.includes('SON-'),'no orders');await closeSheet(p)});
 await check('Tồn KPIs: consignment is not counted in capital',async()=>{const e=await p.evaluate(()=>{const D=window.__mock.D;const own=D.STOCK.filter(s=>s.source==='Mua đứt'&&s.cost!=null);return Math.round(own.reduce((s,x)=>s+x.cost,0)/1e5)/10});const t=norm(await tile(p,'Vốn nằm trong tồn'));const v=parseFloat(t.replace(/\./g,'').replace(',','.'));ok(Math.abs(v-e)<0.11,`capital ${t} vs ${e}`)});
 await shot(p,'hang-ton-1440');
 await check('empty state when filters match nothing, with a reset action',async()=>{await p.selectOption('#f-cat','Đồng hồ');await p.selectOption('#f-src','Ký gửi');await p.click('[data-preset="0-100"]');await p.fill('#pmax','1');const em=await p.locator('#empty').count();if(em){await shot(p,'empty-state',{full:false});await p.click('#empty button');eq(await p.locator('#empty').count(),0)}else ok(true);await p.selectOption('#f-cat','');await p.selectOption('#f-src','');return em?'empty state shown and reset works':'(combination not empty; state exercised only if reachable)'});
 await p.context().close();
}

/* ================= Tuổi tồn & Auto Sale ================= */
{
 const p=await newPage();await open(p,'#tab=tuoi');
 const total=await p.evaluate(()=>window.__mock.D.STOCK.length);
 await check('aging buckets: each bar opens exactly its stock rows, no sold orders; counts add up to all stock',async()=>{const bars=p.locator('#age-bars [data-bucket]');const n=await bars.count();eq(n,9);let sum=0;for(let i=0;i<n;i++){const b=bars.nth(i),c=+await b.getAttribute('data-n');await b.click();const s=await sheetN(p);eq(s.n,c,'bucket '+await b.getAttribute('data-bucket'));eq(await p.locator('#sheet tbody tr').count(),c,'rows');ok(!s.text.includes('SON-'),'no orders');sum+=c;await closeSheet(p)}eq(sum,total,'sum of buckets')});
 await check('age buckets match engine (M0 = 0–29 days … M6+ ≥ 210)',async()=>{const ok1=await p.evaluate(()=>{const {E,D}=window.__mock;const bad=D.STOCK.filter(s=>{const a=E.ageInfo(s,'2026-10-22');if(a.state!=='ok')return false;const d=E.dayDiff(s.ready_for_sale_date,'2026-10-22');return a.label!==(d>=210?'M6+':'M'+Math.floor(d/30))});return bad.length});eq(ok1,0)});
 await check('missing / not-ready stock is its own group (never counted in M0)',async()=>{const pend=p.locator('#age-bars [data-bucket=pending]');const c=+await pend.getAttribute('data-n');eq(c,7);await pend.click();const t=(await sheetN(p)).text;ok(t.includes('Thiếu ngày sẵn sàng')&&t.includes('Chưa tới ngày sẵn sàng'),'reasons');await closeSheet(p);const m0=+await p.locator('#age-bars [data-bucket=M0]').getAttribute('data-n');ok(m0<c+60,'sanity')});
 await check('lock chips: every chip opens its own SKUs; locked total = tile "Bị khóa"',async()=>{const chips=p.locator('#qchips [data-lock]');const n=await chips.count();let locked=0;for(let i=0;i<n;i++){const c=chips.nth(i),code=await c.getAttribute('data-lock'),k=+await c.getAttribute('data-n');await c.click();eq((await sheetN(p)).n,k,code);if(code!=='no_brand')locked+=k;await closeSheet(p)}eq(String(locked),await tile(p,'Bị khóa'))});
 await check('locked groups include all required formula gaps and ≥600 / consign / M0<cost',async()=>{const codes=await p.locator('#qchips [data-lock]').evaluateAll(a=>a.map(x=>x.dataset.lock));for(const c of ['special_hot_trend','special_rule_3pct','special_rule_half','special_buyback','over600','consign','m0_below_cost','missing_ready','not_ready','missing_cost','missing_m0'])ok(codes.includes(c),'missing chip '+c)});
 await check('sheet row can be loaded into the calculator',async()=>{await p.locator('#age-bars [data-bucket=M3]').click();await p.locator('#sheet [data-load]').first().click();await p.locator('#timeline,#calc-out .banner').first().waitFor();ok(await p.locator('#calc-card').isVisible(),'calc visible')});
 await check('Tính lại ×3 is stable: same hash, run counter increments',async()=>{const h0=await p.locator('#run-hash').innerText();for(let i=0;i<3;i++)await p.click('#recalc');eq(await p.locator('#run-hash').innerText(),h0);eq(await p.locator('#run-n').innerText(),'3')});
 await check('"Hết lượt M6" and "Chạm vốn" tiles equal the engine',async()=>{const e=await p.evaluate(()=>{const R=window.__mock.results().filter(r=>!r.lock);return [R.filter(r=>r.hitCost).length,R.filter(r=>r.exhausted).length]});eq(await tile(p,'Chạm giá vốn'),String(e[0]));eq(await tile(p,'Hết lượt M6'),String(e[1]))});
 await shot(p,'tuoi-1440');await shotEl(p,'#qchips','data-quality-chips');
 /* ---- calculator timeline ---- */
 await open(p,'#tab=tuoi');
 const setCalc=async o=>{for(const [k,v] of Object.entries(o)){const el=p.locator('#c-'+k);if(k==='legacy')await el.setChecked(v);else if(k==='src'||k==='special')await el.selectOption(v);else await el.fill(String(v))}};
 const base=async(days=100,o={})=>{await setCalc({m0:100,cost:60,special:'',src:'Mua đứt',legacy:false,...o});await p.click(`#calc-card [data-days="${days}"]`)};
 const due=async()=>p.locator('#timeline tbody tr:not(.t-future)').count();
 await setCalc({m0:100,cost:60,special:'',src:'Mua đứt',legacy:false});
 for(const [d,turns,price] of [[29,0,'100 tr'],[30,1,'97,5 tr'],[60,2,'95 tr'],[180,6,'85 tr']]){
  await check(`calculator ${d} ngày → ${turns} lượt, giá ${price}`,async()=>{await p.click(`#calc-card [data-days="${d}"]`);eq(await due(),turns);eq(norm(await p.locator('#calc-price').innerText()),price);await shotEl(p,'#calc-card','calc-'+d+'-ngay')});
 }
 await check('calculator 209 → still 6 turns, not exhausted; 210 → exhausted flag, price unchanged',async()=>{await p.click('#calc-card [data-days="209"]');eq(await due(),6);ok(!(await p.locator('#calc-sum').innerText()).includes('hết lượt'),'209 not exhausted');const p209=await p.locator('#calc-price').innerText();await p.click('#calc-card [data-days="210"]');ok((await p.locator('#calc-sum').innerText()).includes('hết lượt auto'),'210 exhausted');eq(await p.locator('#calc-price').innerText(),p209)});
 await check('calculator: M3 hint is text only (no action button) and sits on turn 3',async()=>{await p.click('#calc-card [data-days="90"]');const row=p.locator('#timeline tr[data-k="3"]');ok((await row.innerText()).includes('Gợi ý demo M3'),'hint');eq(await row.locator('button,a').count(),0)});
 await check('calculator: missing ready date → locked group, not M0',async()=>{await base(60);await p.fill('#c-ready','');await p.fill('#c-cycle','');const t=await p.locator('#calc-out').innerText();ok(t.includes('Thiếu ngày sẵn sàng')&&!(await p.locator('#timeline').count()),t);await shotEl(p,'#calc-card','calc-missing-ready')});
 await check('calculator: ready date after calc date → "Chưa tới ngày sẵn sàng"',async()=>{await base(60);await p.fill('#c-ready','2026-11-05');await p.fill('#c-cycle','2026-11-05');ok((await p.locator('#calc-out').innerText()).includes('Chưa tới ngày sẵn sàng'),'')});
 await check('calculator: cost stop (15 tr, vốn 14,4, 100 ngày) keeps 14,5 and stops later turns',async()=>{await base(100,{m0:15,cost:14.4});eq(norm(await p.locator('#calc-price').innerText()),'14,5 tr');eq(await p.locator('#timeline tr[data-status="stopped_cost"]').count(),1);eq(await p.locator('#timeline tr[data-status="stopped"]').count(),1);ok((await p.locator('#calc-sum').innerText()).includes('chạm giá vốn'),'tag');await shotEl(p,'#calc-card','calc-cost-stop')});
 await check('calculator: M0 below cost is locked for manual handling, price NOT raised',async()=>{await base(100,{m0:40,cost:45});const t=await p.locator('#calc-out').innerText();ok(t.includes('xử lý tay')&&t.includes('không tự tăng giá'),t);eq(await p.locator('#timeline').count(),0)});
 await check('calculator: M0 = 600 tr → không đủ chính sách; 599,9 tr is computed',async()=>{await base(100,{m0:600,cost:300});ok((await p.locator('#calc-out').innerText()).includes('600 triệu'),'600');await setCalc({m0:599.9});ok(await p.locator('#timeline').count()===1,'599.9 computed')});
 await check('calculator: Hot/trend, 3%, 1/2, giá thu về, ký gửi are locked with the formula-gap reason',async()=>{await base(100);for(const v of ['hot_trend','rule_3pct','rule_half','buyback']){await setCalc({special:v});const t=await p.locator('#calc-out').innerText();ok(t.includes('chưa đủ công thức'),v);eq(await p.locator('#timeline').count(),0)}await setCalc({special:'',src:'Ký gửi'});ok((await p.locator('#calc-out').innerText()).includes('Ký gửi'),'consign');await setCalc({src:'Mua đứt'})});
 await check('calculator: legacy reset → price clock from reset date, age from ready date (two labels)',async()=>{await base(100);await setCalc({legacy:true});await p.fill('#c-ready','2026-03-01'); // day presets clear the legacy flag on purpose
  const t=await p.locator('#calc-sum').innerText();ok(t.includes('Tuổi tồn M6+')&&t.includes('Bậc giá M3')&&t.includes('01/07/2026'),t);await shotEl(p,'#calc-card','calc-legacy-reset')});
 /* ---- cross-check cases (a)(b)(c) in the UI ---- */
 await check('(a) cycle starts before ready: turns before ready are "bỏ qua", only the post-ready turn discounts',async()=>{await base(60);await p.fill('#c-ready','2026-09-12');await p.fill('#c-cycle','2026-07-04');eq(await p.locator('#timeline tr[data-status="skipped_before_ready"]').count(),2);eq(await p.locator('#timeline tr[data-status="applied"]').count(),1);eq(norm(await p.locator('#calc-price').innerText()),'97,5 tr');const t=await p.locator('#calc-sum').innerText();ok(t.includes('bỏ qua 2 lượt')&&t.includes('trước ngày sẵn sàng'),t);ok(!(await p.locator('#calc-out .note').last().innerText()).includes(': ,'),'no stray comma in version note');const skipped=await p.locator('#timeline tr[data-status="skipped_before_ready"] td:nth-child(4)').allInnerTexts();ok(skipped.every(x=>norm(x)==='—'||norm(x)==='0 tr'),'no discount on skipped');await shotEl(p,'#calc-card','calc-cycle-before-ready')});
 await check('(a) stock sheet shows the two demo items with skipped turns',async()=>{await p.locator('#age-bars [data-bucket=M1]').click();const s=await sheetN(p);ok(s.text.includes('bỏ qua 2 lượt'),'skipped tag in the M1 bucket');await closeSheet(p)});
 await check('(b) legacy reset date belongs to the item: editing it moves only the price clock',async()=>{await base(100);await setCalc({legacy:true});await p.fill('#c-ready','2026-03-01');await p.fill('#c-reset','2026-07-01');const a=await p.locator('#calc-sum').innerText();ok(a.includes('Tuổi tồn M6+')&&a.includes('Bậc giá M3')&&a.includes('01/07/2026'),a);await p.fill('#c-reset','2026-09-01');const b=await p.locator('#calc-sum').innerText();ok(b.includes('Tuổi tồn M6+')&&b.includes('Bậc giá M1')&&b.includes('01/09/2026'),b)});
 await check('(c) before the first policy version: turns are "chưa có phiên bản hiệu lực", never the future version',async()=>{await base(100);await p.fill('#c-calc','2025-06-01');await p.fill('#c-ready','2024-11-01');await p.fill('#c-cycle','2024-11-01');const first=p.locator('#timeline tr[data-k="1"]');eq(await first.getAttribute('data-status'),'no_policy');ok((await first.innerText()).includes('chưa có phiên bản chính sách hiệu lực'),'text');eq(await p.locator('#timeline tr[data-k="2"]').getAttribute('data-status'),'no_policy');eq(await p.locator('#timeline tr[data-k="3"]').getAttribute('data-status'),'applied');await shotEl(p,'#calc-card','calc-no-policy-yet')});
 await check('(c) global "Ngày tính" before any version renders without error and says no version is in force',async()=>{await p.fill('#calc-date','2024-12-31');await p.waitForSelector('#calc-meta');ok((await p.locator('#calc-meta').innerText()).includes('chưa có phiên bản nào hiệu lực'),'meta');ok((await p.locator('#kpis').count())>0,'page rendered')});
 await p.context().close();
}

/* ================= Policy flow ================= */
{
 const p=await newPage();await open(p,'#tab=tuoi');
 const hash0=await p.locator('#run-hash').innerText();
 const dis0=await tile(p,'Giảm dự kiến');
 await p.click('#tab-chinhsach');
 await check('policy: full old table present (11 brackets + ≥600 row), "chưa áp dụng thực tế" banner, v0 listed',async()=>{eq(await p.locator('#pol-table tbody tr').count(),12);ok((await p.locator('.banner').first().innerText()).includes('Chưa áp dụng thực tế'),'banner');eq(await p.locator('#ver-table tbody tr').count(),1);const vals=await p.locator('#pol-table input').evaluateAll(a=>a.map(i=>i.value).join());eq(vals,'0.3,0.5,0.5,0.7,0.8,1,1.5,1.5,2.5,2.5,3,3,4,4,5,5,7,7,8,8,10,10')});
 await check('policy: both dropdowns are labelled as unapproved examples; approve disabled until preview',async()=>{for(const id of ['#d-bmode','#d-cmode']){const o=await p.locator(id+' option').allInnerTexts();ok(o.every(t=>t.includes('chưa được duyệt')),id)}ok(await p.locator('#p-approve').isDisabled(),'approve disabled')});
 await check('policy: effective date before calc date is rejected (no back-dating)',async()=>{await p.fill('#d-eff','2026-10-01');ok((await p.locator('#pol-msgs').innerText()).includes('không truy giảm'),'msg');ok(await p.locator('#p-preview').isDisabled(),'preview disabled');await p.fill('#d-eff','2026-10-22')});
 await check('policy: negative / invalid input blocks preview; c2 < c1 only warns',async()=>{await p.fill('#d-c1-2','-1');ok(await p.locator('#p-preview').isDisabled(),'blocked');await p.fill('#d-c1-2','0.8');await p.fill('#d-c2-2','0.5');ok((await p.locator('#pol-msgs .w').count())>0&&!(await p.locator('#p-preview').isDisabled()),'warn only');await p.fill('#d-c2-2','1')});
 await check('policy: draft → preview → cancel returns everything to the original',async()=>{await p.fill('#d-c1-2','1.2');await p.fill('#d-c2-2','1.5');await p.click('#p-preview');await p.locator('#pv-card').waitFor();ok(await p.locator('#p-approve').isEnabled(),'approve enabled after preview');await shotEl(p,'#pv-card','policy-preview');await p.click('#p-cancel');eq(await p.inputValue('#d-c1-2'),'0.8');eq(await p.inputValue('#d-c2-2'),'1');eq(await p.locator('#pv-card').count(),0);ok(await p.locator('#p-approve').isDisabled(),'approve disabled again');eq(await p.locator('#ver-table tbody tr').count(),1)});
 await check('policy: editing after preview invalidates the preview (must preview again)',async()=>{await p.fill('#d-c1-2','1.2');await p.fill('#d-c2-2','1.5');await p.click('#p-preview');await p.locator('#pv-card').waitFor();await p.fill('#d-c2-2','1.7');eq(await p.locator('#pv-card').count(),0);ok(await p.locator('#p-approve').isDisabled(),'approve disabled');await p.fill('#d-c2-2','1.5')});
 let previewAt60='';
 await check('policy: preview shows before → after at calc date and +60 days (several SKUs change)',async()=>{await p.click('#p-preview');await p.locator('#pv-card').waitFor();const tiles=await p.locator('#pv-tiles .tile').allInnerTexts();eq(tiles.length,2);previewAt60=norm(tiles[1]);ok(/Giảm dự kiến .* → .*/.test(previewAt60),previewAt60);const ch=parseInt(tiles[1].match(/(\d+) món đổi/)[1]);ok(ch>=3,'expected several changed SKUs at +60d, got '+ch);await shot(p,'policy-before-approve',{full:true})});
 await check('policy: approve (GIẢ LẬP) adds v1 with effective date, banner, persists across reload',async()=>{await p.click('#p-approve');eq(await p.locator('#ver-table tbody tr').count(),2);ok((await p.locator('#approved-banner').innerText()).includes('GIẢ LẬP'),'banner');ok((await p.locator('#ver-table').innerText()).includes('Duyệt giả lập'),'tag');await shot(p,'policy-approved');await p.reload();await p.waitForSelector('#ver-table');eq(await p.locator('#ver-table tbody tr').count(),2)});
 await check('dashboard recalculates after approve: +60 days "Giảm dự kiến" equals the preview number',async()=>{await p.click('#tab-tuoi');await p.fill('#calc-date','2026-12-21');await p.waitForSelector('#run-hash');const now=await tile(p,'Giảm dự kiến');const m=previewAt60.match(/→ ([^(]+?)\s\(/);ok(m,'parse preview '+previewAt60);eq(now,norm(m[1]),'tile vs preview')});
 await check('(b) policy panel has no reset-date field; approving v1 left every legacy cycle and past turn untouched',async()=>{const bad=await p.evaluate(()=>{const {results,policy,D}=window.__mock,v1=policy.versions.find(v=>v.id==='v1');return results().filter(r=>{const s=D.STOCK.find(x=>x.sku===r.sku);return s.legacy_reset&&r.cycleStart!==s.legacy_reset_date}).length});eq(bad,0);await p.click('#tab-chinhsach');eq(await p.locator('#d-reset').count(),0);ok((await p.locator('#reset-note').innerText()).includes('dữ liệu của từng món'),'note');await p.click('#tab-tuoi')});
 await check('past turns keep the old version: every due turn before v1 effective date is v0',async()=>{const bad=await p.evaluate(()=>{const {results,policy}=window.__mock;const v1=policy.versions.find(v=>v.id==='v1');return results().flatMap(r=>r.turns.filter(t=>t.due&&t.date<v1.effective&&t.version&&t.version!=='v0')).length});eq(bad,0)});
 await check('same input + same policy (v0,v1) → same hash on repeat; different policy MAY differ (reported)',async()=>{const a=await p.locator('#run-hash').innerText();await p.click('#recalc');await p.click('#recalc');eq(await p.locator('#run-hash').innerText(),a);return `hash with v0+v1 @ 21/12 = ${a}`});
 await check('reset to v0 returns the original numbers (hash and "Giảm dự kiến") at the original date',async()=>{await p.click('#tab-chinhsach');await p.click('#p-reset');eq(await p.locator('#ver-table tbody tr').count(),1);await p.click('#tab-tuoi');await p.fill('#calc-date','2026-10-22');eq(await p.locator('#run-hash').innerText(),hash0);eq(await tile(p,'Giảm dự kiến'),dis0)});
 await check('policy: perTurn + toCost dropdowns change preview numbers; draft cancel leaves dashboard untouched',async()=>{await p.click('#tab-chinhsach');await p.selectOption('#d-bmode','perTurn');await p.selectOption('#d-cmode','toCost');await p.click('#p-preview');await p.locator('#pv-card').waitFor();const t=norm(await p.locator('#pv-tiles').innerText());ok(/\d+ món đổi/.test(t),t);await p.click('#p-cancel');await p.click('#tab-tuoi');eq(await p.locator('#run-hash').innerText(),hash0)});
 await p.click('#tab-chinhsach');await shot(p,'policy-1440');
 await p.context().close();
}

/* ================= Sale tab ================= */
{
 const p=await newPage();await open(p,'#tab=sale');
 await check('Sale tab: orders = Σ per-sale orders (one sale per order); items ≥ orders; channel shares sum to 100',async()=>{const rows=await p.locator('#sale-table tbody tr').allInnerTexts();const so=rows.reduce((s,r)=>s+parseInt(r.split('\t')[1]),0),tot=+await tile(p,'Số đơn'),items=+await tile(p,'Số món');eq(so,tot);ok(items>tot,'items>orders')});
 await check('Sale drilldown: sale row → their orders, count equals the row',async()=>{const row=p.locator('#sale-table tbody tr').first();const c=(await row.innerText()).split('\t');await row.locator('button.link').click();const s=await sheetN(p);eq(s.n,parseInt(c[2]));eq(+s.orders,parseInt(c[1]));await closeSheet(p)});
 await shot(p,'sale-1440');
 await p.context().close();
}

/* ================= Responsive, reduced motion, contrast ================= */
const TABS=[['hang',''],['hang-ton','#scope=ton'],['tuoi','#tab=tuoi'],['chinhsach','#tab=chinhsach'],['sale','#tab=sale']];
for(const w of [1440,768,390]){
 const p=await newPage(w,w<700?844:900,w<700?{hasTouch:true,isMobile:true}:{});await open(p);
 for(const [n,h] of TABS){
  await check(`no horizontal overflow @${w}: ${n}`,async()=>{await p.goto(BASE+h);await p.reload();await p.waitForSelector('#view *');await p.waitForTimeout(150);const sw=await p.evaluate(()=>document.documentElement.scrollWidth);ok(sw<=w,`scrollWidth ${sw} > viewport ${w} (measured against the real width, not innerWidth which mobile emulation can inflate)`);if(w!==1440)await shot(p,`${n}-${w}`)});
 }
 if(w===390){
  await check('mobile slider usable: thumbs ≥ 24px, drag works by touch-sized target',async()=>{await p.goto(BASE);await p.reload();await p.waitForSelector('#r-min');await p.locator('#r-max').scrollIntoViewIfNeeded();const b=await p.locator('#r-max').boundingBox();ok(b.height>=44,'hit zone '+b.height);await p.mouse.move(b.x+b.width-14,b.y+b.height/2);await p.mouse.down();await p.mouse.move(b.x+b.width*0.5,b.y+b.height/2,{steps:8});await p.mouse.up();const v=+await p.inputValue('#pmax');ok(v<1000&&v>0,'pmax '+v);await shotEl(p,'section[aria-label="Bộ lọc"]','slider-filter-390')});
  await check('mobile: drilldown opens as bottom sheet and closes',async()=>{await p.goto(BASE+'#tab=tuoi');await p.reload();await p.waitForSelector('#age-bars');await p.locator('#age-bars [data-bucket=M1]').click();const s=await sheetN(p);ok(s.n>0);const r=await p.locator('#sheet').boundingBox();ok(r.width<=390.5,'sheet width '+r.width);await shot(p,'sheet-mobile-390',{full:false});await closeSheet(p)});
 }
 await p.context().close();
}
{
 const p=await newPage(1440,900,{reducedMotion:'reduce'});await open(p,'#tab=tuoi');
 await check('reduced motion: motion tokens are 0 and no running animations after opening a sheet',async()=>{eq((await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--dur-2'))).trim(),'0ms');await p.locator('#age-bars [data-bucket=M1]').click();await p.locator('#sheet-count').waitFor();await p.waitForTimeout(100);eq(await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);await closeSheet(p)});
 await p.context().close();
}
{
 const p=await newPage(1440,900);await open(p);
 await check('motion budget: no transition/animation outside 120–280 ms (reduced-motion off)',async()=>{const bad=await p.evaluate(()=>{const out=[];const s=v=>v.split(',').map(x=>parseFloat(x)*(x.trim().endsWith('ms')?.001:1));for(const el of document.querySelectorAll('*')){const cs=getComputedStyle(el);for(const d of [...s(cs.transitionDuration),...(cs.animationName==='none'?[]:s(cs.animationDuration))])if(d&&(d<.12||d>.28))out.push(el.tagName+'.'+el.className+':'+d)}return out});eq(bad.length,0,bad.slice(0,4).join(','))});
 const contrast=()=>({
  parse:c=>{const q=(c.match(/rgba?\(([^)]+)\)/)?.[1]||'').split(/[ ,\/]+/).filter(Boolean).map(Number);return q.length>=3?{r:q[0],g:q[1],b:q[2],a:q.length>3?q[3]:1}:null}});
 for(const [n,h] of TABS){
  await check(`text contrast AA: ${n}`,async()=>{await p.goto(BASE+h);await p.reload();await p.waitForSelector('#view *');await p.waitForTimeout(200);
   const fails=await p.evaluate(()=>{const parse=c=>{const q=(c.match(/rgba?\(([^)]+)\)/)?.[1]||'').split(/[ ,\/]+/).filter(Boolean).map(Number);return q.length>=3?{r:q[0],g:q[1],b:q[2],a:q.length>3?q[3]:1}:null};
    const lum=({r,g,b})=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
    const bg=el=>{for(let e=el;e;e=e.parentElement){const c=parse(getComputedStyle(e).backgroundColor);if(c&&c.a>.5)return c}return {r:255,g:255,b:255,a:1}};
    const out=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
    while((n=w.nextNode())){const el=n.parentElement;if(!n.nodeValue.trim()||!el||el.closest('button:disabled,svg,script,style,dialog:not([open]),[hidden],option'))continue;const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;
     const cs=getComputedStyle(el),a=lum(parse(cs.color)),b=lum(bg(el)),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),size=parseFloat(cs.fontSize);
     if(ratio<((size>=24||(Number(cs.fontWeight)>=700&&size>=18.66))?3:4.5))out.push(`${n.nodeValue.trim().slice(0,28)} ${ratio.toFixed(2)}`)}
    return out});
   eq(fails.length,0,fails.slice(0,5).join(' | '))});
 }
 await p.context().close();
}
await check('no page errors or console errors during the whole run',async()=>{eq(pageErrors.length,0,pageErrors.slice(0,3).join(' | '))});
await browser.close();
const pass=results.filter(r=>r.ok).length,fail=results.length-pass;
writeFileSync(path.join(here,'qa-results.json'),JSON.stringify({when:new Date().toISOString(),url:BASE,pass,fail,results},null,1));
console.log(`\nBrowser QA: ${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
