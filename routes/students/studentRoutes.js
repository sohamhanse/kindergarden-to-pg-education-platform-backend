const express = require('express');
const router = express.Router();
const studentController = require('../../controllers/studentController');
const {authMiddleware} = require('../../middleware/authMiddleware');

router.get('/me/progress', authMiddleware, studentController.getProgress);
router.get('/me/streak', authMiddleware, studentController.getStreak);

module.exports = router;