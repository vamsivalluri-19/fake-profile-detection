const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const { registerValidation, loginValidation, register, login } = require('../controllers/authController');
const { detectValidation, detectProfile, getReports, getMetrics } = require('../controllers/profileController');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/detect-profile', authMiddleware, detectValidation, detectProfile);
router.get('/reports', authMiddleware, getReports);
router.get('/metrics', authMiddleware, getMetrics);

module.exports = router;
