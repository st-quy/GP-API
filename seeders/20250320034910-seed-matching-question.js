"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
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

    // Kiểm tra xem Part "PART 2: VOCABULARY" đã có chưa, nếu chưa thì tạo mới
    let partId = await queryInterface.rawSelect(
      "Parts",
      {
        where: { Content: "PART 2: VOCABULARY", TopicID: topicId },
      },
      ["ID"]
    );

    if (!partId) {
      partId = uuidv4();
      await queryInterface.bulkInsert(
        "Parts",
        [
          {
            ID: partId,
            Content: "PART 2: VOCABULARY",
            SubContent: "(Question 26-30: 25 questions)",
            TopicID: topicId, // Gán vào "Practice Test 2"
            Sequence: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        {}
      );
    }

    // Define the questions to be inserted
    const questions = [
      {
        ID: uuidv4(),
        Type: "matching",
        Content:
          "Select a word from the list that has the most similar meaning to the following words.",
        AnswerContent: JSON.stringify({
          title:
            "Select a word from the list that has the most similar meaning to the following words.",
          subTitle: "Example: big - large",
          leftItems: ["complain", "copy", "cut", "defeat", "disagree"],
          rightItems: [
            "slice",
            "ask",
            "praise",
            "duplicate",
            "hoard",
            "approve",
            "conquer",
            "argue",
            "object",
            "follow",
          ],
          correctAnswer: [
            { left: "complain", right: "object" },
            { left: "copy", right: "duplicate" },
            { left: "cut", right: "slice" },
            { left: "defeat", right: "conquer" },
            { left: "disagree", right: "argue" },
          ],
        }),
        Sequence: 26,
        PartID: partId,
        SkillID: skillId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ID: uuidv4(),
        Type: "matching",
        Content: "Complete each definition using a word from the list.",
        AnswerContent: JSON.stringify({
          leftItems: [
            "To place in the ground, cover up or hide is to",
            "To smash, split or fracture is to",
            "To raise, push higher or promote is to",
            "To show off about oneself is to",
            "To declare someone else responsible for a fault is to",
          ],
          rightItems: [
            "buy",
            "bother",
            "bury",
            "book",
            "boast",
            "boost",
            "blur",
            "break",
            "blame",
            "bear",
          ],
          correctAnswer: [
            {
              left: "To place in the ground, cover up or hide is to",
              right: "bury",
            },
            { left: "To smash, split or fracture is to", right: "break" },
            {
              left: "To raise, push higher or promote is to",
              right: "boost",
            },
            { left: "To show off about oneself is to", right: "boast" },
            {
              left: "To declare someone else responsible for a fault is to",
              right: "blame",
            },
          ],
        }),
        Sequence: 27,
        PartID: partId,
        SkillID: skillId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ID: uuidv4(),
        Type: "matching",
        Content: "Complete each sentence using a word from the list.",
        AnswerContent: JSON.stringify({
          leftItems: [
            "The witness's testimony was ____ and helped to build the case.",
            "The artist was known for her ____ and unique paintings.",
            "She was a ____ nurse and always put her patients first.",
            "The garden was ____ with a variety of exotic plants.",
            "He was able to explain the concept in a ____ and clear manner.",
          ],
          rightItems: [
            "cultivated",
            "complex",
            "capable",
            "concise",
            "compassionate",
            "comfortable",
            "confident",
            "creative",
            "careless",
            "credible",
          ],
          correctAnswer: [
            {
              left: "The witness's testimony was ____ and helped to build the case.",
              right: "credible",
            },
            {
              left: "The artist was known for her ____ and unique paintings.",
              right: "creative",
            },
            {
              left: "She was a ____ nurse and always put her patients first.",
              right: "compassionate",
            },
            {
              left: "The garden was ____ with a variety of exotic plants.",
              right: "cultivated",
            },
            {
              left: "He was able to explain the concept in a ____ and clear manner.",
              right: "concise",
            },
          ],
        }),
        Sequence: 28,
        PartID: partId,
        SkillID: skillId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ID: uuidv4(),
        Type: "matching",
        Content:
          "Select a word from the list that has the most similar meaning to the following words.",
        AnswerContent: JSON.stringify({
          leftItems: ["shore", "beginner", "child", "competition", "hatred"],
          rightItems: [
            "expert",
            "contest",
            "adult",
            "liking",
            "bravery",
            "learner",
            "coast",
            "toddler",
            "disgust",
            "courage",
          ],
          correctAnswer: [
            { left: "shore", right: "coast" },
            { left: "beginner", right: "learner" },
            { left: "child", right: "toddler" },
            { left: "competition", right: "contest" },
            { left: "hatred", right: "disgust" },
          ],
        }),
        Sequence: 29,
        PartID: partId,
        SkillID: skillId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ID: uuidv4(),
        Type: "matching",
        Content:
          "Select a word from the list that is most often used with the following words.",
        AnswerContent: JSON.stringify({
          leftItems: [
            "detention +",
            "black +",
            "baggage +",
            "convenience +",
            "driving +",
          ],
          rightItems: [
            "fire",
            "list",
            "manner",
            "promise",
            "store",
            "home",
            "license",
            "interest",
            "claim",
            "center",
          ],
          correctAnswer: [
            { left: "detention +", right: "center" },
            { left: "black +", right: "list" },
            { left: "baggage +", right: "claim" },
            { left: "convenience +", right: "store" },
            { left: "driving +", right: "license" },
          ],
        }),
        Sequence: 30,
        PartID: partId,
        SkillID: skillId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Insert questions if they do not already exist
    for (const question of questions) {
      const questionExists = await queryInterface.rawSelect(
        "Questions",
        {
          where: {
            Content: question.Content,
            PartID: partId,
            SkillID: skillId,
            Sequence: question.Sequence
          },
        },
        ["ID"]
      );

      if (!questionExists) {
        await queryInterface.bulkInsert("Questions", [question], {});
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Questions", { Type: "matching" }, {});
  },
};
