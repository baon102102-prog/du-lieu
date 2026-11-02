import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {analyze,coverageOf,incomeFor,buildRecords} from './income.mjs';import {summarize,team} from './model.mjs';
const real=()=>JSON.parse(fs.readFileSync(new URL('./snapshot.json',import.meta.url)));
const mk=(code,sale,amount,personal,items=1)=>({code,id:code,date:'2026-10-28',source:personal?'Instagram':'Facebook',amount,status:'Đã thanh toán',sale,personal,paid:amount,items,detail:true,url:'https://baoqluxury.mysapo.net/x/'+code,creator:sale,sku:['QA'],evidence:'x'});
const rc=(code,sale,amt)=>({code,date:'2026-10-29',amount:amt,status:'Đã nhập hàng',sale,paid:amt,paymentVerified:true,allocations:[{id:'P-'+code,amount:amt,paymentAmount:amt}],url:'https://baoqluxury.kiotviet.vn/x/'+code,evidence:'x'});
const small=(orders,receipts=[],period=['2026-10-26','2026-10-30'])=>({period,orders,receipts,events:[],coverage:{}});
const get=(a,n,k)=>a.sales.find(s=>s.name===n).components.find(c=>c.key===k);

test('real snapshot: monthly thresholds are "insufficient" with null amount, never 0',()=>{const a=analyze(real());
 assert.equal(a.coverage.complete,false);assert.equal(a.coverage.days,5);assert.deepEqual(Object.values(a.coverage.mechanisms),['unknown','unknown','unknown','unknown','unknown']);
 for(const s of a.sales)for(const k of ['selling','personal','cross']){const c=s.components.find(x=>x.key===k);assert.equal(c.status,'insufficient',s.name+k);assert.equal(c.amount,null)}
 assert.equal(a.totals.known,false);assert.equal(a.totals.amount,null);for(const s of a.sales){assert.equal(s.total.known,false);assert.equal(s.total.amount,null)}});
test('real snapshot: purchase waiting is "pending", no receipt is "none", salary is "unconfigured" and never 0',()=>{const a=analyze(real());
 assert.equal(get(a,'Linh','acq').status,'pending');assert.equal(get(a,'My','acq').status,'unseen');assert.equal(get(a,'My','adjust').status,'unseen');
 for(const s of a.sales){const c=s.components.find(x=>x.key==='salary');assert.equal(c.status,'unconfigured');assert.equal(c.amount,null)}});
test('verified sales amount equals the model; unassigned records are not credited to anyone',()=>{const d=real(),a=analyze(d);assert.equal(a.totals.verifiedSales,summarize(d.orders).total);assert.equal(a.totals.verifiedSales,101800000);
 assert.equal(a.unassigned.provisional,0);assert.equal(a.unassigned.pending+a.unassigned.excluded+0,a.records.filter(r=>!r.sale).length-a.records.filter(r=>!r.sale&&r.state==='provisional').length)});
test('thresholds met on partial data are valid positive evidence: amounts equal the model, total sums only counted mechanisms',()=>{
 const d=small([mk('A1','QA',1e8,true),mk('A2','QA',4e8,false,12)],[rc('R1','QA',1e7)]);const a=analyze(d);
 assert.equal(a.coverage.complete,false);
 assert.equal(get(a,'QA','selling').status,'provisional');assert.equal(get(a,'QA','selling').amount,2.5e6);
 assert.equal(get(a,'QA','personal').amount,1e6);assert.equal(get(a,'QA','cross').amount,1e6);assert.equal(get(a,'QA','acq').amount,150000);
 const s=a.sales[0];assert.equal(s.total.known,true);assert.equal(s.total.amount,2.5e6+1e6+1e6+150000);assert.equal(s.total.partial,true);
 assert.equal(get(a,'QA','salary').status,'unconfigured');assert.equal(a.totals.amount,s.total.amount)});
test('personal 99.999.999 on a partial sample stays insufficient (not 0) and is not credited',()=>{
 const a=analyze(small([mk('B1','QB',99999999,true),mk('B2','QB',5e8,false)]));
 assert.equal(get(a,'QB','selling').status,'insufficient');assert.equal(get(a,'QB','personal').status,'insufficient');assert.equal(get(a,'QB','personal').amount,null)});
const att=(extra={})=>({mechanisms:{selling:true,personal:true,cross:true,acq:true,adjust:true},...extra});
test('coverage is never inferred: a 28-day range cutting a month, all orders read in detail, still gives insufficient (not 0 / not met)',()=>{
 const d=small([mk('C1','QC',1e6,false),mk('C2','QC',2e6,true)],[rc('R9','QC',1e6)],['2026-10-20','2026-11-16']);const a=analyze(d);
 assert.equal(a.coverage.days,28);assert.equal(a.coverage.ordersRead,a.coverage.ordersTotal);assert.equal(a.coverage.complete,false);
 for(const k of ['selling','personal','cross']){assert.equal(get(a,'QC',k).status,'insufficient');assert.equal(get(a,'QC',k).amount,null)}});
test('detail=true is not enough: orders read in detail but pending (part-paid / no source) keep thresholds insufficient even with proof',()=>{
 const pend={...mk('P2','QP',2e6,false),status:'Thanh toán một phần',paid:1e6};
 const a=analyze({...small([mk('P1','QP',1e6,false),pend]),proof:att()});assert.equal(a.records.find(r=>r.code==='P2').state,'pending');
 assert.equal(get(a,'QP','selling').status,'insufficient');assert.equal(get(a,'QP','personal').amount,null);
 const unk={...mk('P3',null,2e6,false),sale:null};const b=analyze({...small([mk('P4','QP',1e6,false),unk]),proof:att()});assert.equal(get(b,'QP','cross').status,'insufficient')});
test('missing source coverage (no proof) never produces 0 / not met, even with every row verified',()=>{
 const a=analyze(small([mk('S1','QS',1e6,false)],[],['2026-11-01','2026-11-30']));assert.equal(a.coverage.complete,false);
 assert.equal(get(a,'QS','selling').status,'insufficient');assert.equal(get(a,'QS','acq').status,'unseen');assert.equal(get(a,'QS','adjust').status,'unseen')});
test('only explicit proof + no pending record allows "not met" / "none"',()=>{
 const a=analyze({...small([mk('N1','QN',1e6,false)],[],['2026-11-01','2026-11-30']),proof:att()});assert.equal(a.coverage.complete,true);
 assert.equal(get(a,'QN','selling').status,'notmet');assert.equal(get(a,'QN','selling').amount,0);assert.equal(get(a,'QN','personal').status,'notmet');
 assert.equal(get(a,'QN','acq').status,'none');assert.equal(get(a,'QN','adjust').status,'none');
 const part={...att(),mechanisms:{...att().mechanisms,selling:false}};const b=analyze({...small([mk('N1','QN',1e6,false)]),proof:part});assert.equal(get(b,'QN','selling').status,'insufficient')});
test('a total of 0 appears only when every money mechanism is settled by proof; missing data never gives 0',()=>{
 const a=analyze({...small([mk('Z1','QZ',1e6,false)],[],['2026-11-01','2026-11-30']),proof:att()});assert.equal(a.sales[0].total.known,true);assert.equal(a.sales[0].total.amount,0);
 const b=analyze(small([mk('Z1','QZ',1e6,false)]));assert.equal(b.sales[0].total.known,false);assert.equal(b.sales[0].total.amount,null)});
test('cross-sale branch B uses selling orders only: a 350 tr verified receipt never counts as a ≥300 tr order',()=>{
 const a=analyze(small([mk('E1','QE',1e6,false)],[rc('R2','QE',35e7)]));const c=get(a,'QE','cross');
 assert.equal(c.status,'insufficient');assert.equal(c.basis.maxOrder,1e6);assert.equal(get(a,'QE','acq').status,'provisional')});
test('bán and thu mua are never added into one number: personal/shop drill and mechanism totals stay separate',()=>{
 const a=analyze(small([mk('G1','QG',1e8,true),mk('G2','QG',4e8,false)],[rc('R3','QG',1e7)]));
 const recs=a.records.filter(r=>r.sale==='QG');const selling=recs.filter(r=>r.kind==='selling').reduce((s,r)=>s+r.ctr,0),acq=recs.filter(r=>r.kind==='acquisition').reduce((s,r)=>s+r.ctr,0);
 assert.equal(selling,5e8);assert.equal(acq,1e7);assert.equal(get(a,'QG','selling').basis.total,5e8);assert.equal(get(a,'QG','selling').basis.personal,1e8)});
test('analysis never mutates data or changes model results',()=>{const d=real(),before=JSON.stringify(d),m=JSON.stringify(summarize(d.orders).rows.map(r=>[r.code,r.state,r.base]));analyze(d);assert.equal(JSON.stringify(d),before);assert.equal(JSON.stringify(summarize(d.orders).rows.map(r=>[r.code,r.state,r.base])),m)});
test('configured base salary is shown separately and never added into the commission total',()=>{
 const d=small([mk('H1','QH',1e8,true),mk('H2','QH',4e8,false)]);const a=analyze(d,{baseSalary:{QH:12e6}});
 assert.equal(get(a,'QH','salary').status,'provisional');assert.equal(get(a,'QH','salary').amount,12e6);assert.equal(a.sales[0].total.amount,2.5e6+1e6+1e6)}); // selling + personal + cross (a 400 tr order reaches branch B); salary excluded
