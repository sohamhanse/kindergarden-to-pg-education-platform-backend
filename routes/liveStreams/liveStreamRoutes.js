const express = require('express');
const router = express.Router();
const liveStreamController = require('../../controllers/liveStreamController');
const {authMiddleware} = require('../../middleware/authMiddleware');

router.post('/', authMiddleware, liveStreamController.startLiveStream);
router.get('/', authMiddleware, liveStreamController.getAllLiveStreams);
router.get('/:streamId', authMiddleware, liveStreamController.getLiveStreamById);
router.post('/:streamId/join', authMiddleware, liveStreamController.joinLiveStream);
router.post('/:streamId/end', authMiddleware, liveStreamController.endLiveStream);

module.exports = router;