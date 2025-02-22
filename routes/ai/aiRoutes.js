const express = require('express');
const router = express.Router();
const aiController = require('../../controllers/aiController');
const {authMiddleware} = require('../../middleware/authMiddleware');

router.post('/generate-blog', authMiddleware, aiController.generateBlog);
router.post('/translate-audio', authMiddleware, aiController.translateAudio);
router.post('/generate-report', authMiddleware, aiController.generateReport);

module.exports = router;