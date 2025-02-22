const express = require('express');
const router = express.Router();
const upload = require('../utils/fileUpload');
const uploadController = require('../controllers/uploadController');
const auth = require('../middleware/auth');

// Profile picture upload route
router.post('/profile-picture',
    auth,
    upload.single('profilePicture'),
    uploadController.uploadProfilePicture
);

// Video upload route
router.post('/video',
    auth,
    upload.single('video'),
    uploadController.uploadVideo
);

// Assignment submission route
router.post('/assignment/:assignmentId',
    auth,
    upload.single('assignmentFile'),
    uploadController.uploadAssignment
);

module.exports = router; 