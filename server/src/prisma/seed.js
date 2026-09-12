// Prisma seed entrypoint: `npm run db:seed -w server` (needs a live DATABASE_URL).
// Idempotent: existing catalog entries (matched by name) are left untouched.
const { prisma } = require('./client');
const { seedShop, SHOP_CATALOG } = require('../services/shop.service');

async function main() {
  const { created } = await seedShop(prisma);
  console.log(`Shop seed complete: ${created} new item(s), catalog holds ${SHOP_CATALOG.length}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
