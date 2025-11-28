'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      // --------------------------------------------------------
      // 1) Lấy tất cả Part thuộc LISTENING
      // --------------------------------------------------------
      const partRows = await queryInterface.sequelize.query(
        `
        SELECT "ID","Content","SubContent"
        FROM "Parts"
        WHERE "SkillID" = (
          SELECT "ID" FROM "Skills" WHERE "Name" = 'LISTENING'
        );
      `,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      if (!partRows || partRows.length === 0) {
        throw new Error('No LISTENING parts found. Run FILE 1 & FILE 2 first.');
      }

      const findPart = (content) => {
        const row = partRows.find((p) => p.Content === content);

        if (!row) {
          console.error('❌ Part not found:', content);
          throw new Error(`Missing Part mapping: ${content}`);
        }

        return row.ID;
      };

      // --------------------------------------------------------
      // 2) LISTENING — FULL 17 QUESTIONS (GIỮ NGUYÊN JSON)
      // --------------------------------------------------------
      const DATA = [
        // ===================================================
        // PART 1 — Information Recognition (Q1–Q13)
        // ===================================================
        {
          PartContent: 'LS_P1_InfoRecognition',
          Type: 'multiple-choice',
          Sequence: 1,
          AudioKeys:
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Audio/Q1.mp3',
          Content:
            'A woman is talking about her family’s weekend. What does the family do most weekends?',
          Options: ['Goes for a walk', 'Goes picnic', 'Goes to the beach'],
          CorrectAnswer: 'Goes for a walk',
        },
        {
          PartContent: 'LS_P1_InfoRecognition',
          Type: 'multiple-choice',
          Sequence: 2,
          AudioKeys:
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Audio/Q2.mp3',
          Content:
            'A man is talking to a shop assistant. What does the man buy in the shop?',
          Options: ['Mugs', 'Candles', 'Clothes'],
          CorrectAnswer: 'Clothes',
        },
        {
          PartContent: 'LS_P1_InfoRecognition',
          Type: 'multiple-choice',
          Sequence: 3,
          AudioKeys:
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Audio/Q3.mp3',
          Content: 'A man is talking on the phone. What did the man lose?',
          Options: ['Jacket', 'Glasses', 'Books'],
          CorrectAnswer: 'Glasses',
        },
        {
          PartContent: 'LS_P1_InfoRecognition',
          Type: 'multiple-choice',
          Sequence: 4,
          AudioKeys:
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Audio/Q4.mp3',
          Content:
            'Jack is phoning his mom. What does Jack need to buy for his sister?',
          Options: ['Chocolate', 'Milk', 'Fruit'],
          CorrectAnswer: 'Chocolate',
        },
        {
          PartContent: 'LS_P1_InfoRecognition',
          Type: 'multiple-choice',
          Sequence: 5,
          AudioKeys:
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Audio/Q5.mp3',
          Content:
            'Lucy is calling her brother. What does the brother have to drink?',
          Options: ['Milk', 'Medicine', 'Water'],
          CorrectAnswer: 'Water',
        },
        {
          PartContent: 'LS_P1_InfoRecognition',
          Type: 'multiple-choice',
          Sequence: 6,
          AudioKeys:
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Audio/Q6.mp3',
          Content: 'Anna is calling her friend. Where will they meet?',
          Options: ['At the market place', 'At the mall', 'At the park'],
          CorrectAnswer: 'At the market place',
        },
        {
          PartContent: 'LS_P1_InfoRecognition',
          Type: 'multiple-choice',
          Sequence: 7,
          AudioKeys:
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Audio/Q7.mp3',
          Content:
            'Listen to an auction man talking about a cabinet. Which part of the cabinet is original?',
          Options: ['The drawers', 'The doors', 'The handles'],
          CorrectAnswer: 'The drawers',
        },
        {
          PartContent: 'LS_P1_InfoRecognition',
          Type: 'multiple-choice',
          Sequence: 8,
          AudioKeys:
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Audio/Q8.mp3',
          Content: 'Listen to a voice message. How does Even feel?',
          Options: ['Sick', 'Happy', 'Tired'],
          CorrectAnswer: 'Sick',
        },
        {
          PartContent: 'LS_P1_InfoRecognition',
          Type: 'multiple-choice',
          Sequence: 9,
          AudioKeys:
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Audio/Q9.mp3',
          Content:
            'Two friends are talking about their trip. What will the weather be like?',
          Options: ['Cold and wet', 'Hot and sunny', 'Warm and dry'],
          CorrectAnswer: 'Cold and wet',
        },
        {
          PartContent: 'LS_P1_InfoRecognition',
          Type: 'multiple-choice',
          Sequence: 10,
          AudioKeys:
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Audio/Q10.mp3',
          Content:
            'A man is talking about his holiday. How is he going to travel to the city?',
          Options: ['By car', 'By train', 'By bus'],
          CorrectAnswer: 'By train',
        },
        {
          PartContent: 'LS_P1_InfoRecognition',
          Type: 'multiple-choice',
          Sequence: 11,
          AudioKeys:
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Audio/Q11.mp3',
          Content:
            'Listen to a nutrition expert. What time is the best for children to eat fruit?',
          Options: ['In the evening', 'In the afternoon', 'In the morning'],
          CorrectAnswer: 'In the morning',
        },
        {
          PartContent: 'LS_P1_InfoRecognition',
          Type: 'multiple-choice',
          Sequence: 12,
          AudioKeys:
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Audio/Q12.mp3',
          Content:
            'Greg is talking about a working day in his life. How does he go to work?',
          Options: ['By bus', 'By bike', 'On foot'],
          CorrectAnswer: 'By bus',
        },
        {
          PartContent: 'LS_P1_InfoRecognition',
          Type: 'multiple-choice',
          Sequence: 13,
          AudioKeys:
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Audio/Q13.mp3',
          Content: 'Listen to a tour guide. Where is the office located?',
          Options: [
            'Next to the park',
            'Opposite the hotel',
            'Above the restaurant',
          ],
          CorrectAnswer: 'Opposite the hotel',
        },

        // ===================================================
        // PART 2 — Information Matching (Q14)
        // GIỮ NGUYÊN JSON GỐC
        // ===================================================
        {
          PartContent: 'LS_P2_InfoMatching',
          Type: 'dropdown-list',
          Sequence: 14,
          AudioKeys:
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Audio/Q14.mp3',
          Content:
            'Four people are talking about how they travel to work.\nComplete the sentences below.',
          AnswerContent: `{"content":"Four people are talking about how they travel to work. \\nComplete the sentences below.","groupContent":{"title":"Four people are talking about how they travel to work. \\nComplete the sentences below.","audioKey":""},"leftItems":["1. Speaker A …","2. Speaker B ...","3. Speaker C ...","4. Speaker D ..."],"rightItems":["travels by bike.","travels by car.","travels by train.","walks with a friend.","travels by bus.","walks alone."],"correctAnswer":[{"key":"1","value":"travels by bus."},{"key":"2","value":"travels by car."},{"key":"3","value":"walks alone."},{"key":"4","value":"walks with a friend."}],"type":"dropdown-list","audioKeys":{"text":"https://10.25.83.220:9000/gp-bucket/Topic6/Audio/Q14.mp3","hyperlink":"https://10.25.83.220:9000/gp-bucket/Topic6/Audio/Q14.mp3"}}`,
        },

        // ===================================================
        // PART 3 — Opinion matching (Q15)
        // ===================================================
        {
          PartContent: 'LS_P3_OpinionMatching',
          Type: 'dropdown-list',
          Sequence: 15,
          AudioKeys:
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Audio/Q15.mp3',
          Content:
            'Listen to two people discussing farming space. Read the opinions...',
          AnswerContent: `{
  "content": "Listen to two people discussing farming space. Read the opinions below and decide whose opinion matches the statements, the man, the woman, or both the man and the woman.\\n\\nWho expresses which opinion?",
  "groupContent": {
    "title": "Listen to two people discussing farming space. Read the opinions below and decide whose opinion matches the statements, the man, the woman, or both the man and the woman.\\n\\nWho expresses which opinion?",
    "audioKey": ""
  },
  "leftItems": [
    "1. Living space is more important than farming space.",
    "2. Farming space is appealing.",
    "3. Farming space will benefit the urban economy.",
    "4. Farming space is in need of more food."
  ],
  "rightItems": [
    "Man",
    "Woman",
    "Both"
  ],
  "correctAnswer": [
    { "key": "1", "value": "Woman" },
    { "key": "2", "value": "Both" },
    { "key": "3", "value": "Man" },
    { "key": "4", "value": "Woman" }
  ],
  "type": "dropdown-list",
  "audioKeys": {
    "text": "https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Audio/Q15.mp3",
    "hyperlink": "https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Audio/Q15.mp3"
  }
}`,
        },

        // ===================================================
        // PART 4 — Inference (two talks) Q16–Q17
        // ===================================================

        // Q16 — GIỮ NGUYÊN JSON
        {
          PartContent: 'LS_P4_Inference',
          Type: 'listening-questions-group',
          Sequence: 16,
          AudioKeys:
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Audio/Q16.mp3',
          Content:
            'Listen to an expert talking about a newly broadcasted TV series...',
          AnswerContent: `{"content":"Listen to an expert talking about a newly broadcasted TV series and answer the questions below.","groupContent":{"title":"Listen to an expert talking about a newly broadcasted TV series and answer the questions below.","audioKey":"","listContent":[{"ID":1,"content":"What does the expert say about the series?","options":["It didn’t receive enough investment at the early stage.","It was overlooked by critics.","It caught the audience’s attention from the start."],"type":"listening-questions-group","correctAnswer":"It caught the audience’s attention from the start.","partID":"a1dde54c-be6c-48f8-8a46-da1223b5a452"},{"ID":2,"content":"According to the expert, what is the series’ potential?","options":["It helps to reach new customers.","New seasons will be produced due to great demand.","It inspires young filmmakers to follow a new movie-making style."],"type":"listening-questions-group","correctAnswer":"It helps to reach new customers.","partID":"a1dde54c-be6c-48f8-8a46-da1223b5a452"}]},"type":"listening-questions-group","audioKeys":"https://10.25.83.220:9000/gp-bucket/Topic6/Audio/Q16.mp3"}`,
        },

        // Q17 — GIỮ NGUYÊN JSON
        {
          PartContent: 'LS_P4_Inference',
          Type: 'listening-questions-group',
          Sequence: 17,
          AudioKeys:
            'https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Audio/Q17.mp3',
          Content:
            'Listen to an expert discussing advertising and answer the questions below.',
          AnswerContent: `{
  "content": "Listen to an expert discussing advertising and answer the questions below.",
  "groupContent": {
    "title": "Listen to an expert discussing advertising and answer the questions below.",
    "audioKey": "",
    "listContent": [
      {
        "ID": 1,
        "content": "What does the expert say about the negative side of advertising?",
        "options": [
          "Series are damaged by overexposure.",
          "Advertisements might sometimes be repetitive which is annoying.",
          "Advertising costs the same amount of money to produce a movie."
        ],
        "type": "listening-questions-group",
        "correctAnswer": "Series are damaged by overexposure.",
        "partID": "b2dde54c-be6c-48f8-8a46-da1223b5a452"
      },
      {
        "ID": 2,
        "content": "In what way can advertising affect sports?",
        "options": [
          "They help to attract more fans.",
          "They can boost ticket sales and sales of sports related items.",
          "They can generate negative publicity for the sport."
        ],
        "type": "listening-questions-group",
        "correctAnswer": "They can generate negative publicity for the sport.",
        "partID": "b2dde54c-be6c-48f8-8a46-da1223b5a452"
      }
    ]
  },
  "type": "listening-questions-group",
  "audioKeys": "https://minio.devplus.edu.vn/gp-bucket-dev/Topic6/Audio/Q17.mp3"
}`,
        },
      ];

      // --------------------------------------------------------
      // 3) Lấy danh sách câu đã tồn tại → chống duplicate
      // --------------------------------------------------------
      const existing = await queryInterface.sequelize.query(
        `SELECT "PartID","Sequence" FROM "Questions"`,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      const existSet = new Set(
        existing.map((e) => `${e.PartID}__${e.Sequence}`)
      );

      // --------------------------------------------------------
      // 4) CHUẨN BỊ LIST INSERT — chỉ insert câu chưa có
      // --------------------------------------------------------
      const insertRows = [];

      for (const q of DATA) {
        const partID = findPart(q.PartContent);

        const key = `${partID}__${q.Sequence}`;

        if (existSet.has(key)) {
          console.log(
            `⚠️ Skip duplicate LISTENING: ${q.PartContent} - Seq ${q.Sequence}`
          );
          continue;
        }

        let answerJson = q.AnswerContent;

        // build JSON cho multiple-choice
        if (q.Type === 'multiple-choice') {
          answerJson = JSON.stringify({
            content: q.Content,
            groupContent: { title: q.Content, audioKey: '' },
            options: q.Options,
            correctAnswer: q.CorrectAnswer,
            type: 'multiple-choice',
            audioKeys: q.AudioKeys,
          });
        }

        insertRows.push({
          ID: uuidv4(),
          Type: q.Type,
          AudioKeys: q.AudioKeys ?? null,
          ImageKeys: null,
          PartID: partID,
          Sequence: q.Sequence,
          Content: q.Content,
          SubContent: null,
          GroupContent: null,
          AnswerContent: answerJson,
          createdAt: now,
          updatedAt: now,
        });
      }

      // --------------------------------------------------------
      // 5) INSERT NEW QUESTIONS
      // --------------------------------------------------------
      if (insertRows.length > 0) {
        await queryInterface.bulkInsert('Questions', insertRows, {
          transaction: t,
        });
      } else {
        console.log('✔ LISTENING already fully seeded. Nothing to insert.');
      }

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Questions', {
      Type: ['multiple-choice', 'dropdown-list', 'listening-questions-group'],
    });
  },
};
