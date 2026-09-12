const { z } = require('zod');

const username = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers and underscores only');

// Shared with the frontend in a later step - keep messages human-readable
// so they can be shown inline next to the field.
const signupSchema = z.object({
  username,
  email: z.string().trim().toLowerCase().email('Enter a valid email').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  avatarUrl: z.string().trim().max(500).url('Avatar must be a valid URL').or(z.literal('')).optional(),
});

// Login accepts email OR username so users are not forced to remember which one.
const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or username').max(255),
  password: z.string().min(1, 'Enter your password').max(128),
});

module.exports = { signupSchema, loginSchema };
