"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { v4: uuidv4 } = require("uuid");
    const id1 = uuidv4();
    const id2 = uuidv4();
    const id3 = uuidv4();
    const id4 = uuidv4();
    const id5 = uuidv4();
    const id6 = uuidv4();
    const id7 = uuidv4();
    const id8 = uuidv4();
    const id9 = uuidv4();

    // Fetch existing class names
    const existingClasses = await queryInterface.sequelize.query(
      `SELECT "className" FROM "Classes";`
    );
    const existingClassNames = existingClasses[0].map((c) => c.className);

    // Define new classes
    const newClasses = [
      { ID: id1, className: "CL0701", UserID: null },
      { ID: id2, className: "CL0702", UserID: null },
      { ID: id3, className: "CL0703", UserID: null },
      { ID: id4, className: "CL0704", UserID: null },
      { ID: id5, className: "CL0705", UserID: null },
      { ID: id6, className: "CL0706", UserID: null },
      { ID: id7, className: "CL0707", UserID: null },
      { ID: id8, className: "CL0708", UserID: null },
      { ID: id9, className: "CL0709", UserID: null },
    ];

    // Filter out duplicates
    const filteredClasses = newClasses.filter(
      (cls) => !existingClassNames.includes(cls.className)
    );

// Fetch user IDs
const [users] = await queryInterface.sequelize.query(
  `SELECT "ID" FROM "Users" WHERE "email" = 'teacher@greenprep.com';`
);

if (!users || users.length === 0) {
  throw new Error('Teacher user not found');
}

// Assign UserID and timestamps to filtered classes
filteredClasses.forEach((cls) => {
  cls.UserID = users[0].ID;
  cls.createdAt = new Date();
  cls.updatedAt = new Date();
});

    // Insert filtered classes
    if (filteredClasses.length > 0) {
      return queryInterface.bulkInsert("Classes", filteredClasses);
    } else {
      console.log("No new classes to insert.");
    }
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Classes", null, {});
  },
};
