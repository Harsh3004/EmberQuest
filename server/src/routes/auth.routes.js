const { Router } = require('express');
const { signup, login, refresh, logout } = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate.middleware');
const { signupSchema, loginSchema } = require('../validation/auth.validation');

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;
