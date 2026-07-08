const { z } = require("zod");
const prisma = require("../lib/prisma");
const ValidationError = require("../errors/ValidationError");

const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
});

async function createGroup(body, actor) {
  const result = createGroupSchema.safeParse(body);
  if (!result.success) throw new ValidationError(result.error.issues[0].message);

  const createdGroup = await prisma.$transaction(async (tx) => {
    const group = await tx.group.create({
      data: {
        name: result.data.name,
        description: result.data.description ?? null,
        createdById: actor.userId,
      },
    });

    await tx.groupMember.create({
      data: {
        groupId: group.id,
        userId: actor.userId,
      },
    });

    return group;
  });

  return {
    group: {
      id: createdGroup.id,
      name: createdGroup.name,
      description: createdGroup.description,
      createdAt: createdGroup.createdAt,
      updatedAt: createdGroup.updatedAt,
    },
  };
}

async function getGroups(actor) {
  return { message: "Get Groups endpoint working" };
}

async function getGroupById(groupId, actor) {
  return { message: "Get Group By Id endpoint working" };
}

async function updateGroup(groupId, body, actor) {
  return { message: "Update Group endpoint working" };
}

async function addMember(groupId, body, actor) {
  return { message: "Add Member endpoint working" };
}

module.exports = { createGroup, getGroups, getGroupById, updateGroup, addMember };
