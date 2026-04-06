const { Class, sequelize, User, Role } = require('../models');
const sequelizePaginate = require('sequelize-paginate');
const { Op, Sequelize } = require('sequelize');
const { logActivity } = require('./ActivityLogService');

async function findAll(req) {
  sequelizePaginate.paginate(Class);
  const { page = 1, limit, teacherId, searchName } = req.query;
  const parsedPage = parseInt(page, 10);
  const parsedLimit = limit ? parseInt(limit, 10) : null;
  try {
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
      paginate: parsedLimit || undefined,
      where: whereCondition,
      include: [
        {
          association: 'Sessions',
        },
      ],
      attributes: {
        include: [
          [
            sequelize.literal(
              '(SELECT COUNT(*) FROM "Sessions" WHERE "Sessions"."ClassID" = "Classes"."ID")'
            ),
            'numberOfSessions',
          ],
        ],
      },
      order: [['createdAt', 'DESC']],
    };

    const result = await Class.paginate(options);
    const totalCount = await Class.count({ where: whereCondition });

    return {
      status: 200,
      message: 'Classes fetched successfully',
      data: result.docs,
      total: totalCount,
      pagination: {
        currentPage: parseInt(req.query.page) || 1,
        pageSize: parseInt(req.query.limit) || 10,
        itemsOnPage: result.docs.length,
        totalPages: result.pages,
      },
    };
  } catch (error) {
    throw new Error(`Error fetching classes: ${error.message}`);
  }
}

async function createClass(req) {
  try {
    let { className, userId } = req.body;

    if (!className || !userId) {
      throw new Error('Class name and user ID are required');
    }

    // Normalize: Trim and collapse multiple spaces into one
    className = className.trim().replace(/\s+/g, ' ');

    // 1. Check class name trùng (Case-insensitive)
    const existingClass = await Class.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('className')),
        '=',
        className.toLowerCase()
      ),
    });

    if (existingClass) {
      throw new Error('Class name already exists');
    }

    // 2. Tìm user + roles
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          attributes: ['Name'],
          through: { attributes: [] }, // ẩn bảng UserRole
        },
      ],
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 3. Check user có role "teacher" hoặc "admin"
    const roles = (user.Roles || []).map((r) => r.Name);
    const hasTeacherRole = roles.includes('teacher');
    const hasAdminRole = roles.includes('admin');

    if (!hasTeacherRole && !hasAdminRole) {
      throw new Error('Only teachers and admins can create classes');
    }

    // 4. Tạo class
    const newClass = await Class.create({
      className,
      UserID: userId,
    });

    const userIdFromReq = req.user?.userId || null;
    logActivity({
      userId: userIdFromReq,
      action: 'create',
      entityType: 'class',
      entityID: newClass.ID,
      entityName: className,
      details: `Class "${className}" created`,
    });

    return {
      status: 200,
      message: 'Class created successfully',
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
          association: 'Sessions',
          attributes: {
            include: [
              [
                sequelize.literal(
                  '(SELECT COUNT(*) FROM "SessionParticipants" WHERE "SessionParticipants"."SessionID" = "Sessions"."ID")'
                ),
                'participantCount',
              ],
            ],
          },
          include: [
            {
              association: 'SessionParticipants',
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
      message: 'Class details fetched successfully',
      data: classDetail,
    };
  } catch (error) {
    throw new Error(`Error fetching class details: ${error.message}`);
  }
}

async function updateClass(req) {
  try {
    let { className } = req.body;
    const { classId } = req.params;

    if (!className) {
      throw new Error('Class name is required');
    }

    const existingClass = await Class.findByPk(classId);
    if (!existingClass) {
      throw new Error(`Class with id ${classId} not found`);
    }

    const oldClassName = existingClass.className;

    // Normalize: Trim and collapse multiple spaces into one
    className = className.trim().replace(/\s+/g, ' ');

    // Check if another class already has this name (Case-insensitive)
    const duplicateClass = await Class.findOne({
      where: {
        [Op.and]: [
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('className')),
            '=',
            className.toLowerCase()
          ),
          { ID: { [Op.ne]: classId } }
        ]
      },
    });

    if (duplicateClass) {
      throw new Error('Class name already exists');
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

    const userIdFromReq = req.user?.userId || null;
    logActivity({
      userId: userIdFromReq,
      action: 'update',
      entityType: 'class',
      entityID: classId,
      entityName: className,
      details: `Class "${oldClassName}" renamed to "${className}"`,
    });

    return {
      status: 200,
      message: 'Class updated successfully',
      data: updatedRows,
    };
  } catch (error) {
    throw new Error(`Error updating class: ${error.message}`);
  }
}

async function remove(req) {
  try {
    const { classId } = req.params;
    
    const classToDelete = await Class.findByPk(classId);
    const className = classToDelete ? classToDelete.className : classId;
    
    const deletedRows = await Class.destroy({ where: { ID: classId } });
    if (deletedRows === 0) {
      throw new Error(`Class with id ${classId} not found`);
    }

    const userIdFromReq = req.user?.userId || null;
    logActivity({
      userId: userIdFromReq,
      action: 'delete',
      entityType: 'class',
      entityID: classId,
      entityName: className,
      details: `Class "${className}" deleted`,
    });

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
