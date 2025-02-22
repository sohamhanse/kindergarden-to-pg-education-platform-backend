const Meeting = require('../models/Meeting');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const meetingController = {
    // Schedule a new meeting
    scheduleMeeting: async (req, res, next) => {
        try {
            const { participants, scheduledTime, notes, type } = req.body;

            // Validate scheduled time
            if (new Date(scheduledTime) < new Date()) {
                throw new ApiError('Meeting cannot be scheduled in the past', 400);
            }

            // Validate participants exist
            if (participants && participants.length > 0) {
                const userCount = await User.countDocuments({
                    _id: { $in: participants }
                });
                
                if (userCount !== participants.length) {
                    throw new ApiError('One or more participants not found', 400);
                }
            }

            const meeting = await Meeting.create({
                participants: [...participants, req.user.id], // Include organizer
                scheduledTime,
                notes,
                type: type || 'parent-teacher',
                organizer: req.user.id
            });

            const populatedMeeting = await Meeting.findById(meeting._id)
                .populate('participants', 'personalInfo.name email role')
                .populate('organizer', 'personalInfo.name email role');

            res.status(201).json(populatedMeeting);
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Get all meetings for the user
    getAllMeetings: async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            // Build filter based on user's role and query params
            const filter = {
                participants: req.user.id
            };

            if (req.query.type) {
                filter.type = req.query.type;
            }

            if (req.query.startDate) {
                filter.scheduledTime = { 
                    $gte: new Date(req.query.startDate)
                };
            }

            const [meetings, total] = await Promise.all([
                Meeting.find(filter)
                    .skip(skip)
                    .limit(limit)
                    .populate('participants', 'personalInfo.name email role')
                    .populate('organizer', 'personalInfo.name email role')
                    .sort({ scheduledTime: 1 })
                    .lean(),
                Meeting.countDocuments(filter)
            ]);

            res.json({
                meetings,
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

    // Update meeting details
    updateMeeting: async (req, res, next) => {
        try {
            const { meetingId } = req.params;
            const meeting = await Meeting.findById(meetingId);

            if (!meeting) {
                throw new ApiError('Meeting not found', 404);
            }

            // Check if user is organizer or admin
            if (meeting.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
                throw new ApiError('Not authorized to update this meeting', 403);
            }

            // Validate scheduled time if being updated
            if (req.body.scheduledTime && new Date(req.body.scheduledTime) < new Date()) {
                throw new ApiError('Meeting cannot be scheduled in the past', 400);
            }

            const updatedMeeting = await Meeting.findByIdAndUpdate(
                meetingId,
                { $set: req.body },
                { new: true, runValidators: true }
            )
            .populate('participants', 'personalInfo.name email role')
            .populate('organizer', 'personalInfo.name email role');

            res.json(updatedMeeting);
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Delete a meeting
    deleteMeeting: async (req, res, next) => {
        try {
            const { meetingId } = req.params;
            const meeting = await Meeting.findById(meetingId);

            if (!meeting) {
                throw new ApiError('Meeting not found', 404);
            }

            // Check if user is organizer or admin
            if (meeting.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
                throw new ApiError('Not authorized to delete this meeting', 403);
            }

            await meeting.deleteOne();
            res.json({ message: 'Meeting deleted successfully' });
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    }
};

module.exports = meetingController;
