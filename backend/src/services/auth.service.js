const { z } = require("zod");

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

async function register(body) {
  const result = registerSchema.safeParse(body);
  if (!result.success) throw result.error;
  return { message: "Validation successful" };
}

module.exports = { register };
