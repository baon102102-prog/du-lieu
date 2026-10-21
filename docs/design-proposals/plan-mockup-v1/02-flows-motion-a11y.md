# 02 · Flow, storyboard motion, reduced motion, bàn phím, cảm ứng

Tất cả flow dưới đây **đã dựng trong mockup** và được `capture.cjs` kiểm tự động (48/48 PASS trên mockup). Trong app thật, đây vẫn là đặc tả để triển khai.

## 1. Flow

### 1.1 Menu nhiều cấp (drawer trái)

```
[☰ Menu] ──click/Enter/tap──▶ drawer cấp 1 mở, scrim tối mờ, trang phía sau bị khóa (inert)
   focus → mục đang ở (Trang chủ)          Tab/Shift+Tab chỉ chạy trong drawer
   ├─ "Điều hành" (nút) ────▶ đóng drawer, sang Tổng quan điều hành (cùng tab)
   ├─ [›] Mở mục con ──────▶ cấp 2 (fade-through), focus → "‹ Menu chính"
   │      Escape hoặc "‹ Menu chính" ─▶ về cấp 1, focus → nút [›] đã mở
   ├─ Sắp có: 4 mục mờ, không bấm được, có nhãn "Chưa triển khai"
   └─ đóng: Escape (ở cấp 1), nút ×, click/tap scrim ─▶ focus trả về [☰ Menu]
```

- Escape luôn lùi đúng một bậc: cấp 2 → cấp 1 → đóng drawer.
- Mở/đóng nhanh liên tục được: transition CSS đảo chiều giữa chừng. Đã kiểm ×3 liên tục, kết thúc ở trạng thái đóng và trang không bị khóa.

### 1.2 Filter và chế độ xem HOME

- Chip lọc `Đang mở · Hôm nay · Quá hạn · Hoàn thành` có số đếm, dùng `aria-pressed`. Bấm thì danh sách đổi ngay; chỉ phần danh sách có hiệu ứng fade 180 ms; focus ở lại trên chip; URL cập nhật bằng replace.
- Select "Bộ phận" và nút chuyển `Danh sách | Theo bộ phận`.
- Chế độ "Theo bộ phận" chỉ dựng cột cho bộ phận có việc. Bộ phận trống gộp thành một dòng, ví dụ "Không có việc đang mở: Marketing."
- Kết quả rỗng hiện lời giải thích và nút "Xem việc đang mở" (có đường quay lại).

### 1.3 Chi tiết việc (sheet)

```
Dòng việc / CTA "Mở việc đến hạn" ──▶ URL thêm task=ID (push) ──▶ sheet phải (desktop) / sheet đáy 92vh (mobile)
   focus → tiêu đề sheet; Tab vào checklist và các nút; focus trap
   Checklist: bật/tắt tại chỗ, giữ focus
   [Đánh dấu hoàn thành] ─▶ trạng thái đổi ngay, toast "Đã đánh dấu hoàn thành · Hoàn tác" (5 s; dừng đếm khi hover/focus)
                           [Hoàn tác] ─▶ trả lại trạng thái cũ
   [Mở trang chi tiết] ─▶ page=tasks&task=ID (module hiện có, cùng tab)
   đóng: ×, Escape, scrim, Back ─▶ focus trả về dòng việc đã mở; Forward mở lại
```

- Việc vừa hoàn thành **không biến mất khỏi danh sách ngay** (chỉ gạch ngang và đổi trạng thái). Nhờ vậy danh sách không nhảy dưới ngón tay; việc chỉ rời bộ lọc "Đang mở" khi đổi lọc hoặc tải lại.

### 1.4 Dashboard (pha sau)

- Bấm KPI hoặc thanh "Đóng góp" để drilldown sang trang giao dịch có lọc (`field/value`, cùng route hiện có); chip "Kênh: Online ×" để bỏ lọc.
- Bấm dòng giao dịch để mở dialog bản ghi (`record=ID`; desktop giữa màn hình, mobile là sheet đáy). Escape hoặc Back đóng dialog mà vẫn giữ lọc.
- "Xem dạng bảng" bật/tắt bảng tương đương cho từng biểu đồ, theo dataviz: tooltip không được là đường duy nhất để đọc số.

## 2. Storyboard motion

Nguyên tắc (frontend-design và Vercel):
- Motion chỉ để cho thấy cái gì vừa thay đổi; có một khoảnh khắc mở đầu duy nhất.
- Chỉ animate `transform`/`opacity`/màu; không dùng `transition: all`.
- Không bao giờ chặn click; người dùng có thể ngắt giữa chừng.
- Ra nhanh hơn vào; số tiền không bao giờ chạy đếm.

| Chuyển động | Kích hoạt | Thuộc tính | Thời lượng / easing | Ngắt giữa chừng | Reduced motion |
|---|---|---|---|---|---|
| Mở đầu HOME (khoảnh khắc duy nhất) | Lần render đầu | headline, lede, CTA: opacity 0→1, y 6→0px; lệch 40 ms | 240 ms, ease-out | Không chặn click (chỉ opacity/transform) | Tắt |
| Header khi cuộn | scrollY > 8 | Nền espresso → espresso 94% + blur, viền champagne mảnh, bóng | 180 ms, std | — | Đổi tức thì |
| Drawer mở / đóng | ☰, ×, scrim, Escape | translateX(-100%)→0; scrim opacity | Vào 240 ms ease-out / ra 180 ms ease-in | Có (transition đảo chiều) | Hiện/ẩn tức thì |
| Drawer cấp 1 ↔ 2 | › / ‹ / Escape | Fade-through: cũ mờ 0–120 ms, mới trượt 32px và hiện 120–240 ms | 240 ms tổng | Có | Tức thì |
| Lọc danh sách | Chip, select, chuyển chế độ xem | Chỉ vùng danh sách: opacity .35→1, y 4→0 | 180 ms, ease-out | Nội dung mới có ngay (không trễ) | Tắt |
| Sheet việc | Mở/đóng | Desktop translateX(100%)→0; mobile translateY(100%)→0; scrim | 240 / 180 ms | Có | Tức thì |
| Dialog bản ghi | `record` | opacity + scale .98→1 (desktop) / translateY (mobile) | 240 / 180 ms | Có | Tức thì |
| Toast + Hoàn tác | Đánh dấu xong | opacity, y 8→0 | 180 ms | Tự ẩn sau 5 s, dừng khi hover/focus | Tức thì |
| Nhấn nút | :active | scale .98 | 120 ms | — | Tắt transform |
| Hover dòng / KPI | hover | Nền mist | 120 ms | — | Đổi tức thì |
| Số tiền, KPI, bảng, thanh biểu đồ | — | **Không animate, không chạy đếm** | — | — | — |

### Khung hình đã render (transition thật bị dừng tại t, không phải video)

| Chuỗi | Khung | Đã xem bằng mắt |
|---|---|---|
| Drawer mở 1440 | `drawer-open-1440-t000/060/120/180/240` | t060 (lần render trước, CSS drawer không đổi sau đó) |
| Cấp 1 → cấp 2, 390 | `drawer-level2-390-t000/080/160/240` | t080, t160 (sau khi sửa sang fade-through; CSS drawer không đổi ở lần render cuối): t080 chỉ còn cấp cũ mờ dần, không chồng chữ; t160 cấp mới đã rõ |
| Sheet việc 1440 | `task-sheet-open-1440-t000/080/160/240` | Chưa mở xem |
| Sheet việc 390 | `task-sheet-open-390-t000/080/160/240` | t080 (lần render trước) |
| Đổi lọc 1440 | `filter-change-1440-t000/060/120/180` | Chưa mở xem |

Qua việc xem khung hình, tôi đã phát hiện và sửa một lỗi: bản đầu, chuyển cấp drawer làm hai lớp chữ chồng nhau rõ ở 80 ms; đã đổi sang fade-through. Video `motion/*.webm` đã được ghi nhưng **Claude không xem được**. Độ mượt realtime (FPS, giật khung) **chưa được đo**; cần anh hoặc Codex xem video hoặc thử trực tiếp trên mockup.

## 3. Reduced motion

`prefers-reduced-motion: reduce`:
- Mọi `--dur-*` về 0; tắt keyframes; drawer, sheet, dialog, toast và các cấp menu xuất hiện tức thì ở vị trí cuối; nút nhấn không co.
- Đã kiểm trên mockup: mở drawer và sheet có `document.getAnimations().length = 0` và transform cuối là `none`.
- Ảnh: `screens/reduced-motion-drawer-390.png`.

## 4. Bàn phím

| Phím | Hành vi |
|---|---|
| Tab đầu trang | Link "Bỏ qua tới nội dung" |
| Enter/Space trên ☰ | Mở drawer, focus vào mục hiện tại |
| Tab / Shift+Tab trong drawer, sheet, dialog | Bị giữ bên trong (focus trap) |
| Escape | Lùi một bậc: cấp 2 → cấp 1 → đóng drawer; đóng sheet/dialog; thu gọn ghi chú demo |
| Enter trên dòng việc | Mở sheet; đóng xong focus quay lại đúng dòng |
| Enter/Space trên chip lọc | Lọc; focus ở lại chip |
| Back / Forward của trình duyệt | Đóng/mở lại sheet và dialog; giữ lọc drilldown |

Vòng focus dùng walnut trên nền sáng, champagne-light trên nền tối, đều ≥ 3:1. Khi mở sheet bằng chuột, focus đặt vào tiêu đề nên không hiện vòng thừa.

## 5. Cảm ứng

- Mọi điều khiển hiển thị ở 390px đều ≥ 44×44 px (đo: 0 vi phạm).
- Không có chức năng nào chỉ dùng được bằng hover: chạm mở drawer, sheet và dialog; hover chỉ đổi nền.
- `touch-action: manipulation`; `overscroll-behavior: contain` cho drawer và sheet để kéo cuộn không trôi sang trang sau.
- Sheet đáy cao 92vh, có nút × lớn; không bắt buộc thao tác kéo.
- Trên mobile, nút ngôn ngữ chỉ hiện ngôn ngữ đích ("EN"/"VI") để header gọn.
- Chip lọc 13px vẫn đủ 44px chiều cao; select bộ phận cao 44px.

## 6. Live region và nội dung

- Vùng danh sách và toast dùng `aria-live="polite"`.
- Tên thương hiệu, mã bản ghi, nguồn được đánh dấu `translate="no"`; tên việc, người nhận và bình luận không bị dịch (`data-no-translate`, như cơ chế hiện có).
- Dùng khoảng trắng không ngắt giữa số và danh từ ("1 việc"); số tiền theo vi-VN; phần trăm theo ngôn ngữ đang chọn (vi: 55,26%, en: 55.26%).
