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
        number: '9960318',  // Updated till number
        instructions: `1. Go to M-Pesa\n2. Select "Lipa na M-Pesa"\n3. Select "Pay Bill"\n4. Enter Business Number: 9960318\n5. Enter Account Number: Your Phone Number\n6. Enter Amount (Min KSh 500)\n7. Enter PIN and confirm`,
        action: 'Pay with M-Pesa',
        min: 500,
        max: 70000
      },
      {
        id: 'card',
        name: 'Card Payment',
        min: 500,
        max: 500000,
        instructions: 'Enter your card details below to complete payment',
        action: 'Pay with Card'
      }
    ]
  },
  UGX: {
    currency: 'UGX',
    symbol: 'USh',
    name: 'Ugandan Shilling',
    flag: '🇺🇬',
    minDeposit: 14250,  // 500 KES × 28.5 = 14,250 UGX
    methods: [
      {
        id: 'mobile',
        name: 'Airtel Money / MTN Mobile Money',
        number: '+256 776 785216',  // Updated Uganda number
        instructions: `1. Go to Airtel Money or MTN Mobile Money\n2. Select "Send Money"\n3. Enter Number: +256 776 785216\n4. Enter Amount (Min USh 14,250)\n5. Enter Reference: BETZENITH\n6. Enter PIN and confirm`,
        action: 'Send Money',
        min: 14250,
        max: 5000000
      }
    ]
  },
  MWK: {
    currency: 'MWK',
    symbol: 'MK',
    name: 'Malawian Kwacha',
    flag: '🇲🇼',
    minDeposit: 6400,  // 500 KES × 12.8 = 6,400 MWK
    methods: [
      {
        id: 'mobile',
        name: 'Airtel Money / TNM Mpamba',
        number: '+256 776 785216',  // Same number for Malawi (can be updated)
        instructions: `1. Go to Airtel Money or TNM Mpamba\n2. Select "Send Money"\n3. Enter Number: +256 776 785216\n4. Enter Amount (Min MK 6,400)\n5. Enter Reference: BETZENITH\n6. Enter PIN and confirm`,
        action: 'Send Money',
        min: 6400,
        max: 2000000
      }
    ]
  }
};

// Store pending deposits for verification
const pendingDeposits = new Map();

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
    
    // In production, you would verify with M-Pesa API here
    // For now, we'll simulate verification
    const user = await User.findById(pending.userId);
    
    // Update user balance
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
      before: user.balance - pending.amountInKES,
      after: user.balance
    };
    await transaction.save();
    
    // Remove from pending deposits
    pendingDeposits.delete(reference);
    
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
        message: `${PAYMENT_METHODS[pending.currency]?.symbol || 'KSh'} ${pending.amount.toLocaleString()} has been added to your account`
      });
    }
    
    res.json({
      success: true,
      message: 'Deposit confirmed successfully!',
      data: {
        newBalance: user.balance,
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

// @route   POST /api/payments/mpesa-callback
// @desc    M-Pesa callback webhook (for real M-Pesa integration)
router.post('/mpesa-callback', async (req, res) => {
  try {
    const { Body } = req.body;
    
    if (Body && Body.stkCallback) {
      const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;
      
      if (ResultCode === 0) {
        // Payment successful
        let amount = 0;
        let phoneNumber = '';
        
        if (CallbackMetadata && CallbackMetadata.Item) {
          CallbackMetadata.Item.forEach(item => {
            if (item.Name === 'Amount') amount = item.Value;
            if (item.Name === 'PhoneNumber') phoneNumber = item.Value;
          });
        }
        
        // Find pending transaction by reference
        const transaction = await Transaction.findOne({ 
          'metadata.checkoutRequestId': CheckoutRequestID 
        });
        
        if (transaction && transaction.status === 'PENDING') {
          const user = await User.findById(transaction.user);
          
          user.balance += transaction.amountInKES;
          await user.save();
          
          transaction.status = 'COMPLETED';
          transaction.processedAt = new Date();
          transaction.metadata = {
            ...transaction.metadata,
            mpesaReceipt: MerchantRequestID,
            checkoutRequestId: CheckoutRequestID,
            confirmedAt: new Date().toISOString()
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
        }
      }
    }
    
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
    
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.json({ ResultCode: 1, ResultDesc: 'Failed' });
  }
});

// @route   POST /api/payments/withdraw
// @desc    Make a withdrawal
router.post('/withdraw', protect, async (req, res) => {
  try {
    const { amount, paymentMethod = 'mobile', currency = 'KES', phoneNumber } = req.body;
    
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
      description: `Withdrawal via ${paymentMethod} (${currency})`,
      metadata: {
        method: paymentMethod,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        phoneNumber: phoneNumber
      },
      balance: {
        before: user.balance + amountInKES,
        after: user.balance
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

module.exports = router;