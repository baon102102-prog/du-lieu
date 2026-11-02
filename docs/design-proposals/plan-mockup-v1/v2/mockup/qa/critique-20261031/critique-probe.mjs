/* READ-ONLY probe for the design critique: loads pages, measures computed styles / positions, takes masked screenshots. Changes nothing. */
import {createRequire} from 'node:module';import {writeFileSync} from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.join(here,'../../../../../../..');
const require=createRequire(path.join(repo,'frontend/package.json'));const {chromium}=require('@playwright/test');
const D='http://127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html#view=';
const PAGES=[['dashboard','dashboard',null],['tx','tx',null],['inventory','inventory',null],['checks','checks',null],['goods','goods','.mod-goods .tile'],['kpi','kpi','.mod-kpi .k-sale'],['kpi-sale','kpi&k_view=sale&k_sale=Linh','.mod-kpi .k-comp'],['kpi-list','kpi&k_view=list&k_state=pending','.mod-kpi .k-table']];
const out={};const b=await chromium.launch();
const probe=()=>{const vis=e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return r.width>0&&r.height>0&&c.visibility!=='hidden'&&c.display!=='none'};
 const fam=e=>getComputedStyle(e).fontFamily.split(',')[0].replace(/["']/g,'');const q=s=>document.querySelector(s);
 const main=q('.ops-main')||q('main');const small=[...main.querySelectorAll('a,button,select,input,summary,[tabindex="0"]')].filter(e=>vis(e)&&!e.closest('[hidden]')).map(e=>{const r=e.getBoundingClientRect();return {t:(e.innerText||e.getAttribute('aria-label')||e.id||e.tagName).trim().slice(0,28),w:Math.round(r.width),h:Math.round(r.height),cls:e.className.toString().slice(0,30)}}).filter(x=>x.h<40||x.w<40);
 const heads=[...main.querySelectorAll('h1,h2,h3')].filter(vis).slice(0,8).map(e=>({tag:e.tagName,t:e.innerText.trim().slice(0,30),fam:fam(e),size:getComputedStyle(e).fontSize}));
 const nums=[...main.querySelectorAll('.kvalue,.tile .v,.k-total .kvalue')].filter(vis).slice(0,5).map(e=>({t:e.innerText.trim().slice(0,18),fam:fam(e),size:getComputedStyle(e).fontSize,w:getComputedStyle(e).fontWeight}));
 const firstCard=[...main.querySelectorAll('.kcard,.tile,.card,.k-sale')].filter(vis)[0];const fc=firstCard&&firstCard.getBoundingClientRect();
 const nav=q('.ops-side')&&getComputedStyle(q('.ops-side')).display!=='none'?'sidebar':q('.ops-menu')&&getComputedStyle(q('.ops-menu')).display!=='none'?'menu':'tabs';
 const tabs=q('.ops-tabs');return {sw:document.documentElement.scrollWidth,iw:innerWidth,nav,navSticky:tabs?getComputedStyle(tabs).position:null,h1:q('h1')&&{t:q('h1').innerText,fam:fam(q('h1')),size:getComputedStyle(q('h1')).fontSize},bandBottom:Math.round(q('.band').getBoundingClientRect().bottom),firstCardTop:fc?Math.round(fc.top):null,heads,nums,small:small.slice(0,12),smallCount:small.length}};
for(const w of [1440,768,390]){const ctx=await b.newContext({viewport:{width:w,height:w===390?844:w===768?1024:900},...(w<500?{isMobile:true,hasTouch:true,deviceScaleFactor:2}:{})});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 for(const [n,h,sel] of PAGES){await p.goto(D+h);if(sel)await p.waitForSelector(sel,{timeout:8000});await p.waitForTimeout(500);out[n+'@'+w]=await p.evaluate(probe);
  await p.addStyleTag({content:'.sens{filter:blur(7px)!important}'});await p.screenshot({path:path.join(here,'shots',`${n}-${w}.png`),fullPage:false})}
 out['errors@'+w]=errs;await ctx.close()}
await b.close();writeFileSync(path.join(here,'probe.json'),JSON.stringify(out,null,1));
for(const [k,v] of Object.entries(out)){if(k.startsWith('errors'))console.log(k,JSON.stringify(v));else console.log(k.padEnd(18),`nav=${v.nav} sticky=${v.navSticky} sw=${v.sw} h1=${v.h1?.fam}/${v.h1?.size} band=${v.bandBottom} firstCard=${v.firstCardTop} small=${v.smallCount}`)}
