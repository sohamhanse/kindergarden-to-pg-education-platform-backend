const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('./ApiError');

// Create uploads directory if it doesn't exist
const createUploadDirectories = () => {
    const directories = [
        'uploads',
        'uploads/profiles',
        'uploads/assignments',
        'uploads/videos'
    ];

    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

createUploadDirectories();

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'uploads/';
        
        switch (file.fieldname) {
            case 'profilePicture':
                uploadPath += 'profiles/';
                break;
            case 'assignmentFile':
                uploadPath += 'assignments/';
                break;
            case 'video':
                uploadPath += 'videos/';
                break;
            default:
                uploadPath += 'misc/';
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'profilePicture') {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new ApiError('Only image files are allowed!', 400), false);
        }
    } else if (file.fieldname === 'video') {
        if (!file.mimetype.startsWith('video/')) {
            return cb(new ApiError('Only video files are allowed!', 400), false);
        }
    } else if (file.fieldname === 'assignmentFile') {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.zip'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedTypes.includes(ext)) {
            return cb(new ApiError('Invalid file type for assignment!', 400), false);
        }
    }
    cb(null, true);
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    }
});

module.exports = upload; 