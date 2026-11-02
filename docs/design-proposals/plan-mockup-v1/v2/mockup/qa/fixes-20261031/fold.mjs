import {createRequire} from 'node:module';import path from 'node:path';import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.join(here,'../../../../../../..');
const {chromium}=createRequire(path.join(repo,'frontend/package.json'))('@playwright/test');
const b=await chromium.launch();
for(const [w,h] of [[1440,900],[768,1024],[390,844]]){const ctx=await b.newContext({viewport:{width:w,height:h},...(w<500?{isMobile:true,hasTouch:true,deviceScaleFactor:2}:{})});const p=await ctx.newPage();
 await p.goto('http://127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html#view=kpi');await p.waitForSelector('.mod-kpi .k-sale');await p.waitForTimeout(400);
 console.log(w,JSON.stringify(await p.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();return {vh:innerHeight,ctx:Math.round(r('.k-ctx').height),saleTop:Math.round(r('.k-sale').top),tabsH:Math.round(r('.k-tabs').height),hOver:document.documentElement.scrollWidth>innerWidth}})));await ctx.close()}
await b.close()
