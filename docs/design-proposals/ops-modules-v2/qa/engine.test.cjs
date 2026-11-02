/* Logic QA for engine.js + data.js. Run: node qa/engine.test.cjs   (no dependencies) */
const assert=require('node:assert/strict');
const E=require('../engine.js'),D=require('../data.js');
let pass=0,fail=0;const failures=[];
function t(name,fn){try{fn();pass++;console.log('  ok  '+name)}catch(e){fail++;failures.push(name);console.log('FAIL  '+name+'\n      '+e.message.split('\n').slice(0,4).join('\n      '))}}
const V0=E.defaultVersions(),CALC='2026-10-22',tr=x=>x*1e6;
const item=o=>Object.assign({sku:'T',name:'t',brand:'B',category:'Giày',source:'Mua đứt',list_price:tr(100),cost:tr(50),m0_price:tr(100),receipt_date:'2026-01-01',ready_for_sale_date:E.addDays(CALC,-180),sale_cycle_start:E.addDays(CALC,-180),special:null,legacy_reset:false},o);
const withDays=(d,o)=>item(Object.assign({ready_for_sale_date:E.addDays(CALC,-d),sale_cycle_start:E.addDays(CALC,-d)},o));
const ver=o=>Object.assign(E.clone(V0[0]),o);

console.log('Bracket boundaries (half-open, triệu)');
t('9,999,999 → <10; 10,000,000 → 10–<20',()=>{assert.equal(E.bracketOf(9999999,V0[0].brackets).max,10);assert.equal(E.bracketOf(10000000,V0[0].brackets).min,10)});
t('19,999,999/20,000,000 and 49,999,999/50,000,000',()=>{assert.equal(E.bracketOf(19999999,V0[0].brackets).min,10);assert.equal(E.bracketOf(20000000,V0[0].brackets).min,20);assert.equal(E.bracketOf(49999999,V0[0].brackets).min,20);assert.equal(E.bracketOf(50000000,V0[0].brackets).min,50)});
t('599,999,999 → 500–<600; 600,000,000 → no rule',()=>{assert.equal(E.bracketOf(599999999,V0[0].brackets).min,500);assert.equal(E.bracketOf(600000000,V0[0].brackets),null)});
t('table matches the brief (11 brackets, M1&M2 / M3–M6)',()=>{const b=V0[0].brackets.map(x=>[x.min,x.max,x.c1,x.c2].join());assert.deepEqual(b,['0,10,0.3,0.5','10,20,0.5,0.7','20,50,0.8,1','50,100,1.5,1.5','100,150,2.5,2.5','150,200,3,3','200,250,4,4','250,300,5,5','300,400,7,7','400,500,8,8','500,600,10,10'])});

console.log('Age clock (from ready_for_sale_date)');
t('29→M0, 30→M1, 59→M1, 60→M2, 179→M5, 180→M6, 209→M6, 210→M6+',()=>{const m={29:'M0',30:'M1',59:'M1',60:'M2',179:'M5',180:'M6',209:'M6',210:'M6+',400:'M6+'};for(const [d,l] of Object.entries(m))assert.equal(E.ageInfo(withDays(+d),CALC).label,l,'day '+d)});
t('missing ready date is its own state, never M0',()=>{const a=E.ageInfo(item({ready_for_sale_date:null}),CALC);assert.equal(a.state,'missing');assert.notEqual(a.label,'M0');assert.equal(a.idx,null)});
t('ready date after calc date → "chưa sẵn sàng", not M0',()=>{const a=E.ageInfo(item({ready_for_sale_date:E.addDays(CALC,3)}),CALC);assert.equal(a.state,'future');assert.equal(a.idx,null)});

console.log('Price clock (turns from sale_cycle_start, 30 days each)');
t('turns due: 29d→0, 30d→1, 59d→1, 60d→2, 180d→6, 209d→6, 400d→6 (max 6)',()=>{const m={29:0,30:1,59:1,60:2,89:2,90:3,179:5,180:6,209:6,400:6};for(const [d,n] of Object.entries(m))assert.equal(E.evaluate(withDays(+d),CALC,V0).turnsDue,n,'day '+d)});
t('tier label "Bậc giá M#" is separate from age label',()=>{const r=E.evaluate(withDays(95,{}),CALC,V0);assert.equal(r.tier,'M3');assert.equal(r.age.label,'M3')});
t('turn dates = cycleStart + 30·k',()=>{const r=E.evaluate(withDays(100),CALC,V0);assert.equal(r.turns[0].date,E.addDays(r.cycleStart,30));assert.equal(r.turns[5].date,E.addDays(r.cycleStart,180))});
t('never auto past M6: 210+ days → exhausted, price unchanged since turn 6',()=>{const a=E.evaluate(withDays(180),CALC,V0),b=E.evaluate(withDays(300),CALC,V0);assert.equal(a.proposed,b.proposed);assert.equal(a.exhausted,false);assert.equal(b.exhausted,true);assert.equal(b.turns.length,6)});

console.log('Worked examples');
t('M0 100 tr, fixed bracket, 180d: 6 × 2.5 → 85 tr',()=>assert.equal(E.evaluate(withDays(180,{m0_price:tr(100)}),CALC,V0).proposed,tr(85)));
t('M0 100 tr, per-turn bracket: 97.5 then 1.5/turn → 90 tr',()=>{const r=E.evaluate(withDays(180),CALC,[ver({bracketMode:'perTurn'})]);assert.equal(r.turns[0].after,tr(97.5));assert.equal(r.turns[1].amount,tr(1.5));assert.equal(r.proposed,tr(90))});
t('M0 10 tr, fixed: 2×0.5 + 4×0.7 → 6.2 tr',()=>assert.equal(E.evaluate(withDays(180,{m0_price:tr(10),cost:tr(1)}),CALC,V0).proposed,tr(6.2)));
t('M0 9.9 tr uses bracket <10 (0.3/0.5): 2×0.3 + 4×0.5 → 7.3 tr',()=>assert.equal(E.evaluate(withDays(180,{m0_price:tr(9.9),cost:tr(1)}),CALC,V0).proposed,tr(7.3)));
t('M0 exactly 10 tr moves to the 10–<20 bracket',()=>assert.equal(E.evaluate(withDays(30,{m0_price:tr(10),cost:tr(1)}),CALC,V0).turns[0].amount,tr(0.5)));
t('M0 599 tr: bracket 500–<600 → 10 tr per turn, 6 turns → 539 tr',()=>assert.equal(E.evaluate(withDays(180,{m0_price:tr(599),cost:tr(300)}),CALC,V0).proposed,tr(539)));

console.log('Cost floor (M0 below cost is locked, never raised)');
const costStop=m=>E.evaluate(withDays(100,{m0_price:tr(15),cost:tr(14.4)}),CALC,[ver({costMode:m})]);
t('keepPrev: turn 2 would cross cost → keep 14.5, stop, later turns stopped',()=>{const r=costStop('keepPrev');assert.equal(r.hitCost,true);assert.equal(r.proposed,tr(14.5));assert.equal(r.turns[1].status,'stopped_cost');assert.equal(r.turns[2].status,'stopped');assert.ok(r.proposed>=tr(14.4))});
t('toCost: turn 2 lands exactly on cost, then stops',()=>{const r=costStop('toCost');assert.equal(r.proposed,tr(14.4));assert.equal(r.turns[1].status,'to_cost');assert.equal(r.turns[2].status,'stopped')});
t('price landing exactly on cost is allowed (not below)',()=>{const r=E.evaluate(withDays(30,{m0_price:tr(15),cost:tr(14.5)}),CALC,V0);assert.equal(r.proposed,tr(14.5));assert.equal(r.hitCost,false)});
t('M0 below cost → locked "m0_below_cost", proposed price stays null (no auto raise)',()=>{const r=E.evaluate(withDays(100,{m0_price:tr(40),cost:tr(45)}),CALC,V0);assert.equal(r.lock.code,'m0_below_cost');assert.equal(r.proposed,null);assert.equal(r.turns.length,0)});
t('no result is ever below cost across all stock, both cost modes, both bracket modes',()=>{for(const bm of ['fixedM0','perTurn'])for(const cm of ['keepPrev','toCost'])for(const r of E.evaluateAll(D.STOCK,CALC,[ver({bracketMode:bm,costMode:cm})])){if(r.proposed==null)continue;const s=D.STOCK.find(x=>x.sku===r.sku);assert.ok(r.proposed>=s.cost,`${r.sku} ${bm}/${cm}`)}});

console.log('Locks');
t('consignment locked (GIẢ ĐỊNH)',()=>assert.equal(E.evaluate(withDays(100,{source:'Ký gửi'}),CALC,V0).lock.code,'consign'));
t('Hot/trend, 3%, 1/2, giá thu về locked with "chưa đủ công thức"; no number computed',()=>{for(const s of ['hot_trend','rule_3pct','rule_half','buyback']){const r=E.evaluate(withDays(100,{special:s}),CALC,V0);assert.equal(r.lock.code,'special_'+s);assert.match(r.lock.text,/chưa đủ công thức/);assert.equal(r.proposed,null);assert.equal(r.discount,0)}});
t('≥ 600 tr → "không đủ chính sách"; 599.9 tr is computed',()=>{const a=E.evaluate(withDays(100,{m0_price:tr(600)}),CALC,V0),b=E.evaluate(withDays(100,{m0_price:tr(599.9),cost:tr(300)}),CALC,V0);assert.equal(a.lock.code,'over600');assert.equal(a.proposed,null);assert.equal(b.lock,null)});
t('missing cost / missing M0 / missing or future ready are locked as data issues',()=>{assert.equal(E.evaluate(withDays(100,{cost:null}),CALC,V0).lock.code,'missing_cost');assert.equal(E.evaluate(withDays(100,{m0_price:null}),CALC,V0).lock.code,'missing_m0');assert.equal(E.evaluate(item({ready_for_sale_date:null}),CALC,V0).lock.code,'missing_ready');assert.equal(E.evaluate(item({ready_for_sale_date:E.addDays(CALC,2)}),CALC,V0).lock.code,'not_ready')});

console.log('Legacy reset (GIẢ ĐỊNH MÔ PHỎNG): reset date is item data');
const legacy=(o)=>item(Object.assign({legacy_reset:true,legacy_reset_date:'2026-07-01',sale_cycle_start:null,ready_for_sale_date:'2026-03-01'},o));
t('legacy: price cycle starts on the item\'s reset date, age still from ready date',()=>{const r=E.evaluate(legacy(),CALC,V0);assert.equal(r.cycleStart,'2026-07-01');assert.equal(r.cycleDays,113);assert.equal(r.turnsDue,3);assert.equal(r.age.days,E.dayDiff('2026-03-01',CALC));assert.equal(r.age.label,'M6+')});
t('legacy: reset date after calc date → no turns yet',()=>{const r=E.evaluate(legacy({legacy_reset_date:'2026-11-01'}),CALC,V0);assert.equal(r.turnsDue,0);assert.equal(r.proposed,tr(100))});
t('legacy: different reset dates move only the price clock, never the age',()=>{const a=E.evaluate(legacy({legacy_reset_date:'2026-07-01'}),CALC,V0),b=E.evaluate(legacy({legacy_reset_date:'2026-09-01'}),CALC,V0);assert.equal(a.age.label,b.age.label);assert.notEqual(a.turnsDue,b.turnsDue)});
t('legacy without its own reset date is locked (data issue), never guessed',()=>{const r=E.evaluate(legacy({legacy_reset_date:null}),CALC,V0);assert.equal(r.lock.code,'missing_reset_date');assert.equal(r.proposed,null)});

console.log('Stability and versions');
t('same input + same policy → identical hash on repeated runs',()=>{const h=[1,2,3].map(()=>E.hashOf(E.evaluateAll(D.STOCK,CALC,V0)));assert.equal(h[0],h[1]);assert.equal(h[1],h[2])});
t('re-running does not read earlier output (pure: input items unchanged)',()=>{const before=JSON.stringify(D.STOCK);E.evaluateAll(D.STOCK,CALC,V0);E.evaluateAll(D.STOCK,CALC,V0);assert.equal(JSON.stringify(D.STOCK),before)});
t('a different valid policy MAY change results (reported, not asserted equal)',()=>{const a=E.hashOf(E.evaluateAll(D.STOCK,CALC,V0)),b=E.hashOf(E.evaluateAll(D.STOCK,CALC,[ver({bracketMode:'perTurn'})]));console.log('      info: fixedM0 hash '+a+' vs perTurn hash '+b+(a===b?' (same)':' (different, expected)'))});
t('version effective mid-cycle: earlier turns keep v0, turns on/after effective use v1',()=>{const v1=ver({id:'v1',effective:'2026-10-01',brackets:E.clone(V0[0].brackets).map(b=>Object.assign(b,{c1:b.c1+1,c2:b.c2+1}))});const it=legacy();const r=E.evaluate(it,CALC,[V0[0],v1]);// turns 7/31, 8/30 (v0), 9/29 (v0), 10/29 not due
 assert.deepEqual(r.turns.filter(x=>x.due).map(x=>x.version),['v0','v0','v0']);const r2=E.evaluate(withDays(120),'2026-10-22',[V0[0],ver({id:'v1',effective:'2026-10-15',brackets:E.clone(V0[0].brackets).map(b=>Object.assign(b,{c1:5,c2:5}))})]);const vs=r2.turns.filter(x=>x.due).map(x=>x.version);assert.deepEqual(vs,['v0','v0','v0','v1']);assert.equal(r2.turns[0].amount,tr(2.5));assert.equal(r2.turns[3].amount,tr(5))});
t('draft validation: effective before calc date is an error (no back-dating); c2<c1 only warns',()=>{const bad=E.validateVersion(ver({effective:'2026-10-01'}),CALC);assert.ok(bad.errors.length);const w=ver({effective:CALC});w.brackets[0].c2=0.1;const r=E.validateVersion(w,CALC);assert.equal(r.errors.length,0);assert.ok(r.warnings.length)});

console.log('Synthetic data consistency');
const lines=D.LINES,orders=D.ORDERS;
t('distinct orders < line items (multi-line orders exist)',()=>{assert.ok(orders.length<lines.length);assert.equal(new Set(lines.map(l=>l.order)).size,orders.length);assert.equal(orders.reduce((s,o)=>s+o.lines.length,0),lines.length)});
t('revenue by category sums to total; line price = list − discount',()=>{const tot=lines.reduce((s,l)=>s+l.price_actual,0),by=D.CATS.reduce((s,c)=>s+lines.filter(l=>l.category===c).reduce((a,l)=>a+l.price_actual,0),0);assert.equal(by,tot);for(const l of lines)assert.equal(l.price_actual,l.list_price-l.discount)});
t('sum of per-category distinct orders can exceed total distinct orders (so the UI must not add them)',()=>{const s=D.CATS.reduce((a,c)=>a+new Set(lines.filter(l=>l.category===c).map(l=>l.order)).size,0);assert.ok(s>orders.length)});
t('stock and sold SKUs never overlap; stock SKUs unique',()=>{const a=new Set(D.STOCK.map(s=>s.sku)),b=new Set(lines.map(l=>l.sku));assert.equal(a.size,D.STOCK.length);assert.equal(b.size,lines.length);for(const k of a)assert.ok(!b.has(k))});
t('dates: receipt ≤ ready (when both exist); sold ready ≤ created_on; orders inside the period',()=>{for(const s of D.STOCK)if(s.ready_for_sale_date)assert.ok(s.receipt_date<=s.ready_for_sale_date,s.sku);for(const l of lines){if(l.ready_for_sale_date)assert.ok(l.ready_for_sale_date<=l.created_on,l.sku);assert.ok(l.created_on>=D.PERIOD.from&&l.created_on<=D.PERIOD.to)}});
t('four separate fields exist: receipt_date, ready_for_sale_date, sale_cycle_start, m0_price',()=>{for(const k of ['receipt_date','ready_for_sale_date','sale_cycle_start','m0_price'])assert.ok(k in D.STOCK[0],k)});
t('covers the demo cases: missing ready, future ready, missing cost/M0/brand, ≥600, >1 tỷ, consign, legacy, specials, cost-stop',()=>{const c=k=>D.STOCK.filter(s=>s.tag===k).length;assert.equal(c('missing_ready'),5);assert.equal(c('not_ready'),2);assert.equal(c('missing_cost'),3);assert.equal(c('missing_m0'),3);assert.equal(c('cost_stop'),3);assert.equal(c('legacy'),8);assert.equal(D.STOCK.filter(s=>s.special).length,10);assert.equal(c('cycle_before_ready'),2);assert.ok(D.STOCK.some(s=>s.source==='Ký gửi'));assert.ok(D.STOCK.some(s=>s.brand===D.BRAND_NONE));assert.ok(D.STOCK.some(s=>s.list_price>1e9));assert.ok(D.STOCK.some(s=>s.list_price===1e9));assert.ok(lines.some(l=>l.price_actual>1e9));assert.ok(lines.some(l=>l.cost==null));assert.ok(lines.some(l=>l.ready_for_sale_date==null))});
t('every stock item evaluates without throwing at several calc dates; every lock has a text',()=>{for(const d of ['2026-10-22','2026-11-21','2027-02-01'])for(const r of E.evaluateAll(D.STOCK,d,V0)){if(r.lock)assert.ok(r.lock.text);else{assert.ok(r.proposed!=null);assert.ok(r.turns.length<=6)}}});

console.log('Cross-check regressions (a) cycle before ready, (b) legacy reset fixed per item, (c) no future policy');
const cyc=(readyDaysAgo,cycleDaysAgo,o)=>item(Object.assign({ready_for_sale_date:E.addDays(CALC,-readyDaysAgo),sale_cycle_start:E.addDays(CALC,-cycleDaysAgo)},o));
// (a)
t('(a) cycle 110d ago, ready 40d ago: turns 1–2 fall before ready → skipped, only turn 3 discounts',()=>{const r=E.evaluate(cyc(40,110),CALC,V0);assert.deepEqual(r.turns.map(x=>x.status),['skipped_before_ready','skipped_before_ready','applied','future','future','future']);assert.equal(r.skipped,2);assert.equal(r.cycleBeforeReady,true);assert.equal(r.proposed,tr(97.5));assert.equal(r.turns[0].amount,0);assert.equal(r.turns[1].amount,0)});
t('(a) not reversed: price is never lower than "M0 minus only the post-ready turns"; skipped turns are NOT made up later',()=>{const r=E.evaluate(cyc(40,110),CALC,V0),naive=E.evaluate(cyc(110,110),CALC,V0);assert.ok(r.proposed>naive.proposed,'with ready 40d ago the price must stay higher than a fully-ready item');const later=E.evaluate(cyc(40,110),E.addDays(CALC,60),V0);assert.deepEqual(later.turns.map(x=>x.status).slice(0,3),['skipped_before_ready','skipped_before_ready','applied']);assert.equal(later.turns[3].status,'applied')});
t('(a) a turn dated exactly on the ready date is valid; one day earlier is skipped',()=>{const on=E.evaluate(cyc(60,90),CALC,V0),before=E.evaluate(cyc(59,90),CALC,V0);assert.equal(on.turns[0].date,E.addDays(CALC,-60));assert.equal(on.turns[0].status,'applied');assert.equal(before.turns[0].status,'skipped_before_ready')});
t('(a) property: for many (ready, cycle start, calc) combinations a turn before ready never discounts and discounts never exceed the post-ready ones',()=>{for(let ra=0;ra<=240;ra+=17)for(let ca=ra;ca<=ra+150;ca+=23){const r=E.evaluate(cyc(ra,ca),CALC,V0);for(const x of r.turns){if(x.date<E.addDays(CALC,-ra))assert.equal(x.amount,0,`ready ${ra}d cycle ${ca}d turn ${x.k}`);if(x.status==='skipped_before_ready')assert.equal(x.after,x.before)}assert.ok(r.proposed<=tr(100)&&r.proposed>=tr(60))}});
t('(a) all six turns before ready → no discount, not marked "hết lượt M6"',()=>{const r=E.evaluate(cyc(5,300),CALC,V0);assert.equal(r.proposed,tr(100));assert.equal(r.skipped,6);assert.equal(r.exhausted,false)});
t('(a) rerun is stable with skipped turns',()=>{const it=D.STOCK.filter(s=>s.tag==='cycle_before_ready');const h=[1,2,3].map(()=>E.hashOf(E.evaluateAll(it,CALC,V0)));assert.equal(h[0],h[2]);for(const r of E.evaluateAll(it,CALC,V0))assert.equal(r.skipped,2)});
// (b)
t('(b) policy versions cannot move a legacy cycle: a new version (even one carrying a legacyResetDate) leaves cycleStart and past turns unchanged',()=>{const it=legacy();const v1=ver({id:'v1',effective:'2026-10-01',legacyResetDate:'2026-09-01',brackets:E.clone(V0[0].brackets).map(b=>Object.assign(b,{c1:9,c2:9}))});const a=E.evaluate(it,CALC,V0),b=E.evaluate(it,CALC,[V0[0],v1]);assert.equal(a.cycleStart,'2026-07-01');assert.equal(b.cycleStart,'2026-07-01');assert.equal(b.cycleDays,a.cycleDays);for(let i=0;i<a.turns.length;i++)if(a.turns[i].date<v1.effective)assert.deepEqual(b.turns[i],a.turns[i],'past turn '+(i+1)+' rewritten')});
t('(b) same for every legacy stock item and any list of versions',()=>{const leg=D.STOCK.filter(s=>s.legacy_reset);assert.equal(leg.length,8);const vs=[V0,[V0[0],ver({id:'v1',effective:'2026-10-22',legacyResetDate:'2026-10-01',bracketMode:'perTurn'})],[ver({effective:'2025-01-01',legacyResetDate:'2025-06-01'})]];for(const s of leg){const starts=vs.map(v=>E.evaluate(s,CALC,v).cycleStart);assert.deepEqual(new Set(starts).size,1);assert.equal(starts[0],s.legacy_reset_date)}});
t('(b) legacy items carry their own, different reset dates (item data)',()=>{const ds=new Set(D.STOCK.filter(s=>s.legacy_reset).map(s=>s.legacy_reset_date));assert.ok(ds.size>=2);for(const d of ds)assert.ok(E.isDate(d))});
t('(b) default policy no longer has a legacyResetDate field; validateVersion ignores it',()=>{assert.ok(!('legacyResetDate' in V0[0]));assert.equal(E.validateVersion(ver({effective:CALC}),CALC).errors.length,0)});
// (c)
t('(c) versionAt before the first effective date → null (never the first/future version)',()=>{const v=[ver({id:'v0',effective:'2026-09-01'})];assert.equal(E.versionAt(v,'2026-08-31'),null);assert.equal(E.versionAt(v,'2026-09-01').id,'v0');assert.equal(E.versionAt([],'2026-09-01'),null)});
t('(c) a version effective after calc is never applied to earlier turns',()=>{const v0=ver({id:'v0',effective:'2026-01-01'}),vF=ver({id:'vF',effective:'2026-12-01',brackets:E.clone(V0[0].brackets).map(b=>Object.assign(b,{c1:9,c2:9}))});const a=E.evaluate(cyc(100,100),CALC,[v0]),b=E.evaluate(cyc(100,100),CALC,[v0,vF]);assert.deepEqual(b.turns,a.turns);assert.equal(b.proposed,a.proposed);assert.ok(b.turns.filter(x=>x.version).every(x=>x.version==='v0'))});
t('(c) the only version is effective later: turns before it are "no_policy" (skipped), later turns apply',()=>{const late=ver({id:'v0',effective:'2026-09-01'});const r=E.evaluate(cyc(100,100),CALC,[late]);// cycle start 2026-07-14: turns 08-13 (before) , 09-12, 10-12
 assert.deepEqual(r.turns.slice(0,3).map(x=>x.status),['no_policy','applied','applied']);assert.equal(r.turns[0].amount,0);assert.equal(r.skipped,1);assert.equal(r.proposed,tr(95))});
t('(c) policy that starts after every turn → price stays at M0, nothing applied',()=>{const r=E.evaluate(cyc(100,100),CALC,[ver({effective:'2026-12-01'})]);assert.ok(r.turns.filter(x=>x.due).every(x=>x.status==='no_policy'));assert.equal(r.proposed,tr(100));assert.equal(r.discount,0)});
t('(c) with no versions at all nothing is applied and nothing throws',()=>{const r=E.evaluate(cyc(100,100),CALC,[]);assert.equal(r.proposed,tr(100));assert.equal(E.hashOf(E.evaluateAll(D.STOCK,CALC,[])).length,8)});
t('(c) demo stock is fully covered by v0 (no "no_policy" turn at the default calc date)',()=>{const n=E.evaluateAll(D.STOCK,CALC,V0).reduce((s,r)=>s+r.turns.filter(x=>x.status==='no_policy').length,0);assert.equal(n,0)});

console.log(`\n${pass} passed, ${fail} failed`);
if(fail){console.log('Failed: '+failures.join(' | '));process.exit(1)}
