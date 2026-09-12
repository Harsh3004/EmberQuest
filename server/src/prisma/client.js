// Shared PrismaClient singleton (plain JS, CommonJS).
// Stored on globalThis so `node --watch` reloads and Jest workers
// never open more than one connection pool per process.
const { PrismaClient } = require('@prisma/client');

if (!globalThis.__emberquestPrisma) {
  globalThis.__emberquestPrisma = new PrismaClient();
}

const prisma = globalThis.__emberquestPrisma;

module.exports = { prisma };
