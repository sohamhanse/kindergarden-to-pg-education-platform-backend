const express = require('express');
const router = express.Router();
const teacherController = require('../../controllers/teacherController');
const {authMiddleware} = require('../../middleware/authMiddleware');

router.get('/me/courses', authMiddleware, teacherController.getCourses);
router.post('/me/courses/:courseId/videos', authMiddleware, teacherController.uploadVideo);
router.post('/me/courses/:courseId/assignments', authMiddleware, teacherController.createAssignment);
router.post('/me/courses/:courseId/quizzes', authMiddleware, teacherController.createQuiz);

module.exports = router;