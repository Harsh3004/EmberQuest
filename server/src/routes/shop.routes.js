const { Router } = require('express');
const controller = require('../controllers/shop.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = Router();

router.use(requireAuth);

router.get('/', controller.listShop);
// No body: the price comes from the STORED item row, never the client.
router.post('/:itemId/purchase', controller.purchase);

module.exports = router;
