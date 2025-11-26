'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const saltRounds = 10;
      const now = new Date();

      const ROLE_NAMES = ['admin', 'teacher', 'student'];
      const USER_EMAILS = [
        'admin@greenprep.com',
        'teacher@greenprep.com',
        'student@greenprep.com',
      ];

      // Đảm bảo roles tồn tại
      const roles = await queryInterface.sequelize.query(
        `SELECT "ID","Name" FROM "Roles" WHERE "Name" IN (:names);`,
        {
          replacements: { names: ROLE_NAMES },
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        }
      );
      const roleMap = roles.reduce((acc, r) => {
        acc[r.Name] = r.ID;
        return acc;
      }, {});

      const existingUsers = await queryInterface.sequelize.query(
        `SELECT "ID","email" FROM "Users" WHERE "email" IN (:emails);`,
        {
          replacements: { emails: USER_EMAILS },
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        }
      );
      const existingEmailSet = new Set(existingUsers.map((u) => u.email));

      const seedUsers = [
        {
          lastName: 'Admin',
          firstName: 'GP',
          email: 'admin@greenprep.com',
          phone: '1234567890',
          studentCode: null,
          teacherCode: null,
          password: bcrypt.hashSync('greenprep@2025', saltRounds),
          status: true,
          address: '123 Main St',
        },
        {
          lastName: 'Teacher',
          firstName: 'GP',
          email: 'teacher@greenprep.com',
          phone: '0987654321',
          studentCode: null,
          teacherCode: 'T654321',
          password: bcrypt.hashSync('greenprep@2025', saltRounds),
          status: true,
          address: '456 Elm St',
        },
        {
          lastName: 'Student',
          firstName: 'GP',
          email: 'student@greenprep.com',
          phone: '0988997774',
          studentCode: 'S654321',
          teacherCode: null,
          password: bcrypt.hashSync('greenprep@2025', saltRounds),
          status: true,
          address: '567 Elm St',
        },
      ];

      const usersToInsert = seedUsers
        .filter((u) => !existingEmailSet.has(u.email))
        .map((u) => ({
          ID: uuidv4(),
          ...u,
          createdAt: now,
          updatedAt: now,
        }));

      if (usersToInsert.length > 0) {
        await queryInterface.bulkInsert('Users', usersToInsert, {
          transaction,
        });
      }

      // reload users
      const allUsers = await queryInterface.sequelize.query(
        `SELECT "ID","email" FROM "Users" WHERE "email" IN (:emails);`,
        {
          replacements: { emails: USER_EMAILS },
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        }
      );
      const userMap = allUsers.reduce((acc, u) => {
        acc[u.email] = u.ID;
        return acc;
      }, {});

      const desiredUserRoles = [
        { email: 'admin@greenprep.com', roleName: 'admin' },
        { email: 'teacher@greenprep.com', roleName: 'teacher' },
        { email: 'student@greenprep.com', roleName: 'student' },
      ];

      const existingUserRoles = await queryInterface.sequelize.query(
        `SELECT "UserID","RoleID" FROM "UserRoles" WHERE "UserID" IN (:userIds);`,
        {
          replacements: { userIds: allUsers.map((u) => u.ID) },
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        }
      );
      const existingSet = new Set(
        existingUserRoles.map((ur) => `${ur.UserID}-${ur.RoleID}`)
      );

      const userRolesToInsert = desiredUserRoles
        .map(({ email, roleName }) => {
          const userId = userMap[email];
          const roleId = roleMap[roleName];
          if (!userId || !roleId) return null;
          const key = `${userId}-${roleId}`;
          if (existingSet.has(key)) return null;
          return {
            ID: uuidv4(),
            UserID: userId,
            RoleID: roleId,
            createdAt: now,
            updatedAt: now,
          };
        })
        .filter(Boolean);

      if (userRolesToInsert.length > 0) {
        await queryInterface.bulkInsert('UserRoles', userRolesToInsert, {
          transaction,
        });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const USER_EMAILS = [
        'admin@greenprep.com',
        'teacher@greenprep.com',
        'student@greenprep.com',
      ];

      const users = await queryInterface.sequelize.query(
        `SELECT "ID","email" FROM "Users" WHERE "email" IN (:emails);`,
        {
          replacements: { emails: USER_EMAILS },
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        }
      );
      const userIds = users.map((u) => u.ID);

      if (userIds.length > 0) {
        await queryInterface.bulkDelete(
          'UserRoles',
          { UserID: userIds },
          { transaction }
        );
        await queryInterface.bulkDelete(
          'Users',
          { email: USER_EMAILS },
          { transaction }
        );
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
