# Brief thiết kế lại KPI Sale cho Claude — 30/10/2026 UTC

Bảo chưa duyệt UI KPI hiện tại vì khó hiểu, thiếu trực quan và khó thao tác. Hãy thiết kế và triển khai lại UI mockup, đạt chất lượng HOME + dashboard Luxury Workspace mà anh thích. Không chỉ đổi màu một bảng dài. Dùng skill thiết kế phù hợp (ví dụ baoq-admin-ui nếu có), tự đọc component/design system hiện hữu; bỏ mọi bước port production, commit/push hoặc deploy trong workflow skill.

## Phạm vi và đầu vào

Repo Mac: `/Users/baoqluxury/Documents/Codex/2026-10-19/task/baoq-internal`.
Module: `docs/design-proposals/plan-mockup-v1/v2/mockup/kpi/`.
Preview: `http://127.0.0.1:8788/v2/mockup/kpi/`.
Tham chiếu: dashboard `http://127.0.0.1:8788/v2/mockup/baoq-mockup-v2.html#view=dashboard`, HOME cùng bản V2, và prototype `http://127.0.0.1:8790/`.

Chỉ sửa presentation/interaction của KPI (`view.mjs`, `controller.mjs`, `style.css`, `index.html`) và tài liệu/QA cần thiết. Giữ `model.mjs`, snapshot, công thức, dữ liệu và các module khác. Dashboard source/build đã có link KPI: giữ link. Không phục hồi/ghi đè bản cũ, không xóa thay đổi chưa commit. Lưu baseline/snapshot UI trước sửa; kiểm tra không có writer khác. Coordinator đã được báo worker Codex dừng UI; nếu thấy file tiếp tục bị writer khác sửa thì dừng và báo xung đột, không tranh ghi.

Không backend, API thật, credential, thay đổi nghiệp vụ, sửa chứng từ, gửi khách, push/public/deploy hoặc cập nhật skill. Snapshot riêng tư chỉ dùng local; không chép raw chứng từ/khách hàng vào chat, log công khai, ảnh bàn giao hoặc repo public. Không truy cập tài khoản ngoài để sửa nguồn trong lượt thiết kế này.

## Bảng trải nghiệm cần thiết kế

| Khu vực | Câu hỏi cần trả lời | Dữ liệu hiển thị | Thao tác | Trạng thái thiếu dữ liệu | Tiêu chí nghiệm thu |
|---|---|---|---|---|---|
| Đầu trang và kỳ | Tôi đang xem kỳ nào, dữ liệu cập nhật lúc nào? | Kỳ mô phỏng chính sách, khoảng ngày snapshot, timestamp có timezone, nhãn không realtime | Chọn kỳ/phạm vi có dữ liệu; quay về dashboard | Kỳ không có snapshot ghi chưa có dữ liệu, không hiện 0 như kết luận | Luôn phân biệt chính sách 11/2026 với mẫu 26–30/10/2026; không ngoại suy 5 ngày thành tháng |
| Tổng quan CEO | Ai đang đạt/chưa đạt và còn chờ xác minh gì? | Thẻ KPI gọn; số tạm tính/chờ/loại trừ tách riêng; tổng bán, cơ cấu cá nhân/shop; tiến độ hai điều kiện theo từng sale | Chọn sale mở hồ sơ; bấm số mở danh sách đóng góp đã lọc | Thiếu bằng chứng hiển thị chờ, không coi bằng 0; không xếp hạng hiệu suất từ dữ liệu chưa đủ | Nhìn nhanh hiểu tổng quan, không phải đọc bảng dày; điều kiện tổng >=500tr VÀ cá nhân >=100tr hiện hai thanh và phần còn thiếu |
| Hồ sơ sale | Tiền nào góp vào KPI và thưởng nào đủ điều kiện? | Bán cá nhân/shop không trùng; commission bán lũy tiến; thưởng cá nhân; thu mua; cross-sale; điều chỉnh, trạng thái tạm tính | Chuyển nhóm bằng tab/section rõ; bấm từng khoản mở căn cứ, quay lại giữ bộ lọc | Mapping sale/nguồn chưa rõ nằm chờ; không tự gán người | Tổng chi tiết khớp model; giải thích ngắn tại sao đạt/chưa đạt/chờ, không gộp các cơ chế thưởng khác nhau |
| Tiến độ và căn cứ thưởng | Vì sao có hoặc chưa có khoản này? | Hai ngưỡng bán; các bậc từ model; cá nhân 1%; thu mua 1,5% riêng; cross-sale hai nhánh OR | Mở giải thích công thức và danh sách đóng góp; chọn nhánh kiểm tra | Tiền thực trả/phân bổ chưa xác minh không tính thu mua; điều chỉnh chưa đủ chứng cứ để chờ | Không thêm cổng giao hàng/hai tuần; không chồng thưởng cross-sale; số và nhãn đọc rõ, không méo vì 3D |
| Danh sách đóng góp → chứng từ | Số tổng đến từ chứng từ nào, sửa ở đâu? | Các dòng theo đúng metric/sale/kỳ, loại chứng từ, số tiền tính, trạng thái và lý do, nguồn Sapo/Kiot | Lọc/tìm; mở chi tiết rồi link nguồn có sẵn để người dùng sửa tại nguồn; không ghi nguồn từ mockup | Thiếu URL/ID thì khóa nút và giải thích, không link giả hoặc đoán chứng từ | Từ số tổng tới danh sách tối đa 1 click, tới chi tiết thêm 1 click; đúng tập bản ghi; quay lại giữ ngữ cảnh |
| Cần xử lý | Vì sao bản ghi chờ, cần làm gì tiếp? | Nhóm lỗi theo lý do, số lượng, bằng chứng còn thiếu, bước tiếp theo | Lọc nhóm, mở chi tiết/nguồn; nhận việc nếu chưa có cơ chế thật thì khóa có giải thích | Không đủ chứng cứ về ngày ghi nhận/hoàn khác kỳ/phí thì chờ xác minh | Mỗi dòng có lý do + bước tiếp theo; không biến bấm nhận thành đã xử lý; không tự duyệt để làm đẹp số |
| Trạng thái chung | Trang đang tải, trống hay lỗi? | Loading, empty, error, dữ liệu một phần; thông báo rõ phạm vi | Thử lại chỉ khi có hành vi local thật; đóng dialog bằng Escape, quay lại | Phân biệt không có bản ghi và chưa có dữ liệu | Không nút trang trí; nút hoạt động hoặc disabled có lý do; không spinner giả không kết thúc |

## Ngôn ngữ thiết kế

Ưu tiên dễ hiểu, trực quan, ít thao tác, nền sáng với walnut/espresso theo HOME và Luxury Workspace hiện hữu. Typography, khoảng trắng và thứ bậc thông tin tốt; không ép palette/chi tiết mới trái bản Bảo thích. Biểu đồ chỉ khi trả lời câu hỏi cụ thể, có đơn vị và mẫu số; không nhồi donut lặp. Shadow/depth tinh tế, motion 140–280ms và hỗ trợ reduced-motion. Responsive desktop/tablet/mobile; không tràn toàn trang; bảng chi tiết được cuộn trong vùng riêng. Keyboard focus rõ, dialog trả focus, Escape đóng. Giữ cảnh báo tạm tính đủ dễ thấy nhưng không chiếm hết màn hình.

## Công thức và giới hạn phải bảo toàn

- Bán = cá nhân + shop, không cộng trùng. Commission bán cần đồng thời tổng >=500 triệu VÀ cá nhân >=100 triệu. Bậc lũy tiến đọc SOP/model có sẵn, không đoán hoặc áp một tỷ lệ cho toàn bộ. Model hiện có 6 bậc: 5 bậc rộng 1 tỷ, bậc cuối phần còn lại; tỷ lệ 0,5% / 0,75% / 1% / 1,25% / 1,35% / 1,5%. Nếu SOP khác model, báo riêng, không tự sửa logic.
- Thưởng cá nhân 1% toàn bộ doanh thu cá nhân khi đủ 100 triệu. Thu mua 1,5% tiền shop thực trả đã xác minh/phân bổ, tách ngưỡng bán.
- Cross-sale = max(số món - 1, 0); đạt 10 HOẶC có 1 đơn >=300 triệu: 1 triệu/lần/sale/tháng, không cộng hai lần khi đạt cả hai.
- Chỉ tính đơn đủ tiền và trạng thái thanh toán, không thêm cổng giao hàng. Loại livestream và ký gửi đối tác/B2B khỏi KPI sale.
- Quay đầu phí >=10% giữ toàn bộ giá bán ban đầu; dưới 10% hoặc hủy không phí = zero. Không có luật hai tuần. Ngày ghi nhận, hoàn khác kỳ, tỷ lệ phí thiếu chứng cứ phải chờ, không tự đặt luật.

QA.md/model đã được coordinator đọc; QA ghi 7/7 nhóm test kỹ thuật, không phải duyệt thẩm mỹ. Snapshot được báo gồm 134 đơn Sapo đủ 2 trang +47 phiếu Kiot trong 26–30/10, chỉ kiểm chi tiết 6 đơn bán +1 phiếu thu mua, không kiểm tất cả; 3 đơn tạm tính 101,8 triệu, 167 chờ, 12 loại trừ trên 182 bản ghi gồm 1 sự kiện hoàn ngoài kỳ. Những số này là mốc đối chiếu local, không thành lương đã duyệt. Chưa xác minh API, mapping sale/nguồn, lịch sử NCC, toàn bộ hủy/hoàn, phân bổ tiền, thanh toán trong kỳ của đơn cũ. Không ngoại suy mẫu thành thành tích tháng. Gói chat không chứa raw snapshot.

## Cách thực hiện và bàn giao

Đọc QA.md, README, model và component hiện có; nêu ngắn bố cục dự định rồi triển khai UI trong phạm vi trên. Không cần xin duyệt lại việc thiết kế đã giao. Nếu cần đổi model/logic/dữ liệu để khớp thiết kế, giữ nguyên và báo vấn đề thay vì tự sửa. Không khởi động việc nối sổ Excel/dữ liệu thật đang chờ ở phiên cũ.

Kiểm tra trước/sau hash model và snapshot không đổi; chạy các test hiện có; QA luồng CEO → sale → khoản đóng góp → chứng từ, back/filter, kỳ thiếu dữ liệu, lý do pending/excluded, hai điều kiện AND và cross-sale OR. Render/xem ảnh desktop 1440, tablet 768, mobile 390; kiểm focus/Escape/reduced-motion và lỗi console. Không coi test pass là Bảo duyệt giao diện. Bàn giao URL local đã mở thực tế, file đổi, ảnh sạch dữ liệu nhạy cảm, kết quả kiểm và hạn chế. Không polish vô hạn. Xác nhận nhận brief, đúng repo, phạm vi UI-only và không có writer khác trước bắt đầu.
