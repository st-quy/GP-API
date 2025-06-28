const { Class, sequelize, User, Role } = require("../models");
const sequelizePaginate = require("sequelize-paginate");
const { Op, Sequelize } = require("sequelize");

async function findAll(req) {
  sequelizePaginate.paginate(Class);
  const { page = 1, limit = 10, teacherId, searchName } = req.query;
  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);
  try {
    let whereCondition = {};
    if (teacherId) {
      whereCondition.UserID = teacherId;
    }
    if (searchName) {
      whereCondition.className = {
        [Op.like]: `%${searchName}%`
      };
    }

    const options = {
      page: parsedPage,
      paginate: parsedLimit,
      where: whereCondition,
      include: [
        {
          association: "Sessions",
        },
      ],
      attributes: {
        include: [
          [
            sequelize.literal(
              '(SELECT COUNT(*) FROM "Sessions" WHERE "Sessions"."ClassID" = "Classes"."ID")'
            ),
            "numberOfSessions",
          ],
        ],
      },
      order: [["createdAt", "DESC"]]
    };

    const result = await Class.paginate(options);
    const totalCount = await Class.count({ where: whereCondition });

    return {
      status: 200,
      message: "Classes fetched successfully",
      data: result.docs,
      pagination: {
        currentPage: parseInt(req.query.page) || 1,
        pageSize: parseInt(req.query.limit) || 10,
        itemsOnPage: result.docs.length,
        totalPages: result.pages,
        totalItems: totalCount,
      }
    };
  } catch (error) {
    throw new Error(`Error fetching classes: ${error.message}`);
  }
}

async function createClass(req) {
  try {
    const { className, userId } = req.body;

    if (!className || !userId) {
      throw new Error("Class name and user ID are required");
    }

    // Check if class name already exists
    const existingClass = await Class.findOne({
      where: { className }
    });

    if (existingClass) {
      throw new Error("Class name already exists");
    }

    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error("User not found");
    } else {
      const hasTeacherRole = user.roleIDs.includes("teacher");
      if (!hasTeacherRole) {
        throw new Error("Only teachers can create classes");
      }
    }

    const newClass = await Class.create({
      className,
      UserID: userId,
    });

    return {
      status: 200,
      message: "Class created successfully",
      data: newClass,
    };
  } catch (error) {
    throw new Error(`Error creating class: ${error.message}`);
  }
}

async function getClassDetailById(req) {
  try {
    const { classId } = req.params;

    const classDetail = await Class.findOne({
      where: { ID: classId },
      include: [
        {
          association: "Sessions",
          include: [
            {
              association: "SessionParticipants",
            },
          ],
        },
      ],
    });

    if (!classDetail) {
      throw new Error(`Class with id ${classId} not found`);
    }

    return {
      status: 200,
      message: "Class details fetched successfully",
      data: classDetail,
    };
  } catch (error) {
    throw new Error(`Error fetching class details: ${error.message}`);
  }
}

async function updateClass(req) {
  try {
    const { className } = req.body;
    const { classId } = req.params;

    if (!className) {
      throw new Error("Class name is required");
    }

    const [updatedRows] = await Class.update(
      { className },
      {
        where: { ID: classId },
      }
    );
    if (updatedRows === 0) {
      throw new Error(`Class with id ${classId} not found or no changes made`);
    }
    return {
      status: 200,
      message: "Class updated successfully",
      data: updatedRows,
    };
  } catch (error) {
    throw new Error(`Error updating class: ${error.message}`);
  }
}

async function remove(req) {
  try {
    const { classId } = req.params;
    const deletedRows = await Class.destroy({ where: { ID: classId } });
    if (deletedRows === 0) {
      throw new Error(`Class with id ${classId} not found`);
    }
    return `Class with id ${classId} deleted successfully`;
  } catch (error) {
    throw new Error(`Error deleting class: ${error.message}`);
  }
}

module.exports = {
  findAll,
  createClass,
  updateClass,
  getClassDetailById,
  remove,
};
