// Progression engine (build-plan section 3). Pure math: zero dependencies,
// zero I/O, fully deterministic. Step 7 (quest completion) wires these
// together with Prisma writes; nothing here touches the database.

const CHARACTER_BASE = 100;
const ATTRIBUTE_BASE = 25;
const DAY_MS = 24 * 60 * 60 * 1000;

// Difficulty -> reward table. Server-side constant and single source of truth:
// quest.service re-exports it, the client never supplies rewards.
const REWARD_TABLE = {
  TRIVIAL: { xp: 10, gold: 2 },
  EASY: { xp: 25, gold: 5 },
  MEDIUM: { xp: 50, gold: 12 },
  HARD: { xp: 100, gold: 25 },
  EPIC: { xp: 200, gold: 60 },
};

function rewardsFor(difficulty) {
  const row = REWARD_TABLE[difficulty];
  if (!row) throw new Error(`Unknown difficulty: ${difficulty}`);
  return { xpReward: row.xp, goldReward: row.gold };
}

function assertLevel(level) {
  if (!Number.isInteger(level) || level < 1) throw new Error('Level must be a positive integer');
}

// XP to go from level n to n+1 (non-linear curve).
function xpForCharacterLevel(level) {
  assertLevel(level);
  return Math.round(CHARACTER_BASE * Math.pow(level, 1.5));
}

// Same curve, smaller base: Skill Trees level independently of character level.
function xpForAttributeLevel(level) {
  assertLevel(level);
  return Math.round(ATTRIBUTE_BASE * Math.pow(level, 1.5));
}

// Adds gained XP, carrying overflow through as many level-ups as it earns.
// Pass xpForCharacterLevel or xpForAttributeLevel as xpForLevel.
function applyXp({ level, currentXp, gained, xpForLevel }) {
  if (gained < 0) throw new Error('Gained XP cannot be negative');
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

// Day boundaries are UTC calendar days (deterministic, testable).
// A per-user timezone refinement can build on this later without changing callers.
function startOfUtcDay(date) {
  const d = new Date(date);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

// Streak rules: same day -> no change; yesterday -> +1; older/never -> reset to 1.
// `today` is injectable so the rules are unit-testable without clock mocking.
function computeStreak({ lastActiveDay, currentStreak = 0, longestStreak = 0, today = new Date() }) {
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

// +5% XP per 5 full streak days, capped at +50%. Applied server-side only.
function streakBonusPercent(streak) {
  if (!Number.isFinite(streak) || streak < 0) return 0;
  return Math.min(50, Math.floor(streak / 5) * 5);
}

function applyStreakBonus(xp, streak) {
  return Math.round(xp * (1 + streakBonusPercent(streak) / 100));
}

module.exports = {
  CHARACTER_BASE,
  ATTRIBUTE_BASE,
  REWARD_TABLE,
  rewardsFor,
  xpForCharacterLevel,
  xpForAttributeLevel,
  applyXp,
  computeStreak,
  streakBonusPercent,
  applyStreakBonus,
};
