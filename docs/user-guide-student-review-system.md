# Hướng dẫn Sinh viên - Hệ thống Xem lại bài thi (Review System)

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Quy trình thi và xem kết quả](#2-quy-trình-thi-và-xem-kết-quả)
3. [Hướng dẫn chi tiết](#3-hướng-dẫn-chi-tiết)
4. [API Endpoints liên quan](#4-api-endpoints-liên-quan)
5. [Câu hỏi thường gặp](#5-câu-hỏi-thường-gặp)

---

## 1. Tổng quan

Hệ thống Review cho phép sinh viên:
- Tham gia phiên thi APTIS trực tuyến
- Nộp bài thi gồm 5 kỹ năng
- Xem lại kết quả chi tiết từng kỹ năng sau khi giảng viên công bố điểm
- Xem nhận xét (feedback) từ giảng viên cho phần Speaking và Writing

### Cấu trúc bài thi APTIS

| # | Kỹ năng | Dạng câu hỏi | Ghi chú |
|---|---------|--------------|---------|
| 1 | Speaking | Ghi âm trả lời 3 phần | Cần microphone |
| 2 | Listening | Nghe audio + trả lời | Cần tai nghe |
| 3 | Grammar & Vocabulary | Trắc nghiệm, nối cặp | Chọn đáp án |
| 4 | Reading | Dropdown, matching, ordering | Đọc đoạn văn |
| 5 | Writing | Viết bài luận | Theo dõi số từ |

---

## 2. Quy trình thi và xem kết quả

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Đăng nhập │──▶│ Tham gia  │──▶│ Làm bài  │──▶│ Nộp bài  │──▶│ Xem kết  │
│           │   │ phiên thi │   │ thi      │   │          │   │ quả      │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                     │                               │               │
                     ▼                               ▼               ▼
              Nhập Session Key              Hệ thống lưu       Sau khi GV
              Chờ GV duyệt                 câu trả lời        Publish Scores
```

---

## 3. Hướng dẫn chi tiết

### 3.1 Đăng nhập

1. Truy cập hệ thống **GP-Student**
2. Nhập email và mật khẩu
3. Nhấn **Đăng nhập**

**Quên mật khẩu?**
1. Nhấn **Quên mật khẩu** ở trang đăng nhập
2. Nhập email đã đăng ký
3. Kiểm tra email và nhấn link đặt lại mật khẩu
4. Nhập mật khẩu mới

### 3.2 Tham gia phiên thi

1. Sau khi đăng nhập, nhập **Session Key** do giảng viên cung cấp
2. Hệ thống gửi yêu cầu tham gia
3. Chờ giảng viên **Approve** yêu cầu
4. Sau khi được duyệt, bắt đầu làm bài

### 3.3 Làm bài thi

#### Speaking (Nói)
1. Đọc hướng dẫn ở trang giới thiệu
2. **Kiểm tra microphone** - đảm bảo trình duyệt đã cho phép
3. Thực hiện 3 phần:
   - **Part 1**: Trả lời câu hỏi ngắn về bản thân
   - **Part 2**: Mô tả, so sánh theo hình ảnh/chủ đề
   - **Part 3**: Thảo luận chủ đề chuyên sâu
4. Nhấn nút **Ghi âm** → Trả lời → Nhấn **Dừng**
5. Bản ghi âm được tự động upload lên hệ thống

#### Listening (Nghe)
1. Đọc hướng dẫn
2. **Kiểm tra tai nghe** - đảm bảo nghe rõ
3. Nghe audio và trả lời câu hỏi (matching, trắc nghiệm, dictation)
4. Chuyển câu bằng thanh điều hướng

#### Grammar & Vocabulary (Ngữ pháp & Từ vựng)
1. Đọc hướng dẫn
2. Trả lời câu hỏi trắc nghiệm
3. Sử dụng navigator để di chuyển giữa các câu
4. Có thể quay lại câu đã trả lời để sửa

#### Reading (Đọc hiểu)
1. Đọc hướng dẫn
2. Đọc đoạn văn và trả lời:
   - **Dropdown**: Chọn từ điền vào chỗ trống
   - **Matching**: Nối thông tin với đáp án đúng
   - **Ordering**: Sắp xếp câu/đoạn theo thứ tự đúng

#### Writing (Viết)
1. Đọc hướng dẫn và đề bài
2. Viết bài trong ô soạn thảo
3. Theo dõi **số từ** hiển thị bên dưới
4. Chú ý thời gian còn lại

### 3.4 Nộp bài

1. Sau khi hoàn thành 5 phần, trang tổng kết hiển thị
2. Kiểm tra các phần đã hoàn thành
3. Nhấn **Nộp bài**
4. Hệ thống xác nhận và gửi email thông báo

### 3.5 Xem kết quả (Review System)

Sau khi giảng viên chấm điểm và **Publish Scores**:

1. Đăng nhập vào hệ thống
2. Vào trang **Lịch sử thi** / **Exam History**
3. Chọn phiên thi muốn xem
4. Xem kết quả chi tiết:

#### Bảng điểm tổng quan

| Kỹ năng | Điểm | Cấp độ CEFR |
|---------|------|-------------|
| Speaking | XX/100 | A1-C2 |
| Listening | XX/100 | A1-C2 |
| Reading | XX/100 | A1-C2 |
| Grammar & Vocabulary | XX/100 | A1-C2 |
| Writing | XX/100 | A1-C2 |
| **Tổng** | **XX/100** | **XX** |

#### Xem chi tiết từng kỹ năng

**Grammar & Vocabulary / Listening / Reading:**
- Xem lại từng câu hỏi
- Xem đáp án đã chọn vs đáp án đúng
- Điểm chấm tự động

**Speaking:**
- Nghe lại bản ghi âm của mình
- Xem nhận xét (comment) từ giảng viên
- Điểm giảng viên chấm

**Writing:**
- Đọc lại bài viết đã nộp
- Xem nhận xét (comment) từ giảng viên
- Điểm giảng viên chấm

#### Cấp độ CEFR

| Cấp độ | Mô tả |
|--------|-------|
| A1 | Người mới bắt đầu |
| A2 | Sơ cấp |
| B1 | Trung cấp |
| B2 | Trung cấp cao |
| C1 | Nâng cao |
| C2 | Thành thạo |

---

## 4. API Endpoints liên quan

### Tham gia phiên thi

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/session-requests` | POST | Gửi yêu cầu tham gia (gửi sessionKey + UserID) |
| `/api/session-requests/{sessionId}/student/{studentId}` | GET | Kiểm tra trạng thái yêu cầu |

### Nộp bài

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/student-answer-draft` | POST | Lưu nháp câu trả lời (tự động) |
| `/api/student-answers` | POST | Nộp bài thi chính thức |
| `/api/presigned-url` | GET | Lấy URL upload file audio (Speaking) |

### Xem kết quả

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/session-participants/user/{userId}` | GET | Lấy lịch sử thi của sinh viên |
| `/api/session-participants/detail/{participantId}` | GET | Chi tiết kết quả 1 phiên thi |
| `/api/grades/review/{sessionParticipantId}` | GET | Xem chi tiết bài thi: câu hỏi, đáp án, điểm, nhận xét |

### Tài khoản

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/users/login` | POST | Đăng nhập |
| `/api/users/forgot-password` | POST | Quên mật khẩu |
| `/api/users/reset-password` | POST | Đặt lại mật khẩu |
| `/api/users/{userId}` | GET | Xem thông tin cá nhân |
| `/api/users/{userId}` | PUT | Cập nhật thông tin |
| `/api/users/{userId}/change-password` | POST | Đổi mật khẩu |

---

## 5. Câu hỏi thường gặp

**Q: Tôi không nhận được email kết quả?**
A: Kết quả chỉ được gửi khi giảng viên nhấn "Publish Scores". Liên hệ giảng viên để biết thời gian công bố.

**Q: Microphone không hoạt động trong phần Speaking?**
A: Kiểm tra:
- Trình duyệt đã cho phép quyền sử dụng microphone
- Microphone đang hoạt động (thử với ứng dụng khác)
- Sử dụng trình duyệt Chrome hoặc Firefox (khuyến nghị)

**Q: Bài thi bị gián đoạn, dữ liệu có mất không?**
A: Hệ thống tự động lưu nháp câu trả lời. Khi kết nối lại và truy cập lại phiên thi, bài thi sẽ được khôi phục.

**Q: Tôi có thể làm lại bài thi không?**
A: Không thể làm lại bài thi đã nộp. Giảng viên có thể tạo phiên thi mới nếu cần.

**Q: Điểm tổng được tính như thế nào?**
A: Điểm Grammar, Listening, Reading được chấm tự động. Điểm Speaking và Writing do giảng viên chấm thủ công. Cấp độ CEFR được xác định dựa trên điểm tổng.

**Q: Tôi muốn xem lại bài ghi âm của mình?**
A: Vào trang kết quả → Chọn phiên thi → Tab Speaking → Nhấn nút play để nghe lại.

**Q: Session Key ở đâu?**
A: Giảng viên sẽ cung cấp Session Key qua lớp học hoặc email. Mỗi phiên thi có 1 key duy nhất.
