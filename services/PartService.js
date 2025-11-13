const { Part } = require("../models");

async function createPart(req) {
  try {
    const { content, subContent, sequence } = req.body;
    if (!content) return { status: 400, message: "Content is required" };
    const newPart = await Part.create({
      Content: content,
      SubContent: subContent || null,
      Sequence: sequence ?? null,
    });
    return {
      status: 201,
      message: "Part created successfully",
      data: newPart,
    };
  } catch (error) {
    throw new Error(`Error creating part: ${error.message}`);
  }
}

async function updatePart(req) {
  try {
    const { partId } = req.params;
    const { content, subContent, sequence } = req.body;
    const part = await Part.findByPk(partId);
    if (!part) {
      return {
        status: 404,
        message: `Part with id ${partId} not found`,
      };
    } else {
      await part.update({
        Content: content ?? part.Content,
        SubContent: subContent ?? part.SubContent,
        Sequence: sequence ?? part.Sequence,
      });
      return { status: 200, message: "Part updated successfully", data: part };
    }
  } catch (error) {
    throw new Error(`Error updating part: ${error.message}`);
  }
}

async function getPartByID(req) {
  try {
    const { partId } = req.params;
    const part = await Part.findOne({ where: { ID: partId } });
    if (!part)
      return {
        status: 404,
        message: `Part with id ${partId} not found`,
      };
    return { status: 200, message: "Part fetched successfully", data: part };
  } catch (error) {
    throw new Error(`Error fetching part: ${error.message}`);
  }
}

async function getAllPart() {
  try {
    const parts = await Part.findAll({ order: [["createdAt", "DESC"]] });
    return {
      status: 200,
      message: "Parts fetched successfully",
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
      message: "Part deleted successfully",
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
