const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();

// Exchange rates (base KES)
const EXCHANGE_RATES = {
  KES: 1,
  UGX: 28.5,  // 1 KES = 28.5 UGX
  MWK: 12.8   // 1 KES = 12.8 MWK
};

// Minimum deposit in KES (base currency)
const MINIMUM_DEPOSIT_KES = 500;

// Payment methods configuration with REAL NUMBERS
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

// Store pending deposits for verification
const pendingDeposits = new Map();

// @route   GET /api/payments/methods
// @desc    Get available payment methods
router.get('/methods', protect, (req, res) => {
  const userCurrency = req.user.currency || 'KES';
  const methods = PAYMENT_METHODS[userCurrency] || PAYMENT_METHODS.KES;
  
  res.json({
    success: true,
    data: {
      currency: userCurrency,
      symbol: methods.symbol,
      name: methods.name,
      flag: methods.flag,
      minDeposit: methods.minDeposit,
      methods: methods.methods,
      exchangeRates: EXCHANGE_RATES
    }
  });
});

// @route   POST /api/payments/deposit
// @desc    Initiate a deposit
router.post('/deposit', protect, async (req, res) => {
  try {
    const { amount, paymentMethod = 'till', currency = 'KES', phoneNumber } = req.body;
    
    const user = await User.findById(req.user._id);
    const depositAmount = Number(amount);
    
    // Get minimum deposit for the selected currency
    const currencyConfig = PAYMENT_METHODS[currency];
    const minDeposit = currencyConfig?.minDeposit || 500;
    
    // Validate minimum deposit
    if (depositAmount < minDeposit) {
      return res.status(400).json({
        success: false,
        message: `Minimum deposit is ${currencyConfig?.symbol || 'KSh'} ${minDeposit.toLocaleString()}`
      });
    }
    
    // Validate phone number
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required for payment'
      });
    }
    
    // Convert amount to base currency for balance update
    let amountInKES = depositAmount;
    if (currency !== 'KES') {
      amountInKES = depositAmount / EXCHANGE_RATES[currency];
    }
    
    // Generate unique transaction reference
    const reference = `DEP${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Create pending transaction
    const transaction = await Transaction.create({
      user: user._id,
      type: 'DEPOSIT',
      amount: depositAmount,
      amountInKES: amountInKES,
      currency: currency,
      status: 'PENDING',
      paymentMethod,
      reference,
      description: `Deposit via ${paymentMethod} (${currency})`,
      metadata: {
        method: paymentMethod,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        phoneNumber: phoneNumber,
        initiatedAt: new Date().toISOString()
      }
    });
    
    // Store pending deposit for verification
    pendingDeposits.set(reference, {
      userId: user._id,
      amount: depositAmount,
      amountInKES: amountInKES,
      currency,
      phoneNumber,
      createdAt: Date.now()
    });
    
    // Get payment instructions
    const methodConfig = currencyConfig.methods.find(m => m.id === paymentMethod);
    
    res.json({
      success: true,
      message: 'Deposit initiated. Please send payment to complete.',
      data: {
        reference,
        amount: depositAmount,
        currency,
        symbol: currencyConfig.symbol,
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
  try {
    const { reference, transactionId, phoneNumber } = req.body;
    
    const pending = pendingDeposits.get(reference);
    
    if (!pending) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or already processed'
      });
    }
    
    // Check if transaction exists in database
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
    user.balance += pending.amountInKES;
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
    
    // Remove from pending deposits
    pendingDeposits.delete(reference);
    
    // Emit socket event for real-time balance update
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${user._id}`).emit('balance-update', {
        newBalance: user.balance,
        oldBalance: oldBalance,
        amount: pending.amount,
        currency: pending.currency,
        transaction: transaction.summary
      });
      
      io.to(`user-${user._id}`).emit('notification', {
        type: 'success',
        title: 'Deposit Successful',
        message: `${PAYMENT_METHODS[pending.currency]?.symbol || 'KSh'} ${pending.amount.toLocaleString()} has been added to your account`,
        newBalance: user.balance
      });
    }
    
    res.json({
      success: true,
      message: 'Deposit confirmed successfully!',
      data: {
        newBalance: user.balance,
        oldBalance: oldBalance,
        amountAdded: pending.amount,
        currency: pending.currency,
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
  try {
    const { reference } = req.params;
    
    const transaction = await Transaction.findOne({ reference });
    
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
  try {
    const user = await User.findById(req.user._id);
    
    // Calculate balances in all currencies
    const balances = {
      KES: user.balance,
      UGX: user.balance * EXCHANGE_RATES.UGX,
      MWK: user.balance * EXCHANGE_RATES.MWK
    };
    
    // Get minimum deposit in each currency
    const minDeposits = {
      KES: PAYMENT_METHODS.KES.minDeposit,
      UGX: PAYMENT_METHODS.UGX.minDeposit,
      MWK: PAYMENT_METHODS.MWK.minDeposit
    };
    
    res.json({
      success: true,
      data: {
        baseCurrency: 'KES',
        balance: user.balance,
        balances,
        minDeposits,
        symbols: {
          KES: 'KSh',
          UGX: 'USh',
          MWK: 'MK'
        },
        flags: {
          KES: '🇰🇪',
          UGX: '🇺🇬',
          MWK: '🇲🇼'
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