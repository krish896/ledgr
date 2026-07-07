const prisma = require("../src/lib/prisma");

async function main() {
  const result = await prisma.user.deleteMany();

  console.log(result);

  const users = await prisma.user.findMany();
  console.log(users);
}

main()
  .catch((err) => {
    console.error("Error:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
