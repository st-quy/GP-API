"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { v4: uuidv4 } = require("uuid");

    // Kiểm tra xem Skill "APTIS READING" đã có chưa
    const skillId = await queryInterface.rawSelect(
      "Skills",
      {
        where: { Name: "READING" },
      },
      ["ID"]
    );

    if (!skillId) {
      throw new Error(
        'Skill "READING" chưa được seed. Hãy chạy seed skill trước.'
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

    // Tạo Part "Part 1 - Choose one word from the list for each gap." liên kết với Topic này
    const partId1 = uuidv4();
    const partId2a = uuidv4();
    const partId2b = uuidv4();
    const partId3 = uuidv4();
    const partId4 = uuidv4();
    await queryInterface.bulkInsert("Parts", [
      {
        ID: partId1,
        Content: "Choose one word from the list for each gap.",
        SubContent: "",
        TopicID: topicId, // Gán vào "Practice Test 2"
        Sequence: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ID: partId2a,
        Content: `The sentences below are from instructions. Put the sentences in the right order. The first sentence is done for you.`,
        SubContent: "Example: Follow the steps below if you join a talk by Professor James Smith.",
        TopicID: topicId, // Gán vào "Practice Test 2"
        Sequence: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ID: partId2b,
        Content: `The sentences below are from instructions. Put the sentences in the right order. The first sentence is done for you. `,
        SubContent: "Example: Most of drivers must follow the schedule of company.",
        TopicID: topicId, // Gán vào "Practice Test 2"
        Sequence: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ID: partId3,
        Content: `Four people respond in the comments section of an online magazine article about technology. Read the texts and then answer the questions below.`,
        SubContent: "",
        TopicID: topicId, // Gán vào "Practice Test 2"
        Sequence: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ID: partId4,
        Content: `Read the following passage quickly. Choose a heading for each numbered paragraph (1-7). There is one more heading than you need.`,
        SubContent: "",
        TopicID: topicId, // Gán vào "Practice Test 2"
        Sequence: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Danh sách 25 câu hỏi multiple-choice
    const questions = [
      {
        content: `Dear Karen,
This contract has fifty pages. It is very 1.  (hot/ long/ cold) 
I ask my staff to read and check 2. (detail/ hour / money) 
I will print and give my staff a 3. (hand/ listen/ copy) 
I know they are 4. (busy/ long/ hire) and not have free time 
However, I need to finish this meeting with my 5. (boss/ client/ host)
`,
        options: [
          {
            key: "1",
            value: ["hot", "long", "cold"],
          },
          {
            key: "2",
            value: ["detail", "hour", "money"],
          },
          {
            key: "3",
            value: ["hand", "listen", "copy"],
          },
          {
            key: "4",
            value: ["busy", "long", "hire"],
          },
          {
            key: "5",
            value: ["boss", "client", "host"],
          },
        ],
        correctAnswer: [
          {
            key: "1",
            value: "long",
          },
          {
            key: "2",
            value: "detail",
          },
          {
            key: "3",
            value: "copy",
          },
          {
            key: "4",
            value: "busy",
          },
          {
            key: "5",
            value: "client",
          },
        ],
        partID: partId1,
        type: "dropdown-list",
      },
      {
        content: `
After he finishes, there will be time for questions.
A staff member will note this down and give you a welcome pack.
If you would like to attend his talk, it will take place in the main hall at midday.
When you arrive at the conference hall, give your booking number.
Inside, you will find a schedule of events and the information of the key speaker.
`,
        options: [
          "After he finishes, there will be time for questions.",
          "A staff member will note this down and give you a welcome pack.",
          "If you would like to attend his talk, it will take place in the main hall at midday.",
          "When you arrive at the conference hall, give your booking number.",
          "Inside, you will find a schedule of events and the information of the key speaker.",
        ],
        correctAnswer: [
          {
            key: "After he finishes, there will be time for questions.",
            value: 5,
          },
          {
            key: "A staff member will note this down and give you a welcome pack.",
            value: 2,
          },
          {
            key: "If you would like to attend his talk, it will take place in the main hall at midday.",
            value: 4,
          },
          {
            key: "When you arrive at the conference hall, give your booking number.",
            value: 1,
          },
          {
            key: "Inside, you will find a schedule of events and the information of the key speaker.",
            value: 3,
          },
        ],
        partID: partId2a,
        type: "ordering",
      },
      {
        content: `
You must return truck keys to the office after being back.
In the company office, you can take a map with you.
You should arrive the office by 6 am and have your truck keys.
When you complete delivers, return to the company office.
You must follow the map to send your products.
`,
        options: [
          "You must return truck keys to the office after being back.",
          "In the company office, you can take a map with you.",
          "You should arrive the office by 6 am and have your truck keys.",
          "When you complete delivers, return to the company office.",
          "You must follow the map to send your products.",
        ],
        correctAnswer: [
          {
            key: "You must return truck keys to the office after being back.",
            value: 5,
          },
          {
            key: "In the company office, you can take a map with you.",
            value: 2,
          },
          {
            key: "When you complete delivers, return to the company office.",
            value: 1,
          },
          {
            key: "You should arrive the office by 6 am and have your truck keys.",
            value: 4,
          },
          {
            key: "You must follow the map to send your products.",
            value: 3,
          },
        ],
        partID: partId2b,
        type: "ordering",
      },
      {
        content: `
Karl: I moved to a new country last year. In the past, it would have been harder to stay in touch with my relatives, but now we can send instant messages and make video calls. Because of that, we talk all the time. Technology is probably something I am too dependent on, but I think most people use it for everything these days, and even young children have it in schools.
Lucy: I work in finance, and I have to keep up to date with global banking information and discuss it with co-workers. Many of them live in other countries, and it's technology that allows me to do this. I am therefore grateful for technology, but I am aware of some disadvantages, for example, that screen use can interfere with sleep. For this reason, I turn everything off by around 9 pm.
Beth: Our family uses technology a lot. My sister even calls Mum from inside the same house! Although Dad tells us not to use it late at night, I often do anyway. Technology is great for watching movies and listening to music. I play games with my friends. They all buy the most recent models, which puts pressure on me to do the same thing. It is not cheap, but I can't get left behind!
Ken: I am a professional painter, so my job isn't traditionally connected to using computers. Perhaps I'll use one more in the future to support my business. I have a laptop at home, although I don't use it very much. My daughters have become very interested in it, so I tend to keep it locked away. Lots of my friends enjoy giving their kids access to games and music, but I worry about the effect on developing minds.
        `,
        leftItems: [
          "1. Who needs to use technology for their job?",
          "2. Who mainly uses technology to communicate with their family?",
          "3. Who has to have the latest technology products?",
          "4. Who thinks children should not use technology?",
          "5. Who thinks people rely too much on technology?",
          "6. Who doesn't use technology before going to bed?",
          "7. Who likes to use technology for entertainment?",
        ],
        rightItems: ["Karl", "Lucy", "Beth", "Ken"],
        correctAnswer: [
          {
            key: "1. Who needs to use technology for their job?",
            value: "Lucy",
          },
          {
            key: "2. Who mainly uses technology to communicate with their family?",
            value: "Karl",
          },
          {
            key: "3. Who has to have the latest technology products?",
            value: "Beth",
          },
          {
            key: "4. Who thinks children should not use technology?",
            value: "Ken",
          },
          {
            key: "5. Who thinks people rely too much on technology?",
            value: "Karl",
          },
          {
            key: "6. Who doesn't use technology before going to bed?",
            value: "Lucy",
          },
          {
            key: "7. Who likes to use technology for entertainment?",
            value: "Beth",
          },
        ],
        partID: partId3,
        type: "dropdown-list",
      },
      {
        content: `Tulips
Paragraph 1 - In the 17th century, the Netherlands was undergoing a period of remarkable growth and prosperity. The country became a major economic powerhouse, thanks to its advanced trade networks and thriving industries. This economic success fueled a demand for luxury goods, and the tulip, with its striking beauty, becoming status symbol that reflected the wealth of the Dutch people. As the country’s economic influence expanded, so did the obsession with tulips.
Paragraph 2 - The arrival of exotic plants in Europe often sparked excitement and fascination. The tulip, originally from the Ottoman Empire, quickly captivated the Dutch due to its vibrant colors and elegant shape. By the early 1600s, tulips were a highly sought-after flower in the gardens of the rich, symbolizing wealth and sophistication. Over time, the popularity of tulips spread from the aristocracy to the growing merchant class. Tulips became a fashionable item, with families competing to display the rarest and most beautiful varieties in their gardens.
Paragraph 3 - As tulips gained popularity, their value skyrocketed, and Dutch merchants were quick to realize the potential for profit. The flowers became highly sought-after, not only for their beauty but also for their rarity, especially the unusual and broken varieties. This trade spread across Europe, with tulips becoming a central part of the economy in the Netherlands. The flower was no longer just a luxury item for the elite; it became an essential part of the broader trade network.
Paragraph 4 - Some tulips were highly prized for their unusual color patterns, with certain varieties featuring stripes or flame-like patterns. These rare "broken" tulips were particularly coveted and fetched incredibly high prices, despite being caused by a virus. The more unique the tulip, the more valuable it became. This drove the cultivation of even more exotic tulips, further inflating their market value.
Paragraph 5 - The tulip market was not as straightforward as buying and selling flowers that had already bloomed. Instead, a scheme of early futures contracts emerged, where people would agree to buy tulip bulbs at a set price even before they had been harvested. Prices increased dramatically as people rushed to buy bulbs, hoping to sell them later at a profit. However, this speculative trading detached the actual value of tulips from the market, leading to an unsustainable rise in prices.
Paragraph 6 - The tulip’s appeal stretched beyond the Netherlands and captured the attention of European countries. As the flower gained popularity, people from all over the continent admired its beauty. Tulips were sought after not only in the Netherlands but also in France, England, and even as far as the Ottoman Empire. The growing admiration for tulips led to them becoming an integral part of European garden culture.
Paragraph 7 - However, the tulip’s rise to fame came with a sudden twist. In 1637, the market for tulips suddenly crashed, and the value of the flowers dropped dramatically. What had been an increasingly speculative market quickly collapsed, leaving many investors with worthless bulbs and huge financial losses. This event, known as "Tulip Mania," is considered one of the earliest examples of a financial bubble. While tulips remained popular as a flower, their role as a commodity was never the same again.
`,
        leftItems: [
          "Paragraph 1",
          "Paragraph 2",
          "Paragraph 3",
          "Paragraph 4",
          "Paragraph 5",
          "Paragraph 6",
          "Paragraph 7",
        ],
        rightItems: [
          "An unexpected turn of events",
          "Trade mechanics",
          "Different types of tulip",
          "Tulips across Europe",
          "Coming into fashion",
          "The economy during the Golden Age",
          "An object of trade",
          "The scientific study of tulip varieties",
        ],
        correctAnswer: [
          {
            left: "Paragraph 1",
            right: "The economy during the Golden Age",
          },
          {
            left: "Paragraph 2",
            right: "Coming into fashion",
          },
          {
            left: "Paragraph 3",
            right: "An object of trade",
          },
          {
            left: "Paragraph 4",
            right: "Different types of tulip",
          },
          {
            left: "Paragraph 5",
            right: "Trade mechanics",
          },
          {
            left: "Paragraph 6",
            right: "Tulips across Europe",
          },
          {
            left: "Paragraph 7",
            right: "An unexpected turn of events",
          },
        ],
        partID: partId4,
        type: "matching",
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
      { Content: "Choose one word from the list for each gap." },
      {
        Content: `The sentences below are from instructions. Put the sentences in the right order. The first sentence is done for you.`,
      },
      {
        content: `The sentences below are from instructions. Put the sentences in the right order. The first sentence is done for you. `,
      },
      {
        Content: `Four people respond in the comments section of an online magazine article about technology. Read the texts and then answer the questions below.`,
      },
      {
        Content: `Read the following passage quickly. Choose a heading for each numbered paragraph (1-7). There is one more heading than you need.`,
      }
    );
    await queryInterface.bulkDelete("Topics", { Name: "Practice Test 2" });
  },
};
