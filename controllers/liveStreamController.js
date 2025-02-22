const LiveStream = require('../models/LiveStream');
const Course = require('../models/Course');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const liveStreamController = {
    // Start a new live stream
    startLiveStream: async (req, res, next) => {
        try {
            const { title, description, courseId } = req.body;

            // Verify course and teacher authorization
            const course = await Course.findOne({
                _id: courseId,
                teacher: req.user.id
            });

            if (!course) {
                throw new ApiError('Course not found or unauthorized', 404);
            }

            const liveStream = await LiveStream.create({
                title,
                description,
                course: courseId,
                conductedBy: req.user.id,
                startTime: new Date(),
                attendance: [req.user.id] // Add teacher as first attendee
            });

            // Update course with live stream reference
            await Course.findByIdAndUpdate(courseId, {
                $push: { 'content.videos': liveStream._id }
            });

            res.status(201).json(liveStream);
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Get all active live streams
    getAllLiveStreams: async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            // Only show streams that haven't ended
            const filter = { endTime: { $exists: false } };
            
            // If student, only show streams from enrolled courses
            if (req.user.role === 'student') {
                const enrolledCourses = await Course.find({ 
                    students: req.user.id 
                }).select('_id');
                filter.course = { $in: enrolledCourses };
            }

            const [streams, total] = await Promise.all([
                LiveStream.find(filter)
                    .skip(skip)
                    .limit(limit)
                    .populate('conductedBy', 'personalInfo.name email')
                    .populate('course', 'title')
                    .lean(),
                LiveStream.countDocuments(filter)
            ]);

            res.json({
                streams,
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

    // Get specific live stream by ID
    getLiveStreamById: async (req, res, next) => {
        try {
            const { streamId } = req.params;
            const stream = await LiveStream.findById(streamId)
                .populate('conductedBy', 'personalInfo.name email')
                .populate('course', 'title')
                .populate('attendance', 'personalInfo.name email');

            if (!stream) {
                throw new ApiError('Live stream not found', 404);
            }

            // Check if user has access to this stream
            if (req.user.role === 'student') {
                const course = await Course.findById(stream.course);
                if (!course.students.includes(req.user.id)) {
                    throw new ApiError('Not enrolled in this course', 403);
                }
            }

            res.json(stream);
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Join a live stream
    joinLiveStream: async (req, res, next) => {
        try {
            const { streamId } = req.params;
            const stream = await LiveStream.findById(streamId);

            if (!stream) {
                throw new ApiError('Live stream not found', 404);
            }

            if (stream.endTime) {
                throw new ApiError('This live stream has ended', 400);
            }

            // Check if user is enrolled in the course
            const course = await Course.findById(stream.course);
            if (!course.students.includes(req.user.id) && 
                course.teacher.toString() !== req.user.id) {
                throw new ApiError('Not authorized to join this stream', 403);
            }

            // Add user to attendance if not already present
            if (!stream.attendance.includes(req.user.id)) {
                await LiveStream.findByIdAndUpdate(streamId, {
                    $addToSet: { attendance: req.user.id }
                });
            }

            res.json({ message: 'Joined live stream successfully' });
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // End a live stream
    endLiveStream: async (req, res, next) => {
        try {
            const { streamId } = req.params;
            const stream = await LiveStream.findById(streamId);

            if (!stream) {
                throw new ApiError('Live stream not found', 404);
            }

            // Only the conductor can end the stream
            if (stream.conductedBy.toString() !== req.user.id) {
                throw new ApiError('Not authorized to end this stream', 403);
            }

            if (stream.endTime) {
                throw new ApiError('Stream has already ended', 400);
            }

            const updatedStream = await LiveStream.findByIdAndUpdate(
                streamId,
                { 
                    endTime: new Date(),
                    recordingUrl: req.body.recordingUrl 
                },
                { new: true }
            );

            res.json(updatedStream);
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    }
};

module.exports = liveStreamController; 