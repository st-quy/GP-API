const { Part, Skill, Question } = require('../models');
const { Op } = require('sequelize');

/**
 * Helper: resolve Skill từ skillId hoặc skillName
 */
async function resolveSkill({ skillId, skillName }) {
  if (!skillId && !skillName) {
    return null;
  }

  let skill = null;

  if (skillId) {
    skill = await Skill.findByPk(skillId);
    if (!skill) {
      throw new Error(`Skill with id ${skillId} not found`);
    }
  } else if (skillName) {
    skill = await Skill.findOne({ where: { Name: skillName } });
    if (!skill) {
      throw new Error(`Skill "${skillName}" not found`);
    }
  }

  return skill;
}

async function createPart(req) {
  try {
    const { content, subContent, sequence, skillId, skillName } = req.body;

    if (!content) {
      return { status: 400, message: 'Content is required' };
    }

    let skill = null;
    let SkillID = null;

    try {
      skill = await resolveSkill({ skillId, skillName });
      SkillID = skill ? skill.ID : null;
    } catch (err) {
      return { status: 400, message: err.message };
    }

    const newPart = await Part.create({
      Content: content,
      SubContent: subContent || null,
      Sequence: sequence ?? null,
      SkillID,
    });

    return {
      status: 201,
      message: 'Part created successfully',
      data: newPart,
    };
  } catch (error) {
    throw new Error(`Error creating part: ${error.message}`);
  }
}

async function updatePart(req) {
  try {
    const { partId } = req.params;
    const { content, subContent, sequence, skillId, skillName } = req.body;

    const part = await Part.findByPk(partId);
    if (!part) {
      return {
        status: 404,
        message: `Part with id ${partId} not found`,
      };
    }

    let SkillID = part.SkillID;

    // Nếu FE gửi skillId / skillName thì update luôn Skill cho Part
    if (skillId || skillName) {
      try {
        const skill = await resolveSkill({ skillId, skillName });
        SkillID = skill ? skill.ID : null;
      } catch (err) {
        return { status: 400, message: err.message };
      }
    }

    await part.update({
      Content: content ?? part.Content,
      SubContent: subContent ?? part.SubContent,
      Sequence: sequence ?? part.Sequence,
      SkillID,
    });

    return {
      status: 200,
      message: 'Part updated successfully',
      data: part,
    };
  } catch (error) {
    throw new Error(`Error updating part: ${error.message}`);
  }
}

async function getPartByID(req) {
  try {
    const { partId } = req.params;
    const part = await Part.findOne({
      where: { ID: partId },
      include: [
        {
          model: Skill,
          as: 'Skill',
          attributes: ['ID', 'Name'],
        },
      ],
    });

    if (!part) {
      return {
        status: 404,
        message: `Part with id ${partId} not found`,
      };
    }

    return {
      status: 200,
      message: 'Part fetched successfully',
      data: part,
    };
  } catch (error) {
    throw new Error(`Error fetching part: ${error.message}`);
  }
}

/**
 * GET /parts?skillId=...&skillName=...
 * - Nếu không truyền skill => trả về tất cả Part
 * - Nếu truyền skillId / skillName => filter theo Skill
 */
async function getAllPart(req) {
  try {
    const { skillId, skillName, searchName } = req.query || {};

    // Pagination params
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    let where = {};

    // Filter theo skill
    if (skillId || skillName) {
      try {
        const skill = await resolveSkill({ skillId, skillName });
        if (!skill) {
          return {
            status: 400,
            message: 'Skill not found',
          };
        }
        where.SkillID = skill.ID;
      } catch (err) {
        return { status: 400, message: err.message };
      }
    }

    // SEARCH theo Content
    if (searchName) {
      where.Content = { [Op.iLike]: `%${searchName}%` };
    }

    // COUNT tổng số Part phù hợp
    const total = await Part.count({ where });

    // FETCH có phân trang
    const parts = await Part.findAll({
      where,
      limit,
      offset,
      order: [['Sequence', 'ASC']],
      include: [
        {
          model: Skill,
          as: 'Skill',
          attributes: ['ID', 'Name'],
        },
        {
          model: Question,
          as: 'Questions',
          required: false,
          order: [['createdAt', 'DESC']],
        },
      ],
    });

    return {
      status: 200,
      message: 'Parts fetched successfully',
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      data: parts,
    };
  } catch (error) {
    throw new Error(`Error fetching parts: ${error.message}`);
  }
}

async function deletePart(req) {
  try {
    const { partId } = req.params;
    const part = await Part.findByPk(partId);
    if (!part) {
      return {
        status: 404,
        message: `Part with id ${partId} not found`,
      };
    }

    await part.destroy();
    return {
      status: 200,
      message: 'Part deleted successfully',
    };
  } catch (error) {
    throw new Error(`Error deleting part: ${error.message}`);
  }
}

module.exports = {
  createPart,
  updatePart,
  getPartByID,
  getAllPart,
  deletePart,
};
