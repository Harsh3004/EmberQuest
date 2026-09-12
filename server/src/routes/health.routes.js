const { Router } = require('express');

const router = Router();

// GET /api/health - used by hosting checks and frontend connectivity probe.
router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'emberquest-server',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
