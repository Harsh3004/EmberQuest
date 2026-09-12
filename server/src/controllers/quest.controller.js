const questService = require('../services/quest.service');

function notFound(res) {
  return res.status(404).json({ error: { message: 'Quest not found', code: 'QUEST_NOT_FOUND' } });
}

function locked(res, action) {
  return res.status(409).json({
    error: {
      message: `Completed quests are permanent history and cannot be ${action}`,
      code: 'QUEST_LOCKED',
    },
  });
}

async function createQuest(req, res, next) {
  try {
    const quest = await questService.createQuest(req.userId, req.body);
    return res.status(201).json({ quest });
  } catch (err) {
    return next(err);
  }
}

async function listQuests(req, res, next) {
  try {
    const quests = await questService.listQuests(req.userId, req.query.status);
    return res.json({ quests });
  } catch (err) {
    return next(err);
  }
}

async function patchQuest(req, res, next) {
  try {
    const existing = await questService.findOwnQuest(req.userId, req.params.id);
    if (!existing) return notFound(res);
    if (existing.status !== 'ACTIVE') return locked(res, 'edited');

    const data = {};
    for (const key of ['title', 'description', 'attribute', 'recurrence', 'dueDate']) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    if (req.body.difficulty !== undefined && req.body.difficulty !== existing.difficulty) {
      data.difficulty = req.body.difficulty;
      Object.assign(data, questService.rewardsFor(req.body.difficulty));
    }
    const quest = await questService.updateQuest(existing.id, data);
    return res.json({ quest });
  } catch (err) {
    return next(err);
  }
}

async function deleteQuest(req, res, next) {
  try {
    const existing = await questService.findOwnQuest(req.userId, req.params.id);
    if (!existing) return notFound(res);
    if (existing.status === 'COMPLETED') return locked(res, 'deleted');
    await questService.removeQuest(existing.id);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

// No body is read: rewards come from the stored quest row (anti-cheat).
// AppError (404/409) flows to the central error handler for a uniform shape.
async function completeQuest(req, res, next) {
  try {
    const result = await questService.completeQuest(req.userId, req.params.id);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { createQuest, listQuests, patchQuest, deleteQuest, completeQuest };
