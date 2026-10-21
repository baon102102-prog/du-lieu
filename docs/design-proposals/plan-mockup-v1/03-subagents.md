# 03 · Chia subagent bên Claude (chỉ chạy SAU KHI được duyệt)

**Hiện chưa khởi chạy subagent nào.** Đây là kế hoạch. Codex chỉ điều phối và kiểm chéo dạng chỉ đọc.

## 1. Nguyên tắc

1. **Một integrator duy nhất (INT)** là phiên Claude chính. Chỉ INT được:
   - sửa các file dùng chung,
   - chạy `npm run build` (ghi `dist`) và Playwright,
   - tạo snapshot và rollback,
   - cập nhật docs bàn giao.
2. **Mỗi subagent chỉ ghi vào các file mình sở hữu** (bảng §3), không động vào file khác, không build, không đụng server hay `dist`, không cài gì. Được phép chạy `tsc --noEmit` vì lệnh này không ghi file.
3. Repo **không phải git**, nên không có worktree cô lập. Hai cách:
   - **D5 khuyến nghị:** INT chạy `git init` cục bộ (không remote, không push). Mỗi pha một commit để diff và rollback theo commit.
   - Nếu không dùng git: snapshot thư mục kèm manifest sha256 (04 §2), cùng quy định ownership chặt.
4. Mỗi subagent nộp báo cáo gồm: danh sách file đã đổi kèm sha256, chuỗi UI mới (VI→EN) để đưa vào glossary, các giả định, và những gì chưa làm được.
5. INT đối chiếu fingerprint toàn repo trước và sau mỗi lượt. Nếu có file ngoài phạm vi sở hữu bị đổi: **từ chối, khôi phục file đó từ snapshot, báo lại**, không ghi đè lên thay đổi lạ.
6. Gặp thao tác bị chặn hoặc bị từ chối thì dừng thao tác đó và báo nguyên văn, không tìm đường vòng.
7. Model: dùng đúng model phiên chính (Opus 5.5; chế độ "Extra" do người dùng xác nhận trên UI, Claude không tự kiểm được).

## 2. Đồ thị phụ thuộc và checkpoint

```
P0  INT: snapshot + baseline (build, 16 test, ảnh) + tách tasks-store.ts (refactor, không đổi hành vi)
     └─ C0: 16/16 PASS, ảnh baseline giống từng byte trước/sau refactor
P1  song song, file tách biệt, CHƯA mount vào app:
     ├─ VIS  tokens.css, base.css
     ├─ IA   nav-model.ts, shell/Drawer.tsx, app-header.tsx (bản mới, chưa nối vào app), shell.css
     └─ A11Y a11y/focus-trap.ts, motion.css, qa-helpers.ts
     └─ C1: typecheck PASS, app chưa đổi hành vi (16/16 PASS)
P2  HOME:
     ├─ HOME home/HomeView.tsx, TaskSheet.tsx, task-queue.ts, home.css  (dùng VIS, A11Y)
     └─ INT  nối vào main.tsx, i18n glossary, cập nhật/thêm test (01 §6), build
     └─ C2 = CHECKPOINT HOME: build/typecheck/test, ảnh 390/768/1440 VI/EN, khung motion → DỪNG để anh thử
P3  (chỉ khi anh duyệt C2) DASHBOARD:
     ├─ INT  tách dashboard khỏi main.tsx (refactor, không đổi hành vi) → C3a: 16+ PASS, ảnh giống từng byte
     ├─ DASH dashboard/*.tsx, dashboard.css
     └─ INT  tích hợp, test dashboard → C3 → DỪNG
P4  INT + A11Y: dọn CSS chết (luxury.css, AppLauncher, HomeBoard, selector cũ), audit a11y cuối → C4
```

## 3. Vai trò và file ownership (không chồng lấn)

| Vai trò | Sở hữu (được ghi) | Đầu vào | Đầu ra / tiêu chí xong |
|---|---|---|---|
| **INT** (integrator kiêm QA, phiên chính) | `src/main.tsx`, `src/i18n.tsx`, `src/tasks.tsx`, `src/tasks-store.ts` (P0), `src/style.css`, `src/luxury.css` (chỉ khi dọn), `qa.spec.ts`, `visual-capture.spec.ts`, `playwright*.config.ts`, `docs/verification.md`, `docs/developer-handoff.md`, `README.md`, `.rollback/`, `dist/` (qua build) | Báo cáo của mọi vai trò | Build và test xanh tại mỗi checkpoint; ảnh; diff; ghi chép rollback |
| **IA** (UX/IA, điều hướng) | `src/nav-model.ts`, `src/shell/Drawer.tsx`, `src/app-header.tsx`, `src/styles/shell.css` | 01 §3, mockup | Drawer 2 cấp, header 56px; giữ hợp đồng `.apps-trigger`, `#apps-menu`, nút "Điều hành", aria-label ngôn ngữ |
| **VIS** (visual system) | `src/styles/tokens.css`, `src/styles/base.css` | 01 §4 | Token và kiểu nền; contrast đúng các số đã đo |
| **HOME** | `src/home/HomeView.tsx`, `src/home/TaskSheet.tsx`, `src/home/task-queue.ts`, `src/styles/home.css` | 01 §3 quy tắc dữ liệu, 02 §1.2–1.3, `tasks-store.ts` | HOME đúng mockup; `task-queue.ts` là hàm thuần (dễ kiểm) |
| **A11Y** (motion và accessibility) | `src/a11y/focus-trap.ts`, `src/styles/motion.css`, `frontend/qa-helpers.ts` (hàm đo contrast, motion, vùng chạm, overflow; INT import vào spec) | 02 §2–5 | Hook focus trap/trả focus/Escape; motion trong 120–280 ms; reduced motion; P4 audit |
| **DASH** (chỉ P3) | `src/dashboard/*.tsx` (sau khi INT tách), `src/styles/dashboard.css` | Mockup dashboard, dataviz | KPI → Cần xử lý → Phân tích; giữ accessible name dùng trong test |

Quy định cho file dùng chung:
- `main.tsx`, `i18n.tsx`, `qa.spec.ts` chỉ do INT sửa. Subagent gửi "đề xuất patch" trong báo cáo, INT áp dụng.
- CSS mới được nạp theo thứ tự cố định trong `main.tsx`: tokens → base → shell → home/dashboard → motion (cuối cùng để reduced motion luôn thắng).

## 4. Mẫu brief cho từng subagent

```
Vai trò: <IA|VIS|HOME|A11Y|DASH>. Repo: /Users/baoqluxury/Documents/Codex/2026-10-19/task/baoq-internal
Chỉ ghi các file: <danh sách §3>. Không sửa file khác, không build, không chạy server, không cài gì.
Đọc: docs/design-proposals/plan-mockup-v1/{01,02}.md, mockup/baoq-mockup-v1.src.html (tham chiếu, không copy nguyên).
Giữ: routes, dữ liệu, công thức, quyền mô phỏng, hợp đồng test (01 §6), VI/EN glossary.
Xong khi: <tiêu chí §3>; `tsc --noEmit` PASS.
Báo cáo: file + sha256, chuỗi UI mới (VI→EN), giả định, việc chưa làm, thao tác bị chặn (nguyên văn).
```

## 5. Rủi ro và cách chặn

| Rủi ro | Biện pháp |
|---|---|
| Hai agent ghi cùng một file | Bảng ownership; INT kiểm fingerprint mỗi lượt; vi phạm thì trả về snapshot |
| Build và test đè `dist` hoặc ảnh docs giữa chừng | Chỉ INT build và chạy test, tuần tự |
| Glossary thiếu chuỗi, bản EN lẫn tiếng Việt | Test "EN không còn chuỗi UI tiếng Việt"; mỗi báo cáo kèm danh sách chuỗi mới |
| Test nghiệp vụ gãy do đổi DOM | Giữ hợp đồng: `.apps-trigger`, `#apps-menu`, nhãn `Vai trò demo`, `Kỳ dữ liệu`, aria-label nút ngôn ngữ, tên nút dashboard |
| Dashboard bị ảnh hưởng ngay trong pha HOME | Header và drawer dùng chung là thay đổi duy nhất; test 1, 2, 3, 5, 8, 13, 14 phải giữ nguyên và PASS |
