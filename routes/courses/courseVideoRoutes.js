const express = require('express');
const router = express.Router({ mergeParams: true }); // Important for accessing courseId
const videoController = require('../../controllers/videoController');
const {authMiddleware} = require('../../middleware/authMiddleware');

// Get all videos for a course
router.get('/', authMiddleware, videoController.getCourseVideos);

// Get specific video from a course
router.get('/:videoId', authMiddleware, videoController.getCourseByVideoById);

module.exports = router; 