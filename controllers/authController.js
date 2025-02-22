const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authController = {
    register: async (req, res) => {
        try {
            const { email, password, role, personalInfo, educationalStage } = req.body;

            // Check if user already exists
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ message: 'User already exists' });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create new user
            user = new User({
                email,
                password: hashedPassword,
                role,
                personalInfo,
                educationalStage
            });

            await user.save();

            // Generate JWT token
            const token = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({ token });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Check if user exists
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // Validate password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({ token });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    logout: async (req, res) => {
        try {
            // Client-side should remove the token
            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;
            
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Generate password reset token
            const resetToken = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // TODO: Send reset token via email
            
            res.json({ message: 'Password reset instructions sent to email' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    resetPassword: async (req, res) => {
        try {
            const { token, newPassword } = req.body;

            // Verify reset token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Update user password
            await User.findByIdAndUpdate(decoded.userId, {
                password: hashedPassword
            });

            res.json({ message: 'Password reset successful' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Invalid or expired reset token' });
        }
    }
};

module.exports = authController;