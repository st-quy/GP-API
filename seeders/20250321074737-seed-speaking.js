"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { v4: uuidv4 } = require("uuid");

    // Kiểm tra xem Skill "SPEAKING" đã có chưa
    const skillId = await queryInterface.rawSelect(
      "Skills",
      {
        where: { Name: "SPEAKING" },
      },
      ["ID"]
    );

    if (!skillId) {
      throw new Error(
        'Skill "SPEAKING" chưa được seed. Hãy chạy seed skill trước.'
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
      topicId = uuidv4();
      await queryInterface.bulkInsert(
        "Topics",
        [
          {
            ID: topicId,
            Name: "Practice Test 2",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        {}
      );
    }

    // Function to check if a part already exists
    async function partExists(content, topicId) {
      return await queryInterface.rawSelect(
        "Parts",
        {
          where: { Content: content, TopicID: topicId },
        },
        ["ID"]
      );
    }

    const parts = [
      {
        content: "PART 1",
        subContent: "",
        Sequence: 1,
      },
      {
        content: "PART 2",
        subContent: "",
        Sequence: 2,
      },
      {
        content: "PART 3",
        subContent: "",
        Sequence: 3,
      },
      {
        content: "PART 4",
        subContent: "",
        Sequence: 4,
      },
    ];

    const partIds = {};

    for (const part of parts) {
      if (!(await partExists(part.content, topicId))) {
        const partId = uuidv4();
        await queryInterface.bulkInsert("Parts", [
          {
            ID: partId,
            Content: part.content,
            SubContent: part.subContent,
            TopicID: topicId, // Gán vào "Practice Test 2"
            Sequence: part.Sequence,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
        partIds[part.content] = partId;
      } else {
        partIds[part.content] = await queryInterface.rawSelect(
          "Parts",
          {
            where: { Content: part.content, TopicID: topicId },
          },
          ["ID"]
        );
      }
    }

    const questions = [
      {
        content: "Describe your journey here today.",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds["PART 1"],
        type: "speaking",
        imageKeys: null,
      },
      {
        content: "Tell me about your favourite season.",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds["PART 1"],
        type: "speaking",
        imageKeys: null,
      },
      {
        content: "Describe a typical meal of your country.",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds["PART 1"],
        type: "speaking",
        imageKeys: null,
      },
      {
        content: "Describe the picture",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds["PART 2"],
        type: "speaking",
        imageKeys: [
          "https://10.25.80.12:9000/gp-bucket/Topic2/ImageTopic2/2.png",
        ],
      },
      {
        content: "Tell me about the last time you went shopping for clothes.",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds["PART 2"],
        type: "speaking",
        imageKeys: [
          "https://10.25.80.12:9000/gp-bucket/Topic2/ImageTopic2/2.png",
        ],
      },
      {
        content: "Why do some people dislike going shopping for clothes?",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds["PART 2"],
        type: "speaking",
        imageKeys: [
          "https://10.25.80.12:9000/gp-bucket/Topic2/ImageTopic2/2.png",
        ],
      },
      {
        content: "Describe two pictures",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds["PART 3"],
        type: "speaking",
        imageKeys: [
          "https://10.25.80.12:9000/gp-bucket/Topic2/ImageTopic2/3.png",
        ],
      },
      {
        content: "Why is it appealing to eat at different places?",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds["PART 3"],
        type: "speaking",
        imageKeys: [
          "https://10.25.80.12:9000/gp-bucket/Topic2/ImageTopic2/3.png",
        ],
      },
      {
        content: "Where do people like to eat on special occasions?",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds["PART 3"],
        type: "speaking",
        imageKeys: [
          "https://10.25.80.12:9000/gp-bucket/Topic2/ImageTopic2/3.png",
        ],
      },
      {
        content:
          "Describe a time when you put a lot of effort to do something.",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds["PART 4"],
        type: "speaking",
        imageKeys: [
          "https://10.25.80.12:9000/gp-bucket/Topic2/ImageTopic2/4.png",
        ],
      },
      {
        content: "How did you feel when you completed it?",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds["PART 4"],
        type: "speaking",
        imageKeys: [
          "https://10.25.80.12:9000/gp-bucket/Topic2/ImageTopic2/4.png",
        ],
      },
      {
        content:
          "Do you think it is important to make a plan before doing something important?",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds["PART 4"],
        type: "speaking",
        imageKeys: [
          "https://10.25.80.12:9000/gp-bucket/Topic2/ImageTopic2/4.png",
        ],
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
        await queryInterface.bulkInsert("Questions", [
          {
            ID: uuidv4(),
            Type: q.type,
            Content: q.content,
            AnswerContent: JSON.stringify(q),
            GroupContent: JSON.stringify(q.groupContent),
            PartID: q.partID,
            SkillID: skillId,
            Sequence: questions.indexOf(q) + 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            ImageKeys: q.imageKeys,
          },
        ]);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Questions", {
      PartID: Sequelize.col("ID"),
    });
    await queryInterface.bulkDelete("Parts", { Content: "PART 1: GRAMMAR" });
    await queryInterface.bulkDelete("Topics", { Name: "Practice Test 2" }, {});
  },
};
