# 04 · Checklist nghiệm thu (390 / 768 / 1440) và kế hoạch rollback

Áp dụng cho **app thật** ở checkpoint HOME (C2), và sau này cho dashboard (C3). Mỗi mục phải có bằng chứng ghi rõ một trong ba trạng thái **PASS / FAIL / NOT RUN** kèm lệnh hoặc ảnh. Không đánh dấu PASS khi chưa chạy.

## 1. Checklist HOME (C2)

### Chung

- [ ] `npm run typecheck` và `npm run build` PASS (lệnh ở §3).
- [ ] Playwright: toàn bộ test nghiệp vụ PASS. Test đã cập nhật đúng danh sách 01 §6, mỗi thay đổi có lý do; không xóa test nào để PASS.
- [ ] Số liệu demo không đổi: 190.000.000 · 162.500.000 · 27.500.000 · 111.000.000 ₫; drilldown Online 3 dòng; tồn ≥ 90 ngày 2 SKU.
- [ ] Không có lỗi trang hay console.
- [ ] `frontend/src/simulated-api.ts`, `demo-data.json`, `backend/`, `tests/`, `package.json`, `scripts/` có fingerprint không đổi.

### Theo độ rộng

| Kiểm | 390×844 (mobile, cảm ứng) | 768×1024 | 1440×900 |
|---|---|---|---|
| Không tràn ngang, viewport không tự zoom (`innerWidth` = độ rộng) | [ ] | [ ] | [ ] |
| Header cao 56px, logo gốc (`naturalWidth` 2048) căn giữa ±2px, không bị điều khiển đè | [ ] | [ ] | [ ] |
| Việc đầu tiên nằm trong màn hình đầu: **≤ 440px** ở 390 (mockup 419, HOME cũ 560); ≤ 520px ở 768/1440 | [ ] | [ ] | [ ] |
| Headline và CTA đúng 4 trạng thái (quá hạn / đến hạn / không đến hạn / không có việc) | [ ] | [ ] | [ ] |
| Chip lọc: số đếm đúng, URL `homeFilter`, reload giữ trạng thái, focus ở lại chip | [ ] | [ ] | [ ] |
| Xem theo bộ phận: không có cột rỗng; bộ phận trống gộp một dòng | [ ] | [ ] | [ ] |
| Sheet: mở bằng click/Enter/chạm; đóng bằng ×/Escape/scrim/Back; Forward mở lại; trả focus về dòng | [ ] | [ ] | [ ] |
| Đánh dấu hoàn thành → toast → Hoàn tác trả lại trạng thái; "Mở trang chi tiết" sang `page=tasks&task=ID` cùng tab | [ ] | [ ] | [ ] |
| Drawer: mở/đóng ×3 nhanh; cấp 2/Back; thứ tự Escape; focus trap; trả focus về ☰; mục "Sắp có" không bấm được và có nhãn | [ ] | [ ] | [ ] |
| VI/EN: nút `Switch language / Đổi ngôn ngữ`; URL giữ nguyên; HOME bản EN không còn chuỗi UI tiếng Việt; tên việc không bị dịch | [ ] | [ ] | [ ] |
| Vùng chạm ≥ 44×44 px | [ ] | (n/a) | (n/a) |
| Contrast AA cho chữ (audit giống `qa.spec` hiện tại): 0 lỗi | [ ] | [ ] | [ ] |

### Motion và trợ năng

- [ ] Mọi transition/animation trong khoảng 120–280 ms (đo bằng computed style; ghi giá trị lớn nhất).
- [ ] Không có `pointer-events: none` trên phần tử tương tác; click không phải chờ animation.
- [ ] Số tiền hiển thị ngay giá trị cuối, `getAnimations()` trên KPI và bảng bằng 0.
- [ ] Reduced motion: mở drawer, sheet và dialog thì `getAnimations()` = 0, transform cuối là `none`.
- [ ] Có khung hình motion (paused t = 0/80/160/240) cho drawer, cấp 2, sheet và filter, đã được xem. Ghi rõ khung nào đã xem; video ghi riêng nếu có.

### Không hồi quy dashboard (trong pha HOME)

- [ ] Test 1, 2, 3, 5, 8, 13, 14 giữ nguyên và PASS.
- [ ] Từ drawer → Điều hành → chọn kỳ → drilldown → dialog → Back → Trang chủ: cùng tab, cùng origin.

### Ảnh cần nộp

- Thư mục `docs/qa/redesign-home/{before,after}/`: HOME 1440/768/390 (VI), HOME EN 1440/390, drawer cấp 1 và 2, sheet 1440/390, xem theo bộ phận, reduced motion 390.
- Kèm 4 ảnh dashboard (1440/390, VI/EN) để chứng minh không hồi quy.

## 2. Rollback

### Trước mỗi pha ghi (INT)

1. Snapshot vào `/Users/baoqluxury/Documents/Codex/2026-10-19/task/baoq-internal/.rollback/<YYYYMMDD-HHMM>-<C0|C1|C2…>/`:
   - `frontend/src/`, `frontend/qa.spec.ts`, `frontend/visual-capture.spec.ts`, `frontend/playwright*.config.ts`, `frontend/index.html`
   - `frontend/dist/`
   - `docs/verification.md`, `docs/developer-handoff.md`, `README.md`
   - `MANIFEST.sha256` (sha256 từng file) và `CREATED.txt` (file mới tạo trong pha, cập nhật khi tạo).
2. Nếu dùng git (D5): mỗi checkpoint một commit cục bộ; rollback bằng `git restore`/`git checkout <commit> -- <paths>` (không push).

### Khi cần quay lại (ví dụ HOME bị trả về)

```sh
cd /Users/baoqluxury/Documents/Codex/2026-10-19/task/baoq-internal
```

1. Kiểm tra không có writer khác (fingerprint) trước khi khôi phục.
2. Khôi phục file từ snapshot bằng `cp -p` theo đúng danh sách trong `MANIFEST.sha256`. Xóa các file liệt kê trong `CREATED.txt`.
3. So `shasum -a 256` với manifest: phải khớp 100%.
4. Build lại: `PATH="$PWD/.node/bin:$PATH" .node/bin/npm --prefix frontend run build`. Server `http.server` hiện có đọc `dist` từ đĩa, nên **không cần restart** hay đổi cổng.
5. Xác minh các file được phục vụ khớp `dist`: `curl` từng file rồi `cmp` (cách đã làm khi bàn giao server).
6. Chạy lại bộ test của checkpoint được khôi phục (ví dụ 16/16 của bản hiện tại) và báo PASS/FAIL thật.

**Rollback một phần:** vì HOME mới nằm trong file riêng (`src/home/*`, `src/shell/*`, `src/styles/*`), có thể chỉ trả `main.tsx` và `app-header.tsx` về snapshot để quay lại HOME cũ mà vẫn giữ token, rồi build và test.

## 3. Lệnh build/test sẽ dùng (đã xác minh đường dẫn ở các lượt trước)

```sh
PATH="$PWD/.node/bin:$PATH" .node/bin/npm --prefix frontend run typecheck
PATH="$PWD/.node/bin:$PATH" .node/bin/npm --prefix frontend run build
cd frontend && PATH="$PWD/../.node/bin:$PATH" PLAYWRIGHT_BROWSERS_PATH="$PWD/.browsers" ../.node/bin/npx playwright test
cd frontend && PATH="$PWD/../.node/bin:$PATH" PLAYWRIGHT_BROWSERS_PATH="$PWD/.browsers" BAOQ_SHOTS=<thư mục> ../.node/bin/npx playwright test -c playwright.capture.config.ts
```

Playwright dùng Chromium đã có trong `frontend/.browsers/chromium-1248`, khớp `playwright-core` 1.64.1. Không cài thêm.
