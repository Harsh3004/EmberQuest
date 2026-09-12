// Client Progression Engine (pure math, matching backend rules)

export const CHARACTER_BASE = 100;
export const ATTRIBUTE_BASE = 25;

export const REWARD_TABLE = {
  TRIVIAL: { xp: 10, gold: 2 },
  EASY: { xp: 25, gold: 5 },
  MEDIUM: { xp: 50, gold: 12 },
  HARD: { xp: 100, gold: 25 },
  EPIC: { xp: 200, gold: 60 },
};

export function rewardsFor(difficulty) {
  return REWARD_TABLE[difficulty] || REWARD_TABLE.EASY;
}

export function xpForCharacterLevel(level) {
  const lvl = Math.max(1, parseInt(level, 10) || 1);
  return Math.round(CHARACTER_BASE * Math.pow(lvl, 1.5));
}

export function xpForAttributeLevel(level) {
  const lvl = Math.max(1, parseInt(level, 10) || 1);
  return Math.round(ATTRIBUTE_BASE * Math.pow(lvl, 1.5));
}

export function applyXp({ level, currentXp, gained, xpForLevel }) {
  let remaining = currentXp + gained;
  let next = level;
  let levelsGained = 0;
  while (remaining >= xpForLevel(next)) {
    remaining -= xpForLevel(next);
    next += 1;
    levelsGained += 1;
  }
  return { level: next, currentXp: remaining, leveledUp: levelsGained > 0, levelsGained };
}

export function computeStreak({ lastActiveDay, currentStreak = 0, longestStreak = 0, today = new Date() }) {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const startOfUtcDay = (date) => {
    const d = new Date(date);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  };
  if (!lastActiveDay) {
    return { currentStreak: 1, longestStreak: Math.max(longestStreak, 1), alreadyActive: false };
  }
  const diffDays = Math.round((startOfUtcDay(today) - startOfUtcDay(lastActiveDay)) / DAY_MS);
  if (diffDays <= 0) {
    return { currentStreak, longestStreak, alreadyActive: true };
  }
  if (diffDays === 1) {
    const next = currentStreak + 1;
    return { currentStreak: next, longestStreak: Math.max(longestStreak, next), alreadyActive: false };
  }
  return { currentStreak: 1, longestStreak, alreadyActive: false };
}

export function streakBonusPercent(streak) {
  if (!Number.isFinite(streak) || streak < 0) return 0;
  return Math.min(50, Math.floor(streak / 5) * 5);
}

export function applyStreakBonus(xp, streak) {
  return Math.round(xp * (1 + streakBonusPercent(streak) / 100));
}
