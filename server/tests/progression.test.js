const {
  REWARD_TABLE,
  rewardsFor,
  xpForCharacterLevel,
  xpForAttributeLevel,
  applyXp,
  computeStreak,
  streakBonusPercent,
  applyStreakBonus,
} = require('../src/services/progression.service');

describe('level curves: xp = round(base * n^1.5)', () => {
  test('character curve matches the plan table', () => {
    expect(xpForCharacterLevel(1)).toBe(100);
    expect(xpForCharacterLevel(2)).toBe(283);
    expect(xpForCharacterLevel(3)).toBe(520);
    expect(xpForCharacterLevel(4)).toBe(800);
    expect(xpForCharacterLevel(5)).toBe(1118);
    expect(xpForCharacterLevel(10)).toBe(3162);
  });

  test('attribute curve uses the smaller base', () => {
    expect(xpForAttributeLevel(1)).toBe(25);
    expect(xpForAttributeLevel(2)).toBe(71);
    expect(xpForAttributeLevel(3)).toBe(130);
    expect(xpForAttributeLevel(4)).toBe(200);
  });

  test('curve is strictly increasing (later levels always cost more)', () => {
    for (let n = 1; n < 30; n += 1) {
      expect(xpForCharacterLevel(n + 1)).toBeGreaterThan(xpForCharacterLevel(n));
      expect(xpForAttributeLevel(n + 1)).toBeGreaterThan(xpForAttributeLevel(n));
    }
  });

  test('rejects non-positive and non-integer levels', () => {
    for (const bad of [0, -1, 1.5, NaN]) {
      expect(() => xpForCharacterLevel(bad)).toThrow();
      expect(() => xpForAttributeLevel(bad)).toThrow();
    }
  });
});

describe('applyXp carries overflow through multiple level-ups', () => {
  test('no level-up stays put', () => {
    expect(
      applyXp({ level: 1, currentXp: 0, gained: 50, xpForLevel: xpForCharacterLevel })
    ).toEqual({ level: 1, currentXp: 50, leveledUp: false, levelsGained: 0 });
  });

  test('exact threshold lands on the next level with zero remainder', () => {
    expect(
      applyXp({ level: 1, currentXp: 90, gained: 10, xpForLevel: xpForCharacterLevel })
    ).toEqual({ level: 2, currentXp: 0, leveledUp: true, levelsGained: 1 });
  });

  test('large gain crosses two levels (100 then 283, remainder 117)', () => {
    expect(
      applyXp({ level: 1, currentXp: 0, gained: 500, xpForLevel: xpForCharacterLevel })
    ).toEqual({ level: 3, currentXp: 117, leveledUp: true, levelsGained: 2 });
  });

  test('works with the attribute curve too (25 then 71, remainder 104)', () => {
    expect(
      applyXp({ level: 1, currentXp: 0, gained: 200, xpForLevel: xpForAttributeLevel })
    ).toEqual({ level: 3, currentXp: 104, leveledUp: true, levelsGained: 2 });
  });

  test('zero gain is a no-op, negative gain throws', () => {
    expect(
      applyXp({ level: 2, currentXp: 10, gained: 0, xpForLevel: xpForCharacterLevel })
    ).toEqual({ level: 2, currentXp: 10, leveledUp: false, levelsGained: 0 });
    expect(() =>
      applyXp({ level: 2, currentXp: 10, gained: -5, xpForLevel: xpForCharacterLevel })
    ).toThrow();
  });
});

describe('computeStreak (UTC calendar days)', () => {
  const noon = (iso) => new Date(iso);

  test('first activity starts a streak of 1', () => {
    expect(
      computeStreak({ lastActiveDay: null, currentStreak: 0, longestStreak: 0, today: noon('2026-09-12T12:00:00Z') })
    ).toEqual({ currentStreak: 1, longestStreak: 1, alreadyActive: false });
  });

  test('same day is a no-op', () => {
    expect(
      computeStreak({
        lastActiveDay: noon('2026-09-12T08:00:00Z'),
        currentStreak: 4,
        longestStreak: 7,
        today: noon('2026-09-12T20:00:00Z'),
      })
    ).toEqual({ currentStreak: 4, longestStreak: 7, alreadyActive: true });
  });

  test('consecutive day increments and extends the record', () => {
    expect(
      computeStreak({
        lastActiveDay: noon('2026-09-11T23:59:00Z'),
        currentStreak: 7,
        longestStreak: 7,
        today: noon('2026-09-12T00:01:00Z'),
      })
    ).toEqual({ currentStreak: 8, longestStreak: 8, alreadyActive: false });
  });

  test('a missed day resets to 1 but keeps the record', () => {
    expect(
      computeStreak({
        lastActiveDay: noon('2026-09-09T12:00:00Z'),
        currentStreak: 6,
        longestStreak: 9,
        today: noon('2026-09-12T12:00:00Z'),
      })
    ).toEqual({ currentStreak: 1, longestStreak: 9, alreadyActive: false });
  });
});

describe('streak bonus: +5% per 5 days, capped at +50%', () => {
  test.each([
    [0, 0],
    [4, 0],
    [5, 5],
    [9, 5],
    [10, 10],
    [25, 25],
    [49, 45],
    [50, 50],
    [100, 50],
    [1000, 50],
    [-3, 0],
  ])('streak %i -> +%i%%', (streak, expected) => {
    expect(streakBonusPercent(streak)).toBe(expected);
  });

  test('applyStreakBonus rounds to whole XP', () => {
    expect(applyStreakBonus(50, 10)).toBe(55); // +10%
    expect(applyStreakBonus(200, 50)).toBe(300); // capped +50%
    expect(applyStreakBonus(25, 0)).toBe(25);
    expect(applyStreakBonus(10, 5)).toBe(11); // 10.5 rounds up
  });
});

describe('reward table (single source of truth)', () => {
  test('matches the plan values', () => {
    expect(REWARD_TABLE).toEqual({
      TRIVIAL: { xp: 10, gold: 2 },
      EASY: { xp: 25, gold: 5 },
      MEDIUM: { xp: 50, gold: 12 },
      HARD: { xp: 100, gold: 25 },
      EPIC: { xp: 200, gold: 60 },
    });
  });

  test('rewardsFor maps and rejects unknown difficulties', () => {
    expect(rewardsFor('MEDIUM')).toEqual({ xpReward: 50, goldReward: 12 });
    expect(() => rewardsFor('IMPOSSIBLE')).toThrow();
  });
});

describe('worked example end to end (no DB)', () => {
  test('MEDIUM quest on a 10-day streak levels a character from 90 XP', () => {
    const base = rewardsFor('MEDIUM'); // 50 XP
    const gained = applyStreakBonus(base.xpReward, 10); // +10% -> 55
    expect(gained).toBe(55);
    const after = applyXp({ level: 1, currentXp: 90, gained, xpForLevel: xpForCharacterLevel });
    expect(after).toEqual({ level: 2, currentXp: 45, leveledUp: true, levelsGained: 1 });
  });
});
