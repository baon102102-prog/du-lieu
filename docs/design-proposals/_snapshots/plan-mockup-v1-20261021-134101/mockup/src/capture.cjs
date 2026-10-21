// Renders the mockup from file:// (no server) with headless Chromium, writes screenshots, paused-animation
// motion frames, interaction videos and a JSON check report into docs/design-proposals/plan-mockup-v1/.
// Usage (from repo root):
//   NODE_PATH=frontend/node_modules PLAYWRIGHT_BROWSERS_PATH=frontend/.browsers .node/bin/node docs/design-proposals/plan-mockup-v1/mockup/src/capture.cjs
const {chromium} = require('playwright');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');            // plan-mockup-v1/
const file = 'file://' + path.join(root, 'mockup', 'baoq-mockup-v1.html');
const DAY = 'today=2026-10-21';                               // fixed "today" for reproducible images (= device date when captured)
const out = d => { const p = path.join(root, d); fs.mkdirSync(p, {recursive: true}); return p; };
const SHOTS = out('screens'), FRAMES = out('motion/frames'), VIDEO = out('motion');
const report = {captured_at: new Date().toISOString(), file: path.relative(path.resolve(root, '../../..'), path.join(root, 'mockup/baoq-mockup-v1.html')), checks: [], errors: [], firstTaskTop: {}};
const check = (name, ok, detail) => report.checks.push({name, result: ok ? 'PASS' : 'FAIL', detail});
const url = h => `${file}#${DAY}&${h}`;

async function newPage(browser, w, h, extra = {}) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}, deviceScaleFactor: 1, ...extra});
  const page = await ctx.newPage();
  page.on('pageerror', e => report.errors.push(`${w}px pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') report.errors.push(`${w}px console: ${m.text()}`); });
  return {ctx, page};
}
const settle = page => page.waitForTimeout(350);
// Same-file hash navigations do not reload the document; reload so every capture starts from a clean state.
const load = async (page, h) => { await page.goto(url(h)); await page.reload(); };
// Mobile emulation zooms out when content is too wide (innerWidth grows), so also require the layout viewport to stay at the device width.
const overflow = page => page.evaluate(w => document.documentElement.scrollWidth <= w && innerWidth === w, page.viewportSize().width);

async function pausedFrames(page, name, trigger, times) {
  for (const t of times) {
    await load(page, trigger.hash || 'view=home'); await settle(page);
    if (trigger.before) { await trigger.before(page); await settle(page); }
    await page.evaluate(async ({code, t}) => {
      await (new Function('return (async()=>{' + code + '})()'))();
      document.body.offsetWidth;
      for (const a of document.getAnimations()) { a.pause(); a.currentTime = t; }
    }, {code: trigger.code, t});
    await page.screenshot({path: path.join(FRAMES, `${name}-t${String(t).padStart(3, '0')}.png`)});
  }
}

(async () => {
  const browser = await chromium.launch();

  // ---- Static screens + layout checks at 1440 / 768 / 390 ----
  for (const [w, h] of [[1440, 900], [768, 1024], [390, 844]]) {
    const {ctx, page} = await newPage(browser, w, h, w < 700 ? {isMobile: true, hasTouch: true} : {});
    await load(page, 'view=home'); await settle(page);
    report.firstTaskTop[w] = await page.evaluate(() => Math.round(document.querySelector('.row').getBoundingClientRect().top));
    check(`home ${w}px no horizontal overflow`, await overflow(page));
    check(`home ${w}px first task visible in first viewport`, report.firstTaskTop[w] < h, `first task top y=${report.firstTaskTop[w]} / viewport ${h}`);
    await page.screenshot({path: path.join(SHOTS, `home-${w}.png`), fullPage: true});
    await load(page, 'view=home&layout=dept'); await settle(page);
    await page.screenshot({path: path.join(SHOTS, `home-dept-${w}.png`), fullPage: true});
    await load(page, 'view=home&task=TASK-DEMO-01'); await settle(page);
    await page.screenshot({path: path.join(SHOTS, `home-task-sheet-${w}.png`)});
    await load(page, 'view=home'); await settle(page);
    await page.click('#menu-btn'); await settle(page);
    await page.screenshot({path: path.join(SHOTS, `drawer-level1-${w}.png`)});
    await page.click('#open-ops'); await settle(page);
    await page.screenshot({path: path.join(SHOTS, `drawer-level2-${w}.png`)});
    await load(page, 'view=dashboard'); await settle(page);
    check(`dashboard ${w}px no horizontal overflow`, await overflow(page));
    await page.screenshot({path: path.join(SHOTS, `dashboard-${w}.png`), fullPage: true});
    await load(page, 'view=tx&field=channel&value=Online'); await settle(page);
    check(`drilldown ${w}px no horizontal overflow`, await overflow(page));
    check(`drilldown Online shows 3 rows (${w}px)`, await page.locator('tbody tr').count() === 3);
    await page.screenshot({path: path.join(SHOTS, `drilldown-online-${w}.png`), fullPage: true});
    await load(page, 'view=tx&field=channel&value=Online&record=DEMO-S002'); await settle(page);
    await page.screenshot({path: path.join(SHOTS, `record-dialog-${w}.png`)});
    await ctx.close();
  }
  // English
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const {ctx, page} = await newPage(browser, w, h);
    await load(page, 'view=home'); await settle(page);
    await page.click(w < 700 ? '.lang button[aria-pressed="false"]' : '[data-lang="en"]'); await settle(page);
    check(`EN ${w}px home no overflow`, await overflow(page));
    const leftover = await page.evaluate(() => ['Mở việc', 'Tạo việc', 'Đi tới', 'Mở trang', 'Hôm nay,', 'Đang mở'].filter(s => document.getElementById('main').innerText.includes(s)));
    check(`EN ${w}px home: CTA, filters, side links all translated`, leftover.length === 0, leftover.join(', '));
    await page.screenshot({path: path.join(SHOTS, `home-en-${w}.png`), fullPage: true});
    await load(page, 'view=dashboard'); await settle(page);
    check(`EN ${w}px dashboard no overflow`, await overflow(page));
    await page.screenshot({path: path.join(SHOTS, `dashboard-en-${w}.png`), fullPage: true});
    await ctx.close();
  }

  // ---- Interaction checks (keyboard, focus trap, Escape, history, filters) ----
  {
    const {ctx, page} = await newPage(browser, 1440, 900);
    await load(page, 'view=home'); await settle(page);
    await page.focus('#menu-btn'); await page.keyboard.press('Enter'); await settle(page);
    const inDrawer = () => page.evaluate(() => document.getElementById('drawer').contains(document.activeElement));
    check('drawer: focus moves inside on open', await inDrawer());
    let trapped = true; for (let i = 0; i < 25; i++) { await page.keyboard.press('Tab'); trapped = trapped && await inDrawer(); }
    for (let i = 0; i < 5; i++) { await page.keyboard.press('Shift+Tab'); trapped = trapped && await inDrawer(); }
    check('drawer: Tab / Shift+Tab stay inside (focus trap)', trapped);
    await page.focus('#open-ops'); await page.keyboard.press('Enter'); await settle(page);
    check('drawer level 2: focus on Back', await page.evaluate(() => document.activeElement.id === 'back-btn'));
    await page.keyboard.press('Escape'); await settle(page);
    check('drawer level 2: Escape returns to level 1 and focuses the opener', await page.evaluate(() => document.getElementById('level-1').dataset.state === 'current' && document.activeElement.id === 'open-ops'));
    await page.keyboard.press('Escape'); await settle(page);
    check('drawer: Escape closes and returns focus to Menu', await page.evaluate(() => !document.getElementById('drawer').classList.contains('is-open') && document.activeElement.id === 'menu-btn'));
    for (let i = 0; i < 3; i++) { await page.click('#menu-btn'); await page.waitForTimeout(80); await page.click('#scrim', {position: {x: 1200, y: 400}}); await page.waitForTimeout(80); }
    check('drawer: open/close x3 quickly (interrupted transitions) ends closed', await page.evaluate(() => !document.getElementById('drawer').classList.contains('is-open') && !document.body.classList.contains('is-locked')));
    // filter keeps focus, counts flat
    await page.focus('[data-filter="today"]'); await page.keyboard.press('Enter'); await settle(page);
    check('filter Today: 1 row, focus stays on the filter, URL updated', await page.evaluate(() => document.querySelectorAll('.row').length === 1 && document.activeElement.dataset.filter === 'today' && location.hash.includes('filter=today')));
    await page.click('[data-filter="overdue"]'); await settle(page);
    check('filter Overdue: empty state with recovery action', await page.locator('.empty button').isVisible());
    await page.click('[data-filter="open"]'); await settle(page);
    // task sheet via keyboard, Escape, focus return, Back/Forward
    const row = page.locator('.row a').first(); await row.focus(); await page.keyboard.press('Enter'); await settle(page);
    check('task sheet: opens on Enter, focus inside', await page.evaluate(() => !!document.querySelector('.sheet.is-open') && document.querySelector('.sheet').contains(document.activeElement)));
    await page.keyboard.press('Escape'); await settle(page);
    check('task sheet: Escape closes and returns focus to the row', await page.evaluate(() => !document.querySelector('.sheet.is-open') && document.activeElement.matches('.row a')));
    await page.goForward(); await settle(page);
    check('task sheet: Forward reopens (URL state)', await page.evaluate(() => !!document.querySelector('.sheet.is-open')));
    await page.goBack(); await settle(page);
    check('task sheet: Back closes', await page.evaluate(() => !document.querySelector('.sheet.is-open')));
    // mark done + undo
    await row.click(); await settle(page); await page.click('[data-act="done"]'); await settle(page);
    const doneState = await page.evaluate(() => ({toast: document.getElementById('toast').classList.contains('is-open'), pill: document.querySelector('.sheet dd:last-of-type').textContent}));
    await page.click('#toast-undo'); await settle(page);
    const undone = await page.evaluate(() => document.querySelector('.sheet dd:last-of-type').textContent);
    check('task action: Mark as done shows toast, Undo restores status', doneState.toast && doneState.pill === 'Hoàn thành' && undone === 'Đang làm', `${doneState.pill} -> ${undone}`);
    await page.keyboard.press('Escape'); await settle(page);
    // drilldown + record dialog
    await load(page, 'view=dashboard'); await settle(page);
    await page.click('.hbars a >> nth=1'); await settle(page);
    check('dashboard: channel bar drills down to Online (3 rows)', await page.evaluate(() => location.hash.includes('value=Online') && document.querySelectorAll('tbody tr').length === 3));
    await page.click('[data-record="DEMO-S002"]'); await settle(page);
    check('record dialog: opens, focus inside', await page.evaluate(() => !!document.querySelector('.dialog.is-open') && document.querySelector('.dialog').contains(document.activeElement)));
    await page.goBack(); await settle(page);
    check('record dialog: Back closes, filter kept', await page.evaluate(() => !document.querySelector('.dialog.is-open') && location.hash.includes('value=Online')));
    // language switch keeps URL
    const before = page.url(); await page.click('[data-lang="en"]'); await settle(page);
    check('VI->EN keeps URL and translates', page.url() === before && await page.evaluate(() => document.querySelector('h1').textContent === 'Sales & receipts'));
    // motion budget
    const durations = await page.evaluate(() => { const s = v => v.split(',').map(x => parseFloat(x) * (x.trim().endsWith('ms') ? .001 : 1)); let max = 0;
      for (const el of document.querySelectorAll('*')) { const cs = getComputedStyle(el); for (const d of [...s(cs.transitionDuration), ...(cs.animationName === 'none' ? [] : s(cs.animationDuration))]) max = Math.max(max, d); } return max; });
    check('motion budget: no transition/animation longer than 280 ms', durations <= 0.28, `max ${Math.round(durations * 1000)} ms`);
    await ctx.close();
  }

  // ---- Reduced motion ----
  {
    const {ctx, page} = await newPage(browser, 390, 844, {reducedMotion: 'reduce', isMobile: true, hasTouch: true});
    await load(page, 'view=home'); await settle(page);
    await page.tap('#menu-btn');
    const rm = await page.evaluate(() => ({anims: document.getAnimations().length, t: getComputedStyle(document.getElementById('drawer')).transform}));
    check('reduced motion: drawer opens with no animation, final position immediately', rm.anims === 0 && rm.t === 'none', JSON.stringify(rm));
    await page.screenshot({path: path.join(SHOTS, 'reduced-motion-drawer-390.png')});
    await page.tap('#drawer-close'); await settle(page);
    await page.tap('.row a >> nth=0'); const rs = await page.evaluate(() => document.getAnimations().length);
    check('reduced motion: task sheet opens with no animation', rs === 0, `animations ${rs}`);
    await ctx.close();
  }

  // ---- Touch: targets >= 44px on interactive controls (390px) ----
  {
    const {ctx, page} = await newPage(browser, 390, 844, {isMobile: true, hasTouch: true});
    await load(page, 'view=home'); await settle(page);
    const small = await page.evaluate(() => [...document.querySelectorAll('main a, main button, main select, header a, header button')].filter(n => n.offsetParent).map(n => { const r = n.getBoundingClientRect(); return {n: (n.textContent || n.getAttribute('aria-label') || '').trim().slice(0, 30), h: Math.round(r.height), w: Math.round(r.width)}; }).filter(x => x.h < 44 || x.w < 44));
    check('touch 390px: every visible main/header control is at least 44x44 px', small.length === 0, JSON.stringify(small));
    await ctx.close();
  }

  // ---- Contrast (WCAG 2 text, same algorithm as frontend QA) ----
  {
    const {ctx, page} = await newPage(browser, 1440, 900);
    const audit = () => page.evaluate(() => { const parse = c => { const p = (c.match(/rgba?\(([^)]+)\)/)?.[1] || '').split(/[ ,\/]+/).filter(Boolean).map(Number); return p.length >= 3 ? {r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1} : null; };
      const lum = ({r, g, b}) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
      const bg = el => { for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > .5) return c; } return {r: 255, g: 255, b: 255}; };
      const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { const el = n.parentElement; if (!n.nodeValue.trim() || !el || el.closest('script,style,[hidden],.vh,.skip')) continue; const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue; const a = lum(parse(cs.color)), b = lum(bg(el)), ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05), size = parseFloat(cs.fontSize);
        if (ratio < ((size >= 24 || (+cs.fontWeight >= 700 && size >= 18.66)) ? 3 : 4.5)) out.push(`${n.nodeValue.trim().slice(0, 28)} ${ratio.toFixed(2)}`); }
      return out; });
    for (const h of ['view=home', 'view=dashboard', 'view=tx&field=channel&value=Online', 'view=home&task=TASK-DEMO-01']) {
      await load(page, h); await settle(page); const f = await audit(); check(`contrast AA: ${h}`, f.length === 0, f.join(' | '));
    }
    await load(page, 'view=home'); await settle(page); await page.click('#menu-btn'); await settle(page);
    const fd = await audit(); check('contrast AA: drawer open', fd.length === 0, fd.join(' | '));
    await ctx.close();
  }

  // ---- Motion frames: real CSS transitions paused at t (Web Animations API) ----
  {
    const {ctx, page} = await newPage(browser, 1440, 900);
    await pausedFrames(page, 'drawer-open-1440', {code: "document.getElementById('menu-btn').click()"}, [0, 60, 120, 180, 240]);
    await pausedFrames(page, 'task-sheet-open-1440', {code: "await new Promise(r=>{addEventListener('hashchange',()=>setTimeout(r,0),{once:true});location.hash+='&task=TASK-DEMO-01'})"}, [0, 80, 160, 240]);
    await pausedFrames(page, 'filter-change-1440', {code: "document.querySelector('[data-filter=\"today\"]').click()"}, [0, 60, 120, 180]);
    await ctx.close();
    const m = await newPage(browser, 390, 844, {isMobile: true, hasTouch: true});
    await pausedFrames(m.page, 'drawer-level2-390', {before: p => p.click('#menu-btn'), code: "document.getElementById('open-ops').click()"}, [0, 80, 160, 240]);
    await pausedFrames(m.page, 'task-sheet-open-390', {code: "await new Promise(r=>{addEventListener('hashchange',()=>setTimeout(r,0),{once:true});location.hash+='&task=TASK-DEMO-01'})"}, [0, 80, 160, 240]);
    await m.ctx.close();
  }

  // ---- Interaction videos (recorded; real-time playback) ----
  for (const [w, h, name, mobile] of [[1440, 900, 'interactions-1440.webm', false], [390, 844, 'interactions-390.webm', true]]) {
    const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'baoq-video-'));
    const ctx = await browser.newContext({viewport: {width: w, height: h}, recordVideo: {dir, size: {width: w, height: h}}, ...(mobile ? {isMobile: true, hasTouch: true} : {})});
    const page = await ctx.newPage(); const tap = sel => mobile ? page.tap(sel) : page.click(sel); const pause = ms => page.waitForTimeout(ms);
    await load(page, 'view=home'); await pause(900);
    await tap('#menu-btn'); await pause(700); await tap('#open-ops'); await pause(700); await tap('#back-btn'); await pause(600); await tap('#drawer-close'); await pause(700);
    await tap('[data-filter="today"]'); await pause(600); await tap('[data-filter="open"]'); await pause(600);
    await tap('[data-layout="dept"]'); await pause(700); await tap('[data-layout="list"]'); await pause(600);
    await tap('.row a >> nth=0'); await pause(800); await tap('[data-act="done"]'); await pause(900); await tap('#toast-undo'); await pause(700);
    await tap('[data-close="task"]'); await pause(700);
    await page.evaluate(() => window.scrollTo({top: 400})); await pause(500); await page.evaluate(() => window.scrollTo({top: 0})); await pause(400);
    await load(page, 'view=dashboard'); await pause(900); await tap('.hbars a >> nth=1'); await pause(800); await tap('[data-record="DEMO-S002"]'); await pause(900);
    await page.goBack(); await pause(700);
    const v = page.video(); await ctx.close(); await v.saveAs(path.join(VIDEO, name)); fs.rmSync(dir, {recursive: true, force: true});
  }

  await browser.close();
  check('no page or console errors', report.errors.length === 0, report.errors.join(' | '));
  fs.writeFileSync(path.join(root, 'mockup', 'capture-report.json'), JSON.stringify(report, null, 2));
  for (const c of report.checks) console.log(c.result.padEnd(4), c.name, c.detail ? '— ' + c.detail : '');
  console.log('first task top y:', JSON.stringify(report.firstTaskTop));
})().catch(e => { console.error(e); process.exit(1); });
