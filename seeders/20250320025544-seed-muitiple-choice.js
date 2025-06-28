"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { v4: uuidv4 } = require("uuid");

    // Kiểm tra xem Skill "GRAMMAR AND VOCABULARY" đã có chưa
    const skillId = await queryInterface.rawSelect(
      "Skills",
      {
        where: { Name: "GRAMMAR AND VOCABULARY" },
      },
      ["ID"]
    );

    if (!skillId) {
      throw new Error(
        'Skill "GRAMMAR AND VOCABULARY" chưa được seed. Hãy chạy seed skill trước.'
      );
    }

    // Kiểm tra xem Topic "Practice Test 2" đã có chưa, nếu chưa thì tạo mới
    let topicId = await queryInterface.rawSelect(
      "Topics",
      {
        where: { Name: "Practice Test 2" },
      },
      ["ID"]
    );

    if (!topicId) {
      const newTopicId = "ef6b69aa-2ec2-4c65-bf48-294fd12e13fc";
      await queryInterface.bulkInsert(
        "Topics",
        [
          {
            ID: newTopicId,
            Name: "Practice Test 2",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        {}
      );
      topicId = newTopicId;
    }

    // Tạo Part "PART 1: GRAMMAR" liên kết với Topic này
    const partId = uuidv4();
    await queryInterface.bulkInsert(
      "Parts",
      [
        {
          ID: partId,
          Content: "PART 1: GRAMMAR",
          SubContent: "Question 1-25",
          Sequence: 1,
          TopicID: topicId, // Gán vào "Practice Test 2"
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );

    // Danh sách 25 câu hỏi multiple-choice
    const questions = [
      {
        content:
          "I wish I ____ a better grade on the final exam last semester.",
        options: ["got", "would get", "had gotten"],
        correctAnswer: "had gotten",
      },
      {
        content: "I have _____ apples in my bag.",
        options: ["a little", "a few", "much"],
        correctAnswer: "a few",
      },
      {
        content: "I am going ____ the park.",
        options: ["to", "on", "in"],
        correctAnswer: "to",
      },
      {
        content: "I ____ my homework every day.",
        options: ["do", "does", "am doing"],
        correctAnswer: "do",
      },
      {
        content: "If I ____ enough money, I would buy a new car.",
        options: ["have", "had", "will have"],
        correctAnswer: "had",
      },
      {
        content: "I ____ go to the party if I finish my work on time.",
        options: ["shall", "could", "should"],
        correctAnswer: "shall",
      },
      {
        content: "I ____ play basketball when I was younger.",
        options: ["used to", "would", "should have"],
        correctAnswer: "used to",
      },
      {
        content: "The teacher asked the students ____ their homework.",
        options: ["to", "doing", "to do"],
        correctAnswer: "to do",
      },
      {
        content: "____ I am tired, I will still go to the gym.",
        options: ["Although", "Therefore", "On the other hand"],
        correctAnswer: "Although",
      },
      {
        content:
          "Anna: Did you enjoy the concert last night?\nShara: ____, it was amazing!",
        options: ["By the way", "Definitely", "Meanwhile"],
        correctAnswer: "Definitely",
      },
      {
        content: "I will wait for you ____ you finish your work.",
        options: ["until", "then", "during"],
        correctAnswer: "until",
      },
      {
        content:
          "I ____ have gone to the concert last night if I had known about it.",
        options: ["would", "should", "must"],
        correctAnswer: "would",
      },
      {
        content: "I ____ to finish my homework before I watch TV.",
        options: ["should", "must", "have"],
        correctAnswer: "have",
      },
      {
        content: "I ____ my laundry right now.",
        options: ["am doing", "am going to do", "will do"],
        correctAnswer: "am doing",
      },
      {
        content: "I am going to the store ____ buy some groceries.",
        options: ["for", "that", "to"],
        correctAnswer: "to",
      },
      {
        content:
          "Peter: What time is it?\nMary: ____, I forgot my watch at home.",
        options: ["Luckily", "Unfortunately", "Absolutely"],
        correctAnswer: "Unfortunately",
      },
      {
        content: "I ____ my laundry for two hours when you called me.",
        options: ["was doing", "have been doing", "had been doing"],
        correctAnswer: "had been doing",
      },
      {
        content:
          "I ____ have taken my umbrella if I had known it was going to rain.",
        options: ["would", "must", "have to"],
        correctAnswer: "would",
      },
      {
        content: "I will meet you ____ the park at 4 p.m.",
        options: ["on", "in", "at"],
        correctAnswer: "at",
      },
      {
        content: "How often do you ____ to the gym?",
        options: ["go", "goes", "going"],
        correctAnswer: "go",
      },
      {
        content: "I ____ my homework before I went to bed last night.",
        options: ["had finished", "have finished", "has finished"],
        correctAnswer: "had finished",
      },
      {
        content: "I ____ my housework every Saturday.",
        options: ["do", "does", "am doing"],
        correctAnswer: "do",
      },
      {
        content: "You ____ have brought an umbrella because we went by car.",
        options: ["shouldn't", "needn't", "must"],
        correctAnswer: "needn't",
      },
      {
        content: "Lan's mother is ____ than Nga's mother.",
        options: ["taller", "more tall", "more taller"],
        correctAnswer: "taller",
      },
      {
        content: "If you hadn't arrived late, she ____ married now.",
        options: ["wouldn't get", "would have got", "hadn't got"],
        correctAnswer: "wouldn't get",
      },
    ];

    // Seed danh sách câu hỏi
    for (const q of questions) {
      const existingQuestion = await queryInterface.rawSelect(
        "Questions",
        {
          where: { Content: q.content },
        },
        ["ID"]
      );

      if (!existingQuestion) {
        await queryInterface.bulkInsert(
          "Questions",
          [
            {
              ID: uuidv4(),
              Type: "multiple-choice",
              Content: q.content,
              AnswerContent: JSON.stringify(
                {
                  title: q.content,
                  options: [
                    { key: "A", value: q.options[0] },
                    { key: "B", value: q.options[1] },
                    { key: "C", value: q.options[2] },
                  ],
                  correctAnswer: q.correctAnswer,
                },
              ),
              Sequence: questions.indexOf(q) + 1,
              PartID: partId,
              SkillID: skillId,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          {}
        );
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "Questions",
      { PartID: Sequelize.col("ID") },
      {}
    );
    await queryInterface.bulkDelete(
      "Parts",
      { Content: "PART 1: GRAMMAR" },
      {}
    );
    await queryInterface.bulkDelete("Topics", { Name: "Practice Test 2" }, {});
  },
};
