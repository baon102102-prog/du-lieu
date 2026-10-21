# 01 · Kế hoạch code, IA/routes, tokens, ranh giới

Tài liệu này mô tả **việc sẽ làm sau khi được duyệt**. Hiện chưa có dòng code app nào bị thay đổi.

## 1. Chẩn đoán HOME hiện tại (từ code và ảnh QA đã duyệt)

| Vấn đề | Bằng chứng |
|---|---|
| Việc đầu tiên trên mobile nằm ở y≈560 | Banner, tiêu đề "Trang chủ", notice và hàng 6 thẻ ứng dụng đứng trước bảng việc |
| 6 lối vào ứng dụng trùng với menu, 4 mục chưa có nhưng nằm ngang hàng với mục dùng được | `AppLauncher` và `appItems` trong `app-header.tsx` |
| Khung lồng nhau và cột rỗng | Bảng 3 cột cố định: Marketing không có việc vẫn chiếm 1/3 chiều ngang |
| Motion rời rạc | Chủ yếu là logo nghiêng 3D và hover các thẻ; không gắn với thay đổi trạng thái |
| Chữ phụ in hoa giãn chữ, chuỗi meta nối bằng "·" | Bị skill frontend-design liệt vào dấu hiệu "template" |

## 2. Hướng thiết kế đã chốt (theo guidance chính chủ đã đọc)

- **Một điểm nhấn duy nhất:** band espresso #211604 (đúng màu nền logo gốc) chứa headline serif theo ngữ cảnh và một CTA champagne. Mọi phần khác giữ trắng, phẳng, yên lặng.
- **Căn lề:** nội dung căn trái trong khung tối đa 1120px; riêng logo ở giữa header là khoảnh khắc thương hiệu.
- **Tinh thần thekronos.vn** (theo mô tả parent đã xem trực tiếp, Claude không tự truy cập): trắng/đen + champagne, serif cho headline, sans cho số, khoảng trắng rõ, logo giữa, drawer trái nhiều cấp có back và overlay tối mờ, fade tiết chế, header đổi trạng thái khi cuộn. Không sao chép logo, ảnh hay tài sản nào; không dùng video hero; không dùng WebGL/3D.
- **Bỏ:** eyebrow in hoa giãn chữ, chuỗi meta nối "·" trong UI mới, bộ thẻ SaaS na ná nhau, gradient trang trí, nghiêng 3D trên thẻ.

### Wireframe HOME

```
1440                                                    390
┌──────────────────────────────────────────────┐       ┌────────────────────────┐
│ ☰ Menu        BAOQ LUXURY (logo gốc)    VI·EN │ 56px  │ ☰   BAOQ LUXURY     EN │
├──────────────────────────────────────────────┤       ├────────────────────────┤
│ espresso band                                 │       │ Th 4, 21/10 [CEO][Demo]│
│ Thứ Tư, 21/10/2026        Vai trò [CEO] [Demo]│       │ Hôm nay có 1 việc …    │
│ Hôm nay có 1 việc đến hạn   (serif 44)        │       │ [Mở việc đến hạn][Tạo] │
│ 2 việc đang mở ở Studio và Điều hành.         │       ├────────────────────────┤
│ [Mở việc đến hạn] [Tạo việc]                  │       │ [Đang mở 2|Hôm nay 1|…]│
├──────────────────────────────────────────────┤       │ [Bộ phận ▾]   [≡|▥]    │
│ [Đang mở 2|Hôm nay 1|Quá hạn 0|Hoàn thành 0]  │ Đi tới│ Hôm nay, 21/10         │
│                  [Bộ phận ▾] [≡|▥]            │ ─────  │ ◐ Chuẩn bị bộ ảnh …    │ ← y=419
│ Hôm nay, 21/10                                │ Tổng  │ Ngày mai, 22/10        │
│ ◐ Chuẩn bị bộ ảnh sản phẩm demo   Đang làm    │ quan  │ ○ Rà soát checklist …  │
│ Ngày mai, 22/10                               │ Tất cả│ Mở trang Công việc     │
│ ○ Rà soát checklist mở cửa demo   Chưa làm    │ việc  │ Đi tới …               │
└──────────────────────────────────────────────┘       └────────────────────────┘
```

## 3. IA và routes

### Điều hướng (drawer trái, nhiều cấp)

```
Menu
├─ Làm việc
│  ├─ Trang chủ                      page=portal
│  └─ Công việc                      page=tasks            (module hiện có, không đổi)
├─ Quản trị
│  └─ Điều hành  [›] ─────────────── cấp 2 (Back "Menu chính")
│       ├─ Tổng quan điều hành       page=overview
│       ├─ Thu–bán · Hàng tồn kho · Kiểm tra · Chi phí    (route hiện có)
│       └─ Chưa kết nối nguồn: Tổng quan đối soát · Ký gửi · Tiền & đối chiếu · Chốt kỳ & điều chỉnh · Thiết lập & nguồn
│                                    (route hiện có, vẫn mở được, có nhãn "Chưa kết nối")
└─ Sắp có   (chữ mờ, không bấm được, nhãn "Chưa triển khai")
   Price System · Studio · Marketing · Chính sách, quy định, quy trình
```

"Điều hành" ở cấp 1 vẫn là **nút điều hướng thẳng** tới tổng quan (giữ đúng hợp đồng test `#apps-menu` → "Điều hành"). Nút mũi tên cạnh nó có tên riêng "Mở mục con của Điều hành".

### Routes (hash). Không xóa và không đổi nghĩa route nào

| Tham số | Hiện có | Sau redesign |
|---|---|---|
| `page`, `period`, `field`, `value`, `record` | dashboard, drilldown, dialog | **giữ nguyên** |
| `task`, `taskView`, `taskFilter` | module Công việc | **giữ nguyên** trên `page=tasks` |
| `task` trên `page=portal` | (chưa dùng) | **thêm:** mở sheet chi tiết việc trên HOME; Back đóng sheet |
| `homeFilter` = `open\|today\|overdue\|done` | — | **thêm** (mặc định `open`) |
| `homeDept`, `homeView` = `list\|dept` | — | **thêm** |

- Đổi filter thì **thay** history entry (không làm đầy lịch sử Back); mở sheet thì **đẩy** entry mới (Back đóng sheet). Reload giữ nguyên trạng thái.
- Drawer là trạng thái tạm, không đưa vào URL. Tất cả điều hướng trong cùng tab.

### Quy tắc dữ liệu HOME (không bịa)

- Nguồn: kho việc demo hiện có (`sessionStorage['baoq-tasks-demo']` hoặc seed). Tách ra `src/tasks-store.ts` để HOME và module Công việc dùng chung, không đổi hành vi.
- "Hôm nay" là ngày local của thiết bị. Nhóm việc: Quá hạn (<0), Hôm nay (0), Ngày mai (1), Sau đó (>1), Chưa đặt hạn. Tính bằng chuỗi ngày local, không dùng `toISOString()` vì UTC sẽ lệch ngày ở múi giờ +07.
- Sắp xếp theo hạn tăng dần, rồi theo mã. **Không có trường ưu tiên** nào được tạo thêm.
- Headline và CTA, theo thứ tự ưu tiên:
  1. Có việc quá hạn → "N việc đã quá hạn" + "Mở việc quá hạn".
  2. Có việc đến hạn hôm nay → "Hôm nay có N việc đến hạn" + "Mở việc đến hạn".
  3. Có việc đang mở → "Hôm nay không có việc đến hạn" + "Mở việc gần hạn nhất".
  4. Không có việc mở → "Chưa có việc nào đang mở" + "Tạo việc".
- "Đánh dấu hoàn thành" (D3) gọi đúng hàm cập nhật trạng thái của module Công việc. Bản xem trước Telegram mô phỏng giữ nguyên logic cũ. Có Undo trong 5 giây.

## 4. Design tokens (đã kiểm chứng, không ước lượng)

| Nhóm | Token | Giá trị | Kiểm chứng |
|---|---|---|---|
| Palette chính | `--espresso` | #211604 | Đo từ nền logo gốc: đồng nhất tuyệt đối |
| | `--champagne` | #b18f6c | Màu nét logo; trên espresso đạt 5,94:1. Trên trắng chỉ 2,99:1 nên chỉ dùng trang trí |
| | `--walnut` | #68452d | Chữ/điều khiển trên nền sáng 8,48:1; vòng focus |
| | `--ink` | #141414 | Chữ chính |
| | `--paper` / `--mist` | #ffffff / #f4f2ee | Nền / tô nhẹ khi chọn, khi hover |
| Phái sinh | `--champagne-cta` | #c9ab80 | Chữ espresso trên nền này đạt 8,14:1 |
| | `--champagne-light`, `--on-dark-muted` | #d9c2a0, #b9aa97 | Trên espresso đạt 10,31:1 và 7,84:1 |
| | `--muted` | #5f5850 | 7,00:1 trên trắng, 6,26:1 trên mist |
| | `--danger`/`--caution`/`--ok` | #9a3324 / #7a4d12 / #2d6342 | ≥ 6,26:1 trên nền nhạt tương ứng |
| Biểu đồ | `--chart-accent` | #a0612e | Validator dataviz: PASS dải sáng, sắc độ, contrast |
| | `--chart-context` | #bdb6ad | Ghép với accent: CVD ΔE 23,2, mắt thường ΔE 24,4 (PASS). Contrast 2,01 là WARN: đã bù bằng nhãn trực tiếp và bản xem dạng bảng |
| Chữ | `--serif` | Baskerville, Palatino, Georgia | Mẫu chữ render trên máy này: đúng dấu (Ư Ơ ữ ợ ẫ ổ). Charter, Iowan, Didot, Hoefler, Big Caslon bị loại vì sai dấu |
| | `--sans` | -apple-system, system-ui | UI và số liệu. Số trong bảng và trục dùng tabular; số KPI lớn dùng chữ số proportional (theo dataviz) |
| Cỡ chữ | | 12 · 13 · 14 · 15 · 16 · 18 · 22 · 26 · 28 · 36 · 44 | Headline 44 (desktop) / 26 (mobile); thân 16/1.5 |
| Khoảng cách | `--s1…--s9` | 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 56 | Lề: 40 / 24 / 16 px; khung tối đa 1120 |
| Bo góc | `--r-sm/md/lg` | 6 / 10 / 16 | Đồng tâm: sheet 16 > panel 10 > điều khiển 6 |
| Bóng | `--shadow-sheet` | 2 lớp | Chỉ dùng cho sheet, dialog, toast; danh sách và thẻ phẳng |
| Motion | `--dur-1…4` | 120 / 180 / 240 / 280 ms | Đo trên mockup: tối đa 240 ms |
| | `--ease-out` / `--ease-in` / `--ease-std` | cubic-bezier(.22,.8,.24,1) / (.4,0,1,1) / (.4,0,.2,1) | Vào dùng ease-out, ra dùng ease-in và ngắn hơn |
| Vùng chạm | | ≥ 44×44 px ở ≤ 699px | Đo trên mockup: 0 vi phạm |

Token mới có tiền tố riêng và nằm trong `src/styles/tokens.css`. Token `--lx-*` trong `luxury.css` sẽ bị gỡ ở bước dọn dẹp, chỉ sau khi không còn selector nào dùng.

## 5. File dự kiến (pha HOME)

| Loại | File | Nội dung |
|---|---|---|
| Mới | `src/styles/tokens.css`, `base.css` | Token, kiểu chữ, nút, select, focus |
| Mới | `src/styles/shell.css`, `src/shell/Drawer.tsx`, `src/nav-model.ts` | Header 56px, drawer nhiều cấp, mô hình điều hướng |
| Mới | `src/home/HomeView.tsx`, `src/home/TaskSheet.tsx`, `src/home/task-queue.ts`, `src/styles/home.css` | HOME mới; `task-queue.ts` gồm các hàm thuần (nhóm, đếm, headline/CTA) |
| Mới | `src/tasks-store.ts` | Tách kho việc khỏi `tasks.tsx`, không đổi hành vi |
| Mới | `src/a11y/focus-trap.ts`, `src/styles/motion.css` | Focus trap, trả focus, Escape, reduced motion |
| Sửa | `src/app-header.tsx` | Header mới. Giữ `.apps-trigger` (mở drawer), `#apps-menu` (nav cấp 1), nút ngôn ngữ đúng aria-label `Switch language / Đổi ngôn ngữ` |
| Sửa | `src/main.tsx` | `page=portal` render `HomeView`; đặt select `Vai trò demo` ở band HOME và ở hàng tiêu đề trang module |
| Sửa | `src/tasks.tsx` | Dùng `tasks-store`; `HomeBoard` bị gỡ ở bước dọn dẹp |
| Sửa | `src/i18n.tsx` | Thêm glossary cho chuỗi mới (VI→EN); cơ chế dịch giữ nguyên |
| Sửa | `qa.spec.ts`, `visual-capture.spec.ts` | Như §6 |
| Docs | `docs/verification.md`, `developer-handoff.md`, `README.md` | Ghi lại sau mỗi checkpoint |

Logo trong app thật dùng `<img src="/brand/baoq-logo-original.jpg">` cắt bằng CSS (cùng kỹ thuật `.brand-image` hiện có), để test về kích thước gốc 2048 vẫn có ý nghĩa. Mockup dùng ảnh nền CSS chỉ để file được tự chứa.

**Pha dashboard** (sau khi HOME được duyệt): `src/dashboard/*` (tách khỏi `main.tsx`, ban đầu không đổi hành vi) và `src/styles/dashboard.css`. Thứ tự: dải KPI → "Cần xử lý" (lỗi xếp theo trường `severity` có sẵn, cộng tồn ≥ 90 ngày) → "Phân tích" (tuần, kênh/sale dạng thanh, bảng chi phí) → ghi chú hoa hồng. Tab ngang thay sidebar (D4). Giữ accessible name của các nút và biểu đồ mà test đang dùng.

## 6. Test hiện có: giữ hay cập nhật (pha HOME)

Nguyên tắc: **không xóa test để PASS**. Test nghiệp vụ giữ nguyên. Chỉ assertion về bố cục HOME đã bị thay thế mới được sửa, mỗi chỗ có lý do.

| # | Test | Pha HOME | Lý do |
|---|---|---|---|
| 1 | CEO drilldown, URL filters, … | Giữ | Dùng `.apps-trigger` và `#apps-menu` "Điều hành"; hợp đồng này được giữ |
| 2 | cofounder denied; inventory grant; mobile | Giữ | Select `Vai trò demo` vẫn có trên trang dashboard |
| 3 | KPI costs, sale and aging reconcile | Giữ | Dashboard chưa đổi |
| 4 | one shared shell home→module→back | Sửa 2 assertion | `.department-column` = 3 và heading "Công việc hiện tại theo bộ phận" không còn. Thay bằng vùng "Việc của bạn" và h1 HOME. Giữ assertion về vị trí header, aside 0, breadcrumb 0, một tab |
| 5 | empty-state → donuts, weekly bars | Giữ | Dashboard chưa đổi |
| 6 | compact header, centered reveal, menu dismissal | Viết lại phần logo và cách đóng menu (nếu D1 = khuyến nghị) | Panel logo bị bỏ. Kiểm: `<img>` gốc 2048, căn giữa ±2px ở 1440/1024/768/390, không tràn, drawer đóng bằng Escape hoặc scrim (drawer modal phủ `main h1` nên click vào h1 không còn áp dụng) |
| 7 | tasks create/edit/…/VI EN | Sửa 1 dòng | Dòng cuối kiểm `.department-column` = 3 trên HOME, thay bằng danh sách việc HOME. Toàn bộ luồng Công việc giữ |
| 8 | English dashboard filtering | Giữ | `#apps-menu` "Operations" vẫn đến từ glossary |
| 9 | luxury: compact launcher … | Viết lại | Launcher bị bỏ (D2). Mục đích giữ nguyên: việc đầu tiên trong màn hình đầu ở 4 kích thước, mở app bằng bàn phím trong cùng tab, VI/EN |
| 10 | luxury: logo panel … menu repeats | Viết lại | Thành drawer mở/đóng ×3, thứ tự Escape, cấp 2/Back, trả focus |
| 11 | luxury touch | Viết lại | Chạm mở drawer, chạm mở sheet việc, không tràn |
| 12 | luxury: motion 120–280 ms; reduced motion | Đổi selector | `.lx-app` sang phần tử mới; assertion giữ nguyên |
| 13 | amounts render final, no count-up | Giữ | |
| 14 | Back/Forward drilldown + dialog | Giữ | |
| 15 | contrast AA | Giữ | Tự áp dụng cho HOME mới |
| 16 | launcher focus ring not clipped | Thay bằng tương đương | Áp dụng cho chip lọc và mục drawer |

**Test mới cho HOME:**
- Filter: URL, Back/Forward/reload, giữ focus.
- Xem theo bộ phận: không có cột rỗng.
- Sheet: mở/đóng, Escape, Back, trả focus, Mark done + Undo, link "Mở trang chi tiết".
- 4 trạng thái headline/CTA: dùng dữ liệu test ghi vào `sessionStorage` chỉ trong test, là bản sao seed đổi hạn/trạng thái, có ghi chú là dữ liệu test.
- Drawer: focus trap.
- 390×844: việc đầu tiên ≤ 440px; viewport không tự zoom.
- HOME tiếng Anh không còn chuỗi tiếng Việt của UI.

## 7. Ranh giới giữ nguyên (không đụng)

- `backend/`, `tests/` (Python), `frontend/src/simulated-api.ts`, `frontend/src/demo-data.json`, công thức tổng hợp, phân quyền mô phỏng và `grants`, API, schema, auth.
- `package.json` và lock (không thêm dependency), `scripts/run-local.sh`, cổng 8787, cấu hình mạng và bảo mật, secrets, `.env`.
- `frontend/public/brand/baoq-logo-original.jpg` (chỉ đọc, chỉ cắt bằng CSS).
- Module Công việc: tạo, sửa, checklist, bình luận, xem trước Telegram mô phỏng, giữ nguyên hành vi.
- Dashboard trong pha HOME: không đổi giao diện hay luồng, chỉ dùng chung header và drawer mới.
- Không deploy, không push, không cài skill, hook, binary hay Python. Server hiện có không bị restart: build xong `dist` là http.server phục vụ bản mới ngay.
