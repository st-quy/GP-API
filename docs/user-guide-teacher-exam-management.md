# Hướng dẫn Giảng viên - Quản lý Đề thi (Exam Management)

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Quy trình quản lý đề thi](#2-quy-trình-quản-lý-đề-thi)
3. [Hướng dẫn chi tiết](#3-hướng-dẫn-chi-tiết)
4. [API Endpoints liên quan](#4-api-endpoints-liên-quan)
5. [Lưu ý quan trọng](#5-lưu-ý-quan-trọng)

---

## 1. Tổng quan

Hệ thống GreenPREP cho phép giảng viên quản lý đề thi APTIS với 5 kỹ năng:

| Kỹ năng | Mô tả |
|---------|-------|
| Speaking | Ghi âm trả lời (3 phần) |
| Listening | Nghe audio + trả lời câu hỏi |
| Reading | Đọc hiểu + trả lời nhiều dạng |
| Grammar & Vocabulary | Trắc nghiệm ngữ pháp, từ vựng |
| Writing | Viết bài luận |

### Thuật ngữ

- **Topic (Đề thi)**: Một bài thi hoàn chỉnh chứa nhiều Section
- **Section**: Nhóm câu hỏi thuộc cùng kỹ năng
- **Part**: Phân đoạn trong một Section (ví dụ: Part 1, Part 2, Part 3 của Speaking)
- **Question**: Câu hỏi đơn lẻ
- **Session**: Phiên thi gắn với 1 đề thi + 1 lớp học

---

## 2. Quy trình quản lý đề thi

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Tạo câu hỏi │ ──▶ │  Tạo Section  │ ──▶ │  Tạo Topic   │ ──▶ │  Gắn vào     │
│  (Question)  │     │  (nhóm câu    │     │  (đề thi)    │     │  Session     │
│              │     │   hỏi)        │     │              │     │              │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                               │
                                               ▼
                                    ┌──────────────────┐
                                    │  Quy trình duyệt  │
                                    │  Draft → Submitted │
                                    │  → Approved        │
                                    └──────────────────┘
```

### Trạng thái đề thi (Topic Status)

| Trạng thái | Mô tả | Ai thực hiện |
|-----------|-------|-------------|
| **Draft** | Bản nháp, đang soạn | Giảng viên |
| **Submitted** | Đã gửi duyệt | Giảng viên |
| **Approved** | Đã được duyệt, sẵn sàng sử dụng | Admin |
| **Rejected** | Bị từ chối, cần chỉnh sửa | Admin |

---

## 3. Hướng dẫn chi tiết

### 3.1 Quản lý ngân hàng câu hỏi (Question Bank)

#### Tạo Section mới

1. Vào **Question Bank** trên thanh điều hướng
2. Chọn tab kỹ năng (Speaking / Listening / Reading / Grammar / Writing)
3. Nhấn **Tạo mới**
4. Điền thông tin:
   - **Tên Section**: Ví dụ "Grammar Set 1"
   - **Mô tả**: Mô tả nội dung
   - **Độ khó**: Easy / Medium / Hard
5. Thêm câu hỏi vào Section:
   - Với **Grammar**: Tạo câu trắc nghiệm (multiple choice) hoặc nối cặp (matching)
   - Với **Listening**: Upload audio + tạo câu hỏi
   - Với **Reading**: Nhập đoạn văn + tạo câu hỏi (dropdown, matching, ordering)
   - Với **Speaking**: Nhập prompt + thiết lập thời gian chuẩn bị/ghi âm
   - Với **Writing**: Nhập đề bài + yêu cầu số từ
6. Nhấn **Lưu**

#### Import câu hỏi từ Excel

1. Nhấn **Export Template** để tải mẫu Excel
2. Điền câu hỏi vào file mẫu theo format
3. Nhấn **Import** và chọn file
4. Kiểm tra dữ liệu preview
5. Xác nhận import

#### Chỉnh sửa / Xóa Section

- **Sửa**: Nhấn icon sửa → Chỉnh nội dung → Lưu
- **Xóa**: Nhấn icon xóa → Xác nhận (Section đang được sử dụng trong Topic sẽ không xóa được)

### 3.2 Tạo đề thi (Topic)

1. Vào trang **Exam Management**
2. Nhấn **Tạo đề thi mới**
3. Điền tên đề thi (ví dụ: "APTIS Practice Test 1")
4. Chọn các Section cho từng kỹ năng:
   - Chọn 1 Section Speaking
   - Chọn 1 Section Listening
   - Chọn 1 Section Reading
   - Chọn 1 Section Grammar & Vocabulary
   - Chọn 1 Section Writing
5. Nhấn **Lưu nháp (Draft)** hoặc **Gửi duyệt (Submit)**

### 3.3 Gửi duyệt đề thi

1. Tại trang **Exam Management**, tìm đề thi ở trạng thái **Draft**
2. Kiểm tra lại nội dung đề thi
3. Nhấn **Submit** để gửi cho Admin duyệt
4. Đề thi chuyển sang trạng thái **Submitted**
5. Chờ Admin phê duyệt:
   - **Approved** → Sẵn sàng sử dụng cho phiên thi
   - **Rejected** → Chỉnh sửa theo góp ý và gửi lại

### 3.4 Sử dụng đề thi trong phiên thi

1. Vào **Quản lý lớp** → Chọn lớp
2. Nhấn **Tạo phiên thi**
3. Chọn đề thi đã được **Approved**
4. Thiết lập:
   - Tên phiên thi
   - Session Key (tự sinh hoặc nhập)
   - Thời gian bắt đầu / kết thúc
5. Nhấn **Xác nhận**
6. Cung cấp Session Key cho sinh viên

### 3.5 Chấm điểm

Sau khi sinh viên hoàn thành bài thi:

1. Vào **Chi tiết phiên thi** → Chọn sinh viên
2. **Tab Speaking**:
   - Nghe lại bản ghi âm từng phần
   - Nhập điểm (0-100)
   - Thêm nhận xét cho từng câu
3. **Tab Writing**:
   - Đọc bài viết
   - Nhập điểm (0-100)
   - Thêm nhận xét
4. Nhấn **Lưu** sau khi chấm
5. Khi chấm xong tất cả sinh viên, nhấn **Publish Scores**
6. Hệ thống gửi email thông báo kết quả cho sinh viên

---

## 4. API Endpoints liên quan

### Question Bank

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/sections` | GET | Lấy danh sách Section |
| `/api/sections` | POST | Tạo Section mới |
| `/api/sections/{id}` | GET | Chi tiết Section |
| `/api/sections/{id}` | PUT | Cập nhật Section |
| `/api/sections/{id}` | DELETE | Xóa Section |
| `/api/questions` | POST | Tạo câu hỏi |
| `/api/questions/{questionId}` | PUT | Cập nhật câu hỏi |
| `/api/questions/{questionId}` | DELETE | Xóa câu hỏi |

### Exam (Topic)

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/topics` | GET | Danh sách đề thi |
| `/api/topics` | POST | Tạo đề thi mới |
| `/api/topics/{id}` | GET | Chi tiết đề thi với sections |
| `/api/topics/{id}` | PUT | Cập nhật đề thi (tên, trạng thái) |
| `/api/topics/{id}` | DELETE | Xóa đề thi |
| `/api/topicsections/topic/{topicId}` | PUT | Gắn sections vào đề thi |

### Session & Grading

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/sessions` | POST | Tạo phiên thi |
| `/api/sessions/generate-key` | GET | Sinh Session Key |
| `/api/session-participants/{sessionId}` | GET | Danh sách thí sinh |
| `/api/session-requests/{sessionId}` | GET | Yêu cầu tham gia chờ duyệt |
| `/api/session-requests/{sessionId}/approve` | PATCH | Duyệt yêu cầu |
| `/api/grades/participants` | GET | Lấy bài thi cần chấm |
| `/api/grades/teacher-grade` | POST | Lưu điểm chấm |
| `/api/session-participants/publish-scores` | PUT | Công bố điểm |

### Excel

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/excel/export-template` | GET | Tải mẫu Excel |
| `/api/excel/import-excel` | POST | Import câu hỏi từ Excel |

---

## 5. Lưu ý quan trọng

- Đề thi phải ở trạng thái **Approved** mới có thể gắn vào phiên thi
- Không thể xóa Section đang được sử dụng trong Topic
- Không thể xóa Topic đang được sử dụng trong Session đang diễn ra
- Sau khi **Publish Scores**, hệ thống tự động gửi email cho sinh viên
- Kiểm tra kỹ đề thi trước khi Submit để tránh bị Reject
- Với phần Speaking, đảm bảo prompt rõ ràng để sinh viên hiểu yêu cầu
- Với phần Listening, upload audio chất lượng tốt (format mp3/wav)
- Session Key là duy nhất, cung cấp cho sinh viên để tham gia phiên thi
