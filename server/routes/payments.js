const express = require('express');
const { protect } = require('../middleware/auth');
const { depositValidation, withdrawValidation } = require('../middleware/validation');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const router = express.Router();

// @route   GET /api/payments/methods
// @desc    Get available payment methods
// @access  Private
router.get('/methods', protect, (req, res) => {
  const methods = [
    { 
      id: 'card', 
      name: 'Credit/Debit Card', 
      min: 100, 
      max: 100000, 
      icon: '💳',
      processingTime: 'Instant',
      fee: 0
    },
    { 
      id: 'bank', 
      name: 'Bank Transfer', 
      min: 1000, 
      max: 1000000, 
      icon: '🏦',
      processingTime: '1-3 business days',
      fee: 0
    },
    { 
      id: 'mpesa', 
      name: 'M-PESA', 
      min: 100, 
      max: 70000, 
      icon: '📱',
      processingTime: 'Instant',
      fee: 0
    },
    { 
      id: 'airtel', 
      name: 'Airtel Money', 
      min: 100, 
      max: 50000, 
      icon: '📱',
      processingTime: 'Instant',
      fee: 0
    },
    { 
      id: 'paystack', 
      name: 'Paystack', 
      min: 100, 
      max: 1000000, 
      icon: '💳',
      processingTime: 'Instant',
      fee: 0.015
    }
  ];
  
  res.json({
    success: true,
    data: methods
  });
});

// @route   POST /api/payments/deposit
// @desc    Make a deposit
// @access  Private
router.post('/deposit', protect, depositValidation, async (req, res) => {
  try {
    const { amount, paymentMethod = 'card' } = req.body;
    
    const user = await User.findById(req.user._id);
    
    // Check deposit limit
    const limitCheck = await user.checkDepositLimit(amount);
    if (!limitCheck.allowed) {
      return res.status(400).json({
        success: false,
        message: limitCheck.reason
      });
    }
    
    const depositAmount = Number(amount);
    
    // Create pending transaction
    const transaction = await Transaction.create({
      user: user._id,
      type: 'DEPOSIT',
      amount: depositAmount,
      currency: user.currency,
      status: 'PENDING',
      paymentMethod,
      description: `Deposit via ${paymentMethod}`,
      metadata: { 
        method: paymentMethod,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    // In production, you would integrate with payment gateway here
    // For mock, we'll complete immediately
    setTimeout(async () => {
      // Complete transaction
      user.balance += depositAmount;
      await user.save();
      
      transaction.status = 'COMPLETED';
      transaction.processedAt = new Date();
      transaction.balance = {
        before: user.balance - depositAmount,
        after: user.balance
      };
      await transaction.save();
      
      // Emit socket event
      const io = req.app.get('io');
      io.to(`user-${user._id}`).emit('balance-update', {
        newBalance: user.balance,
        transaction: transaction.summary
      });
      
      // Create notification
      io.to(`user-${user._id}`).emit('notification', {
        type: 'success',
        title: 'Deposit Successful',
        message: `₦${depositAmount.toLocaleString()} has been added to your account`
      });
    }, 2000);
    
    res.json({
      success: true,
      message: 'Deposit initiated',
      data: {
        transaction: transaction.summary,
        status: 'processing'
      }
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/payments/withdraw
// @desc    Make a withdrawal
// @access  Private
router.post('/withdraw', protect, withdrawValidation, async (req, res) => {
  try {
    const { amount, paymentMethod = 'bank' } = req.body;
    
    const user = await User.findById(req.user._id);
    const withdrawAmount = Number(amount);
    
    // Check balance
    if (user.balance < withdrawAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }
    
    // Check withdrawal limits based on KYC level
    let maxWithdrawal = 1000000;
    if (user.kycLevel === 0) maxWithdrawal = 100000;
    if (user.kycLevel === 1) maxWithdrawal = 500000;
    if (user.kycLevel === 2) maxWithdrawal = 1000000;
    if (user.kycLevel === 3) maxWithdrawal = 5000000;
    
    if (withdrawAmount > maxWithdrawal) {
      return res.status(400).json({
        success: false,
        message: `Maximum withdrawal for your KYC level is ₦${maxWithdrawal.toLocaleString()}`
      });
    }
    
    // Update user balance immediately
    user.balance -= withdrawAmount;
    await user.save();
    
    // Create transaction
    const transaction = await Transaction.create({
      user: user._id,
      type: 'WITHDRAWAL',
      amount: -withdrawAmount,
      currency: user.currency,
      status: 'PROCESSING',
      paymentMethod,
      balance: {
        before: user.balance + withdrawAmount,
        after: user.balance
      },
      description: `Withdrawal via ${paymentMethod}`,
      metadata: { 
        method: paymentMethod,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    // In production, you would process actual withdrawal here
    setTimeout(async () => {
      transaction.status = 'COMPLETED';
      transaction.processedAt = new Date();
      await transaction.save();
      
      // Emit socket event
      const io = req.app.get('io');
      io.to(`user-${user._id}`).emit('balance-update', {
        newBalance: user.balance,
        transaction: transaction.summary
      });
      
      // Create notification
      io.to(`user-${user._id}`).emit('notification', {
        type: 'success',
        title: 'Withdrawal Processing',
        message: `Your withdrawal of ₦${withdrawAmount.toLocaleString()} is being processed`
      });
    }, 3000);
    
    res.json({
      success: true,
      message: 'Withdrawal initiated',
      data: {
        transaction: transaction.summary,
        newBalance: user.balance,
        status: 'processing'
      }
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/payments/transactions
// @desc    Get user's payment transactions
// @access  Private
router.get('/transactions', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const transactions = await Transaction.find({
      user: req.user._id,
      type: { $in: ['DEPOSIT', 'WITHDRAWAL'] }
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Transaction.countDocuments({
      user: req.user._id,
      type: { $in: ['DEPOSIT', 'WITHDRAWAL'] }
    });
    
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
    console.error('Get payment transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/payments/:id
// @desc    Get transaction details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;