const { prisma } = require('../prisma/client');
const { AppError } = require('../middleware/errorHandler');
const { characterSnapshot } = require('./character.service');
// Reward table lives in the progression engine (single source of truth);
// re-exported here so existing importers keep working.
const {
  REWARD_TABLE,
  rewardsFor,
  computeStreak,
  streakBonusPercent,
  applyStreakBonus,
  applyXp,
  xpForCharacterLevel,
  xpForAttributeLevel,
} = require('./progression.service');

const STATUS_BY_FILTER = { active: 'ACTIVE', completed: 'COMPLETED' };

async function createQuest(userId, fields) {
  const { xpReward, goldReward } = rewardsFor(fields.difficulty);
  return prisma.quest.create({
    data: {
      userId,
      title: fields.title,
      description: fields.description ?? null,
      attribute: fields.attribute,
      difficulty: fields.difficulty,
      xpReward,
      goldReward,
      recurrence: fields.recurrence,
      dueDate: fields.dueDate ?? null,
    },
  });
}

async function listQuests(userId, filter) {
  return prisma.quest.findMany({
    where: { userId, status: STATUS_BY_FILTER[filter] },
    orderBy: { createdAt: 'desc' },
  });
}

// Ownership is always part of the lookup: another user's id can never match,
// and a miss is a plain 404 so quest existence is never leaked.
async function findOwnQuest(userId, id) {
  return prisma.quest.findFirst({ where: { id, userId } });
}

async function updateQuest(id, data) {
  return prisma.quest.update({ where: { id }, data });
}

async function removeQuest(id) {
  return prisma.quest.delete({ where: { id } });
}

// THE progression transaction: the only code path that touches XP/gold.
// The client sends no payload - rewards come from the STORED quest row.
// Race-safe: the claim (updateMany on ACTIVE) is atomic. count === 1 means
// THIS call completed the quest and awards exactly once; count === 0 means
// someone else got there first (or the row is gone/archived), so this call
// is a read-only no-op / 404 / 409 and can never double-award.
async function completeQuest(userId, questId, { today = new Date() } = {}) {
  return prisma.$transaction(
    async (tx) => {
      const claimed = await tx.quest.updateMany({
        where: { id: questId, userId, status: 'ACTIVE' },
        data: { status: 'COMPLETED', completedAt: today },
      });
      const quest = await tx.quest.findFirst({ where: { id: questId, userId } });
      if (!quest) throw new AppError(404, 'Quest not found', 'QUEST_NOT_FOUND');

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');

      if (claimed.count !== 1) {
        if (quest.status === 'COMPLETED') {
          const attributes = await tx.attribute.findMany({
            where: { userId },
            orderBy: { name: 'asc' },
          });
        // Idempotent no-op: double-clicks and lost races change nothing.
        return {
          alreadyCompleted: true,
          quest,
          character: characterSnapshot(user, attributes),
          xpGained: 0,
          goldGained: 0,
          bonusPercent: 0,
          leveledUp: false,
          levelsGained: 0,
          attribute: null,
          streak: {
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
            alreadyActive: true,
          },
        };
      }
      throw new AppError(409, 'Archived quests cannot be completed', 'QUEST_LOCKED');
    }

    const attribute = await tx.attribute.upsert({
      where: { userId_name: { userId, name: quest.attribute } },
      update: {},
      create: { userId, name: quest.attribute },
    });

    const streak = computeStreak({
      lastActiveDay: user.lastActiveDay,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      today,
    });
    const bonusPercent = streakBonusPercent(streak.currentStreak);
    const xpGained = applyStreakBonus(quest.xpReward, streak.currentStreak);
    const goldGained = quest.goldReward; // streak bonus applies to XP only
    const charResult = applyXp({
      level: user.level,
      currentXp: user.totalXp,
      gained: xpGained,
      xpForLevel: xpForCharacterLevel,
    });
    const attrResult = applyXp({
      level: attribute.level,
      currentXp: attribute.currentXp,
      gained: xpGained,
      xpForLevel: xpForAttributeLevel,
    });

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        level: charResult.level,
        totalXp: charResult.currentXp,
        gold: { increment: goldGained },
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActiveDay: today,
      },
    });
    const updatedAttribute = await tx.attribute.update({
      where: { id: attribute.id },
      data: { level: attrResult.level, currentXp: attrResult.currentXp },
    });
    await tx.activityLog.create({
      data: { userId, questId: quest.id, action: 'quest_completed', xpDelta: xpGained, goldDelta: goldGained },
    });
    if (charResult.leveledUp) {
      await tx.activityLog.create({
        data: { userId, questId: quest.id, action: 'level_up', xpDelta: 0, goldDelta: 0 },
      });
    }
    const attributes = await tx.attribute.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    return {
      alreadyCompleted: false,
      quest,
      character: characterSnapshot(updatedUser, attributes),
      xpGained,
      goldGained,
      bonusPercent,
      leveledUp: charResult.leveledUp,
      levelsGained: charResult.levelsGained,
      attribute: {
        name: updatedAttribute.name,
        level: updatedAttribute.level,
        currentXp: updatedAttribute.currentXp,
        leveledUp: attrResult.leveledUp,
        levelsGained: attrResult.levelsGained,
      },
      streak: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        alreadyActive: streak.alreadyActive,
      },
    };
  }, { timeout: 15000, maxWait: 10000 });
}

module.exports = {
  REWARD_TABLE,
  rewardsFor,
  createQuest,
  listQuests,
  findOwnQuest,
  updateQuest,
  removeQuest,
  completeQuest,
};
