const { Router } = require('express');
const controller = require('../controllers/activity.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { validateQuery } = require('../middleware/validate.middleware');
const { logQuerySchema } = require('../validation/character.validation');

const router = Router();

router.use(requireAuth);

router.get('/', validateQuery(logQuerySchema), controller.listLogs);

module.exports = router;
