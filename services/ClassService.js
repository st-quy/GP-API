const { Class, sequelize, User, Role, Session } = require('../models');
const sequelizePaginate = require('sequelize-paginate');
const { Op, Sequelize } = require('sequelize');

async function findAll(req) {
  try {
    sequelizePaginate.paginate(Class);
    const { page = 1, limit = 10, teacherId, searchName } = req.query;
    
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;

    let whereCondition = {};
    if (teacherId) {
      whereCondition.UserID = teacherId;
    }
    if (searchName) {
      whereCondition.className = {
        [Op.iLike]: `%${searchName}%`,
      };
    }

    const options = {
      page: parsedPage,
      paginate: parsedLimit,
      where: whereCondition,
      attributes: [
        'ID',
        'className',
        'createdAt',
        'updatedAt',
        'UserID',
        [
          sequelize.literal(
            '(SELECT COUNT(*)::int FROM "Sessions" WHERE "Sessions"."ClassID" = "Classes"."ID")'
          ),
          'numberOfSessions',
        ],
      ],
      order: [['createdAt', 'DESC']],
    };

    const result = await Class.paginate(options);

    return {
      status: 200,
      message: 'Classes fetched successfully',
      data: result.docs,
      total: result.total,
      page: result.page,
      pages: result.pages,
    };
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw new Error(`Error fetching classes: ${error.message}`);
  }
}

async function createClass(req) {
  try {
    const { className, userId } = req.body;

    if (!className || !userId) {
      throw new Error('Missing required fields: className or userId');
    }

    const newClass = await Class.create({
      className,
      UserID: userId,
    });

    return {
      status: 201,
      message: 'Class created successfully',
      data: newClass,
    };
  } catch (error) {
    throw new Error(`Error creating class: ${error.message}`);
  }
}

async function updateClass(req) {
  try {
    const { classId } = req.params;
    const { className } = req.body;

    if (!className) {
      throw new Error('Missing required fields: className');
    }

    const classToUpdate = await Class.findByPk(classId);

    if (!classToUpdate) {
      throw new Error(`Class with id ${classId} not found`);
    }

    classToUpdate.className = className;
    await classToUpdate.save();

    return {
      status: 200,
      message: 'Class updated successfully',
      data: classToUpdate,
    };
  } catch (error) {
    throw new Error(`Error updating class: ${error.message}`);
  }
}

async function getClassDetailById(req) {
  try {
    const { classId } = req.params;

    const classDetail = await Class.findOne({
      where: { ID: classId },
      attributes: ['ID', 'className', 'UserID', 'createdAt', 'updatedAt'],
      include: [
        {
          association: 'Sessions',
          attributes: {
            include: [
              [
                sequelize.literal(
                  '(SELECT COUNT(*)::int FROM "SessionParticipants" WHERE "SessionParticipants"."SessionID" = "Sessions"."ID")'
                ),
                'participantCount',
              ],
            ],
          },
        },
      ],
      order: [[{ model: Session, as: 'Sessions' }, 'createdAt', 'DESC']],
    });

    if (!classDetail) {
      throw new Error(`Class with id ${classId} not found`);
    }

    return {
      status: 200,
      message: 'Class details fetched successfully',
      data: classDetail,
    };
  } catch (error) {
    throw new Error(`Error fetching class details: ${error.message}`);
  }
}

async function remove(req) {
  try {
    const { classId } = req.params;
    const classToDelete = await Class.findByPk(classId);

    if (!classToDelete) {
      throw new Error(`Class with id ${classId} not found`);
    }

    // [STABILITY]: Check for existing sessions before deletion
    const sessionCount = await Session.count({ where: { ClassID: classId } });
    
    if (sessionCount > 0) {
      throw new Error("Can't delete this class because it has sessions");
    }

    await classToDelete.destroy();

    return `Class with id ${classId} deleted successfully`;
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = {
  findAll,
  createClass,
  updateClass,
  getClassDetailById,
  remove,
};
