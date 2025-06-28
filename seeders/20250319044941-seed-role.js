"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, sequelize) => {
    const roles = [{ Name: "admin" }, { Name: "student" }, { Name: "teacher" }];

    for (const role of roles) {
      const existingRole = await queryInterface.rawSelect(
        "Roles",
        {
          where: { Name: role.Name },
        },
        ["ID"]
      );

      if (!existingRole) {
        await queryInterface.bulkInsert(
          "Roles",
          [
            {
              ID: uuidv4(),
              Name: role.Name,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          {}
        );
      }
    }
  },

  down: async (queryInterface) => {
    return queryInterface.bulkDelete("Roles", null, {});
  },
};
