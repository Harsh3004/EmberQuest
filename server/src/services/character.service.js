const { prisma } = require('../prisma/client');
const { xpForCharacterLevel, xpForAttributeLevel } = require('./progression.service');

// Snapshot shared by GET /api/character and the complete-quest response,
// so the XP bar, gold, streak and trees always come from one builder.
function characterSnapshot(user, attributes) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    level: user.level,
    totalXp: user.totalXp,
    gold: user.gold,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    // Raw timestamp for the flame's at-risk state (UTC-day compare, client-side).
    lastActiveDay: user.lastActiveDay ? new Date(user.lastActiveDay).toISOString() : null,
    xpToNextLevel: xpForCharacterLevel(user.level) - user.totalXp,
    attributes: attributes.map((a) => ({
      name: a.name,
      level: a.level,
      currentXp: a.currentXp,
      xpToNextLevel: xpForAttributeLevel(a.level) - a.currentXp,
    })),
  };
}

async function getCharacter(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const attributes = await prisma.attribute.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
  return characterSnapshot(user, attributes);
}

// Returns null when the user row is gone (P2025) so the controller can 404.
async function updateAvatar(userId, avatarUrl) {
  try {
    await prisma.user.update({ where: { id: userId }, data: { avatarUrl } });
  } catch (err) {
    if (err && err.code === 'P2025') return null;
    throw err;
  }
  return getCharacter(userId);
}

module.exports = { characterSnapshot, getCharacter, updateAvatar };
