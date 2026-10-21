# BAOQ Internal — đề xuất redesign HOME + Dashboard (plan & mockup v1)

**Trạng thái: CHỜ DUYỆT.** Chỉ có kế hoạch và mockup. Chưa có thay đổi nào trong app: `frontend/src`, `frontend/dist`, dữ liệu, backend, config, deps, test và docs cũ giữ nguyên (đã đối chiếu fingerprint). App cũ vẫn chạy tại http://127.0.0.1:8787 (PID 33738, không bị đụng tới).

## Mở mockup

Mở trực tiếp file [`mockup/baoq-mockup-v1.html`](mockup/baoq-mockup-v1.html) bằng trình duyệt (file://, không cần server, không gọi mạng). File tự chứa; logo gốc được nhúng bằng base64 và chỉ cắt bằng CSS.

- Thanh địa chỉ dùng hash: `#view=home` · `#view=dashboard` · `#view=tx&field=channel&value=Online`
- Cố định "hôm nay" để chụp ảnh lặp lại được: thêm `today=2026-10-21` (mặc định lấy ngày của máy).
- Dữ liệu là bản sao của `frontend/src/demo-data.json` và seed trong `frontend/src/tasks.tsx`. Không có chỉ số, ngày hay độ ưu tiên nào được bịa thêm.

## Tài liệu

| File | Nội dung |
|---|---|
| [01-ke-hoach-code.md](01-ke-hoach-code.md) | Kế hoạch code, IA và routes, design tokens, ranh giới giữ nguyên, test giữ/cập nhật |
| [02-flows-motion-a11y.md](02-flows-motion-a11y.md) | Flow menu cấp/back, filter, chi tiết, thao tác việc; storyboard motion; reduced motion, bàn phím, cảm ứng |
| [03-subagents.md](03-subagents.md) | Chia subagent sau khi duyệt: vai trò, file ownership, phụ thuộc, checkpoint |
| [04-nghiem-thu-rollback.md](04-nghiem-thu-rollback.md) | Checklist nghiệm thu 390/768/1440 và kế hoạch rollback |
| `screens/` | 29 ảnh tĩnh render từ mockup (1440/768/390, VI/EN, drawer, sheet, drilldown, dialog, reduced motion) |
| `motion/frames/` | 21 khung hình: transition thật bị tạm dừng tại t ms |
| `motion/*.webm` | 2 video tương tác (1440 và 390) |
| `mockup/capture-report.json` | Kết quả 48 kiểm tra tự động trên mockup |
| `mockup/src/` | Nguồn mockup, `build.cjs` (nhúng logo), `capture.cjs` (chụp và kiểm tra) |

Cách tái tạo (từ thư mục repo, chỉ dùng công cụ sẵn có, không cài gì):

```sh
.node/bin/node docs/design-proposals/plan-mockup-v1/mockup/src/build.cjs
NODE_PATH=frontend/node_modules PLAYWRIGHT_BROWSERS_PATH=frontend/.browsers .node/bin/node docs/design-proposals/plan-mockup-v1/mockup/src/capture.cjs
```

## Mức độ bằng chứng (phân biệt rõ)

| Loại | Gồm những gì |
|---|---|
| **Render thật, Claude đã mở xem ở lần render cuối** | `home-390`, `home-en-390`, `record-dialog-390` |
| **Render thật, Claude đã mở xem ở một lần render trước** (sau đó còn vài sửa CSS nhỏ, chủ yếu không nhắm tới màn đó, rồi tất cả được render lại bằng cùng script) | `home-1440`, `home-dept-1440`, `home-task-sheet-1440`, `home-task-sheet-390`, `dashboard-1440`, `dashboard-390`, `drawer-level1-1440`, `drawer-level1-390`, `drawer-level2-390`; khung `drawer-open-1440-t060`, `drawer-level2-390-t080/t160`, `task-sheet-open-390-t080` |
| **Render thật, chưa mở xem từng ảnh** | Các ảnh 768, `dashboard-en-*`, `drilldown-online-*`, `record-dialog-1440/768`, `reduced-motion-drawer-390` và các khung còn lại. Có kiểm tra tự động về tràn ngang, contrast và hành vi, nhưng chưa được nhìn bằng mắt. |
| **Video** | `motion/interactions-1440.webm`, `-390.webm` được ghi bằng Chromium headless theo kịch bản trong `capture.cjs`. **Claude không xem được video** (không có công cụ phát), chỉ xác nhận file đã được tạo. |
| **Motion** | "Đã thấy" ở đây nghĩa là khung hình tĩnh của transition thật bị dừng tại t (Web Animations API), **không phải quan sát realtime**. Chưa đo FPS hay hiện tượng giật khung. |
| **Suy ra từ code** | Hành vi trong app thật sau khi triển khai (mọi mục trong 01–04 nói về app) là kế hoạch, chưa có gì chạy trong app. |

Kiểm tra tự động trên **mockup** (không phải app): **48/48 PASS**, gồm:
- Không tràn ngang ở 390/768/1440 cho VI và EN; ở mobile còn kiểm thêm viewport không bị tự zoom.
- Việc đầu tiên nằm trong màn hình đầu.
- Focus trap và Escape cho drawer, sheet, dialog; focus trả về đúng chỗ.
- Back/Forward, filter giữ focus, Mark done + Undo, drilldown Online 3 dòng.
- VI/EN đổi ngôn ngữ mà URL giữ nguyên.
- Thời lượng motion ≤ 280 ms (đo được tối đa 240 ms); reduced motion không còn animation nào.
- Vùng chạm ≥ 44×44 px ở 390px; contrast AA 0 lỗi; không có lỗi console.

Vị trí việc đầu tiên trên HOME (y, px): **390px: 419** (HOME cũ: 560) · 768px: 466 · 1440px: 466.

## Quyết định cần anh duyệt

| # | Đề xuất (khuyến nghị) | Phương án khác | Ảnh hưởng |
|---|---|---|---|
| D1 | Header 56px nền espresso, **wordmark logo gốc luôn ở giữa**; logo đầy đủ nằm trong drawer. Bỏ panel logo bung khi hover/focus. | Giữ panel hover/focus như hiện tại | Phải cập nhật 2 test visual về logo (liệt kê trong 01 §6). Header vẫn 56px. |
| D2 | Bỏ hàng 6 thẻ ứng dụng trên HOME. Điều hướng chuyển vào **drawer theo nhóm**; HOME chỉ còn 2 lối tắt "Đi tới". | Giữ hàng gọn hiện tại | Phải cập nhật 2 test launcher |
| D3 | Sheet chi tiết việc ngay trên HOME, có **"Đánh dấu hoàn thành" kèm Undo 5 giây** (dùng chung kho việc demo hiện có) | Sheet chỉ đọc, sửa ở trang Công việc | Thêm test mới |
| D4 | (Pha dashboard) **Tab ngang** thay sidebar trong Điều hành; mục chưa kết nối gom vào "Chưa kết nối (5)" | Giữ sidebar | Một số test dashboard dùng tên nút; kế hoạch giữ nguyên accessible name |
| D5 | Trước khi chạy subagent: **`git init` cục bộ** (không remote, không push) để có diff và rollback theo từng commit | Không git; chỉ dùng snapshot thư mục và quy định file ownership | Xem 03 |
| D6 | Font headline **Baskerville** (đã kiểm tra hiển thị đúng dấu tiếng Việt trên máy này); UI và số liệu dùng sans hệ thống | Giữ Georgia | Không cần font ngoài hay dependency |
| D7 | (Pha dashboard) Donut chuyển thành **thanh ngang** đóng góp kênh/sale; biểu đồ tuần dạng emphasis (kết quả nổi, doanh thu làm nền), có bản xem dạng bảng | Giữ donut | Theo skill dataviz; giữ accessible name để test không gãy |

Thứ tự thực hiện sau khi duyệt: **chỉ HOME trước**, dừng ở checkpoint HOME để anh thử, rồi mới làm dashboard.
