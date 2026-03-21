const express = require('express');
const { protect } = require('../middleware/auth');
const { depositValidation, withdrawValidation } = require('../middleware/validation');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const router = express.Router();

// Exchange rates (base KES)
const EXCHANGE_RATES = {
  KES: 1,
  UGX: 28.5,  // 1 KES = 28.5 UGX
  MWK: 12.8   // 1 KES = 12.8 MWK
};

// Minimum deposit in KES (base currency)
const MINIMUM_DEPOSIT_KES = 500;

// Payment methods configuration with updated minimums
const PAYMENT_METHODS = {
  KES: {
    currency: 'KES',
    symbol: 'KSh',
    minDeposit: 500,  // Minimum 500 KES
    methods: [
      {
        id: 'till',
        name: 'M-Pesa Till',
        number: '5243333',
        instructions: 'Go to M-Pesa, select Pay Bill, enter Business Number 5243333, Account Number: Your Phone Number',
        min: 500,
        max: 70000
      },
      {
        id: 'card',
        name: 'Card Payment',
        min: 500,
        max: 500000
      }
    ]
  },
  UGX: {
    currency: 'UGX',
    symbol: 'USh',
    minDeposit: 14250,  // 500 KES × 28.5 = 14,250 UGX
    methods: [
      {
        id: 'mobile',
        name: 'Airtel Money / MTN Mobile Money',
        number: '+256 700 123 456',
        instructions: 'Send money to +256 700 123 456 with reference: BETZENITH',
        min: 14250,
        max: 5000000
      }
    ]
  },
  MWK: {
    currency: 'MWK',
    symbol: 'MK',
    minDeposit: 6400,  // 500 KES × 12.8 = 6,400 MWK
    methods: [
      {
        id: 'mobile',
        name: 'Airtel Money / TNM Mpamba',
        number: '+265 888 123 456',
        instructions: 'Send money to +265 888 123 456 with reference: BETZENITH',
        min: 6400,
        max: 2000000
      }
    ]
  }
};

// @route   GET /api/payments/methods
// @desc    Get available payment methods for user's currency
router.get('/methods', protect, (req, res) => {
  const userCurrency = req.user.currency || 'KES';
  const methods = PAYMENT_METHODS[userCurrency] || PAYMENT_METHODS.KES;
  
  res.json({
    success: true,
    data: {
      currency: userCurrency,
      symbol: methods.symbol,
      minDeposit: methods.minDeposit,
      methods: methods.methods,
      exchangeRates: EXCHANGE_RATES
    }
  });
});

// @route   POST /api/payments/deposit
// @desc    Make a deposit
router.post('/deposit', protect, depositValidation, async (req, res) => {
  try {
    const { amount, paymentMethod = 'till', currency = 'KES' } = req.body;
    
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
    
    // Convert amount to base currency for balance update
    let amountInKES = depositAmount;
    if (currency !== 'KES') {
      amountInKES = depositAmount / EXCHANGE_RATES[currency];
    }
    
    const amountInKESNum = Number(amountInKES);
    
    // Create pending transaction
    const transaction = await Transaction.create({
      user: user._id,
      type: 'DEPOSIT',
      amount: depositAmount,
      amountInKES: amountInKESNum,
      currency: currency,
      status: 'PENDING',
      paymentMethod,
      description: `Deposit via ${paymentMethod} (${currency})`,
      metadata: {
        method: paymentMethod,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        phoneNumber: req.body.phoneNumber || null
      }
    });
    
    // Simulate payment processing (in production, this would be a callback)
    setTimeout(async () => {
      // Update user balance in KES
      user.balance += amountInKESNum;
      await user.save();
      
      // Update transaction
      transaction.status = 'COMPLETED';
      transaction.processedAt = new Date();
      transaction.balance = {
        before: user.balance - amountInKESNum,
        after: user.balance
      };
      await transaction.save();
      
      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${user._id}`).emit('balance-update', {
          newBalance: user.balance,
          transaction: transaction.summary
        });
        
        io.to(`user-${user._id}`).emit('notification', {
          type: 'success',
          title: 'Deposit Successful',
          message: `${currencyConfig?.symbol || 'KSh'} ${depositAmount.toLocaleString()} has been added to your account`
        });
      }
    }, 2000);
    
    res.json({
      success: true,
      message: 'Deposit initiated. You will receive confirmation shortly.',
      data: {
        transaction: transaction.summary,
        status: 'processing',
        minDeposit: minDeposit,
        instructions: currencyConfig?.methods.find(m => m.id === paymentMethod)?.instructions || null
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

// @route   POST /api/payments/confirm-mpesa
// @desc    Confirm M-Pesa payment (webhook callback)
router.post('/confirm-mpesa', async (req, res) => {
  try {
    const { transactionId, phoneNumber, amount, reference } = req.body;
    
    const transaction = await Transaction.findOne({ reference });
    
    if (!transaction || transaction.status !== 'PENDING') {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    const user = await User.findById(transaction.user);
    
    // Update balance
    user.balance += transaction.amountInKES || transaction.amount;
    await user.save();
    
    // Update transaction
    transaction.status = 'COMPLETED';
    transaction.processedAt = new Date();
    transaction.metadata = {
      ...transaction.metadata,
      mpesaReceipt: transactionId,
      confirmedPhone: phoneNumber
    };
    transaction.balance = {
      before: user.balance - transaction.amount,
      after: user.balance
    };
    await transaction.save();
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${user._id}`).emit('balance-update', {
        newBalance: user.balance,
        transaction: transaction.summary
      });
    }
    
    res.json({ success: true, message: 'Payment confirmed' });
    
  } catch (error) {
    console.error('M-Pesa confirmation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/payments/withdraw
// @desc    Make a withdrawal
router.post('/withdraw', protect, withdrawValidation, async (req, res) => {
  try {
    const { amount, paymentMethod = 'bank', currency = 'KES' } = req.body;
    
    const user = await User.findById(req.user._id);
    const withdrawAmount = Number(amount);
    
    // Convert amount to KES for balance check
    let amountInKES = withdrawAmount;
    if (currency !== 'KES') {
      amountInKES = withdrawAmount / EXCHANGE_RATES[currency];
    }
    
    // Minimum withdrawal (500 KES equivalent)
    const minWithdrawalKES = 500;
    const minWithdrawal = currency === 'KES' ? minWithdrawalKES : Math.ceil(minWithdrawalKES * EXCHANGE_RATES[currency]);
    
    if (withdrawAmount < minWithdrawal) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal is ${PAYMENT_METHODS[currency]?.symbol || 'KSh'} ${minWithdrawal.toLocaleString()}`
      });
    }
    
    // Check balance
    if (user.balance < amountInKES) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Your balance is KSh ${user.balance.toLocaleString()}`
      });
    }
    
    // Check withdrawal limits based on KYC level
    let maxWithdrawal = 1000000;
    if (user.kycLevel === 0) maxWithdrawal = 50000;
    if (user.kycLevel === 1) maxWithdrawal = 200000;
    if (user.kycLevel === 2) maxWithdrawal = 500000;
    if (user.kycLevel === 3) maxWithdrawal = 2000000;
    
    if (withdrawAmount > maxWithdrawal) {
      return res.status(400).json({
        success: false,
        message: `Maximum withdrawal for your KYC level is ${PAYMENT_METHODS[currency]?.symbol || 'KSh'} ${maxWithdrawal.toLocaleString()}`
      });
    }
    
    // Update user balance
    user.balance -= amountInKES;
    await user.save();
    
    // Create transaction
    const transaction = await Transaction.create({
      user: user._id,
      type: 'WITHDRAWAL',
      amount: withdrawAmount,
      amountInKES: amountInKES,
      currency: currency,
      status: 'PROCESSING',
      paymentMethod,
      balance: {
        before: user.balance + amountInKES,
        after: user.balance
      },
      description: `Withdrawal via ${paymentMethod} (${currency})`,
      metadata: {
        method: paymentMethod,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        phoneNumber: req.body.phoneNumber || null
      }
    });
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${user._id}`).emit('balance-update', {
        newBalance: user.balance,
        transaction: transaction.summary
      });
    }
    
    res.json({
      success: true,
      message: 'Withdrawal initiated. Processing will take 1-3 business days.',
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
        balances,
        minDeposits,
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

module.exports = router;