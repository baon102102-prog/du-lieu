/* SUPERSEDED (kept for history): this tested the old same-tab link dashboard <-> standalone 8790 page. Since Hàng hóa & KPI sit inside the dashboard
   menu, navigation is covered by plan-mockup-v1/v2/mockup/qa/shell-qa.mjs. Do not run. */
/* Navigation QA: dashboard Luxury V2 (127.0.0.1:8788) <-> Hàng hóa & hiệu quả vốn prototype (127.0.0.1:8790), same tab.
   Run: PLAYWRIGHT_BROWSERS_PATH=<repo>/frontend/.browsers node qa/nav-qa.mjs  → prints PASS/FAIL, writes qa/nav-results.json and qa/shots-nav/*.png
   Scope: navigation only (links, same tab, hostname/path, filter hand-back, overflow, console errors). Dashboard/prototype logic is covered by their own suites. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const here=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(path.join(here,'../../../../frontend/package.json'));
const {chromium}=require('@playwright/test');
const DASH='http://127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html',PROTO='http://127.0.0.1:8790/';
const SHOTS=path.join(here,'shots-nav');mkdirSync(SHOTS,{recursive:true});
const results=[],errors=[];
async function check(name,fn){try{const d=await fn();results.push({name,ok:true,detail:d||''});console.log('PASS  '+name+(d?'  → '+d:''))}catch(e){results.push({name,ok:false,detail:String(e.message).split('\n')[0]});console.log('FAIL  '+name+'\n      '+String(e.message).split('\n').slice(0,3).join('\n      '))}}
const eq=(a,b,m='')=>{if(a!==b)throw new Error(`${m} expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`)};
const ok=(c,m)=>{if(!c)throw new Error(m)};
const browser=await chromium.launch();
async function ctxPage(w,h,o={}){const ctx=await browser.newContext({viewport:{width:w,height:h},...o});const p=await ctx.newPage();p.on('pageerror',e=>errors.push(`pageerror @${p.url()}: ${e.message}`));p.on('console',m=>{if(m.type()==='error')errors.push(`console.error @${p.url()}: ${m.text()}`)});return {ctx,p}}
const shot=async(p,name,full=false)=>{try{await p.screenshot({path:path.join(SHOTS,name+'.png'),fullPage:full})}catch(e){results.push({name:'screenshot '+name,ok:false,detail:e.message});console.log('FAIL  screenshot '+name)}};
const scrollW=p=>p.evaluate(()=>document.documentElement.scrollWidth);
const dashReady=async p=>{await p.goto(DASH+'#view=dashboard');await p.locator('.ops-layout').waitFor()};

/* ---- 0. servers and static content ---- */
{
 const {ctx,p}=await ctxPage(1440,900);
 await check('server 8788 serves the dashboard V2 (HTTP 200) with the new link',async()=>{const r=await p.request.get(DASH+'.');const t=await (await p.request.get(DASH)).text();eq((await p.request.get(DASH)).status(),200);ok(t.includes('data-goods-link')&&t.includes(':8790/'),'link markup present');void r});
 await check('server 8790 serves the prototype (HTTP 200) with the back button',async()=>{const r=await p.request.get(PROTO);eq(r.status(),200);ok((await r.text()).includes('id="back-dash"'),'back button present')});
 await ctx.close();
}

/* ---- 1. desktop: dashboard → prototype → dashboard, same tab ---- */
{
 const {ctx,p}=await ctxPage(1440,900);
 await dashReady(p);
 const side=p.locator('.ops-side a[data-goods-link]');
 await check('desktop: sidebar item "Hàng hóa & hiệu quả vốn" is visible and links to http://127.0.0.1:8790/',async()=>{await side.waitFor();ok((await side.innerText()).includes('Hàng hóa & hiệu quả vốn'),'label');eq(await side.getAttribute('href'),PROTO);ok((await side.innerText()).includes('Prototype riêng'),'tag says it is a separate prototype');await shot(p,'dashboard-desktop-sidebar')});
 await check('desktop: the other ops links are unchanged (Thu–bán still routes inside the dashboard)',async()=>{await p.locator('.ops-side a',{hasText:'Thu–bán'}).first().click();await p.waitForFunction(()=>location.hash.includes('view=tx'));ok(p.url().startsWith(DASH),'still on dashboard');await p.goBack();await p.locator('.ops-layout').waitFor()});
 await check('desktop: click goes to the prototype in the SAME tab (no new page)',async()=>{await side.click();await p.waitForURL(PROTO+'**');eq(ctx.pages().length,1,'pages');ok((await p.title()).includes('Hàng hóa'),'title '+await p.title());await p.locator('#view *').first().waitFor();await shot(p,'prototype-desktop-with-back',false)});
 await check('prototype: "Quay lại dashboard V2" button is visible, href points to the dashboard path',async()=>{const b=p.locator('#back-dash');await b.waitFor();ok(await b.isVisible(),'visible');const h=await b.getAttribute('href');ok(h.startsWith(DASH+'#view=dashboard'),h);eq(await p.locator('#crumb-ops').getAttribute('href').then(x=>x.startsWith(DASH+'#view=dashboard')),true,'crumb Điều hành')});
 await check('prototype → dashboard: back button returns to #view=dashboard in the same tab',async()=>{await p.locator('#back-dash').click();await p.waitForURL(DASH+'#view=dashboard');await p.locator('.ops-layout').waitFor();eq(ctx.pages().length,1,'pages');ok((await p.locator('h1').first().innerText()).includes('Tổng quan điều hành'),'dashboard heading');await shot(p,'dashboard-after-return')});
 await check('keyboard: Tab to the sidebar link and Enter opens the prototype (same tab)',async()=>{await side.focus();await p.keyboard.press('Enter');await p.waitForURL(PROTO+'**');eq(ctx.pages().length,1,'pages')});
 await ctx.close();
}

/* ---- 2. filters survive the round trip (small, documented: the prototype hash only) ---- */
{
 const {ctx,p}=await ctxPage(1440,900);
 await p.goto(PROTO);await p.evaluate(()=>{try{localStorage.clear()}catch{}});await p.goto(PROTO+'#');await p.waitForSelector('#scope-ton');
 await p.click('#scope-ton');await p.selectOption('#f-cat','Túi xách');await p.click('[data-preset="0-200"]');await p.waitForTimeout(150);
 const kpiBefore=(await p.locator('.tile').filter({hasText:'Số món tồn'}).first().locator('.v').innerText()).trim();
 const hash1=await p.evaluate(()=>location.hash.slice(1));
 await check('prototype state lives in its hash (scope=ton, cat, price range) and the back link carries it',async()=>{ok(hash1.includes('scope=ton')&&hash1.includes('pmax=200'),hash1);const href=await p.locator('#back-dash').getAttribute('href');const m=href.match(/&goods=(.+)$/);ok(m,'goods param in '+href);eq(decodeURIComponent(m[1]),hash1,'carried hash')});
 await check('back to dashboard: the hash is stored for this tab and removed from the URL',async()=>{await p.locator('#back-dash').click();await p.waitForURL(DASH+'#view=dashboard');await p.locator('.ops-layout').waitFor();eq(await p.evaluate(()=>sessionStorage.getItem('baoq-goods-hash')),hash1);ok(!p.url().includes('goods='),'goods removed from URL: '+p.url())});
 await check('dashboard link now opens the prototype with the same filters (state restored)',async()=>{const side=p.locator('.ops-side a[data-goods-link]');eq(await side.getAttribute('href'),PROTO+'#'+hash1);await side.click();await p.waitForURL(PROTO+'**');await p.waitForSelector('#scope-ton');eq(await p.locator('#scope-ton').getAttribute('aria-pressed'),'true');eq(await p.inputValue('#pmax'),'200');eq(await p.inputValue('#f-cat'),'Túi xách');eq((await p.locator('.tile').filter({hasText:'Số món tồn'}).first().locator('.v').innerText()).trim(),kpiBefore,'same KPI');await shot(p,'prototype-filters-restored')});
 await check('browser Back from the dashboard also returns to the prototype with its filters',async()=>{await p.locator('#back-dash').click();await p.waitForURL(DASH+'#view=dashboard');await p.goBack();await p.waitForURL(PROTO+'**');await p.waitForSelector('#scope-ton');eq(await p.locator('#scope-ton').getAttribute('aria-pressed'),'true');eq(await p.inputValue('#pmax'),'200')});
 await check('fresh tab without stored filters opens the prototype with its defaults (plain URL)',async()=>{const {ctx:c2,p:p2}=await ctxPage(1440,900);await dashReady(p2);eq(await p2.locator('.ops-side a[data-goods-link]').getAttribute('href'),PROTO);await c2.close()});
 await ctx.close();
}

/* ---- 2b. cache safety: the static server sends no Cache-Control, so assets are stamped ?v=<sha> (qa/stamp-assets.mjs) ---- */
{
 const {ctx,p}=await ctxPage(1440,900);
 await check('assets in index.html are version-stamped and every stamp matches the current file content',async()=>{try{execFileSync(process.execPath,[path.join(here,'stamp-assets.mjs'),'--check'],{stdio:'pipe'})}catch(e){throw new Error(String(e.stdout||e.message).trim())}});
 await p.goto(PROTO);await p.waitForSelector('#back-dash');
 await check('the browser actually loads the stamped URLs (app.js?v=…, engine.js?v=…, css?v=…)',async()=>{const names=await p.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name));for(const f of ['app.js','engine.js','data.js','app-ops.css','app-v2.css','app-v2-base.css'])ok(names.some(n=>n.includes('/'+f+'?v=')),'unstamped or missing: '+f)});
 await check('reported scenario: Tồn hiện tại + Brand Dior → back link carries goods=… (also after a normal reload)',async()=>{await p.evaluate(()=>{try{localStorage.clear()}catch{}});await p.goto(PROTO+'#');await p.waitForSelector('#scope-ton');await p.click('#scope-ton');await p.selectOption('#f-brand','Dior');await p.waitForTimeout(150);eq(await p.evaluate(()=>location.hash),'#scope=ton&brand=Dior');const want=DASH+'#view=dashboard&goods='+encodeURIComponent('scope=ton&brand=Dior');eq(await p.locator('#back-dash').getAttribute('href'),want,'before reload');await p.reload();await p.waitForSelector('#back-dash');eq(await p.locator('#back-dash').getAttribute('href'),want,'after reload');await p.locator('#back-dash').click();await p.waitForURL(DASH+'#view=dashboard');eq(await p.evaluate(()=>sessionStorage.getItem('baoq-goods-hash')),'scope=ton&brand=Dior')});
 await ctx.close();
}

/* ---- 3. mobile 390: tabs and drawer ---- */
{
 const {ctx,p}=await ctxPage(390,844,{hasTouch:true,isMobile:true});
 await dashReady(p);
 await check('mobile: ops tab "Hàng hóa & hiệu quả vốn" exists (scrolls in the tab row) and links to :8790',async()=>{const a=p.locator('.ops-tabs a[data-goods-link]');await a.waitFor();await a.scrollIntoViewIfNeeded();ok(await a.isVisible(),'visible');eq(await a.getAttribute('href'),PROTO);await shot(p,'dashboard-mobile-tabs')});
 await check('mobile: drawer → Điều hành → "Hàng hóa & hiệu quả vốn" is present, tappable, same tab',async()=>{await p.locator('#menu-btn').tap();await p.locator('#open-ops').tap();const a=p.locator('#level-2 a[data-goods-link]');await a.waitFor();ok(await a.isVisible(),'visible');eq(await a.getAttribute('href'),PROTO);await p.waitForTimeout(450);await shot(p,'dashboard-mobile-drawer');await a.tap();await p.waitForURL(PROTO+'**');eq(ctx.pages().length,1,'pages')});
 await check('mobile: prototype shows the back button, no horizontal overflow, back returns to the dashboard',async()=>{await p.locator('#back-dash').waitFor();ok(await p.locator('#back-dash').isVisible(),'visible');ok(await scrollW(p)<=390,'prototype scrollWidth '+await scrollW(p));const bb=await p.locator('#back-dash').boundingBox();ok(bb.x>=0&&bb.x+bb.width<=390.5,'button inside viewport '+JSON.stringify(bb));await shot(p,'prototype-mobile-top');await p.locator('#back-dash').tap();await p.waitForURL(DASH+'#view=dashboard');await p.locator('.ops-tabs').waitFor();ok(await scrollW(p)<=390,'dashboard scrollWidth '+await scrollW(p))});
 await ctx.close();
}

/* ---- 4. no horizontal overflow on either page at 1440 / 768 / 390 (plain viewports, measured against the real width) ---- */
for(const w of [1440,768,390]){
 const {ctx,p}=await ctxPage(w,w<700?844:900);
 await check(`no horizontal overflow @${w}: dashboard (ops) and prototype`,async()=>{await dashReady(p);const a=await scrollW(p);ok(a<=w,`dashboard ${a} > ${w}`);await p.goto(PROTO);await p.waitForSelector('#back-dash');const b=await scrollW(p);ok(b<=w,`prototype ${b} > ${w}`);if(w===1440)await shot(p,'prototype-desktop-top')});
 await ctx.close();
}

/* ---- 5. English label on the dashboard, console errors ---- */
{
 const {ctx,p}=await ctxPage(1440,900);
 await p.goto(DASH);await p.evaluate(()=>localStorage.setItem('baoq-mockup-lang','en'));await p.goto(DASH+'#view=dashboard');await p.reload();await p.locator('.ops-layout').waitFor();
 await check('English: dashboard shows "Goods & capital efficiency" and the same link',async()=>{const a=p.locator('.ops-side a[data-goods-link]');ok((await a.innerText()).includes('Goods & capital efficiency'),await a.innerText());ok((await a.innerText()).includes('Separate prototype'),'EN tag');eq(await a.getAttribute('href'),PROTO)});
 await ctx.close();
}
await check('no page errors or console errors on either page during the whole run',async()=>{eq(errors.length,0,errors.slice(0,3).join(' | '))});
await browser.close();
const pass=results.filter(r=>r.ok).length,fail=results.length-pass;
writeFileSync(path.join(here,'nav-results.json'),JSON.stringify({when:new Date().toISOString(),dashboard:DASH,prototype:PROTO,pass,fail,results},null,1));
console.log(`\nNavigation QA: ${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
