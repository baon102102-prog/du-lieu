# Báo cáo sửa 5 điểm critique-20261031

Phạm vi: chỉ UI và QA của mockup. Không sửa `model.mjs`, `model.test.mjs`, `snapshot.json`, `engine.js`, `data.js`, chính sách hay tỷ lệ. Không dùng credential hay API nghiệp vụ. Không commit, push hay deploy.
Trình duyệt: Chromium (Playwright headless, `frontend/.browsers`). Ngoài ra trợ lý điều phối Codex đã bấm kiểm chéo KPI → Hàng hóa → Back trên Chrome thật.

## 5 fix đã làm

| # | Nội dung | File sửa |
|---|---|---|
| 1 | Đầu KPI gọn hơn. Chip "Mẫu một phần" và "Không phải thu nhập thực", kỳ, as-of nằm trên thanh một hàng. Độ bao phủ và chính sách ẩn trên mobile, vẫn có trong `<details>`. Số mẫu in đậm 14px, trạng thái thiếu 13px. Cảnh báo "không hiển thị 0" nằm một lần trong details. Tab một hàng trên mobile. | `kpi/controller.mjs`, `kpi/style.css` |
| 2 | Overlay KPI và Goods khóa cuộn nền (`body.is-locked`). Scrim giống V2: rgba(20,14,6,.48) + blur 6px. Vào 240ms, ra 180ms, reduced-motion thì 0. Escape đóng có hiệu ứng ra và trả focus. Đổi route (Back/Forward) hoặc rời module sẽ đóng overlay và nhả khóa. | `kpi/controller.mjs`, `kpi/style.css`, `ops-modules-v2/app.js`, `ops-modules-v2/qa/scope-css.mjs` → `app-ops.scoped.css` |
| 3 | Menu chung dạng một nút, dính dưới header, dùng cho cả 700–1099px trên mọi module. Chọn trực tiếp giữa các module, không vòng qua dashboard. | `src/baoq-mockup-v2.src.html` → build |
| 4 | Select của Goods dùng kiểu V2 `.select` (appearance none, chevron, 14px, bo 6px, 42px; 44px trên phone). KPI cũng 44px trên phone. | `scope-css.mjs`, `kpi/style.css` |
| 5 | Chữ 9–11px lên ≥12px: tâm donut, nhãn "Giả định mô phỏng", pill VÀ/HOẶC. Tab của Goods và nút mã chứng từ KPI ≥44px trên phone. Font theo role giữ nguyên. | `ops-modules-v2/app.js`, `app-ops.css`, `kpi/style.css`, `scope-css.mjs` |

Phần QA: `qa/fixes-20261031/verify.mjs`, `REPORT.md`, `shots-after/`, `measure-after.json`. Cập nhật `kpi/qa/kpi-qa.mjs` và `qa/shell-qa.mjs`.

## Kết quả

- `verify.mjs` (bộ đo mới cho 5 fix): **61/61**, từ lần chạy cuối trước khi viết báo cáo.
- Regression:
  - KPI QA: **31/31**.
  - Shell QA: **67/67**.
  - Goods QA (`qa-results.json`): **93/93**.
  - Unit `model.test` + `income.test`: **21/21**.
- Hash invariants (`PRE-EDIT-HASHES.sha256`): **5/5 OK**.
- Vị trí thẻ sale đầu tiên:

| Viewport | Trước | Sau |
|---|---|---|
| 390 | 831 (ngoài màn hình đầu) | 685 (đo cuối; 640 ở lần đo trung gian) |
| 768 | 641 | 572 |
| 1440 | 494 | 473 |

- Thứ tự thao tác chuẩn của scroll-lock: so y sau khi mở và focus với y sau wheel. Thiếu dữ liệu ≠ 0 được kiểm riêng: 24 dòng thiếu ở 390 không dòng nào hiện số tiền, dòng lương cơ bản là "Chưa cấu hình" và không có số tiền.
- Ảnh trước (đã che chứng từ): `shots-before/`. Ảnh sau: `shots-after/` (KPI 1440/390, nav 768, menu 768, overlay, Goods filters/hang).

## Lỗi của bộ đo đã sửa (không xóa kiểm tra để cho pass)

- `fix-qa.mjs` cũ truyền sai tham số `evaluate`, nên baseline overlay của nó không dùng được. Thay bằng `verify.mjs`.
- Scroll-lock ban đầu so y trước khi click, nhưng click tự cuộn tới nút. Nay so y sau mở/focus với y sau wheel.
- "Thiếu = 0" ban đầu quét mọi số `0`, nên nhầm số 0 thật. Nay kiểm riêng các dòng trạng thái thiếu và dòng lương.
- Kiểm tra navigation Goods ban đầu click tab rồi `goBack` làm mất nút mở. Nay dùng đường tx → module → mở overlay → Back thật → Forward → reload.
- Đếm mục active ở menu từng đếm cả mục ẩn; nay chỉ đếm danh sách mục trong menu.
- Kiểm sticky trên trang ngắn (tx, inventory) từng báo sai vì trang không cuộn; nay ghi `maxScroll` và chỉ yêu cầu dính khi trang đủ dài.
- Kỳ vọng cũ "tablet = tabs" của shell-qa đổi thành "menu" theo fix 3 được duyệt.
- `kpi-qa`: kiểm "không hiển thị 0" nay mở Chi tiết kỳ, đếm đúng một lần, rồi đóng lại. Controller không bị sửa để khớp test cũ.

## Giới hạn và ngoại lệ

- Chỉ Chromium headless (cộng một lượt Chrome thật do trợ lý điều phối Codex kiểm tra). Chưa kiểm Safari/Firefox, cảm ứng thật hay trình đọc màn hình.
- Chưa đo animation bằng video; thời gian ra/vào đo qua `getAnimations()` và thời điểm đóng sau Escape.
- Ngoại lệ tap target: các đoạn nhỏ của thanh cơ cấu (`.seg-b`, rộng 8–21px) không đạt 44px. Chúng là lối bấm thừa, vì chú giải (`.lg`, ≥44px) có cùng liên kết drill-down; đã loại các đoạn này khỏi phép đo.
- Liên kết nội dòng trong đoạn văn không bị ép 44px.
- Màu scrim và chữ đã được đo; đánh giá thẩm mỹ cuối vẫn do anh Bảo.
- Kiểm hash 5/5 và đọc `qa-results.json` đã được thực hiện ngoài lượt chạy cuối này. Báo cáo này không chạy lại test nào.
