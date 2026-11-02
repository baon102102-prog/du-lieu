# BAOQ V2 — bảng bàn giao Dev

Ngày rà: 01/11/2026. **Đạt phạm vi prototype đã duyệt; chưa phải ứng dụng vận hành.** Tài liệu này cập nhật hiện trạng triển khai, không tạo quyết định thiết kế hoặc chính sách mới. Nguồn chuẩn thiết kế vẫn là `docs/developer-handoff.md` (quyết định V2 ngày 31/10) và `docs/design-proposals/plan-mockup-v1/02-flows-motion-a11y.md`.

## 1. Kết luận cho Bảo

- Đã có shell/menu V2 dùng chung, KPI theo từng sale, 5 chỉnh sửa usability, Tổng quan sale chuyển vào KPI, và Tổng quan tùy chỉnh thêm/bớt/sắp xếp/lưu.
- Đạt kiểm thử kỹ thuật trên Chromium ở 1440/768/390. Đây không thay cho Bảo nghiệm thu thẩm mỹ hay duyệt số tiền chi thực tế.
- Dữ liệu vẫn là demo và snapshot cục bộ một phần. Chưa realtime, chưa đủ tháng, chưa tính lương cơ bản, chưa có API/auth/sync tài khoản.
- **Chưa đẩy GitHub:** remote `https://github.com/baon102102-prog/du-lieu` được API GitHub xác minh là **public**, owner `baon102102-prog`. User cho phép push source, chưa cho phép công khai dữ liệu/chính sách nội bộ. Không stage/commit/push trong lượt rà này; cần chốt đích private hoặc phạm vi được phép công khai.

## 2. Bảng yêu cầu — hiện trạng — nghiệm thu Dev

Quy ước path: `M = docs/design-proposals/plan-mockup-v1/v2/mockup`; `G = docs/design-proposals/ops-modules-v2`. QA được dẫn ở mục 5.

| Tính năng / yêu cầu | Hiện trạng và bằng chứng | Module | Dev cần làm / acceptance khi làm thật |
|---|---|---|---|
| Shell V2, menu xuyên suốt | Đạt prototype. Tổng quan, Thu–bán, Tồn kho, Kiểm tra, KPI, Hàng hóa cùng shell; active, Back/reload giữ đúng. Shell QA 67/67. | `M/src/baoq-mockup-v2.src.html` | Giữ menu dùng chung và deep link khi chuyển sang app; test chuyển liên tiếp các mục, reload/Back/Forward, không nhân đôi shell. |
| Font/layout/motion V2 | Heading serif theo stack V2; body/tiền/KPI/bảng sans, số tabular; không webfont mới. Desktop sidebar; tablet/mobile menu sticky phù hợp. | Handoff chuẩn V2, source shell, `M/kpi/style.css`, `G/app-ops.css` | Không dựng design system song song. Xác nhận fallback tiếng Việt trên thiết bị thật; đo motion và reduced-motion, không kết luận từ ảnh tĩnh. |
| 5 cải thiện usability | Đạt regression 61/61: đầu KPI mobile gọn, overlay khóa cuộn/exit/backdrop/reduced-motion, nav tablet dễ truy cập, select Goods theo V2, chữ/vùng bấm tốt hơn. | `M/qa/fixes-20261031/`; shell/KPI/Goods CSS | Giữ focus/Escape, khóa/nhả cuộn khi mở/đóng/chuyển trang; kiểm Safari, cảm ứng và screen reader trước release. |
| Sale & kênh → KPI | Đạt. Tab “Tổng quan sale” nhúng renderer gốc, mọi kênh trong kỳ demo; không chịu lọc Goods. Link cũ `#view=goods&g_tab=sale` đổi sang `#view=kpi&k_view=channels`. | `M/kpi/controller.mjs`; `G/app.js`; shell | Giữ nguồn số duy nhất, kiểm tổng khớp trang nguồn và link cũ/Back/reload. Không cộng doanh thu demo này với snapshot thu nhập. |
| Tổng quan tùy chỉnh | Đạt 85/85 custom QA. Catalog 23 khối (11 điều hành cũ, 4 KPI, 4 Goods, 4 capital), thêm/gỡ/lên/xuống/lưu/hủy/reset nháp/trạng thái trống. Không duplicate; xử lý id lạ/lưu lỗi. | `dashView`, `opsBlocks`, catalog `DB` trong source shell | Giữ thứ tự và lựa chọn sau reload. Nút Lên/Xuống dùng keyboard/mobile. Kéo thả và resize chưa triển khai, không phải điều kiện đã chốt. |
| Lưu bố cục | Chỉ localStorage key `baoq-dash-layout-v1`, cùng origin/trình duyệt. Chặn storage thì báo không lưu được và giữ trong phiên. | Source shell | Nếu cần sync: thiết kế schema version, user ownership, default/reset, conflict handling; chỉ làm sau khi chốt nhu cầu. Chưa có sync thiết bị/tài khoản. |
| Khối dùng chung số liệu | KPI summary dùng `analyze()`; Goods summary dùng `aggLines`/`stockAgg`. Không copy công thức mới. Có link chi tiết, nhãn kỳ/as-of/ngày tính tồn. | `M/kpi/controller.mjs::summary`, `G/app.js::summary` | Cùng query/model với trang gốc; contract/test tránh tổng lệch. Test hiện chứng minh không rò calc/basis/source; không tuyên bố đã thử mọi tổ hợp category/channel/price. |
| Income-first / completeness | Đạt biểu diễn. Thu nhập từng sale và khoản cấu thành; thiếu dữ liệu là null/trạng thái, không zero. Lương “Chưa cấu hình”; không gọi hoa hồng là toàn bộ thu nhập. Unit 21/21, KPI QA 31/31. | `M/kpi/{income,model,view,controller}.mjs` | API cung cấp coverage/proof có nguồn. Không suy đủ tháng từ số ngày/số dòng/detail=true. Không tự ngoại suy mẫu thành MTD hoặc chốt payroll. |
| Drilldown / xử lý thiếu | Bấm khoản → chứng từ → link Sapo/Kiot có sẵn; sửa tại nguồn, snapshot không tự cập nhật. Giao việc thật chưa có. | KPI view/controller | Xác minh quyền truy cập, mapping sale/nguồn, audit trail và refresh; “nhận việc” không đồng nghĩa hoàn tất. |
| Hàng hóa / tuổi tồn / giá | Có Bán/Tồn, slider hai đầu + nhập/preset, drilldown đúng phạm vi, tuổi từ ready-for-sale, phân biệt giá bán thật với giá hiện tại/vốn. Goods QA 93/93. | `G/{app,engine,data}.js` | Dùng SKU từng món; phân biệt distinct order và line item; thiếu ngày tách riêng. Mapping kho/bán cần xác minh API thật. |
| Policy / Auto Sale | Chỉ mô phỏng nháp→preview→duyệt demo→tính lại; phiên bản, reset chu kỳ và cost stop. | `G/engine.js`, `G/README.md` | Không áp production từ demo; bảo toàn invariants mục 4, chốt các giả định mở trước vận hành. |
| Dữ liệu live / auth / backend | Chưa triển khai cho prototype này. Role switch là UI demo, không bảo vệ dữ liệu. | Static V2; backend/frontend cũ là phần riêng | Dev chọn kiến trúc thực, auth/RBAC phía server, adapter Sapo/Kiot, retry/idempotency, audit; không coi code mẫu là đã bảo mật. |
| Đa ngôn ngữ / trình duyệt | Khối mới tiếng Việt; chưa parity EN. Chromium đã test, Safari/Firefox/chạm thật/screen reader chưa test. | UI mới và QA | Chốt yêu cầu ngôn ngữ; kiểm thiết bị/browser mục tiêu trước bàn giao production. |

## 3. Kiến trúc và quickstart thực tế

Prototype được duyệt nằm trong **docs**, không phải React app `frontend/src` hay backend FastAPI được giữ từ lượt trước. `scripts/run-local.sh` phục vụ `frontend/dist` ở 8787; đó **không phải** preview cuối này.

- Shell source HTML/CSS/JS → `build.cjs` inline logo từ `frontend/public/brand/baoq-logo-original.jpg` và stamp module → `M/baoq-mockup-v2.html`.
- KPI là ES module MVC; `income.mjs` là lớp completeness, `model.mjs` công thức thuần. Controller tải `kpi/snapshot.json` cục bộ.
- Goods dùng `window.BAOQGoods.mount/summary`; `M/goods` là symlink `../../../ops-modules-v2`, dùng một source. Khi copy/đóng gói phải giữ cấu trúc/symlink hoặc thiết kế serving tương đương; không copy thành hai phiên bản tự lệch.
- `G/app-ops.scoped.css` sinh từ `G/app-ops.css` bằng `G/qa/scope-css.mjs`. Script scope không đổi trong lượt custom dashboard; report Claude trước đó liệt kê nó là file sửa chưa chính xác.
- URL state: `view`, KPI tiền tố `k_`, Goods `g_`; bố cục localStorage khác với policy nháp. Module import có hash cache-busting.

Từ repo root, dùng Node đã có (`.node/bin/node`) và Python 3. Build không cần React/Vite; QA cần Playwright và Chromium hiện có trong `frontend/node_modules` / `frontend/.browsers`. `frontend/package.json` khai báo `@playwright/test ^1.64.1`; dùng lockfile khi Dev chuẩn bị môi trường mới, không lấy runtime binary từ Git.

```sh
# Terminal 1 — server preview V2, chỉ loopback
python3 -m http.server 8788 --bind 127.0.0.1 --directory docs/design-proposals/plan-mockup-v1
# Terminal 2 — chỉ khi chạy regression Goods standalone
python3 -m http.server 8790 --bind 127.0.0.1 --directory docs/design-proposals/ops-modules-v2
```

Mở `http://127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html#view=dashboard`.
KPI income: `#view=kpi&k_view=income`; Tổng quan sale: `#view=kpi&k_view=channels`; Hàng hóa: `#view=goods`. Cổng 8790 mặc định redirect vào shell; `?standalone=1` chỉ dùng QA cũ.

```sh
M=docs/design-proposals/plan-mockup-v1/v2/mockup
G=docs/design-proposals/ops-modules-v2
# Sau sửa CSS Goods, sinh scoped CSS; sau sửa UI, build/stamp shell
.node/bin/node "$G/qa/scope-css.mjs"
.node/bin/node "$M/src/build.cjs"
# Kiểm đọc-only trạng thái build
.node/bin/node "$M/src/stamp-modules.cjs" --check
.node/bin/node "$G/qa/scope-css.mjs" --check
# Unit + browser QA local
.node/bin/node --test "$M/kpi/model.test.mjs" "$M/kpi/income.test.mjs"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/frontend/.browsers"
.node/bin/node "$M/qa/custom-overview-20261101/custom-qa.mjs"
.node/bin/node "$M/qa/shell-qa.mjs"
.node/bin/node "$M/kpi/qa/kpi-qa.mjs"
.node/bin/node "$M/qa/fixes-20261031/verify.mjs"
.node/bin/node "$G/qa/run-qa.mjs"
```

Các lệnh/build/test trên đã dùng trong quá trình tạo bản cuối; lượt rà này đọc source và kết quả, kiểm stamps/hash, không chạy lại toàn bộ browser QA vô ích. Preview 8788/8790 đã được kiểm chứng trong lượt final QA trước đó. Lượt bàn giao không xác minh lại HTTP trực tiếp: sandbox từ chối network localhost; không đổi đường để né. Không khởi tạo server trùng nếu port đang có.

Env cần cho prototype/QA: **`PLAYWRIGHT_BROWSERS_PATH`, `PATH`** (chỉ tên, không secret). Không có biến credential API bắt buộc cho UI này. Không tự đặt tên khóa Sapo/Kiot/auth khi integration chưa thiết kế. Không commit `.env*`.

**Clone không đủ để chạy KPI có số:** snapshot local bị ignore và không được publish. Model/income tests và một số UI tests hiện phụ thuộc snapshot đó. Dev phải nhận fixture tổng hợp đúng schema hoặc nhận dữ liệu riêng qua kênh có quyền; fixture chia sẻ sạch chưa được tạo trong lượt này. Không tự copy raw snapshot vào source để làm test pass. Không có dữ liệu thì hiển thị lỗi/thiếu dữ liệu, không zero.

## 4. Dữ liệu và invariants không được thay âm thầm

- Tổng quan điều hành cũ: fixture tổng hợp; Goods/Tổng quan sale: demo 01–21/10/2026; KPI: snapshot 26–30/10/2026, thử policy 11/2026. As-of lấy `capturedAt`, ngày tính tồn riêng. Không cộng các nguồn/kỳ thành một tổng thực; không đổi timestamp thành vừa quét.
- Snapshot chỉ kiểm chi tiết một phần, không đối soát toàn bộ; chưa đủ kết luận commission tháng. Missing/proof không có ≠ zero/không đạt. Số tiền đã xác minh chỉ là phần xác định, chưa phải toàn bộ thu nhập.
- Bán = cá nhân + shop không cộng trùng. Commission bán phải đồng thời tổng ≥500 triệu và cá nhân ≥100 triệu; bậc lũy tiến lấy `model.mjs`/SOP hiện có, không tự đoán. Thưởng cá nhân 1% toàn doanh thu cá nhân khi đủ100 triệu. Thu mua1,5% tiền shop thực trả có bằng chứng, không dùng ngưỡng bán.
- Cross-sale: max(số món−1,0); đạt10 hoặc một đơn≥300 triệu →1 triệu/lần/sale/tháng. Chỉ đơn đủ tiền và trạng thái hợp lệ, không thêm cổng giao hàng. Loại livestream và ký gửi đối tác/B2B. Quay đầu phí≥10% giữ giá bán ban đầu; dưới10%/hủy không phí =0; bỏ luật hai tuần.
- Ngày ghi nhận, hoàn khác kỳ, tỷ lệ phí/mapping/phân bổ chưa đủ chứng cứ để chờ. Adapter thật phải chống dùng trùng payment ID trên toàn batch và lưu lịch sử mapping NCC/sale, không hồi tố từ nhóm hiện tại.
- Auto Sale: tách receipt/ready/cycle start/M0; tuổi từ ready, reset cycle không trẻ tuổi. Mỗi30 ngày, tính từ M0 và lượt hợp lệ, rerun không trừ lặp, không tự vượt M6/xuyên vốn. ≥600 triệu chưa có rule; thiếu ready tách riêng. Hot/trend,3%,nửa cơ chế,giá thu về chưa đủ công thức thì khóa tự động. Bracket M0 hay từng lượt/cách chặn vốn là giả định mô phỏng cần chốt, không tự thành policy thật.

## 5. Bằng chứng cuối và giới hạn rà soát

| Kiểm tra | Kết quả bản cuối | File bằng chứng |
|---|---|---|
| Tùy chỉnh + chuyển Sale | 85/85, `2026-11-01T05:47:12.116Z` | `M/qa/custom-overview-20261101/results.json` |
| Shell responsive/navigation | 67/67 | `M/qa/shell-results.json` |
| KPI UI | 31/31 | `M/kpi/qa/kpi-results.json` |
| 5fix overlay/motion/nav | 61/61 | `M/qa/fixes-20261031/measure-after.json` |
| Goods standalone | 93/93 | `G/qa/qa-results.json` |
| Model + income | 21/21 lần chạy cuối | Hai test files; output kiểm chứng trong phiên điều phối |
| Bất biến logic/data | 6/6 hash khớp, kiểm lại lượt bàn giao | `M/qa/custom-overview-20261101/PRE-EDIT-HASHES.sha256` |
| Cache module imports | Current, kiểm lại lượt bàn giao | `M/src/stamp-modules.cjs --check` |

Report chi tiết: `M/qa/custom-overview-20261101/REPORT.md`. Không tự coi ảnh QA là tài liệu công khai: ảnh vẫn có thể hiện tên sale/tổng tiền dù đã blur chứng từ. Những README ghi standalone/Quay lại dashboard hoặc “chưa triển khai KPI” là lịch sử; dùng bảng hiện trạng này cùng source cuối để bàn giao, giữ quyết định font V2 tại nguồn cũ.

## 6. GitHub, privacy và danh sách chưa được xuất bản

- Remote đã xác minh API GitHub: `https://github.com/baon102102-prog/du-lieu.git`, **public**, owner user `baon102102-prog`, default `main`; tài khoản kết nối có push/admin. Có quyền kỹ thuật không đồng nghĩa được phép công khai nội dung.
- Local branch `main`, HEAD `d22fa53c6ccc55da75f82a8c31cee1a6f6302911` là commit cũ, **không chứa kết quả uncommitted mới**. Không cung cấp nó như commit bàn giao. Index ban đầu trống; giữ mọi thay đổi có sẵn.
- Chưa stage/commit/push; chưa có SHA mới để kiểm CI. Local không có `.github/`; chưa kết luận CI remote “pass” hay “không cấu hình” cho một commit chưa tồn tại.
- Quét heuristic source/docs mới không thấy chuỗi credential theo các pattern token/private-key phổ biến; **không phải chứng nhận sạch secrets/history**. Phát hiện tham chiếu nghiệp vụ trong test/README và snapshot. Chưa audit toàn bộ lịch sử; không rewrite/scrub history hoặc đổi visibility.

| Không đưa vào gói publish hiện tại | Lý do / cách xử lý |
|---|---|
| `M/kpi/snapshot.json` | Snapshot riêng tư dù đã lược PII; được `.gitignore` cục bộ bỏ qua. Không force-add. |
| `docs/design-proposals/_snapshots/**` mới | Backup có thể chứa bản sao snapshot, source/ảnh lịch sử; ignore của module hiện tại không bảo vệ mọi backup. Giữ local. |
| `M/kpi/qa/shots*`, `M/qa/**/shots`, `M/qa/fixes-20261031/measure-before.json`, log/result có dữ liệu | Có thể chứa tên sale/tổng tiền/link chứng từ; cần scrub riêng trước chia sẻ. Không coi blur là anonymization đầy đủ. |
| KPI test files và README hiện có | Có ID/tham chiếu chứng từ và kỳ snapshot; cần tách synthetic fixture và expected values trước publish public. Không sửa test để né privacy trong lượt này. |
| Policy nội bộ và docs/source nghiệp vụ | Không tự công khai chỉ vì nằm trong source; cần chốt phạm vi/đích private. |
| `.env*`, runtime `.node/.venv`, `node_modules`, browser binaries, logs, mọi credentials | Không stage; dùng dependency lockfile và cấu hình an toàn tại môi trường Dev. |
| Thay đổi khác của user | Không `git add .`; chỉ stage danh sách đã rà sau khi chốt destination. |

## 7. Lộ trình Dev đề xuất, chưa triển khai

1. Chốt repo/quyền chia sẻ và fixture tổng hợp sạch; tạo gói clone chạy được, CI cho SHA thực tế, không dữ liệu khách.
2. Chốt data contract Sapo/Kiot: định danh món, order/line, payment allocation, mapping lịch sử, coverage/as-of, hoàn khác kỳ. Test replay/idempotency và đối soát nguồn.
3. Xây auth/RBAC server, API và audit trail; secret manager, không ship raw business data trong static bundle. Role demo không tái sử dụng làm security.
4. Nối read-only dữ liệu thật trước; đối soát với nguồn. Chỉ sau nghiệm thu mới xét policy writes/payroll/giao việc; không tự bật gửi tin hay bot.
5. Nếu Bảo yêu cầu: sync layout theo tài khoản, ngôn ngữ EN, browser/a11y QA; các mục này không được tự hiểu là đã giao làm ngay.

**Cần quyết định tiếp:** nơi nhận source private hay danh sách được phép công khai; cách chuyển dữ liệu test sạch. Lương cơ bản, công thức policy còn mở và full-month evidence vẫn cần chốt trước vận hành, không cản dùng prototype để duyệt trải nghiệm.
