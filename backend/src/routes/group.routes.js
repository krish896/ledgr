const express = require("express");
const {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  addMember,
} = require("../controllers/group.controller");

const router = express.Router();

router.post("/", createGroup);
router.get("/", getGroups);
router.get("/:groupId", getGroupById);
router.patch("/:groupId", updateGroup);
router.post("/:groupId/members", addMember);

module.exports = router;
