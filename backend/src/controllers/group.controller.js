const groupService = require("../services/group.service");

async function createGroup(req, res) {
  const result = await groupService.createGroup(req.body, req.user);
  res.status(201).json(result);
}

async function getGroups(req, res) {
  const result = await groupService.getGroups(req.user);
  res.status(200).json(result);
}

async function getGroupById(req, res) {
  const result = await groupService.getGroupById(req.params.groupId, req.user);
  res.status(200).json(result);
}

async function updateGroup(req, res) {
  const result = await groupService.updateGroup(req.params.groupId, req.body, req.user);
  res.status(200).json(result);
}

async function addMember(req, res) {
  const result = await groupService.addMember(req.params.groupId, req.body, req.user);
  res.status(201).json(result);
}

module.exports = { createGroup, getGroups, getGroupById, updateGroup, addMember };
