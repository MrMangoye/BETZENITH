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
        action: 'Pay with M-Pesa'
      }
    ]
  }
};

// M-Pesa Configuration (from your .env)
const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  passkey: process.env.MPESA_PASSKEY,
  shortcode: process.env.MPESA_SHORTCODE || '9960318',
  callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://betzenith-9dx1.onrender.com/api/payments/mpesa-callback',
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox' // Default to sandbox for testing
};

// Log M-Pesa config on startup
console.log('🚀 [DEBUG] M-Pesa Configuration loaded:');
console.log('📝 [DEBUG] Environment:', MPESA_CONFIG.environment);
console.log('🔑 [DEBUG] Consumer Key present:', !!MPESA_CONFIG.consumerKey);
console.log('🔑 [DEBUG] Consumer Secret present:', !!MPESA_CONFIG.consumerSecret);
console.log('🔑 [DEBUG] Passkey present:', !!MPESA_CONFIG.passkey);
console.log('📞 [DEBUG] Shortcode:', MPESA_CONFIG.shortcode);
console.log('🔗 [DEBUG] Callback URL:', MPESA_CONFIG.callbackUrl);

// Store pending deposits
const pendingDeposits = new Map();

// Get M-Pesa Access Token
async function getMpesaAccessToken() {
  console.log('🔄 [DEBUG] Starting getMpesaAccessToken...');
  console.log('📝 [DEBUG] Environment:', MPESA_CONFIG.environment);
  
  try {
    const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
    console.log('✅ [DEBUG] Auth header generated (length):', auth.length);
    
    const url = MPESA_CONFIG.environment === 'production'
      ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    
    console.log('🌐 [DEBUG] Token URL:', url);
    
    const response = await axios.get(url, {
      headers: { Authorization: `Basic ${auth}` },
      timeout: 10000
    });
    
    console.log('✅ [DEBUG] Token received successfully');
    console.log('🔑 [DEBUG] Access token (first 20 chars):', response.data.access_token.substring(0, 20) + '...');
    
    return response.data.access_token;
  } catch (error) {
    console.error('❌ [DEBUG] Error in getMpesaAccessToken:');
    if (error.response) {
      console.error('📡 [DEBUG] Response status:', error.response.status);
      console.error('📄 [DEBUG] Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('🌐 [DEBUG] No response received');
    } else {
      console.error('💥 [DEBUG] Error message:', error.message);
    }
    return null;
  }
}

// Initiate STK Push with enhanced logging
async function initiateSTKPush(phoneNumber, amount, accountReference) {
  console.log('='.repeat(80));
  console.log('🚀 [DEBUG] Starting initiateSTKPush...');
  console.log('📞 [DEBUG] Original phone number:', phoneNumber);
  console.log('💰 [DEBUG] Amount:', amount);
  console.log('🔖 [DEBUG] Account Reference:', accountReference);
  console.log('🔧 [DEBUG] Environment:', MPESA_CONFIG.environment);
  console.log('🔧 [DEBUG] Shortcode:', MPESA_CONFIG.shortcode);
  console.log('='.repeat(80));
  
  try {
    // Get access token
    console.log('🔑 [DEBUG] Getting access token...');
    const token = await getMpesaAccessToken();
    if (!token) {
      console.error('❌ [DEBUG] Failed to get access token');
      return {
        success: false,
        message: 'Failed to authenticate with M-Pesa. Please check your credentials.'
      };
    }
    console.log('✅ [DEBUG] Access token obtained successfully');
    
    // Format phone number
    console.log('📞 [DEBUG] Formatting phone number...');
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    console.log('📞 [DEBUG] After removing non-digits:', formattedPhone);
    
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
      console.log('📞 [DEBUG] After converting from 0:', formattedPhone);
    } else if (formattedPhone.length === 9 && !formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
      console.log('📞 [DEBUG] After adding 254 prefix:', formattedPhone);
    } else if (formattedPhone.length === 12 && formattedPhone.startsWith('254')) {
      console.log('📞 [DEBUG] Already in correct format:', formattedPhone);
    } else {
      console.error('❌ [DEBUG] Invalid phone number format:', formattedPhone);
      return {
        success: false,
        message: 'Invalid phone number format. Please use a valid Kenyan number (e.g., 0712345678)'
      };
    }
    
    // Generate timestamp
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    console.log('⏰ [DEBUG] Timestamp:', timestamp);
    
    // Use correct shortcode for environment
    const businessShortCode = MPESA_CONFIG.environment === 'sandbox' ? '174379' : MPESA_CONFIG.shortcode;
    console.log('🏢 [DEBUG] Business Shortcode:', businessShortCode);
    
    // Generate password
    const passwordString = `${businessShortCode}${MPESA_CONFIG.passkey}${timestamp}`;
    console.log('🔐 [DEBUG] Password string length:', passwordString.length);
    const password = Buffer.from(passwordString).toString('base64');
    console.log('✅ [DEBUG] Password generated (base64 length):', password.length);
    
    const url = MPESA_CONFIG.environment === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    
    console.log('🌐 [DEBUG] STK Push URL:', url);
    
    const requestBody = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: businessShortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CONFIG.callbackUrl,
      AccountReference: accountReference.substring(0, 12),
      TransactionDesc: 'BetZenith Deposit'
    };

    console.log('📤 [DEBUG] STK Push Request:');
    console.log('   BusinessShortCode:', requestBody.BusinessShortCode);
    console.log('   TransactionType:', requestBody.TransactionType);
    console.log('   Amount:', requestBody.Amount);
    console.log('   PartyA:', requestBody.PartyA);
    console.log('   PartyB:', requestBody.PartyB);
    console.log('   PhoneNumber:', requestBody.PhoneNumber);
    console.log('   AccountReference:', requestBody.AccountReference);
    console.log('   CallBackURL:', requestBody.CallBackURL);
    console.log('   Timestamp:', requestBody.Timestamp);
    console.log('   Password:', '***');

    console.log('⏱️ [DEBUG] Sending request to Safaricom...');
    const response = await axios.post(url, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('📥 [DEBUG] STK Push Response:', JSON.stringify(response.data, null, 2));
    console.log('✅ [DEBUG] Response Code:', response.data.ResponseCode);
    console.log('📝 [DEBUG] Response Description:', response.data.ResponseDescription);
    
    if (response.data.ResponseCode === '0') {
      console.log('✅✅✅ [DEBUG] STK Push initiated successfully!');
      console.log('📱 [DEBUG] M-Pesa prompt should appear on phone:', formattedPhone);
      console.log('🆔 [DEBUG] CheckoutRequestID:', response.data.CheckoutRequestID);
    } else {
      console.log('❌ [DEBUG] STK Push failed with ResponseCode:', response.data.ResponseCode);
      console.log('❌ [DEBUG] Reason:', response.data.ResponseDescription);
    }

    return {
      success: response.data.ResponseCode === '0',
      checkoutRequestId: response.data.CheckoutRequestID,
      merchantRequestId: response.data.MerchantRequestID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription
    };
  } catch (error) {
    console.error('='.repeat(80));
    console.error('❌❌❌ [DEBUG] STK Push Exception:');
    console.error('📝 [DEBUG] Error message:', error.message);
    
    if (error.response) {
      console.error('📡 [DEBUG] Response status:', error.response.status);
      console.error('📄 [DEBUG] Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('🌐 [DEBUG] No response received');
    }
    console.error('='.repeat(80));
    
    return {
      success: false,
      message: error.response?.data?.errorMessage || 
               error.response?.data?.ResponseDescription || 
               error.message || 
               'Failed to initiate payment'
    };
  }
}

// ============ ROUTES ============

// Test endpoint
router.get('/test', (req, res) => {
  console.log('🧪 [DEBUG] Test endpoint called');
  res.json({ 
    success: true, 
    message: 'Payments route working!', 
    mpesaConfigured: !!MPESA_CONFIG.consumerKey,
    environment: MPESA_CONFIG.environment,
    shortcode: MPESA_CONFIG.shortcode,
    callbackUrl: MPESA_CONFIG.callbackUrl
  });
});

// Test STK Push endpoint for debugging
router.post('/test-stk-debug', protect, async (req, res) => {
  console.log('🧪 [DEBUG] Test STK Push Debug endpoint called');
  console.log('📝 [DEBUG] Request body:', JSON.stringify(req.body, null, 2));
  
  const { phoneNumber, amount } = req.body;
  
  if (!phoneNumber || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Phone number and amount are required'
    });
  }
  
  const reference = `DEBUG${Date.now()}`;
  
  try {
    console.log('🚀 [DEBUG] Starting test STK Push...');
    const result = await initiateSTKPush(phoneNumber, amount, reference);
    
    res.json({
      success: result.success,
      data: {
        ...result,
        reference,
        phoneNumber,
        amount,
        environment: MPESA_CONFIG.environment,
        shortcode: MPESA_CONFIG.shortcode
      },
      message: result.success 
        ? '✅ STK Push initiated. Check your phone for the M-Pesa prompt.' 
        : `❌ Failed: ${result.message}`
    });
  } catch (error) {
    console.error('❌ [DEBUG] Test STK Push error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get payment methods
router.get('/methods', protect, (req, res) => {
  console.log('📋 [DEBUG] Get payment methods called for user:', req.user._id);
  const userCurrency = req.user?.currency || 'KES';
  const methods = PAYMENT_METHODS[userCurrency] || PAYMENT_METHODS.KES;
  res.json({ success: true, data: methods });
});

// Initiate deposit
router.post('/deposit', protect, async (req, res) => {
  console.log('💰 [DEBUG] Deposit endpoint called');
  console.log('👤 [DEBUG] User ID:', req.user._id);
  console.log('📝 [DEBUG] Request body:', JSON.stringify(req.body, null, 2));
  
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
    
    // Generate reference
    const reference = `DEP${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    console.log('🔖 [DEBUG] Generated reference:', reference);
    
    // Convert amount to KES
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
        phoneNumber: phoneNumber,
        initiatedAt: new Date().toISOString()
      }
    });
    console.log('✅ [DEBUG] Transaction created with ID:', transaction._id);
    
    // Initiate M-Pesa STK Push
    const mpesaResponse = await initiateSTKPush(phoneNumber, depositAmount, reference);
    console.log('📥 [DEBUG] STK Push response:', JSON.stringify(mpesaResponse, null, 2));
    
    if (mpesaResponse.success) {
      pendingDeposits.set(reference, {
        userId: user._id,
        amount: depositAmount,
        amountInKES: amountInKES,
        phoneNumber: phoneNumber,
        checkoutRequestId: mpesaResponse.checkoutRequestId,
        transactionId: transaction._id,
        createdAt: Date.now()
      });
      
      transaction.metadata.checkoutRequestId = mpesaResponse.checkoutRequestId;
      await transaction.save();
      
      res.json({
        success: true,
        message: 'Payment initiated. Check your phone for the M-Pesa prompt.',
        data: {
          reference,
          amount: depositAmount,
          currency: currency,
          symbol: currencyConfig?.symbol || 'KSh',
          checkoutRequestId: mpesaResponse.checkoutRequestId,
          status: 'pending'
        }
      });
    } else {
      transaction.status = 'FAILED';
      transaction.metadata.error = mpesaResponse.message;
      await transaction.save();
      
      res.status(400).json({
        success: false,
        message: mpesaResponse.message || 'Failed to initiate payment. Please try again.'
      });
    }
    
  } catch (error) {
    console.error('💥 [DEBUG] Deposit endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// M-Pesa Callback
router.post('/mpesa-callback', async (req, res) => {
  console.log('='.repeat(80));
  console.log('📱 [DEBUG] M-Pesa Callback received');
  console.log('📦 [DEBUG] Request body:', JSON.stringify(req.body, null, 2));
  console.log('='.repeat(80));
  
  try {
    const { Body } = req.body;
    
    if (Body && Body.stkCallback) {
      const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;
      
      let transaction = null;
      let pending = null;
      
      for (const [ref, p] of pendingDeposits.entries()) {
        if (p.checkoutRequestId === CheckoutRequestID) {
          pending = p;
          transaction = await Transaction.findById(p.transactionId);
          break;
        }
      }
      
      if (!transaction) {
        transaction = await Transaction.findOne({ 'metadata.checkoutRequestId': CheckoutRequestID });
      }
      
      if (transaction && transaction.status === 'PENDING') {
        if (ResultCode === 0) {
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
            amount: amount,
            phoneNumber: phoneNumber
          };
          transaction.balance = {
            before: oldBalance,
            after: user.balance
          };
          await transaction.save();
          
          if (pending) {
            pendingDeposits.delete(transaction.reference);
          }
          
          const io = req.app.get('io');
          if (io) {
            io.to(`user-${user._id}`).emit('balance-update', {
              newBalance: user.balance,
              amount: transaction.amount
            });
          }
          
          console.log(`✅ Deposit confirmed for ${user.username}: ${transaction.amount} ${transaction.currency}`);
        } else {
          transaction.status = 'FAILED';
          transaction.metadata.resultDesc = ResultDesc;
          await transaction.save();
          console.log(`❌ Deposit failed: ${ResultDesc}`);
        }
      }
    }
    
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
    
  } catch (error) {
    console.error('💥 [DEBUG] M-Pesa callback error:', error);
    res.json({ ResultCode: 1, ResultDesc: 'Failed' });
  }
});

// Check deposit status
router.get('/check-deposit/:reference', protect, async (req, res) => {
  console.log('🔍 [DEBUG] Check deposit status for reference:', req.params.reference);
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
        processedAt: transaction.processedAt,
        checkoutRequestId: transaction.metadata?.checkoutRequestId
      }
    });
  } catch (error) {
    console.error('💥 [DEBUG] Error checking deposit:', error);
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