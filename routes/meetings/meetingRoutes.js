const express = require('express');
const router = express.Router();
const meetingController = require('../../controllers/meetingController');
const {authMiddleware} = require('../../middleware/authMiddleware');

router.post('/', authMiddleware, meetingController.scheduleMeeting);
router.get('/', authMiddleware, meetingController.getAllMeetings);
router.put('/:meetingId', authMiddleware, meetingController.updateMeeting);
router.delete('/:meetingId', authMiddleware, meetingController.deleteMeeting);

module.exports = router;