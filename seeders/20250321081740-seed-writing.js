"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { v4: uuidv4 } = require("uuid");

    // Kiểm tra xem Skill "WRITING" đã có chưa
    const skillId = await queryInterface.rawSelect(
      "Skills",
      {
        where: { Name: "WRITING" },
      },
      ["ID"]
    );

    if (!skillId) {
      throw new Error(
        'Skill "WRITING" chưa được seed. Hãy chạy seed skill trước.'
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
      await queryInterface.bulkInsert("Topics", [
        {
          ID: topicId,
          Name: "Practice Test 2",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
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
        ID: 1,
        content:
          "Part 1: You want to join the beautiful homes club. You have 5 messages from a member of the club. Write short answers (1 – 5 words) to each message. Recommended time: 3 minutes.",
        subContent:
          "* (You’re allowed to write up to 10 words without affecting your grade).",
        Sequence: 1,
      },
      {
        ID: 2,
        content:
          "Part 2: You are a new member of the beautiful homes club. Fill in the form. Write sentences. Use 20 – 30 words. Recommended time: 7 minutes.",
        subContent:
          "* (You’re allowed to write up to 45 words without affecting your grade).",
        Sequence: 2,
      },
      {
        ID: 3,
        content:
          "Part 3: You are a member of the beautiful homes club. You are talking to some members in the club’s chat room. Talk to them using sentences. Use 30 – 40 words per answer. Recommended time: 10 minutes.",
        subContent:
          "* (You’re allowed to write up to 60 words without affecting your grade).",
        Sequence: 3,
      },
      {
        ID: 4,
        content:
          "Part 4: You are a member of the beautiful homes club. You received this email from the club president.",
        subContent: `Dear members,
It has been reported that maintaining old buildings is expensive, and they take up a lot of space. These buildings may no longer be safe. The government is suggesting that these old buildings should be demolished and replaced with modern apartment buildings. This would help create more housing and improve the overall look of the city. We would like to hear your suggestions on this.`,
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
        partIds[part.ID] = partId;
      } else {
        partIds[part.ID] = await queryInterface.rawSelect(
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
        content: "What time of day do you like most?",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds[1],
        type: "writing",
        imageKeys: [],
      },
      {
        content: "Where do you often meet your friends?",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds[1],
        type: "writing",
        imageKeys: [],
      },
      {
        content: "What did you do last night at home?",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds[1],
        type: "writing",
        imageKeys: [],
      },
      {
        content: "What kind of accommodation do you live in now?",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds[1],
        type: "writing",
        imageKeys: [],
      },
      {
        content: "Which part of the house would you like to change?",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds[1],
        type: "writing",
        imageKeys: [],
      },
      {
        content: "Please write about your ideal house.",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds[2],
        type: "writing",
        imageKeys: [],
      },
      {
        content:
          "Hannah: Hi! Welcome to the club. I really enjoy watching TV programs about houses. How about you? Are you interested in these programs?",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds[3],
        type: "writing",
        imageKeys: [],
      },
      {
        content:
          "Jack: Hello! Have you ever had any problems with your neighbors?",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds[3],
        type: "writing",
        imageKeys: [],
      },
      {
        content:
          "Nira: Welcome! Houses should be built in a way that is environmentally friendly. Do you agree?",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds[3],
        type: "writing",
        imageKeys: [],
      },
      {
        content:
          "Write an email to your friend. Share your thoughts on this piece of news and your suggestions. Write about 50 words. Recommended time: 10 minutes.",
        subContent:
          "* (You’re allowed to write up to 75 words without affecting your grade).",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds[4],
        type: "writing",
        imageKeys: [],
      },
      {
        content:
          "Write an email to the club president. Express your feelings about this piece of news and your suggestions. Write about 120-150 words. Recommended time: 20 minutes.",
        subContent:
          "* (You’re allowed to write up to 225 words without affecting your grade).",
        groupContent: null,
        options: null,
        correctAnswer: null,
        partID: partIds[4],
        type: "writing",
        imageKeys: [],
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
            Content: q.content ? q.content : "",
            SubContent: q.subContent ? q.subContent : "",
            AnswerContent: q.correctAnswer ? JSON.stringify(q) : null,
            GroupContent: q.groupContent
              ? JSON.stringify(q.groupContent)
              : null,
            Sequence: questions.indexOf(q) + 1,
            PartID: q.partID,
            SkillID: skillId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Questions", {
      PartID: Sequelize.col("ID"),
    });
    await queryInterface.bulkDelete(
      "Parts",
      {
        Content:
          "Part 1: You want to join the beautiful homes club. You have 5 messages from a member of the club. Write short answers (1 – 5 words) to each message. Recommended time: 3 minutes.",
      },
      {
        Content:
          "Part 2: You are a new member of the beautiful homes club. Fill in the form. Write sentences. Use 20 – 30 words. Recommended time: 7 minutes.",
      },
      {
        Content:
          "Part 3: You are a member of the beautiful homes club. You are talking to some members in the club’s chat room. Talk to them using sentences. Use 30 – 40 words per answer. Recommended time: 10 minutes.",
      },
      {
        Content:
          "Part 4: You are a member of the beautiful homes club. You received this email from the club president.",
      }
    );
    await queryInterface.bulkDelete("Topics", { Name: "Practice Test 2" });
  },
};
