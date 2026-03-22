// server/routes/payments.js
const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();

// Exchange rates
const EXCHANGE_RATES = {
  KES: 1,
  UGX: 28.5,
  MWK: 12.8
};

// Payment methods
const PAYMENT_METHODS = {
  KES: {
    currency: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    flag: '🇰🇪',
    minDeposit: 500,
    tillNumber: '9960318',
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

// M-Pesa API Configuration
const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  passkey: process.env.MPESA_PASSKEY,
  shortcode: process.env.MPESA_SHORTCODE || '9960318',
  callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://betzenith-9dx1.onrender.com/api/payments/mpesa-callback'
};

// Store pending deposits
const pendingDeposits = new Map();

// Get M-Pesa Access Token
async function getMpesaAccessToken() {
  try {
    const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`
        },
        timeout: 10000
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('M-Pesa token error:', error.message);
    return null;
  }
}

// Initiate STK Push (User enters PIN on their phone)
async function initiateSTKPush(phoneNumber, amount, accountReference, transactionId) {
  try {
    const token = await getMpesaAccessToken();
    if (!token) {
      throw new Error('Failed to get M-Pesa token');
    }

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`).toString('base64');
    
    const requestBody = {
      BusinessShortCode: MPESA_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phoneNumber,
      PartyB: MPESA_CONFIG.shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: MPESA_CONFIG.callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: 'BetZenith Deposit'
    };

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    return {
      success: true,
      checkoutRequestId: response.data.CheckoutRequestID,
      merchantRequestId: response.data.MerchantRequestID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription
    };
  } catch (error) {
    console.error('STK Push error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.errorMessage || 'Failed to initiate payment'
    };
  }
}

// ============ ROUTES ============

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Payments route working!' });
});

// Get payment methods
router.get('/methods', (req, res) => {
  const userCurrency = req.user?.currency || 'KES';
  const methods = PAYMENT_METHODS[userCurrency] || PAYMENT_METHODS.KES;
  res.json({ success: true, data: methods });
});

// Initiate deposit with M-Pesa STK Push
router.post('/deposit', protect, async (req, res) => {
  try {
    const { amount, paymentMethod = 'till', currency = 'KES', phoneNumber } = req.body;
    
    const user = await User.findById(req.user._id);
    const depositAmount = Number(amount);
    const currencyConfig = PAYMENT_METHODS[currency];
    const minDeposit = currencyConfig?.minDeposit || 500;
    
    if (depositAmount < minDeposit) {
      return res.status(400).json({
        success: false,
        message: `Minimum deposit is ${currencyConfig?.symbol || 'KSh'} ${minDeposit.toLocaleString()}`
      });
    }
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    // Format phone number for M-Pesa (254XXXXXXXXX)
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }
    
    // Generate reference
    const reference = `DEP${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Convert amount to KES for balance
    let amountInKES = depositAmount;
    if (currency !== 'KES') {
      amountInKES = depositAmount / EXCHANGE_RATES[currency];
    }
    
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
      description: `Deposit of ${currencyConfig?.symbol || 'KSh'} ${depositAmount.toLocaleString()}`,
      metadata: {
        phoneNumber: formattedPhone,
        initiatedAt: new Date().toISOString()
      }
    });
    
    // Initiate M-Pesa STK Push
    const mpesaResponse = await initiateSTKPush(
      formattedPhone,
      depositAmount,
      reference,
      transaction._id.toString()
    );
    
    if (mpesaResponse.success && mpesaResponse.responseCode === '0') {
      // Store pending deposit with checkout request ID
      pendingDeposits.set(reference, {
        userId: user._id,
        amount: depositAmount,
        amountInKES: amountInKES,
        phoneNumber: formattedPhone,
        checkoutRequestId: mpesaResponse.checkoutRequestId,
        transactionId: transaction._id,
        createdAt: Date.now()
      });
      
      // Update transaction with checkout ID
      transaction.metadata.checkoutRequestId = mpesaResponse.checkoutRequestId;
      await transaction.save();
      
      res.json({
        success: true,
        message: 'Payment initiated. Please enter your M-Pesa PIN on your phone.',
        data: {
          reference,
          amount: depositAmount,
          currency: currency,
          symbol: currencyConfig?.symbol || 'KSh',
          checkoutRequestId: mpesaResponse.checkoutRequestId,
          status: 'pending',
          instructions: 'Check your phone for the M-Pesa prompt. Enter your PIN to complete payment.'
        }
      });
    } else {
      // Failed to initiate STK Push
      transaction.status = 'FAILED';
      transaction.metadata.error = mpesaResponse.message;
      await transaction.save();
      
      res.status(400).json({
        success: false,
        message: mpesaResponse.message || 'Failed to initiate payment. Please try again.'
      });
    }
    
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// M-Pesa Callback (receives payment confirmation)
router.post('/mpesa-callback', async (req, res) => {
  console.log('📱 M-Pesa Callback received:', JSON.stringify(req.body, null, 2));
  
  try {
    const { Body } = req.body;
    
    if (Body && Body.stkCallback) {
      const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;
      
      // Find transaction by checkout request ID
      let transaction = null;
      for (const [ref, pending] of pendingDeposits.entries()) {
        if (pending.checkoutRequestId === CheckoutRequestID) {
          transaction = await Transaction.findById(pending.transactionId);
          break;
        }
      }
      
      if (!transaction) {
        transaction = await Transaction.findOne({ 'metadata.checkoutRequestId': CheckoutRequestID });
      }
      
      if (transaction && transaction.status === 'PENDING') {
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
          
          const user = await User.findById(transaction.user);
          const oldBalance = user.balance;
          user.balance += transaction.amountInKES;
          await user.save();
          
          transaction.status = 'COMPLETED';
          transaction.processedAt = new Date();
          transaction.metadata = {
            ...transaction.metadata,
            mpesaReceipt: MerchantRequestID,
            checkoutRequestId: CheckoutRequestID,
            confirmedAt: new Date().toISOString(),
            resultCode: ResultCode,
            resultDesc: ResultDesc
          };
          transaction.balance = {
            before: oldBalance,
            after: user.balance
          };
          await transaction.save();
          
          // Remove from pending
          for (const [ref, pending] of pendingDeposits.entries()) {
            if (pending.checkoutRequestId === CheckoutRequestID) {
              pendingDeposits.delete(ref);
              break;
            }
          }
          
          // Emit socket event
          const io = req.app.get('io');
          if (io) {
            io.to(`user-${user._id}`).emit('balance-update', {
              newBalance: user.balance,
              amount: transaction.amount,
              transaction: transaction.summary
            });
          }
          
          console.log(`✅ Deposit confirmed for user ${user.username}: KSh ${transaction.amount}`);
        } else {
          // Payment failed
          transaction.status = 'FAILED';
          transaction.metadata = {
            ...transaction.metadata,
            resultCode: ResultCode,
            resultDesc: ResultDesc,
            failedAt: new Date().toISOString()
          };
          await transaction.save();
          
          console.log(`❌ Deposit failed: ${ResultDesc}`);
        }
      }
    }
    
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
    
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.json({ ResultCode: 1, ResultDesc: 'Failed' });
  }
});

// Check deposit status
router.get('/check-deposit/:reference', protect, async (req, res) => {
  try {
    const { reference } = req.params;
    const transaction = await Transaction.findOne({ reference, user: req.user._id });
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get balance
router.get('/balance', protect, async (req, res) => {
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
        balance: user.balance,
        balances,
        symbols: { KES: 'KSh', UGX: 'USh', MWK: 'MK' }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Simple balance for header
router.get('/balance-simple', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: { balance: user.balance, currency: 'KES', symbol: 'KSh' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;