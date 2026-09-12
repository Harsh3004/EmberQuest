const { prisma } = require('../prisma/client');

// Read-only history feed: proves persistence across refreshes/devices.
// Newest first, capped by ?limit (default 50, max 100).
async function listLogs(req, res, next) {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: req.query.limit,
    });
    return res.json({ logs });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listLogs };
