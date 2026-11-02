# Design critique — KPI Sale và Hàng hóa & hiệu quả vốn trong shell V2 (31/10/2026)

**Phạm vi:** chỉ review, chỉ đọc. Không sửa UI/code, không đổi quyết định thiết kế, không triển khai đề xuất. Không OAuth/Figma, không commit/push/deploy.
**Skill đã dùng:** `design:design-critique` (plugin `design` 1.2.0, user-scope). Đã gọi bằng công cụ Skill trong phiên này; kết quả trả về `Launching skill: design:design-critique` và nạp nội dung từ `~/.claude/plugins/cache/knowledge-work-plugins/design/1.2.0/skills/design-critique`. Khung dùng: Impression, Usability, Visual Hierarchy, Consistency, Accessibility, What Works, Priority Recommendations. Không có connector nào (Figma, feedback) được dùng.
**Bản rendered:** `http://127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html#view=kpi` cùng `dashboard`, `tx`, `inventory`, `checks`, `goods`; ảnh chụp mới trong phiên này, không dùng ảnh cũ. Baseline: `docs/developer-handoff.md` mục "Quyết định chuẩn giao diện V2 — 2026-10-31".
**Nhãn bằng chứng:** **[B]** = đo trực tiếp trong trình duyệt (Chromium, Playwright); **[A]** = suy luận từ ảnh tĩnh; **[C]** = suy luận từ code. Ảnh tĩnh không chứng minh animation; animation đo bằng Web Animations API và lấy mẫu trạng thái mở/đóng theo thời gian **[B]**.
**Giữ nguyên diễn giải dữ liệu:** snapshot 26–30/10 áp policy 11/2026 là mô phỏng một phần; lương cơ bản "Chưa cấu hình"; không suy thu nhập cả tháng. Review này không đánh giá đúng/sai của số.

## Ấn tượng chung
Cảm giác "cùng một web" đã đạt: ba màn dùng chung header, band, sidebar 232px, serif/sans đúng vai, thẻ cùng bóng và độ nâng khi hover. Cơ hội lớn nhất nằm ở thứ bậc nội dung KPI: thông tin nổi nhất trên mỗi thẻ sale hiện là câu "Chưa đủ dữ liệu" lặp lại, trong khi số liệu thật của mẫu lại nhỏ và mờ.

## Cái đạt (có đo)
- **Vai chữ khớp V2 [B]:** h1 Baskerville 32px (24px ở 390) ở cả 8 view; tiêu đề thẻ serif 22px; số tiền / KPI sans 28/600 (18px ở 390) ở dashboard và Hàng hóa; bảng cả ba nơi cùng 14px, ô 12px/8px, tiêu đề cột 500.
- **Shell chung [B]:** sidebar 232px + container 1320px, mục đang chọn đúng ở KPI và Hàng hóa; kiểu điều hướng giống nhau giữa dashboard, Thu–bán, Tồn kho, KPI, Hàng hóa ở mọi viewport đã thử (≥1100 sidebar, 700–1099 tab xuống dòng, <700 nút menu).
- **Không tràn ngang, không lỗi console [B]:** 8 view × 1440/768/390, `scrollWidth` = viewport, 0 lỗi.
- **Hover / focus [B]:** thẻ KPI hover nâng `translateY(-3px)` giống thẻ dashboard; vòng focus 2px walnut, offset 2px, thấy được trên mục sidebar và dòng khoản tiền; dòng khoản tiền đổi nền khi hover, con trỏ pointer.
- **Menu chung luôn khả dụng khi cuộn ở ≥1100 và <700 [B]:** sidebar dính (cách đỉnh 72px sau khi cuộn 1500px); ở 390 thanh menu dính.
- **Overlay [B]:** hộp chi tiết KPI ở giữa, rộng 560px, bo 16px, padding 24px, đúng quyết định V2; sheet Hàng hóa bên phải 460px; cả hai vào 240ms, Escape trả focus đúng nơi mở; reduced-motion: không còn animation, hộp đóng ngay.
- **Tương phản [B]:** cặp thấp nhất trong KPI 6,26:1 (tab chưa chọn), chip trạng thái 6,35:1; không cặp nào dưới AA ở KPI, Hàng hóa và dashboard.
- **Trung thực với dữ liệu thiếu [A/B]:** màn đầu KPI có thanh một dòng nêu kỳ, as-of, độ bao phủ 6/134 và 1/47, nhãn "Mẫu một phần" và "Không phải thu nhập thực"; lương cơ bản là dòng riêng "Chưa cấu hình"; không có số 0 nào đứng thay chỗ dữ liệu thiếu.

## 4 vấn đề ưu tiên (1 vấn đề tính thêm phần nhỏ)

| # | Vấn đề | Mức | Bằng chứng | Đề xuất sửa cụ thể (chưa thực hiện) |
|---|---|---|---|---|
| 1 | **Thứ bậc income-first bị câu trạng thái lặp lấn át.** Chữ nổi nhất trên màn đầu là "Chưa đủ dữ liệu" (sans 20px/600, nâu) ở tổng của mỗi thẻ sale; cụm này xuất hiện 22 lần trong trang. Số mẫu có thật (72 tr / 500 tr, 1 đơn) chỉ ở dòng 13px xám. Ở 390×844 thẻ sale đầu tiên bắt đầu y=831, tức không nằm trong màn hình đầu (1440×900: y=494; 768×1024: y=641). | 🟡 Moderate | **[B]** `probe2.json` mục `fold@*`; `probe3.json` mục `dominantAboveFold:kpi` (hai phần tử đầu là "Chưa đủ dữ liệu" 20px/600, y=616). Ảnh `shots/kpi-1440.png`, `shots/kpi-390.png`. | Mỗi thẻ chỉ giữ **một** chip trạng thái (đã có) và hạ dòng tổng thành chữ trung tính nhỏ ("Chưa kết luận"), rồi nâng số mẫu (ví dụ "Mẫu: 72 tr · 1 đơn") thành dòng nội dung chính. Ba dòng ngưỡng giữ nhãn ngắn hơn hoặc gộp thành một dòng "3 khoản có ngưỡng tháng: chưa đủ dữ liệu" kèm chevron. Ở mobile, đưa thanh kỳ / as-of xuống dưới thẻ sale đầu hoặc gộp vào `<details>` để thẻ sale vào màn hình đầu. |
| 2 | **Thanh menu module không dính ở 700–1099px**, nên "menu chung luôn khả dụng" không đúng ở tablet: sau khi cuộn, các mục Điều hành biến khỏi màn hình (chỉ còn nút Menu mở drawer). Ở ≥1100 sidebar dính, ở <700 thanh menu dính. | 🟡 Moderate | **[B]** `probe2.json` mục `scrollnav@768` (`tabsInView:false`) so với `@1440` (`sidebarInView:true`) và `@390` (`tabsInView:true`). Ảnh `shots/tx-768.png` cho thấy thanh tab hai dòng nằm ngay dưới band. **[C]** CSS `.ops-tabs` chỉ `position:sticky` ở <700px. | Dùng cùng mẫu "nút menu một dòng" của <700px cho cả 700–1099px (dính, một dòng, mở danh sách đầy đủ), hoặc giữ dải tab nhưng làm dính một dòng rút gọn. Chọn một cách và áp cho mọi view Điều hành. |
| 3 | **Overlay của module cư xử khác overlay V2 ở ba điểm:** (a) hộp bản ghi V2 khóa cuộn nền, còn hộp KPI và sheet Hàng hóa vẫn cho cuộn trang phía sau khi lăn chuột trên nền mờ; (b) sheet Hàng hóa đóng tức thì, hộp KPI có thoát ~180ms; (c) màu scrim V2 là `rgba(20,14,6,.48)`, module dùng `rgba(33,22,4,.45)`. | 🟡 Moderate | **[B]** `probe3.json` mục `wheelOnBackdrop:*` (V2: scrollY 0→0; KPI: 0→179; Goods: 756→1256); `probe2.json` mục `overlay:*` `exitSamples` (Goods `open:false` ở 0ms; KPI mở tới ~120ms, đóng ở 200ms) và `geo.scrim`. | Khóa cuộn nền khi mở (`body.is-locked` như V2) cho hộp KPI và sheet Hàng hóa; thêm thoát 180ms ease-in cho sheet Hàng hóa; thống nhất màu scrim về token V2. |
| 4 | **Ô chọn (select) của Hàng hóa dùng kiểu native**, còn KPI và V2 dùng `.select` với mũi tên mảnh tùy biến: cao 44px, không có `background-image`, `appearance:auto` so với 42px, chevron tùy biến. Trong cùng shell, hai nhóm điều khiển nhìn không cùng họ. | 🟢 Minor | **[B]** `probe2.json` mục `goodsSelect` và `kpiSelect`. Ảnh `shots/goods-1440.png` (mũi tên đậm) và `shots/kpi-1440.png` (mũi tên mảnh). | Dùng lớp `.select` của V2 cho các ô chọn của Hàng hóa (nhóm, brand, nguồn, kênh, ngày tính) và canh về 42px. |
| 5 | **Một số chữ và vùng bấm nhỏ hơn mức V2 dùng.** Chữ dưới 12px: nhãn tâm biểu đồ tròn Hàng hóa (9px và 10,5px), nhãn "Giả định mô phỏng" 11px, nhãn VÀ / HOẶC của KPI 10–11px. Vùng bấm: dải phân đoạn 38px cao (giống `.seg` của V2), nút mã chứng từ 32px, đoạn tô "Chứng từ hoàn" 17px, đoạn "Tạm tính" của thanh bằng chứng rộng 6px ở 390 (đã có chú giải thay thế). | 🟢 Minor | **[B]** `probe4.json` (dashboard không có chữ <12px; Hàng hóa 2 chỗ; KPI 2 chỗ) và `probe.json` mục `small` của `kpi@390`, `kpi-list@390`, `kpi-sale@390`. Dashboard V2 cũng có vùng nhỏ: "Mở DEMO-S001" 21×40px (`tx@390`), nên một phần là kế thừa. | Nâng chữ nhỏ lên tối thiểu 12px; tăng chiều cao hộp bấm của nút mã chứng từ và liên kết nội dòng lên 44px trên điện thoại; giữ dải phân đoạn 38px nếu chấp nhận chuẩn V2. |

## Khung của skill (tóm tắt)
- **First impression:** nhận ra ngay là V2 và là trang thu nhập từng sale; điều khiến mắt dừng đầu tiên là chữ nâu đậm "Chưa đủ dữ liệu" (vấn đề 1).
- **Usability:** drill dòng tiền → chứng từ → link nguồn rõ; Back và bộ lọc giữ trạng thái (đã có test riêng); menu chung chuyển trực tiếp giữa module (đã có test riêng). Điểm trừ ở vấn đề 2.
- **Consistency:** khớp V2 ở chữ, thẻ, bảng, hover, focus; lệch ở overlay (3) và ô chọn Hàng hóa (4).
- **Accessibility:** tương phản đạt; focus thấy được; kích cỡ chữ và vùng bấm có chỗ nhỏ (5).

## Giới hạn của review
- Chỉ Chromium; chưa kiểm Safari, Firefox, cảm ứng thật, trình đọc màn hình. Animation đo bằng API và lấy mẫu trạng thái, không phải quay video.
- Không đánh giá tiếng Anh của module (module có ghi chú "chỉ có tiếng Việt"). Không đánh giá nội dung nghiệp vụ hay đúng/sai của số.
- Một số phép đo mức "dominant above the fold" bị nhiễu bởi nội dung `<details>` đang đóng, nên chỉ dùng phần tử có tọa độ y hợp lệ (hai chữ "Chưa đủ dữ liệu" ở y=616).
- Không có ai đã duyệt thẩm mỹ từ báo cáo này; đây là đánh giá tham khảo.

## Tệp
Ảnh tĩnh (che trường chứng từ bằng `.sens`): `shots/*.png` (8 view × 1440/768/390). Số liệu thô: `probe.json`, `probe2.json`, `probe3.json`, `probe4.json`. Mã đo (chỉ đọc): `critique-probe*.mjs`.
