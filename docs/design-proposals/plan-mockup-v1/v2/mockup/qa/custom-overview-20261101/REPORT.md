# Báo cáo: Sale & kênh vào KPI Sale, Tổng quan tùy chỉnh (2026-11-01)

URL local: `http://127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html#view=dashboard` (và `#view=kpi&k_view=channels`).
Phạm vi: chỉ composition, điều hướng và UI mockup. Không đổi số liệu, công thức, policy, tỷ lệ, `model.mjs`, `engine.js`, `data.js`, raw snapshot. Không backend, auth, API hay credentials. Không quét Sapo/Kiot. Không commit, push hay deploy.

## 1. Sale & kênh chuyển vào KPI Sale → Tổng quan sale

- `#view=kpi&k_view=channels` là tab đầu của KPI Sale. Nó nhúng nguyên view "Sale & kênh" của Hàng hóa (`BAOQGoods.mount(..., {only:'sale'})`), tính mọi kênh trong kỳ demo và không chịu filter kênh/giá của Goods. Công thức và nguồn là code cũ, không sao chép.
- Link cũ `#view=goods&g_tab=sale` (kể cả khi kèm filter cũ) được đổi bằng `replaceState` sang `#view=kpi&k_view=channels`. Back không bị lặp; reload và Back/Forward đúng. Sidebar chung giữ nguyên, KPI Sale là mục đang chọn.
- Thanh ngữ cảnh ghi rõ: dữ liệu demo, kỳ demo (lấy từ `PERIOD`, 01–21/10/2026, "không phải cả tháng"), không cùng kỳ với snapshot KPI 26–30/10 (chính sách 11 mô phỏng). Hai nguồn không cộng chung.
- Tab "Sale & kênh" của module Hàng hóa bị gỡ trong shell. Trang test độc lập `ops-modules-v2?standalone=1` vẫn giữ tab này để regression cũ còn dùng được.

## 2. Tổng quan tùy chỉnh (`#view=dashboard`)

- Bố cục mặc định giữ nguyên 11 khối điều hành cũ: 4 thẻ KPI, tuần, cảnh báo, kênh, sale, bridge, cơ cấu chi phí, ghi chú hoa hồng.
- Nút "Tùy chỉnh tổng quan" mở thanh chỉnh sửa gồm:
  - Thêm khối từ danh mục nhóm theo nguồn: Điều hành (demo) / KPI Sale / Hàng hóa / Hiệu quả vốn.
  - Gỡ khối.
  - Sắp xếp bằng nút Lên/Xuống (dùng được bằng bàn phím và trên mobile).
  - Lưu bố cục, Hủy, Khôi phục mặc định (chỉ đặt lại bản nháp).
  - Trạng thái trống an toàn, kèm nút "Dùng bố cục mặc định".
- Lưu bằng `localStorage` khóa riêng `baoq-dash-layout-v1`, ghi rõ "chưa đồng bộ theo tài khoản". Id lạ hoặc trùng bị bỏ khi đọc; dữ liệu hỏng thì dùng mặc định; không đụng khóa khác (policy Auto Sale, ngôn ngữ). Nếu lưu trữ bị chặn, trang báo "không lưu được" và bố cục chỉ giữ trong phiên.
- Khối mới dùng `kpi/controller.mjs::summary()` (cùng `analyze()`) và `BAOQGoods.summary()` (cùng `aggLines` / `stockAgg`). Không có công thức mới.
  - KPI: hoa hồng/thưởng đã xác minh (hiện "Chưa đủ dữ liệu", không phải 0), doanh số bán tạm tính, chờ xác minh, thu nhập từng sale.
  - Hàng hóa: doanh thu, số đơn, tỷ trọng kênh, số món tồn.
  - Hiệu quả vốn: vốn trong tồn, % vốn M6+, lãi gộp ÷ vốn, ngày bán TB.
- Nhãn kỳ trên từng khối:
  - Khối KPI ghi "Snapshot 26/10–30/10/2026 · as-of (lấy từ `capturedAt` của snapshot) · chính sách 11 mô phỏng", mẫu một phần, chưa phải toàn bộ thu nhập, lương cơ bản chưa cấu hình.
  - Khối bán ghi "Demo 01/10–21/10/2026".
  - Khối tồn (số món, vốn, M6+) ghi "tồn tính tại <ngày tính>, không phải kỳ bán".
  - Footer của Tổng quan nêu rõ từng nguồn và kỳ.
- Mỗi khối có link tới đúng module sở hữu số (KPI, Tổng quan sale, Hàng hóa Tồn/Bán) và giữ sidebar chung.
- `summary()` của Goods đổi `st.calc` chỉ trong lời gọi và luôn khôi phục. Đã kiểm: đổi calc/basis/source ở Goods không làm đổi khối dashboard, và quay lại Goods vẫn nguyên trạng thái. Danh mục, kênh và khoảng giá không được thử riêng ở kiểm tra này.

## 3. File thay đổi

| File | Thay đổi |
|---|---|
| `src/baoq-mockup-v2.src.html` → `baoq-mockup-v2.html` | `dashView` chuyển thành hệ khối (`opsBlocks`, `DB`, bố cục, chỉnh sửa, lưu), nút Tùy chỉnh ở band, chuyển link cũ, `ext.goodsSale` cho KPI, footer `footDash`, CSS `.dash-*` |
| `kpi/controller.mjs` | View `channels`, `summary()` xuất ra, hủy sub-mount khi đổi view |
| `kpi/style.css` | Tab KPI xuống dòng ở ≤699px (5 tab vừa 390) |
| `ops-modules-v2/app.js` | `only:'sale'`, gỡ tab Sale ngoài host độc lập, `stockAgg` dùng chung, `summary()` |
| `ops-modules-v2/qa/scope-css.mjs` → `app-ops.scoped.css` | Bản scoped sinh lại cho các thay đổi liên quan |
| `qa/shell-qa.mjs` | Footer Tổng quan theo `footDash` |
| `qa/custom-overview-20261101/` | `custom-qa.mjs`, `results.json`, `PRE-EDIT-HASHES.sha256`, `src-before/` (bản sao trước sửa), `smoke.mjs`, `shots/`, báo cáo này |

## 4. Kết quả (đọc từ file kết quả trong repo)

- `custom-qa.mjs` (`results.json`, 2026-11-01T05:47Z): **85/85**.
  - A: link cũ, số khớp nguồn, reload, Back/Forward, sheet trong Tổng quan sale.
  - B: add, remove, reorder, save, reload, cancel, reset, trống, không trùng, ở 1440/768/390.
  - C: dữ liệu hỏng, id lạ, khóa khác không đổi, lưu trữ bị chặn.
  - D: giá trị và link khớp trang nguồn, kỳ/as-of/ngày tính.
  - E: không rò trạng thái dashboard–Goods–KPI.
  - F: bàn phím, Escape, reduced-motion, vùng bấm.
- Hồi quy: KPI QA **31/31**, Shell QA **67/67**, Goods QA **93/93**, `fixes-20261031/verify.mjs` **61/61** (`measure-after.json`), unit model+income **21/21**, hash `PRE-EDIT-HASHES.sha256` **6/6** nguyên vẹn.
- Hai lỗi thật phát hiện giữa chừng và đã sửa:
  - 5 tab KPI làm tràn ngang ở 390px (477 > 390), đã cho tab xuống dòng.
  - Footer Tổng quan không còn là footer mặc định, đã cập nhật kỳ vọng shell-qa.
- Lỗi bộ đo đã sửa: A5 không dùng `/Sale/` (loại nhầm "Auto Sale"), vị trí reorder, regex số có NBSP, URL lọc của bài kiểm E trả về bảng trống.
- Bài kiểm E chỉ thực sự thử calc + basis + source; đã sửa tên assertion cho đúng phạm vi.
- Ảnh chụp chờ animation vào kết thúc rồi mới chụp.

## 5. Ảnh (đã làm mờ trường chứng từ)

Trong `qa/custom-overview-20261101/shots/`: `channels-1440`, `dash-edit-catalog-1440/390`, `dash-custom-1440/768/390`, `dash-custom-full-1440/390`, `dash-sources-1440`, và `smoke-channels` (bằng chứng smoke ban đầu).

## 6. Giới hạn

- Chỉ Chromium (Playwright headless) cộng một lượt Chrome do trợ lý điều phối kiểm tra. Chưa kiểm Safari/Firefox, cảm ứng thật hay trình đọc màn hình.
- Bố cục chỉ lưu trong trình duyệt này (`localStorage`), chưa đồng bộ theo tài khoản, không backend. Không kéo thả, không đổi kích thước khối; sắp xếp bằng nút Lên/Xuống.
- Khối mới chỉ có tiếng Việt (có ghi chú ở chế độ EN).
- Kỳ demo, snapshot KPI và ngày tính tồn khác nhau; không khối nào cộng chung chúng. Số KPI là mẫu một phần với chính sách 11 mô phỏng, không phải thu nhập thực.
- Tab Sale ở trang test Goods độc lập còn tồn tại chỉ để regression cũ chạy.
