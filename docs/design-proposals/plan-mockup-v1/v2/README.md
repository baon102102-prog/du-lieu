# Mockup v2: Dashboard Điều hành + khung Chính sách (checkpoint chờ duyệt)

**Phạm vi:** chỉ sửa phần dashboard của mockup local và thêm khung Chính sách. HOME và các flow hiện có giữ nguyên. App chính (`frontend/src`, `dist`, port 8787), backend, dữ liệu, quyền và dependencies không bị đụng tới (đã kiểm fingerprint). v1 giữ nguyên tại URL cũ để đối chiếu.

| | URL (server preview loopback hiện có, PID 36332) |
|---|---|
| **v2** | http://127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html |
| v2, mở thẳng dashboard | http://127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html#view=dashboard |
| v2, mở thẳng Chính sách | http://127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html#view=policy |
| v1 (đối chiếu, không đổi) | http://127.0.0.1:8788/mockup/baoq-mockup-v1.html |
| Ảnh và tài liệu v2 | http://127.0.0.1:8788/v2/ |

## Phản hồi của anh Bảo → thay đổi trong v2

| Phản hồi | Đã làm (chỉ dùng số demo có sẵn) |
|---|---|
| “nhìn chán, không đổ bóng, không 3D như bản cũ” | Card có viền mảnh, highlight trên, bóng 3 lớp. KPI tách thành 4 card riêng, card “Kết quả demo” nền espresso làm điểm nhấn. Hover (chuột) nhấc card 3px, bóng sâu hơn và có vệt sáng theo con trỏ. Chữ và số **không bị xoay hay méo**: test kiểm ma trận transform chỉ có tịnh tiến. Cột biểu đồ có gradient dọc và bóng đổ nhẹ nhưng **không dùng 3D cho biểu đồ**. |
| “không có biểu đồ trực quan” | SVG vẽ đúng bề rộng thật: (1) tuần = cột doanh thu + đường/vùng kết quả, tuần âm −14 tr nằm **dưới** trục 0; (2) cầu nối Doanh thu 190 tr → −Giá vốn 130,5 tr → −Vận hành 32 tr → Kết quả 27,5 tr; (3) thanh kênh và sale có gradient; (4) thanh cơ cấu chi phí với % doanh thu. Mỗi biểu đồ có bản xem dạng bảng và nhãn số trực tiếp. |
| “không có nút điều hướng để xem” | Sidebar Điều hành (desktop) với mục đang chọn rõ và badge 2 cảnh báo; tab ngang trên mobile/tablet; breadcrumb bấm được; mỗi KPI có “Xem chi tiết”; “Xem tất cả”; “Quay lại tổng quan”. Các trang Thu–bán, Tồn kho, Kiểm tra, Chi phí dựng từ dữ liệu demo. 5 mục chưa kết nối có trang riêng ghi rõ “Chưa kết nối nguồn”, **không có bảng hay nút giả**. |
| “nhớ bảng điều hành đợt trước” | Lấy lại những gì bản cũ có (card KPI riêng, Xem chi tiết, sidebar, thanh gradient), header thu gọn. Desktop: biểu đồ chính 2/3 + Cần xử lý 1/3. Mobile: KPI 2×2 và các khối cô đọng. |
| “thiếu chỗ để custom chính sách” | Trang **Chính sách & quy định** (vào từ drawer “Quản trị → Chính sách”, sidebar “Khác”, link từ ghi chú hoa hồng) với 5 nhóm: Đối soát & chia tiền · Giá & auto-sale · Phân quyền & duyệt · Hoa hồng & điểm · Nhắc việc. Mỗi nhóm có: quy tắc đã ghi trong tài liệu (chỉ đọc), tham số nháp, phiên bản và nguồn, xem trước tác động, Lưu/Xóa nháp DEMO (có Hoàn tác). |
| Cảnh báo “không chỉ toast” | Bấm cảnh báo mở panel chi tiết gồm mã, bản ghi liên quan (link mở dialog bản ghi), nguồn, ảnh hưởng tiền, cách xử lý, điều kiện hoàn thành. Nhóm tuổi tồn liệt kê D103 (115 ngày, 30 tr) và D104 (182 ngày, 12 tr), tổng 42 tr. |

## Quy tắc Chính sách đã tuân thủ (đọc từ `docs/source-contract.md`, `docs/developer-handoff.md`)

- 40/60, 0 VND, 500000 và “người duyệt: Bảo” chỉ hiện ở dòng **“Tài liệu ghi … chỉ tham chiếu lịch sử, không tự điền”**. Mọi ô đều trống, ghi “Chờ cấu hình”. Tài liệu không nói rõ 40/60 thuộc bên nào, và mockup ghi rõ điều đó.
- Bands theo tuổi và M0 hiển thị “Chưa chốt” / “Chưa giải quyết”, không có ô nhập. Công thức giá dùng đúng tài liệu: giá = giá vốn / (1 − biên). Ví dụ chỉ chạy trên số **người dùng tự nhập**, không áp vào SKU.
- Ngày sẵn sàng bán: **sớm nhất website HOẶC mạng xã hội sau khi chụp**, thay cho quy tắc AND cũ; không dùng ngày nhập kho.
- Hoa hồng/điểm: luôn hiện “Không tính”, kể cả khi nháp đã đủ trường.
- Phân quyền: ma trận nháp để trống. Cột “Mô phỏng: có/không” lấy từ `simulated-api.ts` và chỉ là trạng thái UI. Chọn Tổng quan cho vai trò khác CEO sẽ hiện cảnh báo theo tài liệu. Không cấp quyền thật.
- Xem trước khi thiếu điều kiện luôn ghi “Chưa đủ cấu hình: thiếu …”. Đối soát dù đủ tham số vẫn ghi “Không tính được số dư cầu nối: chưa kết nối nguồn”.
- Nháp chỉ lưu `localStorage` của trình duyệt đang xem (khóa `baoq-mockup-policy-draft-v2`), nhãn **Nháp DEMO**; không gọi nguồn hay API nào.

## Kiểm thử (Chromium headless có sẵn trong `frontend/.browsers`, không cài thêm)

- `mockup/src/capture.cjs` (file://): **128/128 PASS**, chi tiết trong `mockup/capture-report.json`. Gồm:
  - 390/768/1440: không tràn ngang, viewport không tự zoom.
  - HOME: 2 việc, việc đầu ở y=419/466/466 (giống v1).
  - Số liệu: KPI, nhãn biểu đồ, bảng tuần, kênh, sale, chi phí, công thức, tồn 90+ = 42 tr.
  - Điều hướng: sidebar, breadcrumb, Xem chi tiết ×4, Quay lại, Xem tất cả, drawer → Chính sách.
  - Drilldown và Back/Forward, panel cảnh báo bằng bàn phím (Escape trả focus), dialog hàng tồn.
  - Chính sách: mặc định trống, kiểm hợp lệ, chặn lưu khi sai, lưu, tải lại, xóa, Hoàn tác, xem trước ở cả 5 nhóm.
  - VI/EN không sót chuỗi; vùng chạm ≥ 44 px ở 390 (kể cả ma trận quyền).
  - Motion ≤ 280 ms, hover không xoay chữ, số không chạy đếm, reduced motion.
  - Contrast AA ở 9 màn; không lỗi console; v1 sha256 không đổi.
- Smoke qua HTTP thật (`http://127.0.0.1:8788/v2/...`): **12/12 PASS** ở 1440 và 390.
- So với v1, ảnh HOME chỉ khác ở **một dòng footer** (“v1” → “v2”); phần còn lại giống từng pixel.

## Mức độ bằng chứng

| Loại | Gồm |
|---|---|
| **Claude đã xem ở lần render cuối** | `screens/dashboard-390.png`; khung `motion/frames/chart-hover-1440-t120.png` (sau khi sửa nền hover trong suốt) |
| **Claude đã xem ở lần render trước** (sau đó chỉ đổi footer, vùng chạm ma trận, nền hover biểu đồ) | `dashboard-1440`, `policy-reconcile-draft-1440`, `policy-access-warning-1440`, `alert-priority-390-tap`; khung `kpi-hover-1440-t060/t180`, `alert-panel-1440-t080` |
| **Render thật, chưa mở xem từng ảnh** | Ảnh 768, EN, Tồn kho, Kiểm tra, Chi phí, chưa kết nối, Thu–bán tuần 1, dialog hàng tồn, 3 nhóm chính sách còn lại, xem dạng bảng, reduced motion; các khung motion còn lại. Chỉ có kiểm tra tự động. |
| **Video** | `motion/v2-interactions-1440.webm`, `-390.webm` đã ghi; **Claude không xem được video**. |
| **Motion** | “Đã thấy” = khung hình transition thật bị dừng tại t, không phải quan sát realtime; chưa đo FPS. |

Lỗi tìm thấy nhờ xem ảnh và đã sửa:
- nhãn kết quả đè lên cột;
- thanh lưu dạng sticky đè nội dung;
- link bản ghi lệch dòng;
- ô chọn quyền chỉ 20 px;
- nền hover che đường kết quả;
- focus không trả về nút cảnh báo, do `main` bị render lại khi chỉ tham số lớp phủ thay đổi.

## Thay đổi file (lượt này)

- **Mới:** `docs/design-proposals/plan-mockup-v1/v2/` (README này, `mockup/baoq-mockup-v2.html`, `mockup/src/{baoq-mockup-v2.src.html, build.cjs, capture.cjs}`, `mockup/capture-report.json`, `screens/` 42 ảnh, `motion/frames/` 13 khung, `motion/` 2 video).
- **Mới:** snapshot `docs/design-proposals/_snapshots/plan-mockup-v1-20261021-134101/` + `.MANIFEST.sha256` (62 file v1).
- **Không đổi:** toàn bộ v1 (đối chiếu manifest: 62/62 OK), `frontend/`, `backend/`, `tests/`, `scripts/`, các docs khác.
- `baoq-mockup-v2.src.html` bắt đầu từ bản sao byte-identical của nguồn v1. Phần HOME, header, drawer, sheet việc và cơ chế VI/EN giữ nguyên. Chỉ thay khối CSS/JS dashboard, thêm view và lớp phủ mới, thêm mục Chính sách vào drawer (bỏ dòng “Chính sách … Chưa triển khai” ở nhóm Sắp có).

## Rollback

- Bỏ v2: xóa thư mục `docs/design-proposals/plan-mockup-v1/v2/`. v1 và URL v1 không bị ảnh hưởng; không cần restart server.
- Khôi phục v1 nếu nghi bị sửa: chép lại từ `_snapshots/plan-mockup-v1-20261021-134101/`, rồi kiểm bằng `shasum -a 256 -c` với manifest.
- Tái tạo v2 từ nguồn: `.node/bin/node docs/design-proposals/plan-mockup-v1/v2/mockup/src/build.cjs`, rồi chạy `capture.cjs` (lệnh ở đầu file).

## Cần anh quyết (không coi là đã duyệt)

1. Nhóm tham số Chính sách và tên gọi có đúng ý chưa; còn quy tắc nào cần thêm từ tài liệu nào.
2. Sidebar desktop + tab mobile cho Điều hành (thay đề xuất D4 “chỉ tab” ở v1) có giữ không.
3. Mức “3D tiết chế” (nhấc 3px, bóng sâu, vệt sáng) đã đủ hay muốn đậm hơn; biểu đồ vẫn giữ 2D để không sai dữ liệu.
