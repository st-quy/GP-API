'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      // ------------------------------------------------
      // 1) Lấy PartID thuộc READING
      // ------------------------------------------------
      const partRows = await queryInterface.sequelize.query(
        `
          SELECT "ID","Content","SubContent"
          FROM "Parts"
          WHERE "SkillID" = (
            SELECT "ID" FROM "Skills" WHERE "Name" = 'READING'
          );
        `,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      if (!partRows || partRows.length === 0) {
        throw new Error('No Parts found for READING. Run Part Seeder first.');
      }

      // Helper tìm Part
      const findPart = (content) => {
        const row = partRows.find((p) => p.Content === content);
        if (!row) throw new Error(`❌ Part not found: ${content}`);
        return row.ID;
      };

      // ------------------------------------------------
      // 2) Lấy câu hỏi đã tồn tại để chống duplicate
      // ------------------------------------------------
      const existing = await queryInterface.sequelize.query(
        `
          SELECT "PartID","Sequence"
          FROM "Questions"
          WHERE "PartID" IN (
            SELECT "ID" FROM "Parts"
            WHERE "SkillID" = (
              SELECT "ID" FROM "Skills" WHERE "Name" = 'READING'
            )
          );
        `,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      const existsSet = new Set(
        existing.map((q) => `${q.PartID}_${q.Sequence}`)
      );

      // ------------------------------------------------
      // 3) DATA — FULL 5 QUESTION READING
      // ------------------------------------------------
      const DATA = [
        {
          PartContent:
            'Part 1 - Read the email from Ron to his assistant. Choose one word from the list for each gap. The first one is done for you.',
          Sequence: 1,
          Type: 'dropdown-list',
          Content: `Dear Leah,
I hope this email 0. (finds) you well.
The budget doesn't 1. (work/ count/ balance)
Could you get the financial 2. (department/ statement/ accountant)?
I 3. (sure/ assure / think) it will help.
Read the information 4. (beautifully/ fluently/ slowly), not quickly.
Send me the results 5. (when/ before/ between) you go home, not after.
Best,
Ron`,
          // lấy đúng từ DB (eef22cb1-...) bạn gửi
          AnswerContent:
            '{"content":"Dear Leah,\\nI hope this email 0. (finds) you well.\\nThe budget doesn\'t 1. (work/ count/ balance)\\nCould you get the financial 2. (department/ statement/ accountant)?\\nI 3. (sure/ assure / think) it will help.\\nRead the information 4. (beautifully/ fluently/ slowly), not quickly.\\nSend me the results 5. (when/ before/ between) you go home, not after.\\nBest,\\nRon","options":[{"key":"0","value":["finds"]},{"key":"1","value":["work","count","balance"]},{"key":"2","value":["department","statement","accountant"]},{"key":"3","value":["sure","assure","think"]},{"key":"4","value":["beautifully","fluently","slowly"]},{"key":"5","value":["when","before","between"]}],"correctAnswer":[{"key":"0","value":"finds"},{"key":"1","value":"balance"},{"key":"2","value":"statement"},{"key":"3","value":"think"},{"key":"4","value":"slowly"},{"key":"5","value":"before"}],"partID":"fea5405a-2702-4518-bb6d-feb1295cb5f0","type":"dropdown-list"}',
        },

        {
          PartContent:
            'Part 2A: The sentences below are a story about a scientist. Put the sentences in the right order. The first sentence is done for you.',
          Sequence: 2,
          Type: 'ordering',
          Content: 'Albert was a talented kid.',
          // lấy đúng từ DB (a4d6f076-...)
          AnswerContent:
            '{"content":"Albert was a talented kid.","options":["His best friend in his new class was a girl named Lavime.","She later became his wife and helped him with his earliest scientific discoveries.","These were so advanced that he soon became famous all over the world.","As a child, he moved to a special school because he was so clever.","Princeton University in the USA offered him a job because he was so famous."],"correctAnswer":[{"key":"As a child, he moved to a special school because he was so clever.","value":1},{"key":"His best friend in his new class was a girl named Lavime.","value":2},{"key":"She later became his wife and helped him with his earliest scientific discoveries.","value":3},{"key":"These were so advanced that he soon became famous all over the world.","value":4},{"key":"Princeton University in the USA offered him a job because he was so famous.","value":5}],"partID":"d3c505d4-eba9-4b3d-baad-5051d66390dd","type":"ordering"}',
        },

        {
          PartContent:
            'Part 2B: The sentences below are from a fire instruction. Put the sentences in the right order. The first sentence is done for you.',
          Sequence: 3,
          Type: 'ordering',
          Content: 'You need to follow the instruction strictly.',
          // lấy đúng từ DB (4b0225fc-...)
          AnswerContent:
            '{"content":"You need to follow the instruction strictly.","options":["Through these doors, there are stairs leading you to the ground floor.","When you reach the bottom of these stairs, leave the building through front entrance.","When you hear the alarm, leave your bags and belongings at the desk.","Next, walk calmly to the doors marked Emergency Exit.","Outside, gather on the grass and wait for further instructions."],"correctAnswer":[{"key":"When you hear the alarm, leave your bags and belongings at the desk.","value":1},{"key":"Next, walk calmly to the doors marked Emergency Exit.","value":2},{"key":"Through these doors, there are stairs leading you to the ground floor.","value":3},{"key":"When you reach the bottom of these stairs, leave the building through front entrance.","value":4},{"key":"Outside, gather on the grass and wait for further instructions.","value":5}],"partID":"1967bc74-dc00-4d7b-a361-9cb31e450dea","type":"ordering"}',
        },

        {
          PartContent:
            'Part 3: Four people respond in the comments section of an online magazine article about watching a movie. Read the texts and then answer the questions below.',
          Sequence: 4,
          Type: 'dropdown-list',
          // Content full từ DB (7a2c240f-...)
          Content: `Nina
This is the second time I've watched this movie but it still makes me feel restless and anxious. Every time there are sudden scary scenes, my heart feels like it's going to jump out. I think the director and actors made this movie very successful in scaring the audience.
Brad
I feel like going to the cinema is a waste of money so I watched this movie at home with my family, and we had a very good time together. One thing about this movie that makes me excited is the plot of the movie. The film progresses very logically, the story lines are cleverly and skillfully arranged to express the character's psychology in the most complete way. That's one thing I like most about this movie.
Harry
It was a holiday weekend and my college friends and I had planned to go see this movie at the cinema. We had a great time together watching that horror movie. However, I feel that this movie is not as scary as rumored. When I finished watching, I didn't feel any impression or fear at all.
Xavier
I read the book for the movie, and to be fair, the movie wasn't as good as the book. If you want to understand more about this movie you should read its book before you watch the movie. For me, the length of this movie is terrible, the movie lasts over 3 hours, while only half the time is needed for all that content.`,
          // AnswerContent chuẩn dạng dropdown-list (leftItems/rightItems) từ DB
          AnswerContent:
            '{"content":"Nina\\nThis is the second time I\'ve watched this movie but it still makes me feel restless and anxious. Every time there are sudden scary scenes, my heart feels like it\'s going to jump out. I think the director and actors made this movie very successful in scaring the audience.\\nBrad\\nI feel like going to the cinema is a waste of money so I watched this movie at home with my family, and we had a very good time together. One thing about this movie that makes me excited is the plot of the movie. The film progresses very logically, the story lines are cleverly and skillfully arranged to express the character\'s psychology in the most complete way. That\'s one thing I like most about this movie.\\nHarry\\nIt was a holiday weekend and my college friends and I had planned to go see this movie at the cinema. We had a great time together watching that horror movie. However, I feel that this movie is not as scary as rumored. When I finished watching, I didn\'t feel any impression or fear at all.\\nXavier\\nI read the book for the movie, and to be fair, the movie wasn\'t as good as the book. If you want to understand more about this movie you should read its book before you watch the movie. For me, the length of this movie is terrible, the movie lasts over 3 hours, while only half the time is needed for all that content.","leftItems":["1. Who saw the film previously?","2. Who saw the movies with friends?","3. Who thought the film was too long?","4. Who found the film scary?","5. Who saw the film at home?","6. Who enjoyed the story of the film?","7. Who read the book of the film?"],"rightItems":["Nina","Brad","Harry","Xavier"],"correctAnswer":[{"key":"1","value":"Nina"},{"key":"2","value":"Harry"},{"key":"3","value":"Xavier"},{"key":"4","value":"Nina"},{"key":"5","value":"Brad"},{"key":"6","value":"Brad"},{"key":"7","value":"Xavier"}],"partID":"15bc894e-1a96-46ae-a60e-5ac7bcb0360d","type":"dropdown-list"}',
        },

        {
          PartContent:
            'Part 4 - Read the following passage quickly. Choose a heading for each numbered paragraph (1-7). There is one more heading than you need.',
          Sequence: 5,
          Type: 'matching',
          // Content full từ DB (8e86e170-... coffee)
          Content: `Coffee
Paragraph 1 - Coffee drinking began in Ethiopia and slowly spread across the world. In the 15th century, it reached the Arabian Peninsula, where coffeehouses became popular gathering spots. These places allowed people to meet, talk, and share ideas. As travelers and traders encountered coffee, it spread to Europe and later to the Americas. Each culture adapted coffee to suit their own tastes and rituals, making it a global beverage. Today, coffee drinking is enjoyed worldwide, with unique styles and traditions in each region. 
Paragraph 2 - Coffee isn’t just a drink; it’s a source of energy and motivation for many people. The caffeine in coffee helps people feel more awake and focused, making it popular in workplaces and schools. Coffee also brings people together, as friends or colleagues often meet over a cup of coffee to chat or work. Coffeehouses have become social spots, where people gather, relax, or connect with others. For many, coffee provides a sense of comfort and encouragement to start the day or tackle tasks.
Paragraph 3 - Coffee has grown from a habit into a massive global industry. It is one of the most traded commodities, supporting millions of jobs worldwide, from farmers to baristas. Countries like Brazil and Vietnam rely heavily on coffee exports. Coffee shops and brands have also become popular, with specialty cafes and big chains appearing in cities around the world. Today, coffee is a huge business, impacting economies globally as it remains a daily ritual for many people.
Paragraph 4 - The coffee industry faces many challenges. While coffee is a profitable global product, many coffee farmers earn low wages. Middlemen and large companies take a big share of the profit, leaving little for the farmers. Climate change is also a problem, as changing weather makes it harder to grow coffee. This puts farmers at risk of losing their income. Some coffee workers face poor conditions, with long hours and low pay. These issues highlight the need for a fairer coffee economy.
Paragraph 5 - To make the coffee industry fairer, some people support “fair trade” coffee. Fair trade ensures that coffee farmers receive a fair price and better working conditions. By choosing fair trade coffee, consumers help farmers earn a fair income. Another approach is direct trade, where companies buy directly from farmers, cutting out middlemen. This gives farmers more profit. Some coffee companies also support local communities, building schools or providing healthcare. These solutions help create a fairer distribution of revenue.
Paragraph 6 - The health effects of coffee are widely debated. Some say that too much coffee can cause anxiety, insomnia, or heart issues due to caffeine. Others worry about caffeine addiction. However, studies also suggest coffee has health benefits. It contains antioxidants, which may help prevent diseases like Alzheimer’s and Parkinson’s. Drinking moderate amounts of coffee has been linked to a lower risk of liver disease and diabetes. Experts generally recommend drinking coffee in moderation to enjoy its benefits while avoiding potential risks.
Paragraph 7 - The origin of coffee is surrounded by legends. One story says a goat herder in Ethiopia named Kaldi noticed his goats became lively after eating red berries from a certain plant. Curious, he tried the berries himself and felt energized. The story spread, and monks began using coffee to stay awake during long prayers. From Ethiopia, coffee traveled to Yemen and then to the rest of the world. This ancient discovery introduced the world to coffee, creating a lasting cultural impact.`,
          // AnswerContent matching từ DB coffee (8e86e170-...)
          AnswerContent:
            '{"content":"Coffee\\nParagraph 1 - Coffee drinking began in Ethiopia and slowly spread across the world. In the 15th century, it reached the Arabian Peninsula, where coffeehouses became popular gathering spots. These places allowed people to meet, talk, and share ideas. As travelers and traders encountered coffee, it spread to Europe and later to the Americas. Each culture adapted coffee to suit their own tastes and rituals, making it a global beverage. Today, coffee drinking is enjoyed worldwide, with unique styles and traditions in each region. \\nParagraph 2 - Coffee isn’t just a drink; it’s a source of energy and motivation for many people. The caffeine in coffee helps people feel more awake and focused, making it popular in workplaces and schools. Coffee also brings people together, as friends or colleagues often meet over a cup of coffee to chat or work. Coffeehouses have become social spots, where people gather, relax, or connect with others. For many, coffee provides a sense of comfort and encouragement to start the day or tackle tasks.\\nParagraph 3 - Coffee has grown from a habit into a massive global industry. It is one of the most traded commodities, supporting millions of jobs worldwide, from farmers to baristas. Countries like Brazil and Vietnam rely heavily on coffee exports. Coffee shops and brands have also become popular, with specialty cafes and big chains appearing in cities around the world. Today, coffee is a huge business, impacting economies globally as it remains a daily ritual for many people.\\nParagraph 4 - The coffee industry faces many challenges. While coffee is a profitable global product, many coffee farmers earn low wages. Middlemen and large companies take a big share of the profit, leaving little for the farmers. Climate change is also a problem, as changing weather makes it harder to grow coffee. This puts farmers at risk of losing their income. Some coffee workers face poor conditions, with long hours and low pay. These issues highlight the need for a fairer coffee economy.\\nParagraph 5 - To make the coffee industry fairer, some people support “fair trade” coffee. Fair trade ensures that coffee farmers receive a fair price and better working conditions. By choosing fair trade coffee, consumers help farmers earn a fair income. Another approach is direct trade, where companies buy directly from farmers, cutting out middlemen. This gives farmers more profit. Some coffee companies also support local communities, building schools or providing healthcare. These solutions help create a fairer distribution of revenue.\\nParagraph 6 - The health effects of coffee are widely debated. Some say that too much coffee can cause anxiety, insomnia, or heart issues due to caffeine. Others worry about caffeine addiction. However, studies also suggest coffee has health benefits. It contains antioxidants, which may help prevent diseases like Alzheimer’s and Parkinson’s. Drinking moderate amounts of coffee has been linked to a lower risk of liver disease and diabetes. Experts generally recommend drinking coffee in moderation to enjoy its benefits while avoiding potential risks.\\nParagraph 7 - The origin of coffee is surrounded by legends. One story says a goat herder in Ethiopia named Kaldi noticed his goats became lively after eating red berries from a certain plant. Curious, he tried the berries himself and felt energized. The story spread, and monks began using coffee to stay awake during long prayers. From Ethiopia, coffee traveled to Yemen and then to the rest of the world. This ancient discovery introduced the world to coffee, creating a lasting cultural impact.","leftItems":["Paragraph 1","Paragraph 2","Paragraph 3","Paragraph 4","Paragraph 5","Paragraph 6","Paragraph 7"],"rightItems":["The ancient origin of coffee","The role of coffee in modern culture","The custom of coffee drinking begins to spread","Problems of coffee economy","Health risks versus health benefits debate","A habit that has become a big economy","A remedy of unjust revenue distribution","Coffee encourages"],"correctAnswer":[{"left":"Paragraph 1","right":"The custom of coffee drinking begins to spread"},{"left":"Paragraph 2","right":"Coffee encourages"},{"left":"Paragraph 3","right":"A habit that has become a big economy"},{"left":"Paragraph 4","right":"Problems of coffee economy"},{"left":"Paragraph 5","right":"A remedy of unjust revenue distribution"},{"left":"Paragraph 6","right":"Health risks versus health benefits debate"},{"left":"Paragraph 7","right":"The ancient origin of coffee"}]}',
        },
      ];

      // ------------------------------------------------
      // 4) Build + Insert Non-Duplicate Rows
      // ------------------------------------------------
      const insertRows = [];

      for (const q of DATA) {
        const partID = findPart(q.PartContent);

        // Skip nếu đã tồn tại
        if (existsSet.has(`${partID}_${q.Sequence}`)) {
          console.log(
            `⚠️  Skip duplicate READING Q${q.Sequence} (${q.PartContent})`
          );
          continue;
        }

        insertRows.push({
          ID: uuidv4(),
          Type: q.Type,
          AudioKeys: null,
          ImageKeys: null,
          PartID: partID,
          Sequence: q.Sequence,
          Content: q.Content,
          SubContent: null,
          GroupContent: null,
          AnswerContent: q.AnswerContent, // giữ nguyên JSON string
          createdAt: now,
          updatedAt: now,
        });
      }

      if (insertRows.length) {
        await queryInterface.bulkInsert('Questions', insertRows, {
          transaction: t,
        });
      }

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      'Questions',
      { Type: ['dropdown-list', 'matching', 'ordering'] },
      {}
    );
  },
};
