import {createRequire} from 'node:module';import path from 'node:path';import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.join(here,'../../../../../../..');
const {chromium}=createRequire(path.join(repo,'frontend/package.json'))('@playwright/test');
const b=await chromium.launch(),ctx=await b.newContext({viewport:{width:1440,height:900}}),p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
const D='http://127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html#view=';
await p.goto(D+'dashboard');await p.waitForSelector('.dash-item');await p.waitForTimeout(600);
console.log(await p.evaluate(()=>[...document.querySelectorAll('.dash-item')].map(x=>x.dataset.bid).join(',')));
await p.goto(D+'goods&g_tab=sale');await p.waitForSelector('.mod-kpi .mod-goods .tile',{timeout:8000});await p.waitForTimeout(500);
console.log(await p.evaluate(()=>({h:location.hash,tabs:[...document.querySelectorAll('.k-tabs a')].map(a=>a.textContent),cur:document.querySelector('.ops-side [aria-current]').textContent,banner:document.querySelector('.banner')?.textContent.slice(0,60),per:document.querySelector('#kchan-per').textContent})));
await p.screenshot({path:path.join(here,'shots/smoke-channels.png')});
console.log('errs',errs);await b.close()
