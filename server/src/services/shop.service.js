const { prisma } = require('../prisma/client');
const { AppError } = require('../middleware/errorHandler');

// Shop catalog: the items that can exist. Types: theme | badge | title | avatar.
// Avatar art ships with the theme pass (9b): until then avatars are
// equippable collectibles and the portrait fallback still applies.
const SHOP_CATALOG = [
  { name: 'Crimson Keep Theme', description: 'Deep red banners for your halls.', cost: 100, type: 'theme' },
  { name: 'Obsidian Library Theme', description: 'Dark stone and candlelight.', cost: 150, type: 'theme' },
  { name: 'Golden Harvest Theme', description: 'Warm golds for legendary days.', cost: 250, type: 'theme' },
  { name: 'First Flame Badge', description: 'Proof of your first completed quest.', cost: 50, type: 'badge' },
  { name: 'Oathkeeper Badge', description: 'For heroes of the weekly grind.', cost: 120, type: 'badge' },
  { name: 'Dragonslayer Badge', description: 'For those who finish EPIC quests.', cost: 300, type: 'badge' },
  { name: 'Title: the Relentless', description: 'Append to your hero name.', cost: 60, type: 'title' },
  { name: 'Title: Bane of Procrastination', description: 'The rarest of honors.', cost: 200, type: 'title' },
  { name: 'Ember Fox Avatar', description: 'A cunning companion portrait.', cost: 90, type: 'avatar' },
  { name: 'Stone Golem Avatar', description: 'An unmovable portrait.', cost: 180, type: 'avatar' },
];

// Every function takes an injectable db (default: the real client) so the
// economy rules are unit-testable with plain fakes - no database needed.
async function seedShop(db = prisma) {
  let created = 0;
  for (const entry of SHOP_CATALOG) {
    const existing = await db.shopItem.findFirst({ where: { name: entry.name } });
    if (!existing) {
      await db.shopItem.create({ data: entry });
      created += 1;
    }
  }
  return { created, total: SHOP_CATALOG.length };
}

async function listShop(userId, db = prisma) {
  const [items, owned] = await Promise.all([
    db.shopItem.findMany({ orderBy: { cost: 'asc' } }),
    db.inventoryItem.findMany({ where: { userId } }),
  ]);
  const byItemId = new Map(owned.map((row) => [row.itemId, row]));
  return items.map((item) => ({
    ...item,
    owned: byItemId.has(item.id),
    equipped: Boolean(byItemId.get(item.id) && byItemId.get(item.id).equipped),
  }));
}

// Gold moves only here (and quest completion): conditional decrement inside a
// transaction, so concurrent purchases can never overdraw. A P2002 on the
// unique (userId, itemId) rolls the whole transaction back - no charge
// without an item, ever.
async function purchaseItem(userId, itemId, db = prisma) {
  const item = await db.shopItem.findUnique({ where: { id: itemId } });
  if (!item) throw new AppError(404, 'Shop item not found', 'ITEM_NOT_FOUND');
  const existing = await db.inventoryItem.findFirst({ where: { userId, itemId } });
  if (existing) throw new AppError(409, 'You already own this item', 'ALREADY_OWNED');

  try {
    return await db.$transaction(async (tx) => {
      const charged = await tx.user.updateMany({
        where: { id: userId, gold: { gte: item.cost } },
        data: { gold: { decrement: item.cost } },
      });
      if (charged.count !== 1) throw new AppError(402, 'Not enough gold', 'INSUFFICIENT_GOLD');
      const inventoryItem = await tx.inventoryItem.create({ data: { userId, itemId } });
      const user = await tx.user.findUnique({ where: { id: userId } });
      return { item, inventoryItem, gold: user ? user.gold : 0 };
    });
  } catch (err) {
    if (err && err.code === 'P2002') {
      throw new AppError(409, 'You already own this item', 'ALREADY_OWNED');
    }
    throw err;
  }
}

async function getInventory(userId, db = prisma) {
  const rows = await db.inventoryItem.findMany({
    where: { userId },
    orderBy: { acquiredAt: 'desc' },
  });
  if (rows.length === 0) return [];
  const items = await db.shopItem.findMany({ where: { id: { in: rows.map((r) => r.itemId) } } });
  const byId = new Map(items.map((item) => [item.id, item]));
  return rows.map((row) => ({ ...row, item: byId.get(row.itemId) || null }));
}

// One active item per type: equipping unequips same-type siblings.
async function setEquipped(userId, inventoryId, equipped, db = prisma) {
  const row = await db.inventoryItem.findFirst({ where: { id: inventoryId, userId } });
  if (!row) throw new AppError(404, 'Inventory item not found', 'INVENTORY_NOT_FOUND');
  const item = await db.shopItem.findUnique({ where: { id: row.itemId } });
  if (!item) throw new AppError(404, 'Shop item not found', 'ITEM_NOT_FOUND');

  if (equipped) {
    const siblings = await db.inventoryItem.findMany({ where: { userId }, select: { id: true, itemId: true } });
    const candidates = await db.shopItem.findMany({
      where: { id: { in: siblings.map((s) => s.itemId) } },
      select: { id: true, type: true },
    });
    const typeByItem = new Map(candidates.map((c) => [c.id, c.type]));
    const sameType = siblings
      .filter((s) => s.id !== row.id && typeByItem.get(s.itemId) === item.type)
      .map((s) => s.id);
    if (sameType.length > 0) {
      await db.inventoryItem.updateMany({ where: { id: { in: sameType } }, data: { equipped: false } });
    }
  }
  const updated = await db.inventoryItem.update({ where: { id: row.id }, data: { equipped } });
  return { inventoryItem: updated, item };
}

module.exports = { SHOP_CATALOG, seedShop, listShop, purchaseItem, getInventory, setEquipped };
