// server/routes/payments.js
const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const router = express.Router();

// Exchange rates (base KES)
const EXCHANGE_RATES = {
  KES: 1,
  UGX: 28.5,
  MWK: 12.8
};

// Payment methods configuration
const PAYMENT_METHODS = {
  KES: {
    currency: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    flag: '🇰🇪',
    minDeposit: 500,
    methods: [
      {
        id: 'till',
        name: 'M-Pesa Till Number',
        number: '9960318',
        type: 'Till Number',
        instructions: `1. Go to M-Pesa\n2. Select "Lipa na M-Pesa"\n3. Select "Till Number"\n4. Enter Till Number: 9960318\n5. Enter Amount (Min KSh 500)\n6. Enter your M-Pesa PIN\n7. Confirm payment`,
        action: 'Pay with M-Pesa Till'
      }
    ]
  },
  UGX: {
    currency: 'UGX',
    symbol: 'USh',
    name: 'Ugandan Shilling',
    flag: '🇺🇬',
    minDeposit: 14250,
    methods: [
      {
        id: 'mobile',
        name: 'Airtel Money / MTN Mobile Money',
        number: '+256 776 785216',
        type: 'Mobile Money',
        instructions: `1. Go to Airtel Money or MTN Mobile Money\n2. Select "Send Money"\n3. Enter Number: +256 776 785216\n4. Enter Amount (Min USh 14,250)\n5. Enter Reference: BETZENITH\n6. Enter PIN and confirm`,
        action: 'Send Money'
      }
    ]
  },
  MWK: {
    currency: 'MWK',
    symbol: 'MK',
    name: 'Malawian Kwacha',
    flag: '🇲🇼',
    minDeposit: 6400,
    methods: [
      {
        id: 'mobile',
        name: 'Airtel Money / TNM Mpamba',
        number: '+256 776 785216',
        type: 'Mobile Money',
        instructions: `1. Go to Airtel Money or TNM Mpamba\n2. Select "Send Money"\n3. Enter Number: +256 776 785216\n4. Enter Amount (Min MK 6,400)\n5. Enter Reference: BETZENITH\n6. Enter PIN and confirm`,
        action: 'Send Money'
      }
    ]
  }
};

// Store pending deposits (in production, use Redis or database)
const pendingDeposits = new Map();

// ============ TEST ENDPOINT ============
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Payments route working!',
    timestamp: new Date().toISOString(),
    endpoints: ['GET /methods', 'POST /deposit', 'POST /confirm-deposit', 'GET /check-deposit/:reference', 'GET /balance', 'GET /balance-simple']
  });
});

// ============ PUBLIC ROUTE ============
// @route   GET /api/payments/methods
// @desc    Get available payment methods (PUBLIC)
router.get('/methods', (req, res) => {
  console.log('📱 Payment methods requested');
  try {
    // Default to KES
    const methods = PAYMENT_METHODS.KES;
    
    res.json({
      success: true,
      data: {
        currency: methods.currency,
        symbol: methods.symbol,
        name: methods.name,
        flag: methods.flag,
        minDeposit: methods.minDeposit,
        methods: methods.methods,
        exchangeRates: EXCHANGE_RATES
      }
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ============ PROTECTED ROUTES ============

// @route   POST /api/payments/deposit
// @desc    Initiate a deposit
router.post('/deposit', protect, async (req, res) => {
  console.log('💰 Deposit initiated:', req.body);
  
  try {
    const { amount, paymentMethod = 'till', currency = 'KES', phoneNumber } = req.body;
    
    const user = await User.findById(req.user._id);
    const depositAmount = Number(amount);
    
    // Validate amount
    if (isNaN(depositAmount) || depositAmount < 500) {
      return res.status(400).json({
        success: false,
        message: `Minimum deposit is KSh 500`
      });
    }
    
    // Validate phone number
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required for payment'
      });
    }
    
    // Generate unique transaction reference
    const reference = `DEP${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Create pending transaction
    const transaction = await Transaction.create({
      user: user._id,
      type: 'DEPOSIT',
      amount: depositAmount,
      amountInKES: depositAmount,
      currency: 'KES',
      status: 'PENDING',
      paymentMethod,
      reference,
      description: `Deposit of KSh ${depositAmount.toLocaleString()} via ${paymentMethod === 'till' ? 'M-Pesa Till' : paymentMethod}`,
      metadata: {
        method: paymentMethod,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        phoneNumber: phoneNumber,
        initiatedAt: new Date().toISOString()
      }
    });
    
    // Store pending deposit
    pendingDeposits.set(reference, {
      userId: user._id,
      amount: depositAmount,
      phoneNumber,
      transactionId: transaction._id,
      createdAt: Date.now()
    });
    
    // Get payment instructions
    const methodConfig = PAYMENT_METHODS.KES.methods.find(m => m.id === paymentMethod);
    
    res.json({
      success: true,
      message: 'Deposit initiated. Please send payment to complete.',
      data: {
        reference,
        amount: depositAmount,
        currency: 'KES',
        symbol: 'KSh',
        paymentDetails: {
          number: methodConfig.number,
          type: methodConfig.type,
          instructions: methodConfig.instructions,
          action: methodConfig.action
        },
        status: 'pending'
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

// @route   POST /api/payments/confirm-deposit
// @desc    Confirm a deposit after user has sent payment
router.post('/confirm-deposit', protect, async (req, res) => {
  console.log('✅ Confirming deposit:', req.body);
  
  try {
    const { reference, transactionId, phoneNumber } = req.body;
    
    const pending = pendingDeposits.get(reference);
    
    if (!pending) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or already processed'
      });
    }
    
    // Get transaction
    const transaction = await Transaction.findOne({ reference });
    
    if (!transaction || transaction.status !== 'PENDING') {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // Update user balance
    const user = await User.findById(pending.userId);
    const oldBalance = user.balance;
    user.balance += pending.amount;
    await user.save();
    
    // Update transaction
    transaction.status = 'COMPLETED';
    transaction.processedAt = new Date();
    transaction.metadata = {
      ...transaction.metadata,
      confirmedAt: new Date().toISOString(),
      transactionId: transactionId,
      confirmedPhone: phoneNumber
    };
    transaction.balance = {
      before: oldBalance,
      after: user.balance
    };
    await transaction.save();
    
    // Remove from pending
    pendingDeposits.delete(reference);
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${user._id}`).emit('balance-update', {
        newBalance: user.balance,
        amount: pending.amount,
        transaction: transaction.summary
      });
    }
    
    res.json({
      success: true,
      message: 'Deposit confirmed successfully!',
      data: {
        newBalance: user.balance,
        amountAdded: pending.amount,
        transaction: transaction.summary
      }
    });
    
  } catch (error) {
    console.error('Confirm deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/payments/check-deposit/:reference
// @desc    Check status of a deposit
router.get('/check-deposit/:reference', protect, async (req, res) => {
  console.log('🔍 Checking deposit:', req.params.reference);
  
  try {
    const { reference } = req.params;
    
    const transaction = await Transaction.findOne({ reference, user: req.user._id });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        status: transaction.status,
        reference: transaction.reference,
        amount: transaction.amount,
        currency: transaction.currency,
        createdAt: transaction.createdAt,
        processedAt: transaction.processedAt
      }
    });
    
  } catch (error) {
    console.error('Check deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/payments/balance
// @desc    Get user balance in all currencies
router.get('/balance', protect, async (req, res) => {
  console.log('💰 Balance requested for user:', req.user._id);
  
  try {
    const user = await User.findById(req.user._id);
    
    const balances = {
      KES: user.balance,
      UGX: user.balance * EXCHANGE_RATES.UGX,
      MWK: user.balance * EXCHANGE_RATES.MWK
    };
    
    res.json({
      success: true,
      data: {
        baseCurrency: 'KES',
        balance: user.balance,
        balances,
        symbols: {
          KES: 'KSh',
          UGX: 'USh',
          MWK: 'MK'
        }
      }
    });
    
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/payments/balance-simple
// @desc    Get simple user balance (for header)
router.get('/balance-simple', protect, async (req, res) => {
  console.log('💰 Simple balance requested');
  
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      data: {
        balance: user.balance,
        currency: 'KES',
        symbol: 'KSh'
      }
    });
    
  } catch (error) {
    console.error('Get simple balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;