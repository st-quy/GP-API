const express = require("express");
const router = express.Router();
const { allowAnonymous, authorize } = require("../middleware/AuthMiddleware");
const {
  createPart,
  updatePart,
  getPartByID,
  getAllPart,
  deletePart,
  getPartByPartID,
} = require("../controller/PartController");

router.get("/", getAllPart);
router.get("/:partId", getPartByID);
router.post("/", authorize(['teacher', 'admin']), createPart);
router.put("/:partId", authorize(['teacher', 'admin']), updatePart);
router.delete("/:partId", authorize(['teacher', 'admin']), deletePart);
router.get("/by/partId/:partId", getPartByPartID);

module.exports = router;
