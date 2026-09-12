const { Router } = require('express');
const controller = require('../controllers/quest.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate, validateQuery } = require('../middleware/validate.middleware');
const {
  createQuestSchema,
  patchQuestSchema,
  listQuerySchema,
} = require('../validation/quest.validation');

const router = Router();

// Everything here requires a valid access token (Step 4) and is scoped to req.userId.
router.use(requireAuth);

router.get('/', validateQuery(listQuerySchema), controller.listQuests);
router.post('/', validate(createQuestSchema), controller.createQuest);
router.patch('/:id', validate(patchQuestSchema), controller.patchQuest);
router.delete('/:id', controller.deleteQuest);
// The only route that touches XP/gold: no body is read, the server awards the
// STORED rewards, so clients can never self-grant. Status changes here, never via PATCH.
router.post('/:id/complete', controller.completeQuest);

module.exports = router;
