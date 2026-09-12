const shopService = require('../services/shop.service');

async function listShop(req, res, next) {
  try {
    const items = await shopService.listShop(req.userId);
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
}

// AppError codes (404 ITEM_NOT_FOUND, 409 ALREADY_OWNED, 402 INSUFFICIENT_GOLD)
// flow to the central handler for a uniform shape.
async function purchase(req, res, next) {
  try {
    const result = await shopService.purchaseItem(req.userId, req.params.itemId);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function listInventory(req, res, next) {
  try {
    const inventory = await shopService.getInventory(req.userId);
    return res.json({ inventory });
  } catch (err) {
    return next(err);
  }
}

async function equip(req, res, next) {
  try {
    const result = await shopService.setEquipped(req.userId, req.params.id, req.body.equipped);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { listShop, purchase, listInventory, equip };
