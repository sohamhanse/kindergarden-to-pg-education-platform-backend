const Video = require('../models/Video');
const Course = require('../models/Course');
const ApiError = require('../utils/ApiError');
const multer = require('multer');
const path = require('path');

// Configure multer for video upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/videos');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept only video files
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new ApiError('Only video files are allowed', 400), false);
        }
    },
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
}).single('video');

const videoController = {
    // Upload a new video
    uploadVideo: async (req, res, next) => {
        upload(req, res, async (err) => {
            try {
                if (err instanceof multer.MulterError) {
                    throw new ApiError(err.message, 400);
                } else if (err) {
                    throw new ApiError('Error uploading file', 500);
                }

                if (!req.file) {
                    throw new ApiError('No video file uploaded', 400);
                }

                const fileUrl = `${req.protocol}://${req.get('host')}/uploads/videos/${req.file.filename}`;

                const video = await Video.create({
                    title: req.body.title,
                    description: req.body.description,
                    type: req.body.type || 'lecture',
                    url: fileUrl,
                    course: req.body.courseId,
                    uploadedBy: req.user.id,
                    language: req.body.language
                });

                res.status(201).json(video);
            } catch (error) {
                next(new ApiError(error.message, error.status || 400));
            }
        });
    },

    // Get all videos
    getAllVideos: async (req, res, next) => {
        try {
            // Add pagination
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            // Build filter object
            const filter = {};
            if (req.query.type) {
                filter.type = req.query.type;
            }
            if (req.query.language) {
                filter.language = req.query.language;
            }
            if (req.query.courseId) {
                filter.course = req.query.courseId;
            }

            const [videos, total] = await Promise.all([
                Video.find(filter)
                    .skip(skip)
                    .limit(limit)
                    .populate('uploadedBy', 'personalInfo.name email')
                    .populate('course', 'title')
                    .sort({ createdAt: -1 })
                    .lean(),
                Video.countDocuments(filter)
            ]);

            res.json({
                videos,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Get all videos for a specific course
    getCourseVideos: async (req, res, next) => {
        try {
            const { courseId } = req.params;
            
            // Verify course exists
            const course = await Course.findById(courseId);
            if (!course) {
                throw new ApiError('Course not found', 404);
            }

            // Add pagination
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            // Build filter object
            const filter = { course: courseId };
            if (req.query.type) {
                filter.type = req.query.type;
            }
            if (req.query.language) {
                filter.language = req.query.language;
            }

            const [videos, total] = await Promise.all([
                Video.find(filter)
                    .skip(skip)
                    .limit(limit)
                    .populate('uploadedBy', 'personalInfo.name email')
                    .sort({ createdAt: -1 })
                    .lean(),
                Video.countDocuments(filter)
            ]);

            res.json({
                videos,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Get a specific video from a course
    getCourseByVideoById: async (req, res, next) => {
        try {
            const { courseId, videoId } = req.params;

            const video = await Video.findOne({
                _id: videoId,
                course: courseId
            }).populate('uploadedBy', 'personalInfo.name email');

            if (!video) {
                throw new ApiError('Video not found in this course', 404);
            }

            res.json(video);
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Get video by ID
    getVideoById: async (req, res, next) => {
        try {
            const video = await Video.findById(req.params.videoId)
                .populate('uploadedBy', 'personalInfo.name email')
                .populate('course', 'title');

            if (!video) {
                throw new ApiError('Video not found', 404);
            }

            res.json(video);
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Delete video
    deleteVideo: async (req, res, next) => {
        try {
            const video = await Video.findById(req.params.videoId);

            if (!video) {
                throw new ApiError('Video not found', 404);
            }

            // Check if user is authorized to delete the video
            if (video.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
                throw new ApiError('Not authorized to delete this video', 403);
            }

            await video.deleteOne();

            res.json({
                message: 'Video deleted successfully'
            });
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    }
};

module.exports = videoController; 