const { Part, Skill, Question, Section, SectionPart } = require('../models');
const { Op } = require('sequelize');

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

async function getAllSection(req) {
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
      where.Name = { [Op.iLike]: `%${searchName}%` };
    }

    // COUNT tổng số Part phù hợp
    const total = await Section.count({ where });

    // FETCH có phân trang
    const sections = await Section.findAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Skill,
          as: 'Skill',
          attributes: ['ID', 'Name'],
        },
        {
          model: Part,
          as: 'Parts',
          required: false,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: Question,
              as: 'Questions',
              required: false,
              order: [['createdAt', 'DESC']],
            },
          ],
        },
      ],
    });

    return {
      status: 200,
      message: 'Sections fetched successfully',
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      data: sections,
    };
  } catch (error) {
    throw new Error(`Error fetching parts: ${error.message}`);
  }
}
module.exports = {
  getAllSection,
};
