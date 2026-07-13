const prisma = require("./prisma");
const NotFoundError = require("../errors/NotFoundError");

async function ensureActiveMember(groupId, userId) {
  const membership = await prisma.groupMember.findFirst({
    where: { groupId, userId, removedAt: null },
  });
  if (!membership) throw new NotFoundError("Group not found");
  return membership;
}

module.exports = { ensureActiveMember };
