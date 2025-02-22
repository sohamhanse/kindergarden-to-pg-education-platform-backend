const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Video = require('../models/Video');
const Quiz = require('../models/Quiz');
const ApiError = require('../utils/ApiError');

const studentController = {
    // Get all enrolled courses for the student
    getEnrolledCourses: async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const student = await User.findById(req.user.id)
                .populate({
                    path: 'coursesEnrolled',
                    populate: {
                        path: 'teacher',
                        select: 'personalInfo.name email'
                    },
                    options: {
                        skip: skip,
                        limit: limit
                    }
                })
                .select('coursesEnrolled');

            const total = student.coursesEnrolled.length;

            res.json({
                courses: student.coursesEnrolled,
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

    // Submit assignment
    submitAssignment: async (req, res, next) => {
        try {
            const { assignmentId } = req.params;
            const assignment = await Assignment.findById(assignmentId);

            if (!assignment) {
                throw new ApiError('Assignment not found', 404);
            }

            // Check if student is enrolled in the course
            const course = await Course.findById(assignment.course);
            if (!course.students.includes(req.user.id)) {
                throw new ApiError('You are not enrolled in this course', 403);
            }

            // Check if assignment is already submitted
            const existingSubmission = assignment.submissions.find(
                sub => sub.student.toString() === req.user.id
            );
            if (existingSubmission) {
                throw new ApiError('You have already submitted this assignment', 400);
            }

            // Check due date
            if (assignment.dueDate && new Date() > assignment.dueDate) {
                throw new ApiError('Assignment submission deadline has passed', 400);
            }

            // Handle file upload in uploadController
            next();
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Get all assignments for a student's course
    getCourseAssignments: async (req, res, next) => {
        try {
            const { courseId } = req.params;
            
            // Check if student is enrolled
            const course = await Course.findById(courseId);
            if (!course) {
                throw new ApiError('Course not found', 404);
            }
            if (!course.students.includes(req.user.id)) {
                throw new ApiError('You are not enrolled in this course', 403);
            }

            const assignments = await Assignment.find({ course: courseId })
                .populate('submissions', {
                    match: { student: req.user.id }
                });

            res.json(assignments);
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Get student's submission for a specific assignment
    getAssignmentSubmission: async (req, res, next) => {
        try {
            const { assignmentId } = req.params;
            const assignment = await Assignment.findById(assignmentId);

            if (!assignment) {
                throw new ApiError('Assignment not found', 404);
            }

            const submission = assignment.submissions.find(
                sub => sub.student.toString() === req.user.id
            );

            if (!submission) {
                throw new ApiError('No submission found', 404);
            }

            res.json(submission);
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Track video progress
    trackVideoProgress: async (req, res, next) => {
        try {
            const { videoId } = req.params;
            const { progress } = req.body;

            const video = await Video.findById(videoId);
            if (!video) {
                throw new ApiError('Video not found', 404);
            }

            // Check if student is enrolled in the course
            const course = await Course.findById(video.course);
            if (!course.students.includes(req.user.id)) {
                throw new ApiError('You are not enrolled in this course', 403);
            }

            // Update user's activity
            await User.findByIdAndUpdate(req.user.id, {
                lastActive: new Date(),
                $inc: { activityStreak: 1 }
            });

            res.json({ message: 'Progress tracked successfully', progress });
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Get student's progress across all courses
    getProgress: async (req, res, next) => {
        try {
            const student = await User.findById(req.user.id)
                .populate({
                    path: 'coursesEnrolled',
                    populate: [
                        {
                            path: 'content.assignments',
                            select: 'submissions'
                        },
                        {
                            path: 'content.quizzes',
                            select: 'attempts'
                        }
                    ]
                });

            const progress = student.coursesEnrolled.map(course => {
                // Calculate assignment completion
                const totalAssignments = course.content.assignments.length;
                const completedAssignments = course.content.assignments.filter(assignment => 
                    assignment.submissions.some(sub => 
                        sub.student.toString() === req.user.id
                    )
                ).length;

                // Calculate quiz completion
                const totalQuizzes = course.content.quizzes.length;
                const completedQuizzes = course.content.quizzes.filter(quiz =>
                    quiz.attempts.some(attempt =>
                        attempt.student.toString() === req.user.id
                    )
                ).length;

                return {
                    courseId: course._id,
                    courseTitle: course.title,
                    assignmentProgress: {
                        completed: completedAssignments,
                        total: totalAssignments,
                        percentage: totalAssignments ? (completedAssignments / totalAssignments) * 100 : 0
                    },
                    quizProgress: {
                        completed: completedQuizzes,
                        total: totalQuizzes,
                        percentage: totalQuizzes ? (completedQuizzes / totalQuizzes) * 100 : 0
                    }
                };
            });

            res.json({ progress });
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Get student's activity streak
    getStreak: async (req, res, next) => {
        try {
            const student = await User.findById(req.user.id)
                .select('activityStreak lastActive');

            // Check if streak should be reset (inactive for more than 24 hours)
            const hoursSinceLastActive = (new Date() - student.lastActive) / (1000 * 60 * 60);
            
            if (hoursSinceLastActive > 24) {
                await User.findByIdAndUpdate(req.user.id, {
                    activityStreak: 0
                });
                return res.json({ streak: 0 });
            }

            res.json({ 
                streak: student.activityStreak,
                lastActive: student.lastActive
            });
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Submit a quiz attempt
    submitQuiz: async (req, res, next) => {
        try {
            const { quizId } = req.params;
            const { answers } = req.body;

            const quiz = await Quiz.findById(quizId);
            if (!quiz) {
                throw new ApiError('Quiz not found', 404);
            }

            // Check if student is enrolled in the course
            const course = await Course.findById(quiz.course);
            if (!course.students.includes(req.user.id)) {
                throw new ApiError('You are not enrolled in this course', 403);
            }

            // Calculate score
            let score = 0;
            quiz.questions.forEach((question, index) => {
                if (question.correctAnswer === answers[index]) {
                    score++;
                }
            });

            const scorePercentage = (score / quiz.questions.length) * 100;

            // Add attempt to quiz
            const attempt = {
                student: req.user.id,
                answers,
                score: scorePercentage,
                attemptedAt: new Date()
            };

            await Quiz.findByIdAndUpdate(quizId, {
                $push: { attempts: attempt }
            });

            // Update activity streak
            await User.findByIdAndUpdate(req.user.id, {
                lastActive: new Date(),
                $inc: { activityStreak: 1 }
            });

            res.json({
                message: 'Quiz submitted successfully',
                score: scorePercentage,
                totalQuestions: quiz.questions.length,
                correctAnswers: score
            });
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Get quiz attempts for a student
    getQuizAttempts: async (req, res, next) => {
        try {
            const { quizId } = req.params;
            
            const quiz = await Quiz.findById(quizId)
                .select('attempts title questions')
                .populate('course', 'title');

            if (!quiz) {
                throw new ApiError('Quiz not found', 404);
            }

            const studentAttempts = quiz.attempts.filter(
                attempt => attempt.student.toString() === req.user.id
            );

            res.json({
                quizTitle: quiz.title,
                course: quiz.course,
                totalQuestions: quiz.questions.length,
                attempts: studentAttempts
            });
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Get recommended courses based on student's educational stage and interests
    getRecommendedCourses: async (req, res, next) => {
        try {
            const student = await User.findById(req.user.id)
                .select('educationalStage coursesEnrolled');

            const recommendedCourses = await Course.find({
                _id: { $nin: student.coursesEnrolled },
                'educationalStage.level': student.educationalStage.level,
                'educationalStage.grade': student.educationalStage.grade
            })
            .populate('teacher', 'personalInfo.name')
            .limit(5)
            .lean();

            res.json(recommendedCourses);
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    }
};

module.exports = studentController;
