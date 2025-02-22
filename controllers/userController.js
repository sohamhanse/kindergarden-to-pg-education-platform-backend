const User = require('../models/User');

const userController = {
  // Get current user's profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id)
        .select('-password')
        .populate('coursesEnrolled')
        .populate('children')
        .populate('teachingCourses');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error in getProfile:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Update current user's profile
  updateProfile: async (req, res) => {
    try {
      const allowedUpdates = [
        'personalInfo',
        'educationalStage',
        'email'
      ];

      // Filter out any fields that aren't allowed to be updated
      const updates = Object.keys(req.body)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {});

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { 
          $set: updates,
          lastActive: Date.now()
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error in updateProfile:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get user by ID (admin and teacher only)
  getUserById: async (req, res) => {
    try {
      // Check if user has permission to view other users
      if (!['admin', 'teacher'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Permission denied' });
      }

      const user = await User.findById(req.params.userId)
        .select('-password')
        .populate('coursesEnrolled')
        .populate('children')
        .populate('teachingCourses');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error in getUserById:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Delete user (admin only)
  deleteUser: async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Permission denied' });
      }

      const user = await User.findById(req.params.userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Prevent deleting the last admin
      if (user.role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
          return res.status(400).json({ 
            message: 'Cannot delete the last admin user' 
          });
        }
      }

      await user.deleteOne();
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error in deleteUser:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = userController;