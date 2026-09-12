const { z } = require('zod');

// The key is required: send null to remove the avatar, omit nothing by accident.
const avatarSchema = z.object({
  avatarUrl: z.string().trim().max(500, 'Avatar URL is too long').url('Avatar must be a valid URL').nullable(),
});

const logQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

module.exports = { avatarSchema, logQuerySchema };
