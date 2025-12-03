const {
  Part,
  Skill,
  Question,
  Section,
  TopicSection,
  SectionPart,
} = require('../models');
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
        { model: Skill, as: 'Skill', attributes: ['ID', 'Name'] },
        {
          model: Part,
          as: 'Parts',
          required: false,
          include: [{ model: Question, as: 'Questions', required: false }],
        },
      ],
    });

    // sort Parts và Questions theo Sequence
    const sortedSections = sections.map((section) => {
      const parts = (section.Parts || [])
        .slice()
        .sort((a, b) => a.Sequence - b.Sequence);
      parts.forEach((part) => {
        part.Questions = (part.Questions || [])
          .slice()
          .sort((a, b) => a.Sequence - b.Sequence);
      });
      return { ...section.toJSON(), Parts: parts };
    });

    return {
      status: 200,
      message: 'Sections fetched successfully',
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      data: sortedSections,
    };
  } catch (error) {
    throw new Error(`Error fetching parts: ${error.message}`);
  }
}

async function createSection(req) {
  try {
    const { Name, SkillID } = req.body;
    if (!Name || !SkillID) {
      return {
        status: 400,
        message: 'Name and SkillID are required',
      };
    }
    const skill = await Skill.findByPk(SkillID);
    if (!skill) {
      return {
        status: 404,
        message: `Skill with ID ${SkillID} not found`,
      };
    }
    const newSection = await Section.create({
      Name,
      SkillID,
    });
    return {
      status: 201,
      message: 'Section created successfully',
      data: newSection,
    };
  } catch (error) {
    throw new Error(`Error creating Section: ${error.message}`);
  }
}
/* ============================================================
   UPDATE SECTION
   ============================================================ */
async function updateSection(req) {
  try {
    const { id } = req.params;
    const { name, skillId, skillName } = req.body;

    if (!id) {
      return { status: 400, message: 'Section ID is required' };
    }

    // 1) Find existing section
    const section = await Section.findByPk(id);
    if (!section) {
      return { status: 404, message: `Section with id ${id} not found` };
    }

    // 2) Resolve new skill if provided
    let updatedSkillId = section.SkillID;

    if (skillId || skillName) {
      const skill = await Skill.findOne({
        where: {
          ...(skillId && { ID: skillId }),
          ...(skillName && { Name: skillName }),
        },
      });

      if (!skill) {
        return { status: 400, message: 'Skill not found' };
      }

      updatedSkillId = skill.ID;
    }

    // 3) Update fields
    section.Name = name || section.Name;
    section.SkillID = updatedSkillId;

    await section.save();

    return {
      status: 200,
      message: 'Section updated successfully',
      data: section,
    };
  } catch (error) {
    return {
      status: 500,
      message: `Error updating section: ${error.message}`,
    };
  }
}

/* ============================================================
   DELETE SECTION
   - Xóa Section
   - Xóa kèm mapping SectionPart nếu có
   - KHÔNG xóa Part hay Question (tránh mất dữ liệu)
   ============================================================ */
async function deleteSection(req) {
  const t = await Section.sequelize.transaction();

  try {
    const { id } = req.params;

    if (!id) {
      return { status: 400, message: 'Section ID is required' };
    }

    // 1) Kiểm tra Section tồn tại
    const section = await Section.findByPk(id, { transaction: t });
    if (!section) {
      await t.rollback();
      return { status: 404, message: `Section with id ${id} not found` };
    }

    // 2) Kiểm tra section có đang dùng trong TopicSection không
    const usageCount = await TopicSection.count({
      where: { SectionID: id },
      transaction: t,
    });

    if (usageCount > 0) {
      await t.rollback();
      return {
        status: 400,
        message:
          'Cannot delete section because it is already used in one or more Topics',
        usedByTopics: usageCount,
      };
    }

    // 3) Lấy danh sách Part qua SectionPart
    const sectionParts = await SectionPart.findAll({
      where: { SectionID: id },
      transaction: t,
    });

    const partIDs = sectionParts.map((sp) => sp.PartID);

    // 4) Xóa Question theo PartID
    if (partIDs.length > 0) {
      await Question.destroy({
        where: { PartID: partIDs },
        transaction: t,
      });

      // 5) Xóa Part
      await Part.destroy({
        where: { ID: partIDs },
        transaction: t,
      });
    }

    // 6) Xóa SectionPart mapping
    await SectionPart.destroy({
      where: { SectionID: id },
      transaction: t,
    });

    // 7) Xóa Section
    await section.destroy({ transaction: t });

    await t.commit();

    return {
      status: 200,
      message:
        'Section and its linked Parts and Questions deleted successfully',
    };
  } catch (error) {
    await t.rollback();
    return {
      status: 500,
      message: `Error deleting section: ${error.message}`,
    };
  }
}

module.exports = {
  getAllSection,
  updateSection,
  deleteSection,
  createSection,
};
