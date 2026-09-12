const { Router } = require('express');
const controller = require('../controllers/character.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { avatarSchema } = require('../validation/character.validation');

const router = Router();

router.use(requireAuth);

router.get('/', controller.getCharacter);
router.patch('/avatar', validate(avatarSchema), controller.patchAvatar);

module.exports = router;
