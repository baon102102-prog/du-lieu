# BAOQ Internal — developer handoff for review

## Purpose and current state

Clickable synthetic UI scaffold only. Bảo wants to approve and adjust the structure, then describe it to their developer. The current frontend does not call an application API. A static localhost server serves a React build. Role selection is UI simulation, all data is public within the bundle, and there is no real authentication.

## Review sequence

1. Portal: verify five top-level applications. Only Điều hành opens; the others remain explicitly unavailable.
2. Select CEO UI persona → Điều hành → initial blank period → choose October demo.
3. Click revenue KPI/channel/sale legend → transaction table with URL filter → record → close/Escape/Back.
4. Click cost/result KPI → breakdown formula → transaction costs.
5. Click aged inventory and warning count → SKU/errors table → issue detail including impact, source, repair and completion criteria.
6. Switch Cofounder/Kho/Sale UI persona to discuss desired access states. This does not provide security.
7. Review accounting module labels and decide which screens to add/remove next.

## Visual direction

Neutral light backgrounds, graphite typography, restrained bronze accents; no slogans. Main shell uses 230px sidebar, 24–36px content gutters, 16–22px card gaps, 7–9px corners, compact tables and explicit empty/unavailable states. Desktop has 4 KPI columns, paired chart cards; narrow widths collapse grids, tables scroll inside containers.

## Future behavior for dev — specification, not delivered features

- Overall Điều hành view CEO-only. Other roles require explicit backend section grants; Cofounder never implicitly receives CEO financial access.
- Backend independently enforces list/detail/aggregate permissions; menu hiding alone is insufficient.
- Connect sources separately from UI. Sapo sales/refunds, Kiot purchases, OneDrive accounting authority, Price System authoritative pricing/age outputs.
- Retain source IDs, timestamps, provenance, freshness, snapshots, idempotency and approved corrections. No duplicate accounting implementation without source fixtures.
- Closed history changes block close and require approved current-period correction; preserve originals.
- No current commission/score computation until approved policy supplied.

## Latest Price System clarification — supersedes earlier notes

- Margin is profit divided by selling price; cost base only item purchase price. Other fees are separate.
- Sale-ready clock starts at the **earliest website OR social publication timestamp after photography**. Reuse existing SKU and publication/ready status data.
- Do NOT require both channels. Do NOT use stock receipt date as auto-sale start.
- Inventory financial age is separate from auto-sale age.
- Historical M0 baseline remains unresolved. Pricing bands, effective policy/version and concrete API contracts need confirmation.
- Existing auto-sale price approval stays in Price System; this scaffold does not rebuild or overwrite it.

## Suggested review decisions

Confirm portal labels, dashboard KPI choices, required table columns, whether financial inventory age is useful, issue grouping, and which accounting module to design next. Actual access grants, API contracts and source fixtures are implementation handoff items, not implied by this mockup.

## Preserved earlier work

`backend/`, `tests/`, SQL schema and Python environment were created before scope replacement. They are halted and unused. The run script starts only a static file server. No live integration or DB configuration was completed. Dev may independently inspect or disregard preserved code.

## UI iteration: unified shell and visible charts

Persistent BAOQ Internal header and global sidebar now exist on both Trang chủ and Điều hành. Module pages use the same content alignment and breadcrumb hierarchy. Internal actions update the same hash route; no window.open/target=_blank is used. The UI test verifies one tab, same origin and unchanged main-content x-position across home/module/detail/back.

Observed missing-chart state in the user's Chrome tab was `#page=overview` with no selected period. Added an explicit “Xem biểu đồ demo” action to that empty state; selected demo period remains in routes during internal navigation. CEO overview includes channel/sale donuts, cost breakdown, and weekly revenue/result horizontal bars. Weekly result derives from the synthetic transaction costs and operating cost dates, including a negative week; the total remains 27.5m VND. Bar clicks filter transactions by the fixture week. UI persona remains simulation only.

## Superseding home navigation revision

Home now contains only five central application tiles under the shared top header. The duplicate left module list and redundant breadcrumb navigation are removed from HOME entirely. Inside Điều hành, a contextual sidebar lists only Điều hành screens and a clear “← Trang chủ” button. Same-tab hash navigation, role simulation, charts and browser history are retained. This supersedes earlier notes requiring a global sidebar on Home. A1Radar reference was viewed read-only for visual context; no login, changes or tooling installation performed.

## Approved BAOQ branding

Original supplied JPEG preserved at frontend/public/brand/baoq-logo-original.jpg (Library libfile_0b473fc98b0c8191815c0807812465e1; actual bytes 2048×2048). It is displayed using CSS framing only; no redrawing or raster modification. Shared header uses deep walnut, white surfaces and black/walnut text, with chart accents #68452d / #211d19 / #ba9b7d. Headings use Georgia with serif fallback supporting Vietnamese on the reviewed Mac; this is a compatible visual choice, not identification of the logo's original font. Body and financial values retain readable system sans.

Home remains five tiles without sidebar. Context menu appears only in Điều hành. Six browser scenarios passed, including original logo intrinsic dimensions, mobile overflow, navigation and charts. Local visual evidence: brand-home-qa.png, brand-dashboard-qa.png, brand-mobile-qa.png.

## Current visual reference — shadcn/ui dashboard-01

Latest user selection supersedes the intermediate Shadcn Admin reference. Primary reference inspected in browser: https://ui.shadcn.com/view/new-york-v4/dashboard-01 (official repository https://github.com/shadcn-ui/ui). Applied its inset main surface, compact icon navigation, rounded KPI cards with supporting context, primary chart placement and restrained table borders. Existing React implementation adapted; no third-party source copied and no packages installed in this iteration.

The original BAOQ JPEG stays unchanged, centered in the shared header independently of right-hand role controls. At mobile sizes controls occupy a separate row. Walnut/white/black palette and serif title hierarchy remain. HOME has five tiles, no sidebar or breadcrumb; contextual navigation appears only inside Điều hành. All existing synthetic data and drilldowns remain unchanged. User's Sale selection in the live preview was preserved.

Current scope remains frontend UI scaffold only. Role checks are simulated in the browser; backend security, live source adapters and real balances are not delivered by this iteration.

## Luxury Workspace layer (2026-10-20) — supersedes the "five tiles" HOME notes above

Actual HOME in code: compact 56px header, BAOQ logo panel revealed on demand, then the department task board. The earlier "HOME = five tiles" descriptions are historical.

- **Header kept at 56px.** The logo panel still opens on mouse hover and keyboard focus; it now also toggles by click, tap, Enter and Space (`aria-expanded`, `aria-controls="brand-panel"`). The first activation after a hover/focus opens keeps it open. Escape and outside pointer still close it.
- **HOME app row** (`AppLauncher` in `src/app-header.tsx`): one compact row above the task board, same items/order and same-tab hash targets as the "Ứng dụng" menu (shared `appItems`). Unbuilt modules are disabled and labelled "Chưa triển khai". On mobile the row scrolls horizontally inside itself; the task board stays on the first screen.
- **Styles** live in `src/luxury.css`, loaded after `style.css`: tokens `--lx-*` (walnut `#68452d`, walnut-deep `#211604`, charcoal `#211d19`, white, muted `#73685d`), new classes `.lx-*`. Overrides of existing classes are limited to: secondary text colour for WCAG AA, focus outline colour, flat hover feedback (colour/border/shadow) and short entry animations for logo panel, app menu and record dialog.
- **Motion:** 140–280 ms, transform/opacity/colour only, no `pointer-events:none`, navigation never waits on animation. Light 3D (perspective tilt) only on the logo image and enabled app-row cards, and only for `(hover:hover) and (pointer:fine)`; touch gets a press scale. `prefers-reduced-motion: reduce` removes transforms, transitions and animations.
- **Flat data:** KPI values, tables, bars and donuts have no transforms or count-up; amounts render at their final value with tabular digits.
- **Unchanged:** content, synthetic figures, formulas, simulated roles, routes/filters/drilldowns, VI/EN glossary approach (two strings added: "ỨNG DỤNG", "Lối vào ứng dụng"), backend, data files.
- Screenshots: `docs/qa/luxury-baseline/` (before) and `docs/qa/luxury-after/` (after), produced by `frontend/visual-capture.spec.ts` with `frontend/playwright.capture.config.ts`.

## Quyết định chuẩn giao diện V2 — 2026-10-31

**Trạng thái: Bảo đã chọn baseline V2; chưa cho triển khai sửa KPI trong lượt này.** Đây là nguồn quyết định chung về font/layout/motion, thay thế tham chiếu Georgia và Luxury Workspace 20/10 ở trên khi chúng khác V2. Không thay chính sách nghiệp vụ hoặc xác nhận nghiệm thu KPI.

Evidence: khi được hỏi chọn HOME + dashboard Luxury Workspace đầu tiên hay HOME/dashboard V2, Bảo trả lời “v2” lúc 2026-10-31 06:22:55 UTC (Sentinel_d7ebb03453988191ada27908695f8dd6), gửi ảnh Sentinel_dbf7755770e0819196160ca89e52baf3 và nói “này nè em” (Sentinel_843a9526786c8191b92aa4b15085da86). Ảnh Library `libfile_2f802e1d10648191876a6a2ac284c0e0` được cloud worker tải bằng Library helper và xem pixels; parent xác nhận ảnh có URL `127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html#view=dashboard`, heading “Tổng quan điều hành”, brand BAOQ LUXURY. Executor Mac chưa tải/xem được ảnh Library trên Mac; đã đọc source và computed style của V2 trực tiếp.

Baseline: [V2 source](design-proposals/plan-mockup-v1/v2/mockup/src/baoq-mockup-v2.src.html), [preview](http://127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html#view=dashboard), [ảnh dashboard V2 lưu trong repo](design-proposals/plan-mockup-v1/v2/screens/dashboard-1440.png). Các giá trị dưới đây là trích xuất cách V2 đang thực hiện, không phải lựa chọn thiết kế mới. HOME giữ vai trò HOME; không áp kích thước hero HOME lên trang nghiệp vụ.

### Vai trò font dùng chung

- Serif: `"Baskerville","Palatino","Georgia",serif`. Sans: `-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif`. Không thêm webfont. Computed style xác nhận stack; chưa xác định font thực render từng glyph/fallback trên mọi thiết bị.
- Chỉ heading/display dùng serif theo component V2; body, điều khiển, bảng, số tiền/KPI dùng sans. Số dùng `tabular-nums`, không chạy đếm, không xoay/méo.

| Vai trò V2 | Size / weight / line-height | Quy tắc |
|---|---|---|
| HOME display | 44px / 400 / 1.08; mobile 26px | Serif |
| Tiêu đề trang Điều hành | 32px / 400 / 1.08; mobile 24px | Serif, `.slim-title` |
| Section title | 26px / 400 / 1.2; mobile 22px | Serif, không áp đại trà lên mọi h2 |
| Body | 16px / 400 / 1.5 | Sans |
| KPI tiền | 28px / 600 / 1.15; mobile 18px | Sans, `.kcard .kvalue` |
| KPI label / context | 14px / 400 / 1.5; context 13px, mobile12px | Sans |
| Button | 15px / 600 / 1.5 | Sans, cao tối thiểu44px |
| Table | 14px / 400 / 1.5; header weight500 | Sans; cell padding12px 8px, header8px |
| Sheet title / dialog title | 28px / 400 / 1.2; dialog26px, line-height kế thừa | Serif |

### Layout và component

Nhịp spacing V2: 4/8/12/16/20/24/32/40/56px. Gutter40px, dưới1100px là24px, dưới700px là16px. Header56px. HOME `.wrap` max1120px; Điều hành `.wrap-wide`/`.ops-layout` max1320px, sidebar232px + gap32px; dưới1100px chuyển sidebar thành tab ngang. Band Điều hành dùng biến thể compact của V2.

KPI là card riêng: desktop4 cột, dưới1100px2 cột; gap16px (mobile12px), radius14px, padding20px 20px 12px (mobile16px 16px 8px). Giữ gradient, highlight và bóng nhiều lớp của V2; không thay thành một dải KPI ghép. Radius chung: control6px, panel10px, sheet/dialog16px. Button cao44px, padding ngang20px, radius6px.

Phân biệt overlay theo tác vụ: sheet việc/chi tiết tác vụ bên phải rộng tối đa460px, mobile đáy92vh; dialog bản ghi giữa màn rộng tối đa560px, max-height80vh, padding24px, mobile đáy max-height88vh. Không tự đổi mọi dialog bản ghi thành sheet480px như KPI mới. Giữ Escape, trả focus, Back/Forward và bộ lọc.

### Motion thống nhất theo V2

Token thời lượng:120/180/240/280ms. `ease-out=cubic-bezier(.22,.8,.24,1)`, `ease-in=cubic-bezier(.4,0,1,1)`, `std=cubic-bezier(.4,0,.2,1)`. Đây là giá trị V2 được chọn, không thay bằng token140ms riêng của KPI.

| Hành vi | V2 |
|---|---|
| Button / đổi màu điều khiển | 120ms std; active scale .98 |
| Card KPI hover với chuột chính xác | translateY(-3px), bóng sâu + highlight theo con trỏ;180ms ease-out, highlight180ms std; không xoay chữ/số |
| Header khi cuộn | Nền/viền/bóng180ms std |
| Drawer / sheet / dialog | Vào240ms ease-out, ra180ms ease-in; dùng hướng chuyển động theo component |
| Lọc danh sách | opacity .35→1, translateY4→0px;180ms ease-out; không trì hoãn dữ liệu |
| HOME mở đầu | opacity + translateY6px;240ms, stagger40ms; không lặp thành hiệu ứng riêng từng module |
| Số liệu và biểu đồ | Không count-up, không xoay/méo; không tự thêm animation width của progress |
| Reduced motion | Thời lượng0, tắt keyframes/transforms tương ứng, nội dung vẫn đầy đủ |

Tham chiếu hành vi chi tiết: [02-flows-motion-a11y.md](design-proposals/plan-mockup-v1/02-flows-motion-a11y.md). Bảng này bổ sung đặc tính card V2; không lấy hiệu ứng tilt của Luxury Workspace cũ ghép vào V2.

### Kế hoạch KPI — chưa triển khai/chưa duyệt nội dung thu nhập

1. Đổi số KPI/tiền về sans V2; chuẩn hóa title/button/table theo vai trò trên, không thay font mới.
2. Dùng shell Điều hành compact, card riêng và cùng spacing/breakpoint; giữ hành vi drilldown và dữ liệu hiện có.
3. Dùng đúng overlay và motion V2, bỏ biến thể chuyển động riêng của KPI; giữ depth/highlight đã có trong mẫu V2.
4. Đối chiếu HOME/dashboard/KPI cùng viewport1440/768/390; kiểm computed style, font fallback/tiếng Việt, focus/Escape, reduced-motion và số liệu không đổi.
5. Bố cục ưu tiên thu nhập từng sale là kế hoạch riêng cần duyệt. Phạm vi có lương cơ bản hay không chưa chốt; không tự đặt lương, rates hoặc biến dữ liệu thiếu thành0. Quyết định baseline này không cấp quyền sửa UI, quét thêm dữ liệu, push/deploy hay sửa nghiệp vụ.


## Hiện trạng triển khai và bàn giao — 01/11/2026

[Bảng bàn giao Dev cập nhật 01/11/2026](ban-giao-dev-20261101.md) tổng hợp shell V2, KPI/Hàng hóa, Tổng quan tùy chỉnh, QA, quickstart và giới hạn dữ liệu. Các đoạn kế hoạch “chưa triển khai” phía trên là trạng thái lịch sử; bảng mới ghi hiện trạng đã kiểm chứng, không thay quyết định font/layout/motion V2. Chưa push source: remote du-lieu hiện public, cần chốt phạm vi chia sẻ trước xuất bản.
