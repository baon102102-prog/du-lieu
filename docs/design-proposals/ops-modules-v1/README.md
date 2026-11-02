# Mockup: Phân tích kho & sale (ops-modules-v1)

Mở: `/usr/bin/python3 -m http.server 8789 --bind 127.0.0.1 --directory docs/design-proposals/ops-modules-v1` → http://127.0.0.1:8789

Dữ liệu là tổng hợp (150 đơn, 95 món tồn, sinh cố định), đặt theo trường Sapo. Chưa nối API.

## Tab Kho · Lợi nhuận gộp
- Thẻ số: doanh thu, giá vốn, lợi nhuận gộp, % lãi gộp, tồn hiện tại (theo giá vốn).
- Bảng theo nhóm hàng (sắp xếp được), bấm dòng → danh sách đơn.
- Khoảng giá **theo giá bán**, mốc mặc định 50/100/150/200 tr. Nút "Chỉnh khoảng giá": sửa/thêm/bỏ mốc (tối đa 8), mẫu nhanh, kiểm tra mốc tăng dần; lưu `localStorage` key `baoq-price-bands-v1`. Khoảng = [mốc dưới, mốc trên).
- Ma trận nhóm hàng × khoảng giá: đổi chỉ số (lợi nhuận gộp, % lãi, số món, giá trị tồn); ô bán lỗ màu đỏ.

## Tab Sale & kênh
- Thẻ số: số đơn, doanh thu, giá trị đơn TB, lợi nhuận gộp, sale dẫn đầu.
- Tỷ trọng kênh theo doanh thu / số đơn / lợi nhuận gộp (thanh 100%, có nhãn %).
- Bảng từng sale: số đơn, doanh thu, giá trị đơn TB, lợi nhuận gộp, % lãi, tỷ trọng, cơ cấu kênh; bấm tên → đơn của sale.
- Sale × khoảng giá (số đơn), Sale × nhóm hàng (doanh thu).

## Ánh xạ Sapo (cho dev, cần xác nhận với API thật)
| Mockup | Sapo |
|---|---|
| Mã đơn, ngày | `orders.code`, `created_on` |
| Kênh | `source_name` (nguồn đơn) |
| Sale | `assignee` (nhân viên phụ trách) |
| Giá bán, nhóm hàng | `line_items.price`, danh mục/loại sản phẩm |
| Giá vốn | giá vốn từ kho tại thời điểm bán |
| Tồn | tồn kho theo chi nhánh |

Nối API phải làm phía server (khóa API Sapo không để trên trình duyệt). Lợi nhuận gộp chưa trừ chi phí vận hành, hoa hồng.

Màu: ramp heatmap `#d4ab7e→#5a3516` và 3 màu kênh `#cf9a5a/#8c4a1f/#2f7fae` đã chạy validator dataviz (PASS).
