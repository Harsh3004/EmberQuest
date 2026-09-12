const { z } = require('zod');
// Single source of truth lives in auth.service (rows are created at signup).
const { SKILL_TREES } = require('../services/auth.service');

const attribute = z.enum(SKILL_TREES);
const difficultyValue = z.enum(['TRIVIAL', 'EASY', 'MEDIUM', 'HARD', 'EPIC']);
const recurrenceValue = z.enum(['NONE', 'DAILY', 'WEEKLY']);

const title = z
  .string()
  .trim()
  .min(1, 'Give your quest a title')
  .max(200, 'Keep titles under 200 characters');

const description = z.string().trim().max(2000, 'Keep descriptions under 2000 characters');

function dueDateField() {
  return z
    .string()
    .datetime({ offset: true, message: 'Due date must be an ISO date-time' })
    .transform((s) => new Date(s));
}

// NOTE: xpReward / goldReward / status / userId are deliberately absent.
// Zod strips unknown keys, so even if a client sends rewards they are dropped
// and the server assigns them from difficulty instead (anti-cheat).
const createQuestSchema = z.object({
  title,
  description: description.nullable().optional(),
  attribute,
  difficulty: difficultyValue.default('EASY'),
  recurrence: recurrenceValue.default('NONE'),
  dueDate: dueDateField().nullable().optional(),
});

const patchQuestSchema = z.object({
  title: title.optional(),
  description: description.nullable().optional(), // null clears it
  attribute: attribute.optional(),
  difficulty: difficultyValue.optional(), // changing it recomputes rewards server-side
  recurrence: recurrenceValue.optional(),
  dueDate: dueDateField().nullable().optional(), // null clears it
  // Status is changed only via POST /:id/complete (Step 7) - never by edit,
  // otherwise clients could grant themselves XP by flipping it to COMPLETED.
  status: z
    .never({ message: 'Finish quests via POST /api/quests/:id/complete - status cannot be edited' })
    .optional(),
});

const listQuerySchema = z.object({
  status: z.enum(['active', 'completed']).optional().default('active'),
});

module.exports = { createQuestSchema, patchQuestSchema, listQuerySchema };
