const Course = require('../models/Course');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const courseController = {
    createCourse: async (req, res, next) => {
        try {
            // Validate required fields
            const { title, educationalStage, description } = req.body;
            if (!title) {
                throw new ApiError('Title is required', 400);
            }
            if (educationalStage && !['kindergarten', 'primary', 'secondary', 'undergrad', 'postgrad'].includes(educationalStage.level)) {
                throw new ApiError('Invalid educational stage level', 400);
            }

            // Set teacher as current user
            const courseData = {
                ...req.body,
                teacher: req.user.id
            };
            
            const course = await Course.create(courseData);
            res.status(201).json(course);
        } catch (error) {
            next(new ApiError(error.message, 400));
        }
    },

    getAllCourses: async (req, res, next) => {
        try {
            // Add pagination and filtering
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            // Build filter object
            const filter = {};
            if (req.query.educationalStage) {
                filter['educationalStage.level'] = req.query.educationalStage;
            }
            if (req.query.subject) {
                filter.subjects = req.query.subject;
            }

            const [courses, total] = await Promise.all([
                Course.find(filter)
                    .skip(skip)
                    .limit(limit)
                    .populate('teacher', 'name email')
                    .lean(),
                Course.countDocuments(filter)
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
            next(new ApiError(error.message, 400));
        }
    },

    getCourseById: async (req, res, next) => {
        try {
            const course = await Course.findById(req.params.courseId)
                .populate('teacher', 'name email')
                .populate('students', 'name email')
                .populate('content.videos')
                .populate('content.assignments')
                .populate('content.quizzes');

            if (!course) {
                throw new ApiError('Course not found', 404);
            }
            res.json(course);
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    updateCourse: async (req, res, next) => {
        try {
            // Validate educational stage if provided
            if (req.body.educationalStage?.level && 
                !['kindergarten', 'primary', 'secondary', 'undergrad', 'postgrad'].includes(req.body.educationalStage.level)) {
                throw new ApiError('Invalid educational stage level', 400);
            }

            // Check if user is the teacher of the course
            const course = await Course.findById(req.params.courseId);
            if (!course) {
                throw new ApiError('Course not found', 404);
            }
            
            if (course.teacher.toString() !== req.user.id) {
                throw new ApiError('Unauthorized to update this course', 403);
            }

            const updatedCourse = await Course.findByIdAndUpdate(
                req.params.courseId,
                { $set: req.body },
                { new: true, runValidators: true }
            ).populate('teacher', 'name email');

            res.json(updatedCourse);
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    deleteCourse: async (req, res, next) => {
        try {
            // Check if user is the teacher of the course
            const course = await Course.findById(req.params.courseId);
            if (!course) {
                throw new ApiError('Course not found', 404);
            }

            if (course.teacher.toString() !== req.user.id) {
                throw new ApiError('Unauthorized to delete this course', 403);
            }

            await Course.findByIdAndDelete(req.params.courseId);

            res.status(200).json({
                message: 'Course deleted successfully'
            });
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    enrollStudent: async (req, res, next) => {
        try {
            const course = await Course.findById(req.params.courseId);
            if (!course) {
                throw new ApiError('Course not found', 404);
            }

            if (course.students.includes(req.user.id)) {
                throw new ApiError('Student already enrolled', 400);
            }

            // Use $addToSet to prevent duplicate enrollments
            const updatedCourse = await Course.findByIdAndUpdate(
                req.params.courseId,
                { $addToSet: { students: req.user.id } },
                { new: true }
            ).populate('students', 'name email');

            res.status(200).json(updatedCourse);
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    unenrollStudent: async (req, res, next) => {
        try {
            // Use atomic operation for better performance
            const updatedCourse = await Course.findByIdAndUpdate(
                req.params.courseId,
                { $pull: { students: req.user.id } },
                { new: true }
            );

            if (!updatedCourse) {
                throw new ApiError('Course not found', 404);
            }

            res.status(200).json(updatedCourse);
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    getEnrolledStudents: async (req, res, next) => {
        try {
            const course = await Course.findById(req.params.courseId)
                .populate('students', 'name email')
                .select('students')
                .lean();
            
            if (!course) {
                throw new ApiError('Course not found', 404);
            }

            res.json(course.students);
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    }
};

module.exports = courseController;