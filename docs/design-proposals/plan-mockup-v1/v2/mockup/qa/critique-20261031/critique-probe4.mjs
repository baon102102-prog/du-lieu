/* READ-ONLY: find text smaller than 12px (V2 minimum) in each module view. */
import {createRequire} from 'node:module';import {writeFileSync} from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.join(here,'../../../../../../..');
const require=createRequire(path.join(repo,'frontend/package.json'));const {chromium}=require('@playwright/test');
const D='http://127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html#view=';const R={};const b=await chromium.launch();
for(const w of [1440,390]){const ctx=await b.newContext({viewport:{width:w,height:900},...(w<500?{isMobile:true,hasTouch:true,deviceScaleFactor:2}:{})});const p=await ctx.newPage();
 for(const [n,h,s] of [['goods-ban','goods','.mod-goods .tile'],['goods-ton','goods&g_scope=ton','.mod-goods .tile'],['goods-tuoi','goods&g_tab=tuoi','.mod-goods #age-bars'],['goods-sale','goods&g_tab=sale','.mod-goods #sale-table'],['kpi','kpi','.mod-kpi .k-sale'],['kpi-sale','kpi&k_view=sale&k_sale=Linh','.mod-kpi .k-comp'],['dashboard','dashboard','.kcard']]){await p.goto(D+h);await p.waitForSelector(s);await p.waitForTimeout(500);
  R[n+'@'+w]=await p.evaluate(()=>{const o=[];const w=document.createTreeWalker(document.querySelector('.ops-main'),NodeFilter.SHOW_TEXT);for(let t=w.nextNode();t;t=w.nextNode()){if(!t.textContent.trim())continue;const e=t.parentElement;if(!e.checkVisibility?.())continue;const fs=parseFloat(getComputedStyle(e).fontSize);if(fs<12)o.push({fs,t:t.textContent.trim().slice(0,22),tag:e.tagName,cls:(e.className.baseVal??e.className).toString().slice(0,24)})}return {n:o.length,sample:o.slice(0,4)}})}
 await ctx.close()}
await b.close();writeFileSync(path.join(here,'probe4.json'),JSON.stringify(R,null,1));for(const [k,v] of Object.entries(R))console.log(k.padEnd(18),v.n,JSON.stringify(v.sample))
