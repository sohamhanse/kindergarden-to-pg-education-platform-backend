const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            throw new ApiError('No authentication token, access denied', 401);
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Get user from database
            const user = await User.findById(decoded.userId)
                .select('-password')
                .lean();

            if (!user) {
                throw new ApiError('User not found', 404);
            }

            // Update last active timestamp
            await User.findByIdAndUpdate(user._id, {
                lastActive: new Date()
            });

            // Add user info to request
            req.user = user;
            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                throw new ApiError('Invalid token', 401);
            }
            if (error.name === 'TokenExpiredError') {
                throw new ApiError('Token has expired', 401);
            }
            throw error;
        }
    } catch (error) {
        next(new ApiError(error.message, error.status || 500));
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ApiError('Not authorized to access this route', 403));
        }
        next();
    };
};

module.exports = {
    authMiddleware,
    authorize
};
