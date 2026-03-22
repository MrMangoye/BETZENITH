const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Transaction Details
  type: {
    type: String,
    enum: ['DEPOSIT', 'WITHDRAWAL', 'BET_PLACED', 'BET_WON', 'BET_REFUND', 'CASHOUT', 'BONUS', 'REFERRAL', 'ADJUSTMENT'],
    required: true
  },
  
  amount: {
    type: Number,
    required: true
  },
  
  amountInKES: {
    type: Number,
    default: 0
  },
  
  currency: {
    type: String,
    default: 'KES',
    enum: ['KES', 'UGX', 'MWK', 'USD', 'NGN']
  },
  
  balance: {
    before: Number,
    after: Number
  },
  
  // Status
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING'
  },
  
  // Payment Information - ADDED 'till' HERE
  paymentMethod: {
    type: String,
    enum: ['till', 'card', 'bank', 'mpesa', 'airtel', 'mobile', 'paystack', 'flutterwave', 'wallet', 'bonus']
  },
  paymentReference: String,
  paymentProvider: String,
  
  // Related Entities
  bet: { type: mongoose.Schema.Types.ObjectId, ref: 'Bet' },
  relatedTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  
  // Reference
  reference: {
    type: String,
    unique: true
  },
  
  // Description
  description: String,
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  
  // Processing
  processedAt: Date,
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Receipt
  receiptUrl: String,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ reference: 1 }, { unique: true });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });

// Generate reference
transactionSchema.pre('save', async function(next) {
  if (!this.reference) {
    const prefix = this.type.substring(0, 3);
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.reference = `${prefix}${timestamp}${random}`;
  }
  next();
});

// Update timestamps
transactionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Set balance before/after
transactionSchema.pre('save', async function(next) {
  if (this.isNew && !this.balance) {
    const User = mongoose.model('User');
    const user = await User.findById(this.user);
    
    this.balance = {
      before: user.balance - (this.amountInKES || this.amount),
      after: user.balance
    };
  }
  next();
});

// Complete transaction
transactionSchema.methods.complete = async function() {
  this.status = 'COMPLETED';
  this.processedAt = new Date();
  return this.save();
};

// Fail transaction
transactionSchema.methods.fail = async function(reason) {
  this.status = 'FAILED';
  this.metadata = { ...this.metadata, failureReason: reason };
  return this.save();
};

// Reverse transaction
transactionSchema.methods.reverse = async function() {
  if (this.status !== 'COMPLETED') return;
  
  const User = mongoose.model('User');
  const user = await User.findById(this.user);
  
  if (this.type === 'BET_PLACED') {
    user.balance += Math.abs(this.amountInKES || this.amount);
  } else if (this.type === 'DEPOSIT') {
    user.balance -= (this.amountInKES || this.amount);
  }
  
  await user.save();
  
  const Transaction = mongoose.model('Transaction');
  await Transaction.create({
    user: this.user,
    type: 'ADJUSTMENT',
    amount: -(this.amountInKES || this.amount),
    status: 'COMPLETED',
    description: `Reversal of ${this.reference}`,
    relatedTransaction: this._id
  });
  
  this.status = 'REFUNDED';
  return this.save();
};

// Get transaction summary
transactionSchema.virtual('summary').get(function() {
  return {
    reference: this.reference,
    type: this.type,
    amount: this.amount,
    currency: this.currency,
    status: this.status,
    description: this.description,
    createdAt: this.createdAt
  };
});

module.exports = mongoose.model('Transaction', transactionSchema);