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

// ============ PUBLIC ROUTES (No authentication required) ============

// @route   GET /api/payments/methods
// @desc    Get available payment methods (PUBLIC - no auth required)
router.get('/methods', (req, res) => {
  console.log('🔍 [DEBUG] ========== PAYMENT METHODS REQUEST ==========');
  console.log('🔍 [DEBUG] Request headers:', req.headers);
  console.log('🔍 [DEBUG] Request query:', req.query);
  console.log('🔍 [DEBUG] User from req.user:', req.user);
  
  try {
    // Default to KES if no user or currency not set
    const userCurrency = req.user?.currency || 'KES';
    console.log('🔍 [DEBUG] User currency detected:', userCurrency);
    
    const methods = PAYMENT_METHODS[userCurrency] || PAYMENT_METHODS.KES;
    console.log('🔍 [DEBUG] Payment methods found for currency:', userCurrency);
    console.log('🔍 [DEBUG] Methods count:', methods.methods.length);
    console.log('🔍 [DEBUG] Methods data:', JSON.stringify(methods.methods, null, 2));
    
    const responseData = {
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
    };
    
    console.log('🔍 [DEBUG] Sending response:', JSON.stringify(responseData, null, 2));
    console.log('✅ [DEBUG] Payment methods request completed successfully');
    
    res.json(responseData);
  } catch (error) {
    console.error('❌ [DEBUG] Error fetching payment methods:', error);
    console.error('❌ [DEBUG] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ============ PROTECTED ROUTES (Authentication required) ============

// @route   POST /api/payments/deposit
// @desc    Initiate a deposit (requires auth)
router.post('/deposit', protect, async (req, res) => {
  console.log('🔍 [DEBUG] ========== DEPOSIT INITIATION REQUEST ==========');
  console.log('🔍 [DEBUG] Request body:', req.body);
  console.log('🔍 [DEBUG] User ID:', req.user?._id);
  console.log('🔍 [DEBUG] User:', req.user?.username);
  
  try {
    const { amount, paymentMethod = 'till', currency = 'KES', phoneNumber } = req.body;
    console.log('🔍 [DEBUG] Amount:', amount);
    console.log('🔍 [DEBUG] Payment method:', paymentMethod);
    console.log('🔍 [DEBUG] Currency:', currency);
    console.log('🔍 [DEBUG] Phone number:', phoneNumber);
    
    const user = await User.findById(req.user._id);
    console.log('🔍 [DEBUG] User found:', user?.username);
    console.log('🔍 [DEBUG] User current balance:', user?.balance);
    
    const depositAmount = Number(amount);
    console.log('🔍 [DEBUG] Parsed amount:', depositAmount);
    
    // Get minimum deposit for the selected currency
    const currencyConfig = PAYMENT_METHODS[currency];
    const minDeposit = currencyConfig?.minDeposit || 500;
    console.log('🔍 [DEBUG] Min deposit for', currency, ':', minDeposit);
    
    // Validate minimum deposit
    if (depositAmount < minDeposit) {
      console.log('❌ [DEBUG] Amount below minimum:', depositAmount, '<', minDeposit);
      return res.status(400).json({
        success: false,
        message: `Minimum deposit is ${currencyConfig?.symbol || 'KSh'} ${minDeposit.toLocaleString()}`
      });
    }
    
    // Validate phone number
    if (!phoneNumber) {
      console.log('❌ [DEBUG] No phone number provided');
      return res.status(400).json({
        success: false,
        message: 'Phone number is required for payment'
      });
    }
    
    // Convert amount to base currency for balance update
    let amountInKES = depositAmount;
    if (currency !== 'KES') {
      amountInKES = depositAmount / EXCHANGE_RATES[currency];
      console.log('🔍 [DEBUG] Converted to KES:', amountInKES);
    }
    
    // Generate unique transaction reference
    const reference = `DEP${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    console.log('🔍 [DEBUG] Generated reference:', reference);
    
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
    console.log('✅ [DEBUG] Transaction created with ID:', transaction._id);
    
    // Store pending deposit for verification
    pendingDeposits.set(reference, {
      userId: user._id,
      amount: depositAmount,
      amountInKES: amountInKES,
      currency,
      phoneNumber,
      createdAt: Date.now()
    });
    console.log('✅ [DEBUG] Pending deposit stored. Total pending:', pendingDeposits.size);
    
    // Get payment instructions
    const methodConfig = currencyConfig.methods.find(m => m.id === paymentMethod);
    console.log('🔍 [DEBUG] Method config found:', methodConfig ? 'Yes' : 'No');
    
    const responseData = {
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
    };
    
    console.log('✅ [DEBUG] Deposit initiated successfully');
    console.log('🔍 [DEBUG] Response data:', JSON.stringify(responseData, null, 2));
    
    res.json(responseData);
    
  } catch (error) {
    console.error('❌ [DEBUG] Deposit error:', error);
    console.error('❌ [DEBUG] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/payments/confirm-deposit
// @desc    Confirm a deposit after user has sent payment (requires auth)
router.post('/confirm-deposit', protect, async (req, res) => {
  console.log('🔍 [DEBUG] ========== CONFIRM DEPOSIT REQUEST ==========');
  console.log('🔍 [DEBUG] Request body:', req.body);
  
  try {
    const { reference, transactionId, phoneNumber } = req.body;
    console.log('🔍 [DEBUG] Reference:', reference);
    console.log('🔍 [DEBUG] Transaction ID:', transactionId);
    console.log('🔍 [DEBUG] Phone number:', phoneNumber);
    
    const pending = pendingDeposits.get(reference);
    console.log('🔍 [DEBUG] Pending deposit found:', pending ? 'Yes' : 'No');
    
    if (!pending) {
      console.log('❌ [DEBUG] No pending deposit found for reference');
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or already processed'
      });
    }
    
    // Check if transaction exists in database
    const transaction = await Transaction.findOne({ reference });
    console.log('🔍 [DEBUG] Database transaction found:', transaction ? 'Yes' : 'No');
    
    if (!transaction || transaction.status !== 'PENDING') {
      console.log('❌ [DEBUG] Transaction not found or already processed');
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // Update user balance
    const user = await User.findById(pending.userId);
    console.log('🔍 [DEBUG] User found:', user?.username);
    console.log('🔍 [DEBUG] Old balance:', user.balance);
    
    const oldBalance = user.balance;
    user.balance += pending.amountInKES;
    await user.save();
    console.log('✅ [DEBUG] User balance updated to:', user.balance);
    
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
    console.log('✅ [DEBUG] Transaction updated to COMPLETED');
    
    // Remove from pending deposits
    pendingDeposits.delete(reference);
    console.log('✅ [DEBUG] Pending deposit removed');
    
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
      console.log('✅ [DEBUG] Balance update event emitted');
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
    console.error('❌ [DEBUG] Confirm deposit error:', error);
    console.error('❌ [DEBUG] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/payments/check-deposit/:reference
// @desc    Check status of a deposit (requires auth)
router.get('/check-deposit/:reference', protect, async (req, res) => {
  console.log('🔍 [DEBUG] ========== CHECK DEPOSIT REQUEST ==========');
  console.log('🔍 [DEBUG] Reference:', req.params.reference);
  
  try {
    const { reference } = req.params;
    
    const transaction = await Transaction.findOne({ reference, user: req.user._id });
    console.log('🔍 [DEBUG] Transaction found:', transaction ? 'Yes' : 'No');
    
    if (!transaction) {
      console.log('❌ [DEBUG] Transaction not found');
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    console.log('🔍 [DEBUG] Transaction status:', transaction.status);
    
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
    console.error('❌ [DEBUG] Check deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/payments/balance
// @desc    Get user balance in all currencies (requires auth)
router.get('/balance', protect, async (req, res) => {
  console.log('🔍 [DEBUG] ========== BALANCE REQUEST ==========');
  console.log('🔍 [DEBUG] User ID:', req.user._id);
  
  try {
    const user = await User.findById(req.user._id);
    console.log('🔍 [DEBUG] User balance:', user.balance);
    
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
    console.error('❌ [DEBUG] Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/payments/balance-simple
// @desc    Get simple user balance (for header) (requires auth)
router.get('/balance-simple', protect, async (req, res) => {
  console.log('🔍 [DEBUG] ========== SIMPLE BALANCE REQUEST ==========');
  console.log('🔍 [DEBUG] User ID:', req.user._id);
  
  try {
    const user = await User.findById(req.user._id);
    console.log('🔍 [DEBUG] User balance:', user.balance);
    
    res.json({
      success: true,
      data: {
        balance: user.balance,
        currency: 'KES',
        symbol: 'KSh'
      }
    });
    
  } catch (error) {
    console.error('❌ [DEBUG] Get simple balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;