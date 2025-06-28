const { v4: uuidv4 } = require("uuid"); // Import the UUID generator
const bcrypt = require("bcrypt");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check for existing records
    const existingUsers = await queryInterface.sequelize.query(
      `SELECT email FROM "Users" WHERE email IN ('admin@greenprep.com', 'teacher@greenprep.com', 'student@greenprep.com');`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const existingEmails = existingUsers.map((user) => user.email);

    // Prepare data to insert, excluding duplicates
    const saltRounds = 10;

    const usersToInsert = [
      {
        ID: uuidv4(),
        lastName: "Admin",
        firstName: "GP",
        email: "admin@greenprep.com",
        phone: "1234567890",
        studentCode: null,
        teacherCode: null,
        roleIDs: ["admin"],
        password: bcrypt.hashSync("greenprep@2025", saltRounds),
        status: true,
        address: "123 Main St, Anytown, USA",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ID: uuidv4(),
        lastName: "Teacher",
        firstName: "GP",
        email: "teacher@greenprep.com",
        phone: "0987654321",
        studentCode: null,
        teacherCode: "T654321",
        roleIDs: ["teacher"],
        password: bcrypt.hashSync("greenprep@2025", saltRounds),
        status: true,
        address: "456 Elm St, Othertown, USA",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ID: uuidv4(),
        lastName: "Student",
        firstName: "GP",
        email: "student@greenprep.com",
        phone: "0988997774",
        studentCode: "S654321",
        teacherCode: null,
        roleIDs: ["student"],
        password: bcrypt.hashSync("greenprep@2025", saltRounds),
        status: true,
        address: "567 Elm St, Othertown, USA",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ].filter((user) => !existingEmails.includes(user.email));

    if (usersToInsert.length > 0) {
      await queryInterface.bulkInsert("Users", usersToInsert);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Users", null, {});
  },
};
