const express = require('express');
const router = express.Router();
const courseController = require('../../controllers/courseController');
const courseVideoRoutes = require('./courseVideoRoutes');
const {authMiddleware} = require('../../middleware/authMiddleware');

router.post('/', authMiddleware, courseController.createCourse);
router.get('/', authMiddleware, courseController.getAllCourses);
router.get('/:courseId', authMiddleware, courseController.getCourseById);
router.put('/:courseId', authMiddleware, courseController.updateCourse);
router.delete('/:courseId', authMiddleware, courseController.deleteCourse);

router.post('/:courseId/enroll', authMiddleware, courseController.enrollStudent);
router.delete('/:courseId/enroll', authMiddleware, courseController.unenrollStudent);
router.get('/:courseId/students', authMiddleware, courseController.getEnrolledStudents);

// Add video routes
router.use('/:courseId/videos', courseVideoRoutes);

module.exports = router;