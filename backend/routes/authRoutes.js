const express = require('express');
const router = express.Router();
const { register, login, getMe, googleAuth, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/settings', protect, require('../controllers/authController').updateSettings);

module.exports = router;
