1. Tổng quan kiến trúc dữ liệu
1.1. Các thực thể chính

Skill
Đại diện cho kỹ năng: Speaking, Listening, Reading, Grammar, Writing.
Dùng để:

Gắn vào Question (mỗi câu hỏi thuộc một skill).

Quy định thứ tự phần trong đề (qua OrderIndex).

Part
Đại diện cho phân đoạn/bố cục chi tiết trong một skill (VD: Speaking Part 1, Part 2, Listening Part 3, …).

Topic
Đại diện cho một bộ đề hoặc một chủ đề thi (VD: “Mock Test 01”, “Unit 3 – Present Simple”).

TopicPart
Bảng liên kết Topic ↔ Part, mỗi dòng thể hiện:

“Trong Topic X sẽ có Part Y, và Part này dùng QuestionSet Z”

QuestionSet
Bộ câu hỏi cụ thể cho một TopicPart.
Ví dụ: “Mock Test 01 – Listening Part 1 – Question Set”.

QuestionSetQuestion
Bảng trung gian gắn QuestionSet ↔ Question, kèm thứ tự câu hỏi trong đề (Sequence).

Question
Ngân hàng câu hỏi (question bank), dùng lại được cho nhiều đề (nhiều QuestionSet).
Mỗi Question:

Thuộc 1 Skill

Thuộc 1 Part

Có thể thuộc 1 GroupID nếu là “câu con” trong một group speaking/reading (1 câu lớn – nhiều câu con).

1.2. Quan hệ giữa các bảng (tóm tắt)

Skill 1 - n Question

Part 1 - n Question

Topic n - n Part qua TopicPart

TopicPart n - 1 QuestionSet (mỗi Topic+Part tối đa 1 QuestionSet)

QuestionSet n - n Question qua QuestionSetQuestion

Dòng chảy khi build một đề thi theo Topic:

Lấy Topic

Lấy tất cả TopicPart của Topic đó

Từ mỗi TopicPart → lấy QuestionSet → lấy QuestionSetQuestion → lấy Question

Group theo Skill (và Skill.OrderIndex) để hiển thị theo thứ tự:
Speaking → Listening → Reading → Grammar → Writing

Áp dụng logic shuffle dựa theo flag trong QuestionSet.

2. Chi tiết từng model
2.1. Skill
Mục đích

Quản lý kỹ năng: Speaking, Listening, Reading, Grammar, Writing.

Xác định thứ tự xuất hiện của skill trong đề (qua OrderIndex).

Các trường chính
Field	Type	Mô tả
ID	UUID (PK)	Khóa chính
Name	STRING	Tên skill (VD: “Speaking”)
Code	STRING	Mã skill (VD: SPEAKING, LISTENING, …)
OrderIndex	INTEGER	Thứ tự hiển thị skill trong đề (1 → 5)
Quan hệ

Skill.hasMany(Question, { as: "Questions" })

Question.belongsTo(Skill, { as: "Skill" })

2.2. Part
Mục đích

Diễn tả phân đoạn chi tiết trong kỳ thi, gắn với cấu trúc bài (Part 1, Part 2,…).

Kết hợp với Topic để tạo TopicPart.

Các trường chính
Field	Type	Mô tả
ID	UUID (PK)	Khóa chính
Content	TEXT	Nội dung/miêu tả phần
SubContent	TEXT	Miêu tả phụ (optional)
Sequence	INTEGER	Thứ tự Part trong skill hoặc topic (nếu cần)
Quan hệ

Part.belongsToMany(Topic, through: TopicPart, as: "Topics")

Topic.belongsToMany(Part, through: TopicPart, as: "Parts")

Part.hasMany(Question)

Question.belongsTo(Part)

2.3. Topic
Mục đích

Đại diện cho một đề thi hoặc chủ đề (Topic) cụ thể.

Các trường chính
Field	Type	Mô tả
ID	UUID (PK)	Khóa chính
Name	STRING	Tên Topic/đề thi
Quan hệ

Topic.belongsToMany(Part, through: TopicPart, as: "Parts")

2.4. TopicPart
Mục đích

Liên kết một Topic với một Part.

Chỉ định QuestionSet nào sẽ được dùng cho Topic+Part đó.

Các trường chính
Field	Type	Mô tả
ID	UUID (PK)	Khóa chính
TopicID	UUID (FK)	Tham chiếu Topic.ID
PartID	UUID (FK)	Tham chiếu Part.ID
QuestionSetID	UUID (FK, nullable)	Tham chiếu QuestionSet.ID nếu đã gán bộ câu hỏi
Quan hệ

TopicPart.belongsTo(Topic)

TopicPart.belongsTo(Part)

TopicPart.belongsTo(QuestionSet, { as: "QuestionSet" })

QuestionSet.hasMany(TopicPart, { as: "TopicParts" })

2.5. QuestionSet
Mục đích

Đại diện cho một bộ câu hỏi dùng cho một TopicPart.

Chứa flag bật/tắt shuffle câu hỏi / đáp án.

Các trường chính
Field	Type	Mô tả
ID	UUID (PK)	Khóa chính
Name	STRING	Tên bộ câu hỏi (VD: “Mock Test 1 – Listening Part 1”)
Description	TEXT	Mô tả (optional)
ShuffleQuestions	BOOLEAN	Cho phép shuffle thứ tự câu hỏi (mặc định false)
ShuffleAnswers	BOOLEAN	Cho phép shuffle thứ tự đáp án trong mỗi câu (mặc định false)
Quan hệ

QuestionSet.belongsToMany(Question, through: QuestionSetQuestion, as: "Questions")

Question.belongsToMany(QuestionSet, through: QuestionSetQuestion, as: "QuestionSets")

QuestionSet.hasMany(TopicPart, { as: "TopicParts" })

2.6. QuestionSetQuestion
Mục đích

Bảng trung gian gắn QuestionSet ↔ Question.

Xác định thứ tự câu hỏi trong một bộ đề.

Các trường chính
Field	Type	Mô tả
ID	UUID (PK)	Khóa chính
QuestionSetID	UUID (FK)	Tham chiếu QuestionSet.ID
QuestionID	UUID (FK)	Tham chiếu Question.ID
Sequence	INTEGER	Thứ tự câu hỏi trong đề (khi ShuffleQuestions = false)
Ghi chú

Khi ShuffleQuestions = false ⇒ câu hỏi hiển thị theo Sequence tăng dần.

Khi ShuffleQuestions = true ⇒ backend sẽ shuffle, nhưng vẫn có thể dùng Sequence như thứ tự gốc.

2.7. Question
Mục đích

Ngân hàng câu hỏi (question bank).

Có thể dùng lại ở nhiều đề khác nhau (nhiều QuestionSet).

Hỗ trợ:

Gắn với Skill (Speaking/Listening/…)

Gắn với Part

GroupID để gom nhiều câu con thành 1 nhóm (đặc biệt cho Speaking/Reading multi-question).

Các trường chính
Field	Type	Mô tả
ID	UUID (PK)	Khóa chính
Type	STRING	Loại câu hỏi (MCQ, dropdown-list, speaking_sub, …)
AudioKeys	TEXT	Key/URL audio (nếu có)
ImageKeys	ARRAY(TEXT)	Danh sách key/URL hình ảnh (nếu có)
SkillID	UUID (FK)	Tham chiếu Skill.ID
PartID	UUID (FK)	Tham chiếu Part.ID
Sequence	INTEGER (nullable)	Thứ tự nội bộ trong group (nếu dùng), không dùng cho đề thi chính
Content	TEXT	Nội dung câu hỏi
SubContent	TEXT	Nội dung phụ (nếu cần)
GroupContent	JSON	Nội dung nhóm (VD: đoạn hội thoại, đoạn văn chung cho nhiều câu)
AnswerContent	JSON	Dữ liệu đáp án (options, correct answer, …)
GroupID	UUID (nullable)	Dùng để gom nhiều câu con thành 1 “câu lớn” (speaking/reading)
Ghi chú về GroupID

Nếu một “câu lớn” Speaking có 3 câu con:

Sẽ có 3 bản ghi Question khác nhau, cùng GroupID.

FE khi build đề:

Lấy danh sách Question trong một QuestionSet.

Group theo GroupID để hiển thị dạng block.

3. Hành vi shuffle (tóm tắt)
3.1. Shuffle câu hỏi

Điều khiển bởi QuestionSet.ShuffleQuestions:

false (mặc định):

Câu hỏi hiển thị theo QuestionSetQuestion.Sequence.

true:

Backend shuffle danh sách câu hỏi trong QuestionSet.

Nên shuffle theo group (dựa vào GroupID) để các câu cùng group không bị tách rời.

3.2. Shuffle đáp án

Điều khiển bởi QuestionSet.ShuffleAnswers:

false:

Đáp án hiển thị theo thứ tự lưu trong AnswerContent.options[].

true:

Backend shuffle mảng options trước khi gửi về FE.

Để chấm điểm, backend giữ thông tin mapping đáp án đúng theo index/id sau khi shuffle.

4. Flow build một đề thi (theo Topic) – high level

Input: TopicID

Lấy list TopicPart của Topic đó, include:

Part

QuestionSet → QuestionSetQuestion → Question → Skill

Gom tất cả data thành cấu trúc:

[
  {
    skillId,
    skillName,
    code,
    questions: [...] // đã sort theo Sequence + apply shuffle
  },
  ...
]


Sort skill theo Skill.OrderIndex để đảm bảo thứ tự:

Speaking → Listening → Reading → Grammar → Writing

Trả về FE, FE chỉ cần render theo thứ tự data đã nhận.