const Course = require('../models/Course');
const Video = require('../models/Video');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const teacherController = {
    // Get all courses taught by the teacher
    getCourses: async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const [courses, total] = await Promise.all([
                Course.find({ teacher: req.user.id })
                    .skip(skip)
                    .limit(limit)
                    .populate('students', 'personalInfo.name email')
                    .populate('content.videos')
                    .populate('content.assignments')
                    .populate('content.quizzes')
                    .lean(),
                Course.countDocuments({ teacher: req.user.id })
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

    // Upload video to a course
    uploadVideo: async (req, res, next) => {
        try {
            const { courseId } = req.params;
            
            // Verify course ownership
            const course = await Course.findOne({
                _id: courseId,
                teacher: req.user.id
            });

            if (!course) {
                throw new ApiError('Course not found or unauthorized', 404);
            }

            // Video upload handled by uploadController
            const video = await Video.create({
                title: req.body.title,
                description: req.body.description,
                type: req.body.type || 'lecture',
                url: req.body.url,
                course: courseId,
                uploadedBy: req.user.id,
                language: req.body.language
            });

            // Add video to course content
            await Course.findByIdAndUpdate(courseId, {
                $push: { 'content.videos': video._id }
            });

            res.status(201).json(video);
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Create assignment for a course
    createAssignment: async (req, res, next) => {
        try {
            const { courseId } = req.params;
            const { title, description, dueDate, maxMarks } = req.body;

            // Verify course ownership
            const course = await Course.findOne({
                _id: courseId,
                teacher: req.user.id
            });

            if (!course) {
                throw new ApiError('Course not found or unauthorized', 404);
            }

            const assignment = await Assignment.create({
                title,
                description,
                course: courseId,
                dueDate,
                maxMarks
            });

            // Add assignment to course content
            await Course.findByIdAndUpdate(courseId, {
                $push: { 'content.assignments': assignment._id }
            });

            res.status(201).json(assignment);
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Create quiz for a course
    createQuiz: async (req, res, next) => {
        try {
            const { courseId } = req.params;
            const { title, questions, maxMarks } = req.body;

            // Validate quiz structure
            if (!Array.isArray(questions) || questions.length === 0) {
                throw new ApiError('Quiz must contain at least one question', 400);
            }

            // Verify course ownership
            const course = await Course.findOne({
                _id: courseId,
                teacher: req.user.id
            });

            if (!course) {
                throw new ApiError('Course not found or unauthorized', 404);
            }

            const quiz = await Quiz.create({
                title,
                questions,
                course: courseId,
                createdBy: req.user.id,
                maxMarks
            });

            // Add quiz to course content
            await Course.findByIdAndUpdate(courseId, {
                $push: { 'content.quizzes': quiz._id }
            });

            res.status(201).json(quiz);
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Grade assignment submission
    gradeAssignment: async (req, res, next) => {
        try {
            const { assignmentId, submissionId } = req.params;
            const { grade, feedback } = req.body;

            const assignment = await Assignment.findOneAndUpdate(
                {
                    _id: assignmentId,
                    'submissions._id': submissionId,
                    course: { $in: await Course.find({ teacher: req.user.id }).select('_id') }
                },
                {
                    $set: {
                        'submissions.$.grade': grade,
                        'submissions.$.feedback': feedback
                    }
                },
                { new: true }
            );

            if (!assignment) {
                throw new ApiError('Assignment not found or unauthorized', 404);
            }

            res.json(assignment.submissions.id(submissionId));
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    }
};

module.exports = teacherController;
