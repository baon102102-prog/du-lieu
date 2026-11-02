# Mockup v2: Hàng hóa & hiệu quả vốn + Auto Sale (mô phỏng)

**Chỉ là bản mô phỏng HTML để duyệt trải nghiệm rồi bàn giao dev.** Không phải production, không gọi API, không đổi giá Kiot/Sapo, không gửi tin, không tạo việc, không push. Bản v1 giữ nguyên ở `../ops-modules-v1/` (snapshot: `../_snapshots/ops-modules-v1-20261022-001829/` + `.MANIFEST.sha256`).

Mở: `/usr/bin/python3 -m http.server 8790 --bind 127.0.0.1 --directory docs/design-proposals/ops-modules-v2` → http://127.0.0.1:8790

Mọi mục ghi **GIẢ ĐỊNH MÔ PHỎNG** là giả định để chạy thử, **chưa phải quy tắc được duyệt**.

## 1. Các tab

| Tab | Nội dung |
|---|---|
| **Hàng hóa** | Công tắc **Bán trong kỳ / Tồn hiện tại**. Lọc nhóm hàng, brand, nguồn (mua đứt/ký gửi), kênh (chỉ cho Bán). **Lọc giá liên tục**: thanh trượt 2 đầu + 2 ô nhập số + 4 chọn nhanh (0–100 tr, 0–200 tr, 200 tr–1 tỷ, Tất cả). 6 thẻ số, **1 biểu đồ tròn** (chiều xem: brand / nhóm / nguồn, ghi rõ mẫu số), **1 biểu đồ cột** so sánh nhóm hàng (số món / doanh thu hoặc giá trị / lãi), bảng theo nhóm. Bấm bất kỳ phần nào để mở bảng chi tiết. |
| **Tuổi tồn & Auto Sale** | Ngày tính (giả lập) + “Tính lại”. Tuổi tồn M0–M6, M6+ và nhóm “chưa sẵn sàng / thiếu ngày”, bấm ra đúng hàng tồn. Bậc giá Auto Sale. Dải “hàng chưa tự tính được”. **Thử tính 1 món** với timeline từng lượt. |
| **Chính sách Auto Sale (cũ)** | Bảng giảm cũ (11 bậc × 2 cột, triệu VND), 2 dropdown so sánh chưa duyệt, ngày hiệu lực, ngày reset hàng cũ. Luồng **nháp → xem trước → hủy / duyệt GIẢ LẬP → tab Tuổi tồn tính lại**. Danh sách phiên bản. Câu hỏi chưa chốt. |
| **Sale & kênh** | Giữ gọn từ v1, đã sửa đếm đơn không trùng và ghi mẫu số. |

## 2. Logic (code: `engine.js`, hàm thuần, không đụng giao diện)

### Hai đồng hồ, luôn ghi rõ hai nhãn
- **Tuổi tồn** = số ngày từ `ready_for_sale_date`, **không bao giờ reset**. M0 = 0–29 ngày, M1 = 30–59, … M6 = 180–209, **M6+ = từ 210 ngày**.
- **Bậc giá Auto Sale** = số lượt đã tới hạn tính từ `sale_cycle_start`. Lượt k (k = 1…6) xảy ra vào `sale_cycle_start + 30·k` ngày. Reset chu kỳ giá **không** reset tuổi sẵn sàng bán.
- Bốn trường tách riêng: `receipt_date`, `ready_for_sale_date`, `sale_cycle_start`, `m0_price`.
- Ngày tính theo ngày lịch (UTC thuần, không lệch múi giờ). Mốc 29 ngày → M0, 30 ngày → M1.

### Tính giá
- Giá luôn tính **từ giá M0**, không đọc kết quả lần chạy trước, nên **chạy lại cùng đầu vào + cùng chính sách cho cùng kết quả** (không trừ lặp). Có “mã kiểm” (hash) trên tab để so.
- Bậc giá là khoảng nửa mở `[dưới, trên)`: 10.000.000 thuộc 10–<20; 599.999.999 thuộc 500–<600; **600.000.000 trở lên: không có quy định → khóa**.
- Bảng giảm mỗi lượt (triệu VND). Cột 1: M1 & M2. Cột 2: M3–M6:

| Bậc giá M0 | M1 & M2 | M3–M6 | | Bậc giá M0 | M1 & M2 | M3–M6 |
|---|---|---|---|---|---|---|
| < 10 | 0,3 | 0,5 | | 150 – <200 | 3 | 3 |
| 10 – <20 | 0,5 | 0,7 | | 200 – <250 | 4 | 4 |
| 20 – <50 | 0,8 | 1 | | 250 – <300 | 5 | 5 |
| 50 – <100 | 1,5 | 1,5 | | 300 – <400 | 7 | 7 |
| 100 – <150 | 2,5 | 2,5 | | 400 – <500 | 8 | 8 |
| | | | | 500 – <600 | 10 | 10 |

- **Không auto vượt M6**: sau 6 lượt giá dừng; từ ngày 210 của chu kỳ giá, món được gắn “hết lượt, xử lý tay”.
- **Không xuống dưới giá vốn**. Nếu **giá M0 đã thấp hơn vốn**: khóa auto, báo “xử lý tay”, **không tự tăng giá lên vốn**.
- **Gợi ý M3** (content / topic sale / TikTok / ads / đánh dấu Kiot) chỉ là **dòng chữ**, không có nút, không gửi hay tạo gì.

### Bị khóa tự tính (mỗi món một nhóm duy nhất, theo thứ tự ưu tiên)
Thiếu ngày sẵn sàng · chưa tới ngày sẵn sàng · thiếu giá vốn · thiếu giá M0 · ký gửi · Hot/trend · quy tắc 3% · cơ chế 1/2 · giá thu về · từ 600 triệu · giá M0 < giá vốn. **Hàng thiếu ngày không bao giờ bị mặc định vào M0.** Với Hot/trend (“đến M3 mới bắt đầu M0”), 3%, cơ chế 1/2, giá thu về: chưa đủ công thức nên **khóa, không có con số nào được suy ra**.

### Hai điểm chưa chốt, làm dropdown so sánh (mặc định chỉ là ví dụ, chưa được anh duyệt)
1. **Cách xếp bậc**: cố định theo bậc giá M0 *(mặc định)* hay theo giá trước mỗi lượt.
2. **Khi một lượt làm giá thấp hơn vốn**: giữ giá trước lượt rồi dừng *(mặc định)* hay hạ đúng bằng vốn rồi dừng. Cả hai đều dừng hẳn các lượt sau.

Ví dụ kiểm: M0 100 tr, 180 ngày, cố định → 6 × 2,5 → **85 tr**. Theo giá từng lượt → 97,5 rồi mỗi lượt 1,5 → **90 tr**. M0 10 tr → 2×0,5 + 4×0,7 → **6,2 tr**.

### Phiên bản chính sách
- Mỗi lượt dùng **phiên bản đang hiệu lực vào ngày của lượt đó**; lượt đã qua không bị tính lại (GIẢ ĐỊNH MÔ PHỎNG).
- **Trước ngày hiệu lực của phiên bản đầu tiên thì chưa có chính sách nào**: lượt đó bị bỏ qua (trạng thái “chưa có phiên bản chính sách hiệu lực”), không áp dụng ngược chính sách tương lai và không bù sau. v0 demo hiệu lực từ 01/01/2025 nên toàn bộ tồn demo nằm trong vùng có hiệu lực.
- Ngày hiệu lực của nháp **không được trước ngày tính** (không truy giảm quá khứ).
- Xem trước so sánh hai ngày: ngày tính và ngày tính + 60 (vì nháp hiệu lực từ hôm nay chủ yếu đổi các lượt sắp tới).
- Duyệt GIẢ LẬP thêm phiên bản v1, v2… vào `localStorage` (`baoq-autosale-policy-v2.1`), **không áp dụng thực tế**. Sửa nháp sau khi xem trước thì phải xem trước lại mới duyệt được.

### Hàng cũ đã sale thủ công đến 6/2026 (GIẢ ĐỊNH MÔ PHỎNG)
Có thể mô phỏng **reset giá niêm yết làm M0**. **Ngày reset là dữ liệu của từng món** (`legacy_reset_date`, demo có 01/07, 15/06, 30/06/2026), **không phải trường của chính sách**: duyệt phiên bản mới không dời được chu kỳ đã chạy và không viết lại lượt quá khứ. Chỉ đồng hồ **bậc giá** chạy từ ngày reset; **tuổi tồn vẫn tính từ ngày sẵn sàng**. Không truy giảm quá khứ (không có lượt nào trước ngày reset). Hàng cũ thiếu ngày reset thì bị khóa (“thiếu ngày reset”), không đoán.

### Chu kỳ giá bắt đầu trước ngày sẵn sàng bán (GIẢ ĐỊNH MÔ PHỎNG)
Nếu `sale_cycle_start` sớm hơn `ready_for_sale_date`, **lượt nào rơi trước ngày sẵn sàng bị bỏ qua** (không giảm, không bù sau; lượt đúng ngày sẵn sàng thì hợp lệ). Món không bị khóa cả cục, chỉ các lượt đó trống. Ví dụ: chu kỳ bắt đầu 110 ngày trước, sẵn sàng 40 ngày trước → lượt 1–2 bỏ qua, chỉ lượt 3 giảm. Nếu cả 6 lượt đều trước ngày sẵn sàng thì giá giữ M0 và không gắn “hết lượt M6”. Món được gắn nhãn “bỏ qua n lượt” để người duyệt thấy.

## 3. Giá và đếm: các lỗi v1 đã sửa
- **Phân biệt loại giá**: phân tích **Bán** dùng *giá bán thực tế của từng dòng* (sau giảm giá). Lọc **Tồn** dùng *giá niêm yết hiện tại* hoặc *giá vốn* (chọn được). Giá đề xuất Auto Sale là cột riêng, **bộ lọc giá chỉ để xem, không đổi khung Auto Sale**.
- **Số đơn không trùng ≠ số dòng hàng (line items)**: 90 đơn / 117 dòng. Bảng theo nhóm ghi “Đơn có chứa nhóm *” và nói rõ cột này **không cộng dồn** (một đơn nhiều nhóm tính ở mỗi nhóm).
- **Tồn drilldown đúng**: ở chế độ Tồn, mọi click ra **SKU còn tồn** (không bao giờ có mã đơn `SON-`); số dòng bảng chi tiết bằng đúng con số vừa bấm.
- **Phạm vi lọc kênh**: kênh chỉ áp dụng cho **Bán**. Ở Tồn, ô kênh bị khóa kèm lý do. Tab Sale & kênh luôn tính mọi kênh và ghi rõ.
- **Mẫu số** của biểu đồ tròn ghi ngay dưới: ví dụ “100% = X tr doanh thu giá bán thực tế · N đơn · M dòng hàng (sau bộ lọc)”.
- **Trần 1 tỷ là thật**: “200 tr – 1 tỷ” loại các món trên 1 tỷ và nói rõ có bao nhiêu món bị loại. Chỉ “Tất cả” (trạng thái riêng, hiện rõ “Không lọc giá”) mới gồm món trên 1 tỷ. Có thể gõ tay trên 1 tỷ, được gắn nhãn “vượt thang trượt”.
- Thang trượt **không tuyến tính** (0–50, 50–100, 100–200, 200–500, 500–1.000 tr chia đoạn) để khoảng 0–100 tr đủ rộng để kéo.
- **Hiệu quả vốn**: vốn, lãi gộp ÷ vốn, % vốn ở M6+ chỉ tính hàng **mua đứt có giá vốn**; ký gửi không phải vốn của BAOQ. Lãi gộp = giá bán thực tế − giá vốn, **chưa trừ vận hành, hoa hồng, chia lợi nhuận ký gửi**. Dòng thiếu giá vốn bị loại khỏi lãi gộp và có ghi chú.

## 4. Dữ liệu giả (`data.js`)
Cố định theo seed, đặt theo ba nguồn ghép theo SKU: Sapo (đơn/dòng hàng), Kiot (nhận hàng, giá vốn, giá niêm yết), Price System mô phỏng (ngày sẵn sàng bán, chu kỳ giá, giá M0). **`ready_for_sale_date` là trường giả lập được cấp trực tiếp**; mockup **không suy ra** nó từ ngày đăng web/MXH/chụp ảnh. Quy tắc suy ngày đó chưa có xác nhận nên không dùng.

134 SKU tồn (12 ký gửi) · 90 đơn / 117 dòng hàng bán (1–21/10/2026). Có sẵn các trạng thái: thiếu ngày sẵn sàng (5), chưa tới ngày sẵn sàng (2), thiếu giá vốn (3), thiếu giá M0 (3), thiếu brand, M0 < vốn (2), sát đáy vốn (3), Hot/trend (4), 3% (2), 1/2 (2), giá thu về (2), hàng cũ reset (8, mỗi món có ngày reset riêng), chu kỳ giá bắt đầu trước ngày sẵn sàng (2), các mốc biên 29/30/59/60/179/180/209/210 ngày, hàng từ 600 tr (6, trong đó đúng 1 tỷ, 1,25 tỷ và 1,45 tỷ), cùng 1 dòng bán trên 1 tỷ.

## 5. Kiểm thử đã chạy (kết quả thật)
- **Logic**: `node qa/engine.test.cjs` → **59 passed, 0 failed** (trong đó 17 test là hồi quy cho 3 ca kiểm chéo, xem mục 5b). Gồm biên bậc giá, mốc tuổi, mốc lượt, ví dụ số, chạm vốn cả hai kiểu, khóa, hàng cũ, phiên bản giữa chu kỳ, tính lại ổn định, và nhất quán dữ liệu (đơn ≤ dòng, tổng nhóm = tổng, SKU tồn/bán không trùng, ngày hợp lý).
  - Tính lại: **cùng đầu vào + cùng chính sách → cùng hash**. Chính sách hợp lệ khác có thể cho kết quả khác (in ra để xem, không assert bằng nhau).
- **Trình duyệt**: `node qa/run-qa.mjs` → **93 passed, 0 failed** (log: `qa/qa-run.log`, chi tiết: `qa/qa-results.json`). Chạy qua http://127.0.0.1:8790 bằng Chromium headless, Playwright nạp từ `frontend/node_modules` (không sửa `frontend/`). Gồm: slider (chuột, phím, gõ số, min > max, 4 chọn nhanh, trần 1 tỷ), phạm vi lọc, mẫu số, drilldown Bán/Tồn/tuổi/khóa khớp số, máy tính timeline 29/30/59/60/180/209/210 ngày, thiếu ngày, cost-stop, M0 < vốn, ≥ 600 tr, Hot/trend…, hàng cũ reset, luồng chính sách nháp → xem trước → hủy/duyệt → tải lại → tab Tuổi tồn tính lại → khôi phục v0, không tràn ngang ở 1440/768/390, reduced-motion, ngân sách chuyển động 120–280 ms, tương phản AA từng tab, không lỗi console.
### 5b. Kiểm chéo engine (3 ca được yêu cầu bổ sung) — đã sửa và có test hồi quy
| Ca | Lỗi tái hiện được trên engine cũ | Sửa | Test |
|---|---|---|---|
| (a) chu kỳ trước ngày sẵn sàng | Chu kỳ 110 ngày trước, sẵn sàng 40 ngày trước: cả 3 lượt đều giảm (92,5 tr) | Lượt trước ngày sẵn sàng → `skipped_before_ready`, không giảm, không bù | 6 test engine (gồm kiểm tính chất trên nhiều tổ hợp ngày) + 2 test UI |
| (b) reset hàng cũ lấy từ policy | Phiên bản mới mang `legacyResetDate` khác làm `cycleStart` đổi 01/07 → 01/09, viết lại cả lịch sử | Ngày reset là dữ liệu từng món; bỏ khỏi policy, bảng phiên bản và form nháp | 5 test engine + 2 test UI |
| (c) `versionAt` trước hiệu lực | Trước ngày hiệu lực của version đầu vẫn trả về version đầu (chính sách tương lai áp ngược) | Trả `null`; lượt đó là `no_policy` (bỏ qua); UI xử lý khi chưa có phiên bản | 6 test engine + 2 test UI |
- **Kiểm chứng đột biến**: chạy chính bộ test mới trên engine cũ cho **16 test FAIL**; trên engine mới đạt 59/59.
- Hệ quả cần biết: khóa `localStorage` đổi thành `baoq-autosale-policy-v2.1` (bản cũ lưu `legacyResetDate` và ngày hiệu lực cũ); phiên bản đã duyệt giả lập ở bản trước sẽ không còn.

- Bảng màu biểu đồ đã chạy validator dataviz: đạt (ramp một tông, 5 màu danh mục + xám cho “Khác”). `#cf9a5a` dưới 3:1 nên luôn có nhãn số trực tiếp.

## 6. Ảnh bằng chứng (`qa/shots/`)
`hang-ban-1440`, `hang-ton-1440`, `hang-390`, `hang-ton-390`, `hang-768`, `hang-ton-768`, `slider-filter-1440`, `slider-filter-390`, `sheet-ban-drilldown`, `sheet-ton-drilldown`, `sheet-mobile-390`, `empty-state`, `tuoi-1440`, `tuoi-768`, `tuoi-390`, `data-quality-chips`, `calc-29-ngay`, `calc-30-ngay`, `calc-60-ngay`, `calc-180-ngay`, `calc-cost-stop`, `calc-missing-ready`, `calc-legacy-reset`, `calc-cycle-before-ready`, `calc-no-policy-yet`, `policy-1440`, `policy-before-approve`, `policy-preview`, `policy-approved`, `chinhsach-768/390`, `sale-1440/768/390`.

## 7. Dev cần làm thật (ngoài mockup)
1. Ghép dữ liệu Sapo + Kiot + Price System ở **server** theo khóa chung (SKU hay mã dòng sản phẩm, xem câu hỏi 8). Khóa API không để trên trình duyệt.
2. Lưu **sổ các lượt giảm đã áp dụng** (khóa theo SKU + chu kỳ + lượt) để chạy lại không trừ lặp; lưu phiên bản chính sách, ngày hiệu lực, người duyệt, lịch sử.
3. Quy trình duyệt và phân quyền thật; đồng bộ giá về Kiot/Sapo **chỉ sau khi được duyệt**; log kiểm toán.
4. Nguồn thật cho `ready_for_sale_date`, `sale_cycle_start`, `m0_price`; cách phát hiện “sale thủ công” của hàng cũ.
5. Tách tính toán thành dịch vụ có test (port `engine.js` + bộ `engine.test.cjs` làm test chấp nhận).
6. Việc M3 (content/TikTok/ads/Kiot marker) nếu muốn tự động phải là tính năng riêng, cần quyền và duyệt.

## 8. Câu hỏi còn mở (chưa chốt, đang là giả định)
1. Mức giảm xếp theo bậc giá M0 cố định hay theo giá trước mỗi lượt?
2. Khi lượt giảm làm giá thấp hơn vốn: giữ giá trước lượt hay hạ bằng vốn? Sau đó dừng hẳn?
3. Ký gửi có được giảm giá tự động không? “Vốn” của ký gửi là gì? *(Mockup đang khóa ký gửi và không tính vào vốn.)*
4. Thế nào là một lượt hợp lệ (ví dụ đang giữ/đặt cọc)? Lượt bị lỡ thì bỏ hay bù? *(Mockup: lượt nào tới hạn mà dữ liệu đủ thì tính; thiếu dữ liệu thì khóa cả món.)*
5. Ngày reset giá niêm yết cho hàng cũ đến 6/2026 là ngày nào? *(Mockup: 01/07/2026, sửa được.)*
6. Hot/trend, quy tắc 3%, cơ chế 1/2, giá thu về: công thức cụ thể?
7. Hàng từ 600 triệu trở lên áp dụng quy định nào?
8. Khóa ghép giữa Sapo, Kiot, Price System là gì; nguồn chính thức của giá vốn, giá niêm yết, ngày sẵn sàng bán?

## 9. Hạn chế đã biết
- Chỉ tiếng Việt; không có EN. Chưa kiểm Safari/Firefox, chưa kiểm cảm ứng thật (kéo thử bằng chuột trong giả lập di động).
- Ô ngày dùng định dạng theo ngôn ngữ trình duyệt (headless hiện mm/dd/yyyy); dữ liệu nội bộ là ISO.
- Thanh trượt làm tròn bước 1 / 5 / 10 tr tùy đoạn; số gõ tay giữ nguyên, thanh chỉ hiển thị vị trí gần nhất. Ranh giới bậc giá chỉ đọc (không sửa).
- Đổi “ngày tính” sẽ bỏ nháp đang soạn. `localStorage` được bọc try/catch nhưng chưa kiểm khi trình duyệt chặn hoàn toàn.
- Số liệu và tỷ lệ là dữ liệu tổng hợp, không dùng để kết luận kinh doanh. Lãi gộp của hàng ký gửi dùng “giá vốn” giả định (tiền trả chủ hàng tham khảo).
- Mockup này không thay đổi `frontend/`, không commit, không push.

## 10. Tệp
`index.html` · `app.js` (giao diện) · `engine.js` (logic) · `data.js` (dữ liệu giả) · `app-ops.css` · `app-v2-base.css` + `app-v2.css` + `brand/` (bản sao design system) · `qa/engine.test.cjs` · `qa/run-qa.mjs` · `qa/qa-run.log` · `qa/qa-results.json` · `qa/shots/` · `qa/MANIFEST.sha256`.

## 11. Điều hướng với dashboard Luxury V2 (cùng tab)
- Dashboard V2: `http://127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html#view=dashboard` (phục vụ từ `docs/design-proposals/plan-mockup-v1`: `python3 -m http.server 8788 --bind 127.0.0.1 --directory docs/design-proposals/plan-mockup-v1`).
- **Đi**: mục **“Hàng hóa & hiệu quả vốn”** (nhãn “Prototype riêng”) ở sidebar Điều hành (desktop), hàng tab (tablet/di động) và menu ngăn kéo → Điều hành. Mở **cùng tab** tới `http://127.0.0.1:8790/`.
- **Về**: nút **“Quay lại dashboard V2”** và breadcrumb “Điều hành / Trang chủ” trong prototype.
- **Host theo trang hiện tại** (127.0.0.1 không bị lẫn với localhost); không viết lại router.
- **Giữ bộ lọc (logic nhỏ, có giới hạn)**: nút Quay lại gắn thêm `&goods=<hash của prototype>`; dashboard cất vào `sessionStorage` của tab (`baoq-goods-hash`), xóa khỏi URL, và dùng lại khi bấm đi tiếp. Nút Back của trình duyệt cũng quay về đúng trạng thái. **Giới hạn**: chỉ mang hash của prototype (tab, phạm vi, bộ lọc, khoảng giá, ngày tính); không đồng bộ gì khác; tab mới thì mở mặc định; bản nháp chính sách vẫn nằm trong `localStorage` riêng của cổng 8790.
- File đổi: `plan-mockup-v1/v2/mockup/src/baoq-mockup-v2.src.html` (+ build lại `baoq-mockup-v2.html`), `ops-modules-v2/index.html`, `ops-modules-v2/app.js`; kiểm thử `qa/nav-qa.mjs` (21/21, ảnh `qa/shots-nav/`). Snapshot trước khi sửa: `../_snapshots/nav-goods-link-before-20261022-183234/` + `.MANIFEST.sha256`.
- **Cache**: `python3 -m http.server` chỉ gửi `Last-Modified` (không có `Cache-Control`), nên Chrome có thể dùng lại `app.js` cũ sau một lần reload thường. Vì vậy `index.html` gắn `?v=<8 ký tự sha256 của file>` cho mọi CSS/JS cục bộ. **Sau khi sửa bất kỳ asset nào, chạy `node qa/stamp-assets.mjs`** (`--check` để chỉ kiểm tra; `qa/nav-qa.mjs` cũng kiểm tra và sẽ FAIL nếu mã phiên bản lỗi thời).


## 12. Nằm trong menu Điều hành của dashboard V2 (31/10/2026)

Hàng hóa & hiệu quả vốn không còn là trang riêng. Nó là một mục của menu Điều hành, ngang Tổng quan / Thu–bán / Tồn kho / Kiểm tra / Chi phí, dùng chung header, band, sidebar, font, thẻ, nút và motion của V2. Mở module thì menu chung vẫn còn, chỉ nội dung chính đổi.

- Địa chỉ: `http://127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html#view=goods`. Trạng thái nằm trong hash với tiền tố `g_` (ví dụ `#view=goods&g_scope=ton&g_brand=Dior`), nên deep link, tải lại, Back/Forward đều dùng được.
- `app.js` xuất `window.BAOQGoods.mount(host,{ns,base})`; engine, data, công thức, policy, số liệu không đổi. Dashboard nạp module qua thư mục `mockup/goods` (symlink tới thư mục này, một nguồn duy nhất, cùng origin) với `?v=` theo nội dung file.
- CSS nhúng: `app-ops.scoped.css` sinh bởi `node qa/scope-css.mjs` (bọc `.mod-goods`, kèm lớp bố cục nhúng). Sửa `app-ops.css` thì chạy lại lệnh này, rồi `node qa/stamp-assets.mjs`.
- Địa chỉ cũ `http://127.0.0.1:8790/` tự chuyển vào dashboard (ánh xạ khóa sang `g_`). Trang này chỉ còn là máy chủ thử module: thêm `?standalone=1` để chạy riêng (bộ `qa/run-qa.mjs` 93 kiểm tra dùng chế độ này; mặc định đã có tham số).
- `qa/nav-qa.mjs` (link hai trang cũ) đã thay bằng `plan-mockup-v1/v2/mockup/qa/shell-qa.mjs`.
