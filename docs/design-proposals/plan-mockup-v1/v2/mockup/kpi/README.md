# KPI preview — local only

Module MVC nhẹ: model.mjs (công thức thuần), view.mjs (markup), controller.mjs (điều phối), snapshot.json (dữ liệu UI đã lược PII). Không API, không ghi dữ liệu nghiệp vụ, không chốt chi lương. Mọi tổng là phạm vi mẫu, không phải toàn tháng.

Mở qua preview server hiện có: /v2/mockup/kpi/ . Trở về dashboard bằng link header. Snapshot riêng tư được ignore; không push hoặc publish dữ liệu. Không tự bật realtime. Cần xác minh API và mapping trước khi vận hành.

Chạy test với Node: node --test model.test.mjs. Không cài thêm package.

Coverage: Sapo 134 đơn, 2/2 trang, ngày đặt 26–30/10; Kiot 47 phiếu từ 100 dòng giảm dần, thiếu hủy/trả nhập. 6 đơn chi tiết, 3 tạm tính. Sự kiện hoàn DH1579 tách riêng vì đơn tạo ngoài kỳ. Đây là ghi nhận UI, không phải API hay đối soát toàn bộ ngân hàng.

Các tên Wall là nhãn nhóm NCC quan sát trên Kiot. Mapping cần lưu lịch sử theo phiếu; nhóm thay đổi không được hồi tố KPI. Các khoản chi cần ID phân bổ duy nhất trên toàn batch; model hiện minh họa kiểm tra trong từng phiếu, adapter thực tế phải kiểm tra tổng theo payment ID toàn batch trước khi set paymentVerified.

## Thiết kế lại UI (31/10/2026, chỉ presentation)

Giữ nguyên `model.mjs`, `snapshot.json`, công thức và dữ liệu (hash đã đối chiếu với baseline `_snapshots/kpi-ui-before-20261031-005339`). Chỉ viết lại `index.html`, `view.mjs`, `controller.mjs`, `style.css`. Bản UI cũ nằm ở thư mục baseline đó.

Luồng: Tổng quan CEO (4 thẻ: tạm tính / chờ / loại trừ / sale đủ điều kiện; thanh bằng chứng trên 182 chứng từ; mỗi sale hai thanh “tổng ≥ 500 tr VÀ cá nhân ≥ 100 tr”) → Hồ sơ sale (Doanh số, Thưởng bán, Thu mua, Cross-sale, Điều chỉnh, mỗi cơ chế riêng) → Danh sách đóng góp → chi tiết chứng từ + link Sapo/Kiot có sẵn. “Cần xử lý” nhóm theo lý do, có “còn thiếu” và “bước tiếp theo”; “Nhận việc” bị khóa kèm lý do vì chưa có hệ thống giao việc.

Trạng thái nằm trong URL hash (`view`, `sale`, `sec`, `kind`, `state`, `rs`, `pers`, `q`, `period`, `back`) nên bộ lọc giữ được và nút “Quay lại” về đúng ngữ cảnh. Kỳ tháng 11 và tháng 10 hiện trạng thái “chưa có dữ liệu” thay vì số 0.

Chạy QA (cần server 8788): `PLAYWRIGHT_BROWSERS_PATH=$PWD/frontend/.browsers .node/bin/node docs/design-proposals/plan-mockup-v1/v2/mockup/kpi/qa/kpi-qa.mjs`. Ảnh trong `qa/shots/` làm mờ các trường chứng từ (mã, nguồn, số tiền từng chứng từ, SKU, bằng chứng); số tổng và tên sale vẫn hiện. Không commit/push các ảnh này.


## Lượt 31/10/2026: vào menu Điều hành, income-first (chỉ trình bày, giữ nguyên công thức)

- KPI Sale là một mục của menu Điều hành V2, cùng shell/sidebar/font/thẻ/nút/motion với Tổng quan, Thu–bán, Tồn kho, Hàng hóa. Địa chỉ: `http://127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html#view=kpi` (khóa trạng thái có tiền tố `k_`). `kpi/index.html` chỉ còn chuyển hướng địa chỉ cũ.
- Mã: `controller.mjs` xuất `mount(host,{ns,base})`; `view.mjs` (khối giao diện); **`income.mjs` (mới, lớp biểu diễn thu nhập, thuần, có test)**; `style.css` chỉ giữ phần riêng của KPI (lớp thẻ, nút, bảng, chip V2 lấy từ shell). `model.mjs`, `model.test.mjs`, `snapshot.json` giữ nguyên, hash khớp baseline `_snapshots/v2-format-before-20261031-140808`.
- Income-first: màn đầu là thẻ từng sale; mỗi khoản (hoa hồng bán lũy tiến, thưởng cá nhân 1%, cross-sale, thu mua 1,5%, điều chỉnh) một dòng riêng, bấm dòng mới mở đơn / chứng từ cấu thành, rồi bấm chứng từ mở link Sapo / Kiot có sẵn. Lương cơ bản là dòng riêng “Chưa cấu hình”, không tính 0 và không cộng vào tổng. Tổng chỉ gồm khoản đã xác minh và luôn ghi “chưa phải toàn bộ thu nhập”.
- Trạng thái thiếu dữ liệu (chỉ ở lớp biểu diễn): **Chưa đủ dữ liệu** (khoản có ngưỡng tháng, mẫu chưa chứng minh được; số tiền = null, không phải 0), **Chờ xác minh**, **Chưa thấy trong mẫu** (không có phiếu / sự kiện gắn sale trong mẫu, chưa chứng minh là không có cả tháng), **Chưa cấu hình**. “Chưa đạt” và “Không có” chỉ hiện khi dữ liệu mang bằng chứng tường minh `proof.mechanisms[...] === true` cho cơ chế đó và không còn bản ghi chờ nào ở cơ chế ấy. Độ bao phủ không bao giờ được suy từ số ngày, số dòng hay `detail=true`. Snapshot hiện tại không có `proof`, nên mọi cơ chế là “không rõ”.
- Ngưỡng đạt ngay trên mẫu là bằng chứng dương hợp lệ (đủ ngưỡng trên một phần dữ liệu thì tháng đầy đủ cũng đủ), nên khi đó số tiền hiện đúng bằng model.
- Footer của shell nay theo module: KPI ghi “snapshot cục bộ 26–30/10/2026, chính sách 11/2026 mô phỏng”; Hàng hóa ghi “dữ liệu tổng hợp”; các màn khác giữ câu cũ về dữ liệu demo.
- Chạy kiểm: `node --test income.test.mjs model.test.mjs` (21), `qa/kpi-qa.mjs` (31, cần server 8788), và `../qa/shell-qa.mjs` (67). Ảnh: `qa/shots/` (đã làm mờ trường chứng từ), ảnh trước sửa: `qa/shots-before/`.
