const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const bcrypt = require('bcryptjs');
const { resolve } = require('path');

const dbPath = resolve('./prisma/dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash('ftm2026farhan', 12);
  const updated = await prisma.adminUser.updateMany({
    where: {},
    data: { email: 'multimedia@ftm26', passwordHash: hash }
  });
  console.log('Updated users:', updated.count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
