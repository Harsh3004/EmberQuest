const { Router } = require('express');
const controller = require('../controllers/shop.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { equipSchema } = require('../validation/shop.validation');

const router = Router();

router.use(requireAuth);

router.get('/', controller.listInventory);
router.patch('/:id/equip', validate(equipSchema), controller.equip);

module.exports = router;
