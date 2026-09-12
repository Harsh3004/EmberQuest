const characterService = require('../services/character.service');

async function getCharacter(req, res, next) {
  try {
    const character = await characterService.getCharacter(req.userId);
    if (!character) {
      return res.status(404).json({ error: { message: 'User not found', code: 'USER_NOT_FOUND' } });
    }
    return res.json({ character });
  } catch (err) {
    return next(err);
  }
}

async function patchAvatar(req, res, next) {
  try {
    const character = await characterService.updateAvatar(req.userId, req.body.avatarUrl);
    if (!character) {
      return res.status(404).json({ error: { message: 'User not found', code: 'USER_NOT_FOUND' } });
    }
    return res.json({ character });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getCharacter, patchAvatar };
