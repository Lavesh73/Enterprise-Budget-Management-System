const express = require('express');
const router = express.Router();
const { searchGemini } = require('../controllers/geminiController');

// Optional: you can add authMiddleware here if you want to restrict it to logged-in users only.
// const { protect } = require('../middleware/authMiddleware');
// router.post('/search', protect, searchGemini);

router.post('/search', searchGemini);

module.exports = router;
