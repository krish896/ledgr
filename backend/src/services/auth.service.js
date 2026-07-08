const { z } = require("zod");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/jwt");
const ConflictError = require("../errors/ConflictError");
const UnauthorizedError = require("../errors/UnauthorizedError");
const NotFoundError = require("../errors/NotFoundError");
const ValidationError = require("../errors/ValidationError");

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

async function register(body) {
  const result = registerSchema.safeParse(body);
  if (!result.success) throw new ValidationError(result.error.issues[0].message);

  const existing = await prisma.user.findUnique({ where: { email: result.data.email } });
  if (existing) throw new ConflictError("Email already registered");

  const passwordHash = await bcrypt.hash(result.data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: result.data.email,
      passwordHash,
      name: null,
      upiId: null,
      profileCompleted: false,
    },
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    upiId: user.upiId,
    profileCompleted: user.profileCompleted,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return { user: safeUser, token };
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

async function login(body) {
  const result = loginSchema.safeParse(body);
  if (!result.success) throw new ValidationError(result.error.issues[0].message);

  const user = await prisma.user.findUnique({ where: { email: result.data.email } });
  if (!user) throw new UnauthorizedError("Invalid email or password");

  const match = await bcrypt.compare(result.data.password, user.passwordHash);
  if (!match) throw new UnauthorizedError("Invalid email or password");

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    upiId: user.upiId,
    profileCompleted: user.profileCompleted,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return { user: safeUser, token };
}

async function me(payload) {
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new NotFoundError("User not found");

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    upiId: user.upiId,
    profileCompleted: user.profileCompleted,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

module.exports = { register, login, me };
