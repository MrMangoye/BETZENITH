const express = require('express');
const { protect } = require('../middleware/auth');
const { updateProfileValidation, changePasswordValidation } = require('../middleware/validation');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Bet = require('../models/Bet');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -loginHistory -devices');
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, updateProfileValidation, async (req, res) => {
  try {
    const { username, phoneNumber, country, dateOfBirth } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (username) user.username = username;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (country) user.country = country;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/users/balance
// @desc    Get user balance
// @access  Private
router.get('/balance', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayBets = await Bet.aggregate([
      {
        $match: {
          user: user._id,
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          totalStake: { $sum: '$stake' },
          totalWon: {
            $sum: { $cond: [{ $eq: ['$status', 'WON'] }, '$potentialWin', 0] }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        balance: user.balance,
        currency: user.currency,
        today: {
          stake: todayBets[0]?.totalStake || 0,
          won: todayBets[0]?.totalWon || 0
        }
      }
    });
  } catch (error) {
    console.error('Balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/users/transactions
// @desc    Get user transactions
// @access  Private
router.get('/transactions', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    
    let query = { user: req.user._id };
    if (type) query.type = type;
    
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/users/bets
// @desc    Get user bets (summary)
// @access  Private
router.get('/bets', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const bets = await Bet.find({ user: req.user._id })
      .populate('selections.match', 'homeTeam awayTeam league date')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: bets
    });
  } catch (error) {
    console.error('User bets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/users/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', protect, changePasswordValidation, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id).select('+password');
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/users/notification-settings
// @desc    Get notification settings
// @access  Private
router.get('/notification-settings', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notificationSettings');
    
    res.json({
      success: true,
      data: user.notificationSettings
    });
  } catch (error) {
    console.error('Notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/users/notification-settings
// @desc    Update notification settings
// @access  Private
router.put('/notification-settings', protect, async (req, res) => {
  try {
    const { email, push, sms } = req.body;
    
    const user = await User.findById(req.user._id);
    
    user.notificationSettings = {
      email: { ...user.notificationSettings.email, ...email },
      push: { ...user.notificationSettings.push, ...push },
      sms: { ...user.notificationSettings.sms, ...sms }
    };
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Notification settings updated',
      data: user.notificationSettings
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/users/gaming-limits
// @desc    Get responsible gaming limits
// @access  Private
router.get('/gaming-limits', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('gamingLimits');
    
    res.json({
      success: true,
      data: user.gamingLimits
    });
  } catch (error) {
    console.error('Gaming limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/users/gaming-limits
// @desc    Update gaming limits
// @access  Private
router.put('/gaming-limits', protect, async (req, res) => {
  try {
    const { depositLimit, lossLimit, betLimit, sessionLimit } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (depositLimit) {
      user.gamingLimits.depositLimit = {
        ...user.gamingLimits.depositLimit,
        ...depositLimit,
        resetDate: new Date()
      };
    }
    
    if (lossLimit) {
      user.gamingLimits.lossLimit = {
        ...user.gamingLimits.lossLimit,
        ...lossLimit,
        resetDate: new Date()
      };
    }
    
    if (betLimit) {
      user.gamingLimits.betLimit = {
        ...user.gamingLimits.betLimit,
        ...betLimit
      };
    }
    
    if (sessionLimit) {
      user.gamingLimits.sessionLimit = {
        ...user.gamingLimits.sessionLimit,
        ...sessionLimit
      };
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Gaming limits updated',
      data: user.gamingLimits
    });
  } catch (error) {
    console.error('Update gaming limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/users/self-exclude
// @desc    Self-exclude user
// @access  Private
router.post('/self-exclude', protect, async (req, res) => {
  try {
    const { duration } = req.body; // days: 1, 7, 30, 365, or 'permanent'
    
    const user = await User.findById(req.user._id);
    
    const exclusionUntil = new Date();
    
    if (duration === 'permanent') {
      exclusionUntil.setFullYear(exclusionUntil.getFullYear() + 100);
    } else {
      exclusionUntil.setDate(exclusionUntil.getDate() + parseInt(duration));
    }
    
    user.gamingLimits.selfExcluded = true;
    user.gamingLimits.selfExclusionUntil = exclusionUntil;
    user.gamingLimits.excludedAt = new Date();
    
    await user.save();
    
    res.json({
      success: true,
      message: `Self-exclusion applied until ${exclusionUntil.toLocaleDateString()}`,
      data: {
        selfExcluded: true,
        selfExclusionUntil: exclusionUntil
      }
    });
  } catch (error) {
    console.error('Self-exclusion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
