import {test,expect} from '@playwright/test';
test('CEO drilldown, URL filters, repeated details, back, reload and blank period',async({page})=>{
 await page.goto('http://127.0.0.1:8787');
 await page.getByLabel('Vai trò demo').selectOption('ceo');
 await page.locator('.apps-trigger').click(); await page.locator('#apps-menu').getByRole('button',{name:'Điều hành',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Chưa chọn kỳ dữ liệu'})).toBeVisible();
 await page.getByLabel('Kỳ dữ liệu').selectOption('2026-10');
 await expect(page.getByText('190.000.000 ₫',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:/Online 65.000.000/}).click();
 await expect(page).toHaveURL(/field=channel/);
 await expect(page.getByRole('button',{name:'Mở DEMO-S002',exact:true})).toBeVisible();
 for(let i=0;i<3;i++){
  await page.getByRole('button',{name:'Mở DEMO-S002',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button',{name:'Đóng chi tiết'}).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
 }
 await page.reload();
 await expect(page.getByRole('button',{name:/Bỏ lọc: Kênh = Online/})).toBeVisible();
 await page.getByRole('button',{name:'Mở DEMO-S002',exact:true}).click();
 await page.goBack();
 await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.getByRole('button',{name:/Bỏ lọc: Kênh = Online/}).click();
 await expect(page.locator('tbody tr')).toHaveCount(7);
 await page.getByRole('button',{name:'Tổng quan điều hành',exact:true}).click();
 await page.getByRole('button',{name:/2 cảnh báo cần kiểm tra/}).click();
 await expect(page.locator('tbody tr')).toHaveCount(2);
 await page.getByRole('button',{name:'Mở DEMO-E01',exact:true}).click();
 await expect(page.getByText('Điều kiện hoàn thành',{exact:true})).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).not.toBeVisible();
});
test('cofounder denied; inventory grant works; mobile layout',async({page})=>{
 await page.goto('http://127.0.0.1:8787');
 await page.getByLabel('Vai trò demo').selectOption('cofounder');
 await page.locator('.apps-trigger').click(); await page.locator('#apps-menu').getByRole('button',{name:'Điều hành',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('chưa được cấp quyền');
 await page.getByLabel('Vai trò demo').selectOption('inventory');
 await page.locator('.apps-trigger').click(); await page.locator('#apps-menu').getByRole('button',{name:'Điều hành',exact:true}).click();
 await page.getByLabel('Kỳ dữ liệu').selectOption('2026-10');
 await expect(page.locator('tbody tr')).toHaveCount(4);
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
test('KPI costs, sale and aging reconcile; local visual review',async({page})=>{
 await page.goto('http://127.0.0.1:8787');
 await page.getByLabel('Vai trò demo').selectOption('ceo');
 await page.locator('.apps-trigger').click(); await page.locator('#apps-menu').getByRole('button',{name:'Điều hành',exact:true}).click();
 await page.getByLabel('Kỳ dữ liệu').selectOption('2026-10');
 await expect(page.getByText('190.000.000 ₫',{exact:true})).toBeVisible();
 await page.screenshot({path:'../docs/dashboard-local-qa.png',fullPage:true});
 await page.getByRole('button',{name:/An 70.000.000/}).click();
 await expect(page.locator('tbody tr')).toHaveCount(2);
 await page.getByRole('button',{name:'Tổng quan điều hành',exact:true}).click();
 await page.getByRole('button',{name:/Tồn từ 90 ngày/}).click();
 await expect(page.locator('tbody tr')).toHaveCount(2);
 await page.getByRole('button',{name:'Tổng quan điều hành',exact:true}).click();
 await page.getByRole('button',{name:/Tổng chi phí 162.500.000/}).click();
 await expect(page.getByText('27.500.000 ₫',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:/Xem giá vốn theo giao dịch/}).click();
 await expect(page.locator('tbody tr')).toHaveCount(7);
});
test('one shared shell from home to module, detail and browser back',async({page,context})=>{
 await page.goto('http://127.0.0.1:8787');
 await page.getByLabel('Vai trò demo').selectOption('ceo');
 const origin=new URL(page.url()).origin;
 const x=await page.locator('header').evaluate(el=>el.getBoundingClientRect().x);
 await expect(page.locator('aside')).toHaveCount(0);
 await expect(page.locator('.department-column')).toHaveCount(3);
 await expect(page.locator('header')).toBeVisible();
 await page.locator('.apps-trigger').click(); await page.locator('#apps-menu').getByRole('button',{name:'Điều hành',exact:true}).click();
 expect(new URL(page.url()).origin).toBe(origin);
 expect(await page.locator('header').evaluate(el=>el.getBoundingClientRect().x)).toBe(x);
 await expect(page.locator('header')).toBeVisible();
 await expect(page.getByRole('navigation',{name:'Đường dẫn'})).toContainText('Điều hành');
 await page.getByLabel('Kỳ dữ liệu').selectOption('2026-10');
 await page.getByRole('button',{name:/Doanh thu thuần 190.000.000/}).click();
 await page.getByRole('button',{name:'Mở DEMO-S001',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.goBack();
 await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.goBack();
 await expect(page.getByRole('heading',{name:'Tổng quan điều hành',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'← Trang chủ',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Công việc hiện tại theo bộ phận',exact:true})).toBeVisible();
 await expect(page.locator('aside')).toHaveCount(0);
 await expect(page.getByRole('navigation',{name:'Đường dẫn'})).toHaveCount(0);
 expect(await page.locator('header').evaluate(el=>el.getBoundingClientRect().x)).toBe(x);
 await page.goBack();
 await expect(page.getByRole('heading',{name:'Tổng quan điều hành',exact:true})).toBeVisible();
 expect(context.pages()).toHaveLength(1);
 expect(new URL(page.url()).origin).toBe(origin);
});
test('empty-state action reveals donuts and weekly bars with drilldown',async({page})=>{
 await page.goto('http://127.0.0.1:8787');
 await page.getByLabel('Vai trò demo').selectOption('ceo');
 await page.locator('.apps-trigger').click(); await page.locator('#apps-menu').getByRole('button',{name:'Điều hành',exact:true}).click();
 await page.getByRole('button',{name:/Xem biểu đồ demo/}).click();
 await expect(page.getByRole('img',{name:'Đóng góp theo kênh',exact:true})).toBeVisible();
 await expect(page.getByRole('img',{name:'Đóng góp theo sale',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Doanh thu & kết quả theo tuần'})).toBeVisible();
 await page.getByRole('button',{name:/01–07\/10: doanh thu 100.000.000/}).click();
 await expect(page.locator('tbody tr')).toHaveCount(3);
 await page.goBack();
 await expect(page.getByRole('heading',{name:'Doanh thu & kết quả theo tuần'})).toBeVisible();
});
test('compact header, centered reveal, menu dismissal and responsive home',async({page})=>{
 await page.goto('http://127.0.0.1:8787');
 for(const width of [1440,1024,768,390]){
  await page.setViewportSize({width,height:900});
  await expect(page.locator('.brand-panel')).toHaveCount(0);
  await page.locator('.brand-trigger').focus();
  await expect(page.locator('.brand-panel')).toBeVisible();
  const logo=page.locator('.brand-image img');
  expect(await logo.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth===2048)).toBe(true);
  const bounds=await page.locator('.brand-image').boundingBox();
  expect(Math.abs(bounds!.x+bounds!.width/2-width/2)).toBeLessThan(2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('.brand-panel')).toHaveCount(0);
  await page.locator('.apps-trigger').click();
  await expect(page.locator('#apps-menu')).toBeVisible();
  await page.locator('main h1').click();
  await expect(page.locator('#apps-menu')).toHaveCount(0);
 }
 await page.screenshot({path:'../docs/home-board-mobile-qa.png',fullPage:true});
 await page.setViewportSize({width:1440,height:900});
 await page.keyboard.press('ControlOrMeta+Home');
 await page.screenshot({path:'../docs/home-board-desktop-qa.png',fullPage:true});
 await page.locator('.brand-trigger').click(); await expect(page.locator('.brand-panel')).toBeVisible();
 await page.keyboard.press('Escape');
});
test('tasks create/edit/checklist/comments/completion preview with VI EN state continuity',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8787');
 await page.locator('.apps-trigger').click(); await page.locator('#apps-menu').getByRole('button',{name:'Công việc',exact:true}).click();
 await page.getByRole('button',{name:'+ Tạo việc demo',exact:true}).click();
 await page.getByLabel('Tên công việc',{exact:true}).fill('Công việc mẫu không dịch');
 await page.getByLabel('Hạn hoàn thành',{exact:true}).fill('2026-10-25');
 await page.getByRole('button',{name:'Switch language / Đổi ngôn ngữ'}).click();
 await expect(page.getByLabel('Task title',{exact:true})).toHaveValue('Công việc mẫu không dịch');
 await page.getByRole('button',{name:'Create task',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Task details',exact:true})).toBeVisible();
 await page.getByLabel('Assignee',{exact:true}).selectOption('Bình · demo');
 await page.getByLabel('New checklist item',{exact:true}).fill('Kiểm tra công việc');
 await page.getByRole('button',{name:'Add item',exact:true}).click();
 await page.getByLabel('Kiểm tra công việc',{exact:true}).check();
 await page.getByLabel('Demo comment',{exact:true}).fill('Bình luận tiếng Việt giữ nguyên');
 await page.getByRole('button',{name:'Add comment',exact:true}).click();
 await page.getByLabel('Status',{exact:true}).selectOption('Hoàn thành');
 await expect(page.getByRole('region',{name:'Telegram preview'})).toContainText('SIMULATION · NOT SENT');
 await expect(page.getByRole('region',{name:'Telegram preview'})).toContainText('Người giao · demo');
 const url=page.url();await page.getByRole('button',{name:'Switch language / Đổi ngôn ngữ'}).click();
 expect(page.url()).toBe(url);await expect(page.getByLabel('Tên công việc',{exact:true})).toHaveValue('Công việc mẫu không dịch');
 await expect(page.getByText('Bình luận tiếng Việt giữ nguyên',{exact:true})).toBeVisible();
 await page.getByRole('link',{name:/Mở công việc trong BAOQ/}).click();
 await page.reload();await expect(page.getByLabel('Trạng thái',{exact:true})).toHaveValue('Hoàn thành');
 await page.getByRole('button',{name:'Đóng công việc',exact:true}).click();
 await page.getByLabel('Lọc công việc',{exact:true}).selectOption('done');
 await expect(page.locator('.task-row')).toHaveCount(1);
 await page.getByRole('button',{name:'Telegram · Chưa kết nối',exact:true}).click();
 await page.getByLabel('Chu kỳ nhắc lặp',{exact:true}).selectOption('hour');
 await page.getByLabel('Giới hạn số lần nhắc',{exact:true}).selectOption('2');
 await page.getByLabel('Giờ yên lặng bắt đầu',{exact:true}).fill('21:00');
 await page.getByRole('button',{name:'Switch language / Đổi ngôn ngữ'}).click();
 await expect(page.getByLabel('Reminder cadence',{exact:true})).toHaveValue('hour');
 await expect(page.getByLabel('Quiet hours start',{exact:true})).toHaveValue('21:00');
 await page.getByRole('button',{name:'Preview due reminder',exact:true}).click();
 await expect(page.getByRole('region',{name:'Telegram preview'})).toBeVisible();
 await page.screenshot({path:'../docs/tasks-telegram-en.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'← Home',exact:true}).click();
 await expect(page.locator('.department-column')).toHaveCount(3);await expect(page.locator('aside')).toHaveCount(0);
 await page.screenshot({path:'../docs/tasks-portal-en-mobile.png',fullPage:true});
 expect(errors).toEqual([]);
});
test('English dashboard filtering and role warning persist on reload',async({page})=>{
 await page.goto('http://127.0.0.1:8787');await page.getByLabel('Vai trò demo').selectOption('ceo');
 await page.getByRole('button',{name:'Switch language / Đổi ngôn ngữ'}).click();
 await page.locator('.apps-trigger').click(); await page.locator('#apps-menu').getByRole('button',{name:'Operations',exact:true}).click();
 await page.getByRole('button',{name:/View demo charts/}).click();
 await page.getByRole('button',{name:/Online 65.000.000/}).click();
 await expect(page.locator('tbody tr')).toHaveCount(3);await page.reload();
 await expect(page.getByRole('button',{name:/Clear filter:/})).toBeVisible();
 await page.getByRole('button',{name:'Open DEMO-S002',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Close details'}).click();
 await page.getByLabel('Demo role').selectOption('cofounder');await page.locator('.apps-trigger').click(); await page.locator('#apps-menu').getByRole('button',{name:'Operations',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('no access');
});
// Luxury Workspace layer: launcher row, logo panel input modes, motion budget, flat amounts, history and contrast.
const overflowFree=(page:import('@playwright/test').Page)=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth);
test('luxury: compact launcher keeps task board first, keyboard opens apps in same tab, VI/EN',async({page,context})=>{
 await page.goto('http://127.0.0.1:8787');await page.getByLabel('Vai trò demo').selectOption('ceo');
 const launcher=page.getByRole('navigation',{name:'Lối vào ứng dụng'});
 await expect(launcher.getByRole('button')).toHaveCount(6);
 await expect(launcher.locator('button:disabled')).toHaveCount(4);
 for(const b of await launcher.locator('button:disabled').all())await expect(b).toContainText('Chưa triển khai');
 for(const [w,h] of [[1440,900],[1024,768],[768,1024],[390,844]]){
  await page.setViewportSize({width:w,height:h});
  expect((await page.locator('.department-column').first().boundingBox())!.y).toBeLessThan(h);
  expect(await overflowFree(page)).toBe(true);
 }
 await page.setViewportSize({width:1440,height:900});
 await launcher.getByRole('button',{name:/Công việc/}).focus();await page.keyboard.press('Enter');
 await expect(page.getByRole('heading',{name:'Công việc',exact:true,level:1})).toBeVisible();
 await page.goBack();await expect(launcher).toBeVisible();
 await launcher.getByRole('button',{name:/Điều hành/}).focus();await page.keyboard.press('Space');
 await expect(page.getByRole('heading',{name:'Tổng quan điều hành',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'← Trang chủ',exact:true}).click();
 const url=page.url();await page.getByRole('button',{name:'Switch language / Đổi ngôn ngữ'}).click();
 const en=page.getByRole('navigation',{name:'App shortcuts'});
 await expect(en).toContainText('APPS');await expect(en.getByRole('button',{name:/Operations/})).toContainText('Open →');
 await expect(en.locator('button:disabled').first()).toContainText('Not implemented');
 expect(page.url()).toBe(url);expect(context.pages()).toHaveLength(1);
});
test('luxury: logo panel opens by hover, click, Enter/Space; app menu repeats open/close',async({page})=>{
 await page.goto('http://127.0.0.1:8787');
 const trigger=page.locator('.brand-trigger'),panel=page.locator('.brand-panel');
 await page.locator('.home-brand').focus();await page.keyboard.press('Tab');
 await expect(panel).toBeVisible();await expect(trigger).toHaveAttribute('aria-expanded','true');
 await page.keyboard.press('Enter');await expect(panel).toBeVisible();
 await page.keyboard.press('Enter');await expect(panel).toHaveCount(0);await expect(trigger).toHaveAttribute('aria-expanded','false');
 await page.keyboard.press('Space');await expect(panel).toBeVisible();
 await page.keyboard.press('Escape');await expect(panel).toHaveCount(0);
 await trigger.hover();await expect(panel).toBeVisible();
 await trigger.click();await expect(panel).toBeVisible();
 await page.mouse.move(700,700);await expect(panel).toHaveCount(0);
 for(let i=0;i<3;i++){
  await page.locator('.apps-trigger').click();await expect(page.locator('#apps-menu')).toBeVisible();
  await page.keyboard.press('Escape');await expect(page.locator('#apps-menu')).toHaveCount(0);
  await expect(page.locator('.apps-trigger')).toBeFocused();
 }
});
test.describe('luxury touch',()=>{
 test.use({hasTouch:true,isMobile:true,viewport:{width:390,height:844}});
 test('tap toggles logo panel and opens apps from launcher',async({page,context})=>{
  await page.goto('http://127.0.0.1:8787');await page.getByLabel('Vai trò demo').selectOption('ceo');
  await page.locator('.brand-trigger').tap();await expect(page.locator('.brand-panel')).toBeVisible();
  await page.locator('.brand-trigger').tap();await expect(page.locator('.brand-panel')).toHaveCount(0);
  expect(await overflowFree(page)).toBe(true);
  await page.getByRole('navigation',{name:'Lối vào ứng dụng'}).getByRole('button',{name:/Điều hành/}).tap();
  await expect(page.getByRole('heading',{name:'Tổng quan điều hành',exact:true})).toBeVisible();
  await page.getByRole('button',{name:/Xem biểu đồ demo/}).tap();
  await expect(page.getByText('190.000.000 ₫',{exact:true})).toBeVisible();
  expect(await overflowFree(page)).toBe(true);expect(context.pages()).toHaveLength(1);
 });
});
test('luxury: motion stays within 120–280 ms, never disables input; reduced motion removes it',async({page})=>{
 const budget=()=>page.evaluate(()=>{const bad:string[]=[];const s=(v:string)=>v.split(',').map(x=>parseFloat(x)*(x.trim().endsWith('ms')?.001:1));
  for(const el of document.querySelectorAll('*')){const cs=getComputedStyle(el);for(const d of [...s(cs.transitionDuration),...(cs.animationName==='none'?[]:s(cs.animationDuration))])if(d&&(d<.12||d>.28))bad.push(`${el.className}:${d}`);
   if(el.matches('.lx-app,.app-menu,.app-menu button,.brand-trigger,dialog,dialog button')&&cs.pointerEvents==='none')bad.push('pointer-events:'+el.className);}
  return bad;});
 await page.goto('http://127.0.0.1:8787');await page.getByLabel('Vai trò demo').selectOption('ceo');
 await page.locator('.brand-trigger').hover();await expect(page.locator('.brand-panel')).toBeVisible();
 expect(await budget()).toEqual([]);
 await page.mouse.move(700,700);await page.locator('.apps-trigger').click();expect(await budget()).toEqual([]);
 await page.keyboard.press('Escape');
 const app=page.getByRole('navigation',{name:'Lối vào ứng dụng'}).getByRole('button',{name:/Điều hành/});
 await app.hover();await expect.poll(()=>app.evaluate(el=>getComputedStyle(el).transform)).not.toBe('none');
 await page.evaluate(()=>{location.hash='page=transactions&period=2026-10'});
 await page.getByRole('button',{name:'Mở DEMO-S001',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();
 expect(await budget()).toEqual([]);await page.keyboard.press('Escape');
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>{location.hash=''});
 await app.hover();expect(await app.evaluate(el=>getComputedStyle(el).transform)).toBe('none');
 await page.locator('.brand-trigger').hover();await expect(page.locator('.brand-panel')).toBeVisible();
 expect(await page.evaluate(()=>document.getAnimations().length)).toBe(0);
 expect(await page.locator('.brand-image').evaluate(el=>getComputedStyle(el).transform)).toBe('none');
});
test('luxury: amounts render final and flat, no count-up',async({page})=>{
 await page.goto('http://127.0.0.1:8787');await page.getByLabel('Vai trò demo').selectOption('ceo');
 await page.evaluate(()=>{location.hash='page=overview&period=2026-10'});
 const values=page.locator('.kpi strong');await expect(values).toHaveCount(4);
 const first=await values.allTextContents();
 expect(first).toEqual(['190.000.000 ₫','162.500.000 ₫','27.500.000 ₫','111.000.000 ₫']);
 expect(await page.evaluate(()=>document.getAnimations().length)).toBe(0);
 await page.waitForTimeout(600);expect(await values.allTextContents()).toEqual(first);
 expect(await values.first().evaluate(el=>getComputedStyle(el).fontVariantNumeric)).toContain('tabular-nums');
 await page.locator('.kpi').first().hover();expect(await page.locator('.kpi').first().evaluate(el=>getComputedStyle(el).transform)).toBe('none');
});
test('luxury: Back/Forward restore drilldown filter and record dialog',async({page,context})=>{
 await page.goto('http://127.0.0.1:8787');await page.getByLabel('Vai trò demo').selectOption('ceo');
 await page.evaluate(()=>{location.hash='page=overview&period=2026-10'});
 await page.getByRole('button',{name:/Online 65.000.000/}).click();await expect(page.locator('tbody tr')).toHaveCount(3);
 await page.getByRole('button',{name:'Mở DEMO-S002',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();
 await page.goBack();await expect(page.getByRole('dialog')).not.toBeVisible();await expect(page.getByRole('button',{name:/Bỏ lọc: Kênh = Online/})).toBeVisible();
 await page.goBack();await expect(page.getByRole('heading',{name:'Tổng quan điều hành',exact:true})).toBeVisible();
 await page.goForward();await expect(page.getByRole('button',{name:/Bỏ lọc: Kênh = Online/})).toBeVisible();await expect(page.locator('tbody tr')).toHaveCount(3);
 await page.goForward();await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();
 expect(context.pages()).toHaveLength(1);
});
test('luxury: text contrast meets WCAG AA on home, dashboard, table and tasks',async({page})=>{
 await page.goto('http://127.0.0.1:8787');await page.getByLabel('Vai trò demo').selectOption('ceo');
 for(const hash of ['','page=overview&period=2026-10','page=transactions&period=2026-10&field=channel&value=Online','page=tasks']){
  await page.evaluate(h=>{location.hash=h},hash);await page.waitForTimeout(350);
  const failures=await page.evaluate(()=>{const parse=(c:string)=>{const p=(c.match(/rgba?\(([^)]+)\)/)?.[1]||'').split(/[ ,\/]+/).filter(Boolean).map(Number);return p.length>=3?{r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}:null};
   const lum=({r,g,b}:{r:number;g:number;b:number})=>{const f=(v:number)=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
   const bg=(el:Element|null)=>{for(let e=el;e;e=e.parentElement){const c=parse(getComputedStyle(e).backgroundColor);if(c&&c.a>.5)return c}return {r:255,g:255,b:255,a:1}};
   const out:string[]=[];const walk=document.createTreeWalker(document.getElementById('root')!,NodeFilter.SHOW_TEXT);let n:Node|null;
   while((n=walk.nextNode())){const el=n.parentElement;if(!n.nodeValue?.trim()||!el||el.closest('button:disabled,svg'))continue;const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;
    const cs=getComputedStyle(el),a=lum(parse(cs.color)!),b=lum(bg(el)),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),size=parseFloat(cs.fontSize);
    if(ratio<((size>=24||(Number(cs.fontWeight)>=700&&size>=18.66))?3:4.5))out.push(`${n.nodeValue.trim().slice(0,30)} ${ratio.toFixed(2)}`);}
   return out;});
  expect(failures,hash||'home').toEqual([]);
 }
});
test('luxury: launcher focus ring is not clipped by its scroll row',async({page})=>{
 await page.goto('http://127.0.0.1:8787');await page.getByLabel('Vai trò demo').selectOption('ceo');
 for(const w of [1440,390]){
  await page.setViewportSize({width:w,height:900});
  for(const index of [0,5]){
   const card=page.locator('.lx-app').nth(index);
   await card.focus();await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');
   await expect(card).toBeFocused();
   const {ring,row}=await card.evaluate(el=>{const cs=getComputedStyle(el),o=parseFloat(cs.outlineWidth)+parseFloat(cs.outlineOffset),r=el.getBoundingClientRect(),p=el.parentElement!.getBoundingClientRect();return {ring:{l:r.left-o,t:r.top-o,r:r.right+o,b:r.bottom+o},row:{l:p.left,t:p.top,r:p.right,b:p.bottom}}});
   expect(ring.l,`${w}px card ${index} left`).toBeGreaterThanOrEqual(row.l);expect(ring.t,`${w}px card ${index} top`).toBeGreaterThanOrEqual(row.t);
   expect(ring.r,`${w}px card ${index} right`).toBeLessThanOrEqual(row.r);expect(ring.b,`${w}px card ${index} bottom`).toBeLessThanOrEqual(row.b);
  }
  expect(await overflowFree(page)).toBe(true);
 }
});
