const ApiError = require('../utils/ApiError');
const Video = require('../models/Video');
const User = require('../models/User');
const Assignment = require('../models/Assignment');

const uploadController = {
    uploadProfilePicture: async (req, res, next) => {
        try {
            if (!req.file) {
                throw new ApiError('No file uploaded', 400);
            }

            const fileUrl = `${req.protocol}://${req.get('host')}/${req.file.path}`;
            
            await User.findByIdAndUpdate(req.user.id, {
                'personalInfo.profilePicture': fileUrl
            });

            res.status(200).json({ 
                message: 'Profile picture uploaded successfully',
                fileUrl 
            });
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    uploadVideo: async (req, res, next) => {
        try {
            if (!req.file) {
                throw new ApiError('No video file uploaded', 400);
            }

            const fileUrl = `${req.protocol}://${req.get('host')}/${req.file.path}`;
            
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
    },

    uploadAssignment: async (req, res, next) => {
        try {
            if (!req.file) {
                throw new ApiError('No assignment file uploaded', 400);
            }

            const fileUrl = `${req.protocol}://${req.get('host')}/${req.file.path}`;
            
            // Add submission to assignment
            const updatedAssignment = await Assignment.findByIdAndUpdate(
                req.params.assignmentId,
                {
                    $push: {
                        submissions: {
                            student: req.user.id,
                            files: [fileUrl],
                            submittedAt: new Date()
                        }
                    }
                },
                { new: true }
            );

            if (!updatedAssignment) {
                throw new ApiError('Assignment not found', 404);
            }

            res.status(200).json({
                message: 'Assignment submitted successfully',
                submission: updatedAssignment.submissions[updatedAssignment.submissions.length - 1]
            });
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    }
};

module.exports = uploadController; 