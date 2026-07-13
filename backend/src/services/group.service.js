const { z } = require("zod");
const prisma = require("../lib/prisma");
const ValidationError = require("../errors/ValidationError");
const NotFoundError = require("../errors/NotFoundError");
const ConflictError = require("../errors/ConflictError");
const { ensureActiveMember } = require("../lib/groupMembership");
const { computeGroupBalances } = require("../lib/computeGroupBalances");

const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
});

const updateGroupSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
});

const addMemberSchema = z.object({
  email: z.string().email(),
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
  const memberships = await prisma.groupMember.findMany({
    where: { userId: actor.userId, removedAt: null },
    include: { group: true },
  });

  return {
    groups: memberships.map(({ group }) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    })),
  };
}

async function getGroupById(groupId, actor) {
  await ensureActiveMember(groupId, actor.userId);

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        where: { removedAt: null },
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      },
    },
  });

  return {
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      members: group.members.map(({ user }) => user),
    },
  };
}

async function updateGroup(groupId, body, actor) {
  const result = updateGroupSchema.safeParse(body);
  if (!result.success) throw new ValidationError(result.error.issues[0].message);
  if (Object.keys(result.data).length === 0) throw new ValidationError("At least one field must be provided");

  await ensureActiveMember(groupId, actor.userId);

  const group = await prisma.group.update({
    where: { id: groupId },
    data: result.data,
  });

  return {
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    },
  };
}

async function addMember(groupId, body, actor) {
  const result = addMemberSchema.safeParse(body);
  if (!result.success) throw new ValidationError(result.error.issues[0].message);

  await ensureActiveMember(groupId, actor.userId);

  const userToAdd = await prisma.user.findUnique({ where: { email: result.data.email } });
  if (!userToAdd) throw new NotFoundError("User not found");

  const existing = await prisma.groupMember.findFirst({
    where: { groupId, userId: userToAdd.id, removedAt: null },
  });
  if (existing) throw new ConflictError("User is already a member");

  await prisma.groupMember.create({
    data: { groupId, userId: userToAdd.id },
  });

  return {
    member: {
      id: userToAdd.id,
      email: userToAdd.email,
      name: userToAdd.name,
    },
  };
}

async function getBalances(groupId, actor) {
  await ensureActiveMember(groupId, actor.userId);

  const balances = await computeGroupBalances(groupId);

  const filteredBalances = balances.filter(
    (b) => b.fromUserId === actor.userId || b.toUserId === actor.userId
  );

  return { balances: filteredBalances };
}

module.exports = { createGroup, getGroups, getGroupById, updateGroup, addMember, getBalances };
