const express = require('express');
const router = express.Router();
const videoController = require('../../controllers/videoController');
const {authMiddleware} = require('../../middleware/authMiddleware');

router.post('/', authMiddleware, videoController.uploadVideo);
router.get('/', authMiddleware, videoController.getAllVideos);
router.get('/:videoId', authMiddleware, videoController.getVideoById);
// router.put('/:videoId', authMiddleware, videoController.updateVideo);
router.delete('/:videoId', authMiddleware, videoController.deleteVideo);

module.exports = router;