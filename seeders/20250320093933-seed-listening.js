"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { v4: uuidv4 } = require("uuid");

    // Kiểm tra xem Skill "LISTENING" đã có chưa
    const skillId = await queryInterface.rawSelect(
      "Skills",
      {
        where: { Name: "LISTENING" },
      },
      ["ID"]
    );

    if (!skillId) {
      throw new Error(
        'Skill "LISTENING" chưa được seed. Hãy chạy seed skill trước.'
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
        content: "Information recognition (13 questions)",
        subContent: "",
        Sequence: 1,
      },
      {
        content: "Information Matching (4 questions)",
        subContent: "",
        Sequence: 2,
      },
      {
        content: "Opinion Matching (4 questions)",
        subContent:
          "Listen to two people discussing community design. Read the opinions below and decide whose opinion matches the statements: the man, the woman, or both the man and the woman.",
        Sequence: 3,
      },
      {
        content: "Inference (2 talks - 4 questions)",
        subContent:
          "Listen to two long monologues and choose the correct answer for each question.",
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

    // Danh sách 25 câu hỏi multiple-choice
    const questions = [
      {
        content:
          "A mom is calling her son to remind him about picking up groceries. How much is an egg?",
        groupContent: {
          title:
            "A mom is calling her son to remind him about picking up groceries. How much is an egg?",
          audioKey: "",
        },
        options: ["£1.50", "£2.50", "£3.50"],
        correctAnswer: "£1.50",
        partID: partIds["Information recognition (13 questions)"],
        type: "multiple-choice",
        audioKeys: "https://10.25.80.12:9000/gp-bucket/Topic2/Part1/3341.mp3",
      },
      {
        content:
          "An author is talking about her daily routine. When does she usually write?",
        groupContent: {
          title:
            "An author is talking about her daily routine. When does she usually write?",
          audioKey: "",
        },
        options: ["In the mornings", "In the afternoons", "In the evenings"],
        correctAnswer: "In the afternoons",
        partID: partIds["Information recognition (13 questions)"],
        type: "multiple-choice",
        audioKeys: "https://10.25.80.12:9000/gp-bucket/Topic2/Part1/3342.mp3",
      },
      {
        content:
          "Jack is calling to invite a friend to his house. What color is Jack’s house?",
        groupContent: {
          title:
            "Jack is calling to invite a friend to his house. What color is Jack’s house?",
          audioKey: "",
        },
        options: ["Blue", "Purple", "Red"],
        correctAnswer: "Red",
        partID: partIds["Information recognition (13 questions)"],
        type: "multiple-choice",
        audioKeys: "https://10.25.80.12:9000/gp-bucket/Topic2/Part1/3343.mp3",
      },
      {
        content: "A man is calling his wife. Where will they meet?",
        groupContent: {
          title: "A man is calling his wife. Where will they meet?",
          audioKey: "",
        },
        options: ["At home", "In the garden", "Outside the shop"],
        correctAnswer: "Outside the shop",
        partID: partIds["Information recognition (13 questions)"],
        type: "multiple-choice",
        audioKeys: "https://10.25.80.12:9000/gp-bucket/Topic2/Part1/3344.mp3",
      },
      {
        content:
          "A man is talking about his eating habits. What time does he usually eat?",
        groupContent: {
          title:
            "A man is talking about his eating habits. What time does he usually eat?",
          audioKey: "",
        },
        options: ["6 o’clock", "7 o’clock", "8 o’clock"],
        correctAnswer: "7 o’clock",
        partID: partIds["Information recognition (13 questions)"],
        type: "multiple-choice",
        audioKeys: "https://10.25.80.12:9000/gp-bucket/Topic2/Part1/3345.mp3",
      },
      {
        content:
          "Julie is asking her professor about the assignment. When is the work due?",
        groupContent: {
          title:
            "Julie is asking her professor about the assignment. When is the work due?",
          audioKey: "",
        },

        options: [
          "On Thursday morning",
          "On Friday morning",
          "On Saturday morning",
        ],
        correctAnswer: "On Saturday morning",
        partID: partIds["Information recognition (13 questions)"],
        type: "multiple-choice",
        audioKeys: "https://10.25.80.12:9000/gp-bucket/Topic2/Part1/3346.mp3",
      },
      {
        content:
          "James is talking about his family members. In what way are his mother and his aunt alike?",
        groupContent: {
          title:
            "James is talking about his family members. In what way are his mother and his aunt alike?",
          audioKey: "",
        },

        options: [
          "They were both thin",
          "They both had blue eyes",
          "They both had long hair",
        ],
        correctAnswer: "They both had long hair",
        partID: partIds["Information recognition (13 questions)"],
        type: "multiple-choice",
        audioKeys: "https://10.25.80.12:9000/gp-bucket/Topic2/Part1/3348.mp3",
      },
      {
        content:
          "A tour guide is introducing a tourist destination. How many people live in the town?",
        groupContent: {
          title:
            "A tour guide is introducing a tourist destination. How many people live in the town?",
          audioKey: "",
        },
        options: ["8,000", "9,000", "10,000"],
        correctAnswer: "10,000",
        partID: partIds["Information recognition (13 questions)"],
        type: "multiple-choice",
        audioKeys: "https://10.25.80.12:9000/gp-bucket/Topic2/Part1/3349.mp3",
      },
      {
        content:
          "A man and a woman are talking about their old school days. What was the man's favorite thing about school?",
        groupContent: {
          title:
            "A man and a woman are talking about their old school days. What was the man's favorite thing about school?",
          audioKey: "",
        },
        options: ["Math classes", "Geography classes", "History classes"],
        correctAnswer: "History classes",
        partID: partIds["Information recognition (13 questions)"],
        type: "multiple-choice",
        audioKeys: "https://10.25.80.12:9000/gp-bucket/Topic2/Part1/3350.mp3",
      },
      {
        content:
          "Jorge is calling his friend about their plan for the weekend. What time does the football match start?",
        groupContent: {
          title:
            "Jorge is calling his friend about their plan for the weekend. What time does the football match start?",
          audioKey: "",
        },
        options: ["11 p.m", "1 p.m", "6 p.m"],
        correctAnswer: "6 p.m",
        partID: partIds["Information recognition (13 questions)"],
        type: "multiple-choice",
        audioKeys: "https://10.25.80.12:9000/gp-bucket/Topic2/Part1/3351.mp3",
      },
      {
        content:
          "A man is talking about his routine after work. What is he going to do after work?",
        groupContent: {
          title:
            "A man is talking about his routine after work. What is he going to do after work?",
          audioKey: "",
        },
        options: ["Goes running", "Cycles home", "Meets his client"],
        correctAnswer: "Cycles home",
        partID: partIds["Information recognition (13 questions)"],
        type: "multiple-choice",
        audioKeys: "https://10.25.80.12:9000/gp-bucket/Topic2/Part1/3352.mp3",
      },
      {
        content:
          "A professor is talking to his student. What does the professor ask his student to do?",
        groupContent: {
          title:
            "A professor is talking to his student. What does the professor ask his student to do?",
          audioKey: "",
        },
        options: [
          "Speak at a conference",
          "Write another thesis",
          "Tutor another student",
        ],
        correctAnswer: "Speak at a conference",
        partID: partIds["Information recognition (13 questions)"],
        type: "multiple-choice",
        audioKeys: "https://10.25.80.12:9000/gp-bucket/Topic2/Part1/3353.mp3",
      },
      {
        content:
          "Two friends are talking about their favorite activities. What is the woman's favorite form of entertainment?",
        groupContent: {
          title:
            "Two friends are talking about their favorite activities. What is the woman's favorite form of entertainment?",
          audioKey: "",
        },
        options: [
          "Reading books",
          "Going to the theatre",
          "Playing chess with her cousin",
        ],
        correctAnswer: "Going to the theatre",
        partID: partIds["Information recognition (13 questions)"],
        type: "multiple-choice",
        audioKeys: "https://10.25.80.12:9000/gp-bucket/Topic2/Part1/3354.mp3",
      },
      {
        content:
          "Four people are talking about travelling to work. Complete the sentences below.",
        groupContent: {
          title:
            "Four people are talking about travelling to work. Complete the sentences below.",
          audioKey: "",
        },
        leftItems: [
          "Speaker A mainly _____.",
          "Speaker B usually _____.",
          "Speaker C usually _____.",
          "Speaker D primarily _____.",
        ],
        rightItems: [
          "travels by car",
          "walks alone",
          "travels by bike",
          "travels by bus",
          "walks with a friend",
          "walks with their mother",
        ],
        correctAnswer: [
          {
            key: "Speaker A mainly _____.",
            value: "travels by bus",
          },
          {
            key: "Speaker B usually _____.",
            value: "travels by car",
          },
          {
            key: "Speaker C usually _____.",
            value: "walks alone",
          },
          {
            key: "Speaker D primarily _____.",
            value: "walks with a friend",
          },
        ],
        partID: partIds["Information Matching (4 questions)"],
        type: "dropdown-list",
        audioKeys: "https://10.25.80.12:9000/gp-bucket/Topic2/Part2.mp3",
      },
      {
        content:
          "Listen to two people discussing music. Read the opinions below and decide whose opinion matches the statements: the man, the woman, or both the man and the woman.",
        groupContent: {
          title:
            "Listen to two people discussing music. Read the opinions below and decide whose opinion matches the statements: the man, the woman, or both the man and the woman.",
          audioKey: "",
        },
        leftItems: [
          "Building design can influence people's behavior.",
          "Creating community can take time.",
          "Work communities and social communities are the same.",
          "Technology has changed how community forms.",
        ],
        rightItems: ["Man", "Woman", "Both"],
        correctAnswer: [
          {
            key: "Building design can influence people's behavior.",
            value: "Both",
          },
          {
            key: "Creating community can take time.",
            value: "Woman",
          },
          {
            key: "Work communities and social communities are the same.",
            value: "Man",
          },
          {
            key: "Technology has changed how community forms.",
            value: "Both",
          },
        ],
        partID: partIds["Opinion Matching (4 questions)"],
        type: "dropdown-list",
        audioKeys: "https://10.25.80.12:9000/gp-bucket/Topic2/Part3.mp3",
      },
      {
        content:
          "Listen to an expert giving a talk about managing financial spending",
        groupContent: {
          title:
            "Listen to an expert giving a talk about managing financial spending",
          audioKey: "",
          listContent: [
            {
              ID: 1,
              content:
                "How does the speaker recommend saving money effectively?",
              options: [
                "Saving a large amount only on a daily basis.",
                "Organizing their resources more effectively.",
                "Use credit cards to manage expenses.",
              ],
              type: "multiple-choice",
              correctAnswer: "Organizing their resources more effectively.",
              partID: partIds["Inference (2 talks - 4 questions)"],
            },
            {
              ID: 2,
              content:
                "Who does the speaker believe can save money most successfully?",
              options: [
                "Get advice from people that have experience.",
                "Keep all your savings in a single account.",
                "Avoid making any long-term financial plans.",
              ],
              type: "multiple-choice",
              correctAnswer: "Get advice from people that have experience.",
              partID: partIds["Inference (2 talks - 4 questions)"],
            },
          ],
        },
        partID: partIds["Inference (2 talks - 4 questions)"],
        type: "listening-questions-group",
        audioKeys: "https://10.25.80.12:9000/gp-bucket/Topic2/Part4/1.mp3",
      },
      {
        content:
          "Listen to an person sharing their opinion about security cameras",
        groupContent: {
          title:
            "Listen to an person sharing their opinion about security cameras",
          audioKey: "",
          listContent: [
            {
              ID: 1,
              content:
                "What is the speaker’s opinion about security cameras at work?",
              options: [
                "People are unnecessarily worried about them.",
                "Most people don't even realize cameras are present.",
                "Cameras should be placed to ensure complete coverage.",
              ],
              type: "multiple-choice",
              correctAnswer: "People are unnecessarily worried about them.",
              partID: partIds["Inference (2 talks - 4 questions)"],
            },
            {
              ID: 2,
              content:
                "How does the speaker suggest people should feel about security cameras at work?",
              options: [
                "People often find them intimidating and invasive",
                "Many believe they are only useful after incidents have occurred.",
                "People should feel reassured about their presence.",
              ],
              type: "multiple-choice",
              correctAnswer:
                "People should feel reassured about their presence.",
              partID: partIds["Inference (2 talks - 4 questions)"],
            },
          ],
        },
        partID: partIds["Inference (2 talks - 4 questions)"],
        type: "listening-questions-group",
        audioKeys: "https://10.25.80.12:9000/gp-bucket/Topic2/Part4/2.mp3",
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
            Sequence: questions.indexOf(q) + 1,
            PartID: q.partID,
            SkillID: skillId,
            createdAt: new Date(),
            updatedAt: new Date(),
            AudioKeys: q.audioKeys,
          },
        ]);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Questions", {
      PartID: Sequelize.col("ID"),
    });
    await queryInterface.bulkDelete("Parts", {
      Content: "Information recognition (13 questions)",
    });
    await queryInterface.bulkDelete("Topics", { Name: "Practice Test 2" }, {});
  },
};
