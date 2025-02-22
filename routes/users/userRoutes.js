const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');
const {authMiddleware} = require('../../middleware/authMiddleware');

router.get('/me', authMiddleware, userController.getProfile);
router.put('/me', authMiddleware, userController.updateProfile);
router.get('/:userId', authMiddleware, userController.getUserById);
router.delete('/:userId', authMiddleware, userController.deleteUser);

module.exports = router;