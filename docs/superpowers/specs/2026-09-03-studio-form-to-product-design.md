# Studio: mẫu → form từng phần → AI điền ô → xuất sản phẩm

Ngày: 2026-09-03  
Trạng thái: đã cài các phần bắt buộc (form từng phần, AI điền ô, MP4/HTML/PDF, không tự tải)

## Mục tiêu

Người dùng tự chọn mẫu, điền kịch bản theo từng phần đúng form của mẫu đó, có thể nhờ AI lấp các ô, sửa tay, rồi xuất đúng loại file. Không tự tải file khi xong — chỉ hiện nút tải.

Đây không phải phim quay / video AI tạo hình. Video = chữ động + brand + nhạc. Tài liệu in = PDF.

## Ngoài phạm vi lần này

- Hệ thống tự chọn mẫu hoặc AI gợi ý mẫu
- Lời đọc TTS (vẫn mềm nếu chưa có `edge-tts`)
- Repo nexu (`html-anything` / `motion-anything`) làm renderer chính
- Xuất cùng lúc nhiều định dạng từ một form
- Tự tải file khi render xong

## Luồng 4 bước (giữ Studio hiện có)

1. **Chọn mẫu** — `TemplateGallery`. User chọn; không tự pick theo brief.
2. **Chọn thương hiệu** — `BrandPicker`. Palette + tên đi vào renderer.
3. **Kịch bản form** — từng phần theo loại mẫu. Brief tùy chọn + nút «AI điền form».
4. **Xuất** — render theo loại, hiện kết quả + nút tải. Không auto-download.

Bước 3 đủ ô bắt buộc mới cho «Xuất file». Brief/rich text không còn miễn toàn bộ form.

## Form từng phần

Thay “một đống field phẳng + editor HTML” bằng **danh sách phần** + vài field meta.

| Loại mẫu | Meta | Phần lặp | Tối đa |
|---|---|---|---|
| `video`, `social` | Tiêu đề, tỷ lệ, thời lượng gợi ý | Hook, cảnh thân, CTA (thêm/bớt cảnh) | 12 cảnh |
| `deck` | Tiêu đề, số slide gợi ý, tỷ lệ | Mỗi slide: tiêu đề + ý chính | 20 |
| `poster`, `landing`, `infographic`, `certificate`, `event` | Khổ / hướng | Tiêu đề, phụ, CTA / ngày giờ | 6 khối |
| `document`, `newsletter`, `brochure` | Tiêu đề, khổ giấy | Tóm tắt + các mục | 16 mục |
| `resume` | Tên, vị trí ứng tuyển | Các mục CV | 12 |
| `worksheet`, `quiz` | Tiêu đề, khổ | Câu / bài | 20 |

Mỗi phần có: `id`, `role` (`hook` \| `body` \| `cta` \| `slide` \| `section` \| `item`), `title`, `body` (ngắn), `notes` (lời đọc / ghi chú, tùy loại).

User thêm/bớt phần. Số phần form là nguồn thật — không cắt lại từ một đoạn văn khi xuất.

`fieldValues` + `parts[]` sống trong `StudioSelection`. `richHtml` không còn là đầu ra của AI.

## AI điền form

Nút **«AI điền form»** trên bước 3.

- Input: loại mẫu, schema phần, brand, brief/nháp (nếu có), các ô đã điền (giữ nếu user đã sửa).
- Output: JSON `{ title, fieldValues, parts[] }` đúng schema mẫu.
- Client ghi vào form. Không ghi `<ol>` vào `richHtml`.
- Không có API key: báo tiếng Việt, không bịa phần.

API: mở rộng `POST /api/v1/generate/preview` hoặc endpoint mới `POST /api/v1/script/normalize` trả `fieldValues` + `parts`. Không render file ở bước này.

## Xuất sản phẩm

`POST /api/v1/generate` nhận `templateId`, `brandId`, `fieldValues`, `parts` (không chỉ prompt chữ).

Server **không** `resolveVideoScript` từ prompt dài nếu đã có `parts[]`.

| Nhóm | Template type | File |
|---|---|---|
| Video | `video`, `social` | `final.mp4` — chữ ngắn, brand, motion, nhạc |
| Trình bày | `deck`, `poster`, `landing`, `infographic`, `certificate` | HTML brand (`slides.html` / `poster.html`) |
| In | `document`, `newsletter`, `resume`, `brochure`, `event`, `worksheet`, `quiz` | PDF: HTML brand + CSS in, rồi Chromium headless (`puppeteer`) in ra PDF. Khổ giấy lấy từ form (A4 mặc định). |

Bước 4: overlay xử lý, xem trước nếu được (video player / iframe HTML / link PDF), **nút Tải về**. Bỏ auto-click download trong `FinalExport`.

## Dữ liệu / biên

- `getMissingRequiredFields`: luôn check meta bắt buộc (tiêu đề + ít nhất 1 phần có chữ). Story text không waive form.
- `buildStudioPrompt` chỉ dùng khi AI normalize, không phải đường xuất chính.
- Workspace vẫn lưu `script.json` = form đã chuẩn.

## Kiểm thử

- Video 3 phần + brand Việt Mỹ → MP4, không `preview.html`.
- Deck 5 slide → HTML, từng slide đúng title/body.
- Document 3 mục → PDF tải được, chữ Việt.
- AI điền form (khi có key) → ô form đổi, không đổi thành HTML list.
- Không có key: AI báo lỗi, form thủ công vẫn xuất được.
- Bước 4 không tự tải file.
