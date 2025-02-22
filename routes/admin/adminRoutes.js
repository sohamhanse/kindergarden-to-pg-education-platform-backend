const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/adminController');
const {authMiddleware} = require('../../middleware/authMiddleware');

router.get('/users', authMiddleware, adminController.getAllUsers);
router.put('/users/:userId', authMiddleware, adminController.updateUser);
router.delete('/users/:userId', authMiddleware, adminController.deleteUser);

router.get('/courses', authMiddleware, adminController.getAllCourses);
router.delete('/courses/:courseId', authMiddleware, adminController.deleteCourse);

router.get('/videos', authMiddleware, adminController.getAllVideos);
router.delete('/videos/:videoId', authMiddleware, adminController.deleteVideo);

module.exports = router;