# QA và phạm vi — 31/10/2026 UTC+7

Preview: http://127.0.0.1:8788/v2/mockup/kpi/

- Node test: 7/7 pass. Bậc lũy tiến tại 0/1/2/3/4/5/6 tỷ; ngưỡng AND; personal 1% toàn bộ; tiền + trạng thái; cross-sale OR không chồng; quay đầu >=10%; allocation trùng; snapshot 134 unique / 47 phiếu / 101,8 triệu tạm tính.
- Browser: dashboard cũ → KPI → dashboard chạy; chọn Linh ra 72 triệu / 1 đơn; mở DH1782 ra 24 triệu, SKU, nguồn Facebook và link Sapo chính xác; tìm PN000284 ra 6,5 triệu, WALL_LINH, link Kiot và lý do chờ.
- Screenshot desktop 1440×1000 và mobile 390×844 đã xem trực tiếp. Mobile document scrollWidth = clientWidth = 390; tab điều hướng cuộn ngang riêng, bảng có scroll riêng. Không có console error trong lượt kiểm tra.
- Chưa chốt tháng: UI hiện 3 tạm tính, 167 chờ, 12 loại trừ trên 182 bản ghi (134 Sapo + 47 Kiot + 1 sự kiện hoàn ngoài kỳ). Nguồn KG ngoài mẫu chi tiết để chờ, chưa giả định mapping. Khoản 0 hoa hồng là kết quả trên phần mẫu đã xác minh, không phải đánh giá lương/thành tích tháng.
- Dữ liệu chỉ lấy qua UI tài khoản. Chưa xác minh API, cancelled/trả nhập Kiot, toàn bộ hoàn Sapo, thanh toán trong kỳ của đơn tạo trước kỳ, lịch sử nhóm, phân bổ nhiều phiếu toàn batch.
- PN000284 đọc lại thấy đã nhập hàng, tổng và tiền trả 6,5 triệu; note WALL_LINH; SKU SP025280_28102026. Không lưu PII/bank account trong snapshot.
- Không business mutation, không credential, không publish/push. File snapshot.json bị ignore. Server bind 127.0.0.1.

## QA giao diện KPI mới — 31/10/2026

- Test model: 7/7 pass; hash `model.mjs`, `model.test.mjs`, `snapshot.json` khớp baseline.
- Browser (`qa/kpi-qa.mjs`): 85/85 pass (sau kiểm chéo: Bán shop lọc riêng nguồn shop; tổng chứng từ tách theo cơ chế, không cộng bán với thu mua; nhánh cross-sale ≥300 tr chỉ xét đơn bán, không xét phiếu thu mua; mục Thu mua đọc phiếu đã đối soát thật). Gồm luồng CEO → sale → đóng góp → chứng từ, quay lại/lọc/tìm, kỳ thiếu dữ liệu, loading/lỗi/thử lại, lý do chờ/loại trừ, “Nhận việc” khóa, focus/Escape/trả focus, reduced-motion, thời lượng motion 140–280 ms, tương phản AA, không tràn ngang ở 1440/768/390, không lỗi console.
- Hai điều kiện AND, cross-sale OR, bậc lũy tiến được thử bằng dữ liệu tổng hợp nạp trong trình duyệt (file snapshot không đổi): đủ cả hai → 2,5 tr + 1 tr cá nhân; thiếu cá nhân 99.999.999 → 0; cross-sale chỉ nhánh A, chỉ nhánh B, đủ cả hai vẫn 1 tr một lần.
- Giới hạn: chỉ Chromium (Playwright); chưa thử Safari/Firefox, cảm ứng thật, trình đọc màn hình; ngày/giờ lấy từ snapshot, chưa đồng bộ; đây là kiểm kỹ thuật, không phải Bảo duyệt thẩm mỹ.


## QA bản trong menu Điều hành, income-first — 31/10/2026

- Unit: `income.test.mjs` + `model.test.mjs` = 21/21. Hash `model.mjs`, `model.test.mjs`, `snapshot.json`, `engine.js`, `data.js` khớp baseline.
- `kpi/qa/kpi-qa.mjs`: 31/31 (thẻ sale lên màn hình đầu ở 1512×827; metadata một thanh ngắn; “Chưa đủ dữ liệu” không bị thay bằng 0; drilldown dòng tiền → chứng từ → link nguồn; Bán shop / cá nhân tách; tổng bán và thu mua không cộng chung; kịch bản dữ liệu tổng hợp: ngưỡng đạt, 99.999.999 cá nhân, 28 ngày cắt tháng, đã đọc chi tiết nhưng còn chờ, chỉ có bằng chứng tường minh mới ra “Chưa đạt”; loading / lỗi / thử lại; tương phản AA; focus).
- `mockup/qa/shell-qa.mjs`: 67/67 (menu chung, Tổng quan → KPI → Hàng hóa → Thu–bán → Tồn kho, lặp 4 lần không nhân đôi, deep link + tải lại, Back/Forward, focus/Escape, bảng breakpoint, kiểu chữ và thẻ khớp V2, motion 120/180/240/280, reduced-motion, không tràn ngang 1440/768/390, footer theo module).
- Bảng breakpoint đo được (`mockup/qa/breakpoint-table.json`): ≥1100px sidebar dọc; 700–1099px tab ngang xuống dòng, không cắt nhãn; <700px một nút menu liệt kê đủ mục. Cùng viewport thì mọi view Điều hành dùng cùng kiểu.
- Hạn chế: chỉ Chromium; chưa thử Safari/Firefox, cảm ứng thật, trình đọc màn hình; tiếng Anh chưa dịch module (có ghi chú “chỉ có tiếng Việt”); đây là kiểm kỹ thuật, không phải Bảo duyệt thẩm mỹ.
