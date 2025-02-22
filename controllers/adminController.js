const User = require('../models/User');
const Course = require('../models/Course');
const Video = require('../models/Video');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const ApiError = require('../utils/ApiError');

const adminController = {
    // Get all users with filtering and pagination
    getAllUsers: async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            // Build filter object
            const filter = {};
            if (req.query.role) {
                filter.role = req.query.role;
            }
            if (req.query.educationalStage) {
                filter['educationalStage.level'] = req.query.educationalStage;
            }

            const [users, total] = await Promise.all([
                User.find(filter)
                    .select('-password')
                    .skip(skip)
                    .limit(limit)
                    .populate('coursesEnrolled')
                    .populate('teachingCourses')
                    .lean(),
                User.countDocuments(filter)
            ]);

            res.json({
                users,
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

    // Update user details
    updateUser: async (req, res, next) => {
        try {
            const { userId } = req.params;

            // Check if trying to update an admin
            const targetUser = await User.findById(userId);
            if (!targetUser) {
                throw new ApiError('User not found', 404);
            }

            // Special handling for role changes
            if (req.body.role && targetUser.role === 'admin') {
                const adminCount = await User.countDocuments({ role: 'admin' });
                if (adminCount <= 1) {
                    throw new ApiError('Cannot change role of the last admin', 400);
                }
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: req.body },
                { new: true, runValidators: true }
            ).select('-password');

            res.json(updatedUser);
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Delete user
    deleteUser: async (req, res, next) => {
        try {
            const { userId } = req.params;
            const user = await User.findById(userId);

            if (!user) {
                throw new ApiError('User not found', 404);
            }

            // Prevent deleting the last admin
            if (user.role === 'admin') {
                const adminCount = await User.countDocuments({ role: 'admin' });
                if (adminCount <= 1) {
                    throw new ApiError('Cannot delete the last admin user', 400);
                }
            }

            // Remove user references from courses
            await Course.updateMany(
                { students: userId },
                { $pull: { students: userId } }
            );

            await user.deleteOne();
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Get all courses
    getAllCourses: async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const [courses, total] = await Promise.all([
                Course.find()
                    .skip(skip)
                    .limit(limit)
                    .populate('teacher', 'personalInfo.name email')
                    .populate('students', 'personalInfo.name email')
                    .populate('content.videos')
                    .populate('content.assignments')
                    .populate('content.quizzes')
                    .lean(),
                Course.countDocuments()
            ]);

            res.json({
                courses,
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

    // Delete course and all associated content
    deleteCourse: async (req, res, next) => {
        try {
            const { courseId } = req.params;
            const course = await Course.findById(courseId);

            if (!course) {
                throw new ApiError('Course not found', 404);
            }

            // Delete all associated content
            await Promise.all([
                Video.deleteMany({ course: courseId }),
                Assignment.deleteMany({ course: courseId }),
                Quiz.deleteMany({ course: courseId })
            ]);

            // Remove course references from users
            await User.updateMany(
                { coursesEnrolled: courseId },
                { $pull: { coursesEnrolled: courseId } }
            );

            await User.updateMany(
                { teachingCourses: courseId },
                { $pull: { teachingCourses: courseId } }
            );

            await course.deleteOne();
            res.json({ message: 'Course and associated content deleted successfully' });
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Get all videos
    getAllVideos: async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const [videos, total] = await Promise.all([
                Video.find()
                    .skip(skip)
                    .limit(limit)
                    .populate('course', 'title')
                    .populate('uploadedBy', 'personalInfo.name email')
                    .lean(),
                Video.countDocuments()
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

    // Delete video
    deleteVideo: async (req, res, next) => {
        try {
            const { videoId } = req.params;
            const video = await Video.findById(videoId);

            if (!video) {
                throw new ApiError('Video not found', 404);
            }

            // Remove video reference from course
            await Course.findByIdAndUpdate(
                video.course,
                { $pull: { 'content.videos': videoId } }
            );

            await video.deleteOne();
            res.json({ message: 'Video deleted successfully' });
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    }
};

module.exports = adminController;
