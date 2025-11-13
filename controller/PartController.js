const PartService = require("../services/PartService");

const createPart = async (req, res) => {
  try {
    const parts = await PartService.createPart(req);
    return res.status(parts.status).json(result);
  } catch (error) {
    console.error("Error creating part:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updatePart = async (req, res) => {
  try {
    const updatedPart = await PartService.updatePart(req);
    return res.status(updatedPart.status).json(updatedPart);
  } catch (error) {
    console.error("Error updating part:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getPartByID = async (req, res) => {
  try {
    const part = await PartService.getPartByID(req);
    return res.status(part.status).json(part);
  } catch (error) {
    console.error("Error fetching part by ID:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllPart = async (req, res) => {
  try {
    const parts = await PartService.getAllPart(req);
    return res.status(parts.status).json(parts);
  } catch (error) {
    console.error("Error fetching parts:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deletePart = async (req, res) => {
  try {
    const deletedPart = await PartService.deletePart(req);
    return res.status(deletedPart.status).json(deletedPart);
  } catch (error) {
    console.error("Error deleting part:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = {
  createPart,
  updatePart,
  getPartByID,
  getAllPart,
  deletePart,
};
