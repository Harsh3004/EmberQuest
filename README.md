# Emberquest - Life RPG

Tasks are Quests, points are XP, currency is Gold, categories are Skill Trees
(Strength, Intellect, Vitality, Discipline, Charisma), consecutive-day activity is a Flame Streak.

Backend is plain JavaScript (Node + Express, CommonJS). No TypeScript.

> Step 4: Auth (JWT access + rotating refresh, bcrypt, Zod). No live DB needed yet for tests.

## Structure

- client/src: components/{quest,character,shop,ui}, pages, hooks, lib, store
- server/src: routes, controllers, services, middleware, validation, prisma (schema.prisma + client.js)
- server/tests: jest + supertest

## Setup

1. Copy env: cp .env.example .env (or copy on Windows)
2. Install server deps: npm install -w server (or npm install at root for workspaces)
3. Run backend: npm run dev:server (node --watch, no build step)
4. Health check: GET http://localhost:4000/api/health
5. Tests: npm run test -w server
6. Lint: npm run lint -w server

## Database (Postgres + Prisma)

1. Create a Postgres DB (Neon or Railway) and put its URL in `server/.env` as `DATABASE_URL`
   (a dummy localhost URL is there now - fine for validate/generate, not for migrate).
2. `npm run db:migrate -w server` - applies migrations to your DB (needs the real URL).
3. `npm run db:validate -w server` - offline schema check, no DB needed.
4. `npm run db:generate -w server` - regenerates the Prisma Client after schema edits.
5. `npm run db:diff -w server` - prints the SQL the schema would apply, no DB needed.

## Auth (JWT access + rotating refresh)

- `POST /api/auth/signup` - username, email, password (+ optional avatarUrl). Creates the
  user plus all five Skill Trees. 409 `EMAIL_TAKEN` / `USERNAME_TAKEN` on duplicates.
- `POST /api/auth/login` - identifier (email or username) + password. 401 `INVALID_CREDENTIALS`.
- `POST /api/auth/refresh` - rotates the refresh cookie, returns a new access token.
  Reuse of a dead token revokes all sessions (`REFRESH_REUSED`).
- `POST /api/auth/logout` - revokes the session, clears the cookie, always 200.
- Access token: JWT Bearer, 15 min. Refresh token: `eq_refresh` httpOnly cookie (path
  `/api/auth`), 7 days, sha256-hashed in DB. Frontend keeps the access token in memory
  (never localStorage) and silently refreshes on `TOKEN_EXPIRED`.
- All non-auth routes (except `/api/health`) require `Authorization: Bearer <token>`
  via `requireAuth` - every query is scoped to `req.userId`.

## Quests (CRUD, auth-scoped)

- `GET /api/quests?status=active|completed` (default `active`, newest first)
- `POST /api/quests` - title, attribute (one of the 5 Skill Trees), difficulty
  (default EASY), recurrence, dueDate. Rewards are assigned from difficulty server-side.
- `PATCH /api/quests/:id` - edit active quests; changing difficulty recomputes rewards.
  `status` is rejected here - it only changes via `POST /:id/complete` (Step 7).
- `DELETE /api/quests/:id` - 204. Completed quests are permanent history (`QUEST_LOCKED`).
- Every lookup includes the caller id, misses are plain 404 (no existence leaks).

## Progression engine (pure math, no DB)

`server/src/services/progression.service.js` - deterministic functions Step 7 wires to Prisma:

- Character curve: `xpForCharacterLevel(n) = round(100 * n^1.5)` (100 / 283 / 520 / 1118 / 3162).
- Attribute curve: same shape, base 25 (25 / 71 / 130 / 200). Trees level independently.
- `applyXp` carries overflow through multiple level-ups, returns `leveledUp` for the
  celebration animation and `levelsGained` (usually 0 or 1, never assumed).
- Streaks use UTC calendar days: same day = no-op, yesterday = +1, older = reset to 1.
- Streak bonus: +5% XP per 5 full days, capped at +50%, applied server-side only.
- Reward table (Trivial 10/2 ... Epic 200/60) lives here; `quest.service` re-exports it.

## Quest completion, character, history (Step 7)

- `POST /api/quests/:id/complete` - the ONLY route that touches XP/gold. No body is read;
  the server awards the STORED rewards. Atomic claim (`updateMany` on ACTIVE) makes it
  race-safe; repeats return `alreadyCompleted: true` with zero writes. Response carries
  `xpGained`, `goldGained` (never multiplied), `bonusPercent`, `leveledUp` + `levelsGained`
  (frontend celebration triggers), updated `attribute`, `streak`, and full `character`.
- `GET /api/character` - user + all trees + `xpToNextLevel` for every XP bar.
- `PATCH /api/character/avatar` - set or clear (`null`) the avatar URL.
- `GET /api/activity-log?limit=` (default 50, max 100) - newest-first history feed,
  the persistence proof for the demo (refresh, data survives).

## Roadmap

- [x] Step 1: Repo scaffold
- [x] Step 2: Backend base (Express+JS, middleware, health route, tests)
- [x] Step 3: Prisma schema + DB wiring (JS)
- [x] Step 4: Auth (JWT access + refresh, bcrypt, Zod)
- [x] Step 5: Quest CRUD API (auth-scoped, server-assigned rewards)
- [x] Step 6: Progression engine (XP curves, streaks, bonuses - pure + tested)
- [x] Step 7: Quest complete + character API + activity log
- [ ] Step 8+: Frontend, shop, polish, deploy
