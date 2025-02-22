const express = require('express');
const router = express.Router();

// Import all route files
router.use('/auth', require('./auth/authRoutes'));
router.use('/users', require('./users/userRoutes'));
router.use('/courses', require('./courses/courseRoutes'));
router.use('/videos', require('./content/videoRoutes'));
router.use('/students', require('./students/studentRoutes'));
router.use('/teachers', require('./teachers/teacherRoutes'));
router.use('/admin', require('./admin/adminRoutes'));
router.use('/live-streams', require('./liveStreams/liveStreamRoutes'));
router.use('/meetings', require('./meetings/meetingRoutes'));
// router.use('/ai', require('./ai/aiRoutes'));

module.exports = router;