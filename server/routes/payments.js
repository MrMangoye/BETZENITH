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

// Payment methods with your actual numbers
const PAYMENT_METHODS = {
  KES: {
    currency: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    flag: '🇰🇪',
    minDeposit: parseInt(process.env.MINIMUM_DEPOSIT) || 500,
    tillNumber: process.env.MPESA_TILL_NUMBER || '9960318',
    methods: [
      {
        id: 'till',
        name: 'M-Pesa Till Number',
        number: process.env.MPESA_TILL_NUMBER || '9960318',
        type: 'Till Number',
        action: 'Pay with M-Pesa'
      }
    ]
  },
  UGX: {
    currency: 'UGX',
    symbol: 'USh',
    name: 'Ugandan Shilling',
    flag: '🇺🇬',
    minDeposit: 14000, // ~500 KES
    mobileNumber: process.env.UGANDA_MOBILE_NUMBER || '+256776785216',
    methods: [
      {
        id: 'mobile',
        name: 'MTN Mobile Money',
        provider: 'mtn',
        number: process.env.UGANDA_MOBILE_NUMBER || '+256776785216',
        action: 'Pay with MTN Mobile Money'
      },
      {
        id: 'mobile',
        name: 'Airtel Money',
        provider: 'airtel',
        number: process.env.UGANDA_MOBILE_NUMBER || '+256776785216',
        action: 'Pay with Airtel Money'
      }
    ]
  },
  MWK: {
    currency: 'MWK',
    symbol: 'MK',
    name: 'Malawian Kwacha',
    flag: '🇲🇼',
    minDeposit: 6400, // ~500 KES
    mobileNumber: process.env.MALAWI_MOBILE_NUMBER || '+256776785216',
    methods: [
      {
        id: 'mobile',
        name: 'Airtel Money Malawi',
        provider: 'airtel',
        number: process.env.MALAWI_MOBILE_NUMBER || '+256776785216',
        action: 'Pay with Airtel Money'
      }
    ]
  }
};

// M-Pesa Configuration (from .env)
const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  passkey: process.env.MPESA_PASSKEY,
  shortcode: process.env.MPESA_SHORTCODE || process.env.MPESA_TILL_NUMBER || '9960318',
  callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://betzenith-9dx1.onrender.com/api/payments/mpesa-callback',
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox'
};

// Log M-Pesa config on startup
console.log('🚀 M-Pesa Configuration loaded:');
console.log('📝 Environment:', MPESA_CONFIG.environment);
console.log('🔑 Consumer Key present:', !!MPESA_CONFIG.consumerKey);
console.log('🔑 Consumer Secret present:', !!MPESA_CONFIG.consumerSecret);
console.log('🔑 Passkey present:', !!MPESA_CONFIG.passkey);
console.log('📞 Shortcode:', MPESA_CONFIG.shortcode);
console.log('🔗 Callback URL:', MPESA_CONFIG.callbackUrl);

// Store pending deposits
const pendingDeposits = new Map();

// Get M-Pesa Access Token
async function getMpesaAccessToken() {
  console.log('🔄 Getting M-Pesa access token...');
  
  try {
    const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
    
    const url = MPESA_CONFIG.environment === 'production'
      ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    
    const response = await axios.get(url, {
      headers: { Authorization: `Basic ${auth}` },
      timeout: 10000
    });
    
    console.log('✅ M-Pesa access token obtained');
    return response.data.access_token;
  } catch (error) {
    console.error('❌ M-Pesa token error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return null;
  }
}

// Initiate STK Push
async function initiateSTKPush(phoneNumber, amount, accountReference) {
  console.log('🚀 Initiating STK Push...');
  console.log('📞 Phone:', phoneNumber);
  console.log('💰 Amount:', amount);
  console.log('🔖 Reference:', accountReference);
  
  try {
    const token = await getMpesaAccessToken();
    if (!token) {
      return { success: false, message: 'Failed to authenticate with M-Pesa. Please check your credentials.' };
    }
    
    // Format phone number (Kenyan format)
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.length === 9 && !formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1);
    }
    
    console.log('📞 Formatted phone:', formattedPhone);
    
    // Generate timestamp
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    
    const businessShortCode = MPESA_CONFIG.environment === 'sandbox' ? '174379' : MPESA_CONFIG.shortcode;
    const passwordString = `${businessShortCode}${MPESA_CONFIG.passkey}${timestamp}`;
    const password = Buffer.from(passwordString).toString('base64');
    
    const url = MPESA_CONFIG.environment === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    
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
    
    console.log('📤 Sending STK Push request...');
    const response = await axios.post(url, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('📥 STK Push response:', response.data);
    
    if (response.data.ResponseCode === '0') {
      console.log('✅ STK Push initiated successfully');
      return {
        success: true,
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestId: response.data.MerchantRequestID,
        responseDescription: response.data.ResponseDescription
      };
    } else {
      console.log('❌ STK Push failed:', response.data.ResponseDescription);
      return {
        success: false,
        message: response.data.ResponseDescription || 'Payment initiation failed'
      };
    }
  } catch (error) {
    console.error('❌ STK Push exception:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return {
      success: false,
      message: error.response?.data?.errorMessage || error.message || 'Failed to initiate payment'
    };
  }
}

// ============ ROUTES ============

// Get payment methods
router.get('/methods', protect, (req, res) => {
  const userCurrency = req.user?.currency || 'KES';
  const methods = PAYMENT_METHODS[userCurrency] || PAYMENT_METHODS.KES;
  res.json({ success: true, data: methods });
});

// Initiate deposit
router.post('/deposit', protect, async (req, res) => {
  console.log('💰 Deposit endpoint called');
  console.log('User:', req.user?._id);
  console.log('Body:', req.body);
  
  try {
    const { amount, paymentMethod = 'till', currency = 'KES', phoneNumber, provider } = req.body;
    
    const user = await User.findById(req.user._id);
    const depositAmount = Number(amount);
    const currencyConfig = PAYMENT_METHODS[currency];
    
    if (!currencyConfig) {
      return res.status(400).json({
        success: false,
        message: `Unsupported currency: ${currency}`
      });
    }
    
    const minDeposit = currencyConfig.minDeposit;
    
    if (depositAmount < minDeposit) {
      return res.status(400).json({
        success: false,
        message: `Minimum deposit is ${currencyConfig.symbol} ${minDeposit.toLocaleString()}`
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
    console.log('🔖 Generated reference:', reference);
    
    // Convert amount to KES for internal storage
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
      description: `Deposit of ${currencyConfig.symbol} ${depositAmount.toLocaleString()}`,
      metadata: {
        phoneNumber: phoneNumber,
        provider: provider,
        initiatedAt: new Date().toISOString()
      }
    });
    
    let paymentResponse;
    
    // Handle Kenyan M-Pesa (STK Push)
    if (currency === 'KES' && paymentMethod === 'till') {
      paymentResponse = await initiateSTKPush(phoneNumber, depositAmount, reference);
      
      if (paymentResponse.success) {
        pendingDeposits.set(reference, {
          userId: user._id,
          amount: depositAmount,
          amountInKES: amountInKES,
          phoneNumber: phoneNumber,
          checkoutRequestId: paymentResponse.checkoutRequestId,
          transactionId: transaction._id,
          createdAt: Date.now()
        });
        
        transaction.metadata.checkoutRequestId = paymentResponse.checkoutRequestId;
        await transaction.save();
        
        res.json({
          success: true,
          message: 'Payment initiated. Check your phone for the M-Pesa prompt.',
          data: {
            reference,
            amount: depositAmount,
            currency: currency,
            symbol: currencyConfig.symbol,
            checkoutRequestId: paymentResponse.checkoutRequestId,
            status: 'pending'
          }
        });
      } else {
        transaction.status = 'FAILED';
        transaction.metadata.error = paymentResponse.message;
        await transaction.save();
        
        res.status(400).json({
          success: false,
          message: paymentResponse.message || 'Failed to initiate payment. Please try again.'
        });
      }
    } 
    // Handle Uganda Mobile Money (manual for now)
    else if (currency === 'UGX') {
      const mobileNumber = currencyConfig.mobileNumber;
      const selectedMethod = currencyConfig.methods.find(m => m.provider === provider) || currencyConfig.methods[0];
      
      transaction.status = 'PROCESSING';
      transaction.metadata.manualProcessing = true;
      transaction.metadata.paymentNumber = mobileNumber;
      transaction.metadata.providerName = selectedMethod.name;
      await transaction.save();
      
      res.json({
        success: true,
        message: `Payment initiated. Please send ${currencyConfig.symbol} ${depositAmount.toLocaleString()} to our mobile money number.`,
        data: {
          reference,
          amount: depositAmount,
          currency: currency,
          symbol: currencyConfig.symbol,
          status: 'processing',
          paymentInstructions: {
            provider: selectedMethod.name,
            number: mobileNumber,
            reference: reference,
            amount: `${currencyConfig.symbol} ${depositAmount.toLocaleString()}`
          }
        }
      });
    } 
    // Handle Malawi Mobile Money (manual for now)
    else if (currency === 'MWK') {
      const mobileNumber = currencyConfig.mobileNumber;
      const selectedMethod = currencyConfig.methods[0];
      
      transaction.status = 'PROCESSING';
      transaction.metadata.manualProcessing = true;
      transaction.metadata.paymentNumber = mobileNumber;
      await transaction.save();
      
      res.json({
        success: true,
        message: `Payment initiated. Please send ${currencyConfig.symbol} ${depositAmount.toLocaleString()} to our Airtel Money number.`,
        data: {
          reference,
          amount: depositAmount,
          currency: currency,
          symbol: currencyConfig.symbol,
          status: 'processing',
          paymentInstructions: {
            provider: selectedMethod.name,
            number: mobileNumber,
            reference: reference,
            amount: `${currencyConfig.symbol} ${depositAmount.toLocaleString()}`
          }
        }
      });
    }
    else {
      transaction.status = 'PROCESSING';
      await transaction.save();
      
      res.json({
        success: true,
        message: `Payment initiated. Please complete payment of ${currencyConfig.symbol} ${depositAmount.toLocaleString()}.`,
        data: {
          reference,
          amount: depositAmount,
          currency: currency,
          symbol: currencyConfig.symbol,
          status: 'processing'
        }
      });
    }
    
  } catch (error) {
    console.error('💥 Deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// M-Pesa Callback
router.post('/mpesa-callback', async (req, res) => {
  console.log('📱 M-Pesa Callback received');
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { Body } = req.body;
    
    if (Body && Body.stkCallback) {
      const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;
      
      console.log(`Callback: ResultCode=${ResultCode}, ResultDesc=${ResultDesc}`);
      
      let transaction = null;
      let pending = null;
      
      // Find pending deposit
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
          let mpesaReceipt = '';
          
          if (CallbackMetadata && CallbackMetadata.Item) {
            CallbackMetadata.Item.forEach(item => {
              if (item.Name === 'Amount') amount = item.Value;
              if (item.Name === 'PhoneNumber') phoneNumber = item.Value;
              if (item.Name === 'MpesaReceiptNumber') mpesaReceipt = item.Value;
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
            mpesaReceipt: mpesaReceipt,
            merchantRequestId: MerchantRequestID,
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
          
          // Emit real-time balance update
          const io = req.app.get('io');
          if (io) {
            io.to(`user-${user._id}`).emit('balance-update', {
              newBalance: user.balance,
              amount: transaction.amount,
              currency: transaction.currency
            });
          }
          
          console.log(`✅ Deposit confirmed for ${user.username}: ${transaction.amount} ${transaction.currency}`);
        } else {
          transaction.status = 'FAILED';
          transaction.metadata.resultDesc = ResultDesc;
          await transaction.save();
          console.log(`❌ Deposit failed: ${ResultDesc}`);
        }
      } else if (transaction) {
        console.log(`Transaction already ${transaction.status}, ignoring callback`);
      }
    }
    
    // Always respond with success to M-Pesa
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
    
  } catch (error) {
    console.error('💥 M-Pesa callback error:', error);
    res.json({ ResultCode: 1, ResultDesc: 'Failed' });
  }
});

// Manual payment confirmation (for admin to confirm Uganda/Malawi payments)
router.post('/confirm-payment/:reference', protect, async (req, res) => {
  try {
    const { reference } = req.params;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const transaction = await Transaction.findOne({ reference });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    if (transaction.status !== 'PROCESSING') {
      return res.status(400).json({
        success: false,
        message: `Transaction cannot be confirmed. Current status: ${transaction.status}`
      });
    }
    
    const user = await User.findById(transaction.user);
    const oldBalance = user.balance;
    user.balance += transaction.amountInKES;
    await user.save();
    
    transaction.status = 'COMPLETED';
    transaction.processedAt = new Date();
    transaction.metadata.confirmedBy = req.user._id;
    transaction.metadata.confirmedAt = new Date().toISOString();
    transaction.balance = {
      before: oldBalance,
      after: user.balance
    };
    await transaction.save();
    
    // Emit real-time balance update
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${user._id}`).emit('balance-update', {
        newBalance: user.balance,
        amount: transaction.amount,
        currency: transaction.currency
      });
    }
    
    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: {
        user: user.username,
        amount: transaction.amount,
        currency: transaction.currency,
        newBalance: user.balance
      }
    });
    
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Check deposit status
router.get('/check-deposit/:reference', protect, async (req, res) => {
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
    console.error('Error checking deposit:', error);
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