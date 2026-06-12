import { prisma } from "./lib/prisma";

async function main() {
  const matches = await prisma.match.findMany({
    include: { participants: true }
  });
  console.log(JSON.stringify(matches, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
