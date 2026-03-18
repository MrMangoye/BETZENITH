const mongoose = require('mongoose');

const betSelectionSchema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  marketIndex: {
    type: Number,
    required: true,
    min: 0
  },
  marketName: String,
  odds: {
    type: Number,
    required: true
  },
  oddsAtPlacement: Number,
  status: {
    type: String,
    enum: ['PENDING', 'WON', 'LOST', 'CASHED_OUT', 'VOID'],
    default: 'PENDING'
  },
  settledAt: Date
});

const betSchema = new mongoose.Schema({
  // User Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Bet Type
  type: {
    type: String,
    enum: ['SINGLE', 'MULTI', 'SYSTEM'],
    default: 'SINGLE'
  },
  
  // Selections
  selections: [betSelectionSchema],
  
  // Bet Details
  totalOdds: {
    type: Number,
    required: true,
    min: 1.01
  },
  stake: {
    type: Number,
    required: true,
    min: 10
  },
  potentialWin: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'NGN'
  },
  
  // Cashout
  cashoutValue: Number,
  cashoutAvailable: {
    type: Boolean,
    default: false
  },
  cashoutTaken: {
    type: Boolean,
    default: false
  },
  cashoutAmount: Number,
  cashoutTime: Date,
  
  // Status
  status: {
    type: String,
    enum: ['PENDING', 'WON', 'LOST', 'CASHED_OUT', 'VOID', 'REFUNDED'],
    default: 'PENDING',
    index: true
  },
  
  // Winnings
  winnings: Number,
  paidOut: {
    type: Boolean,
    default: false
  },
  paidOutAt: Date,
  
  // Reference
  reference: {
    type: String,
    unique: true
  },
  
  // Metadata
  ipAddress: String,
  userAgent: String,
  deviceInfo: String,
  location: String,
  
  // Settlements
  settledAt: Date,
  settledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
betSchema.index({ user: 1, createdAt: -1 });
betSchema.index({ status: 1, createdAt: -1 });
betSchema.index({ reference: 1 });
betSchema.index({ 'selections.match': 1 });

// Generate unique reference
betSchema.pre('save', async function(next) {
  if (!this.reference) {
    const prefix = this.type === 'SINGLE' ? 'S' : 'M';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.reference = `${prefix}${timestamp}${random}`;
  }
  next();
});

// Update timestamps
betSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Calculate cashout value
betSchema.methods.calculateCashout = function() {
  if (!this.cashoutAvailable || this.cashoutTaken) return 0;
  if (this.status !== 'PENDING') return 0;
  
  const settledSelections = this.selections.filter(s => s.status !== 'PENDING');
  const unsettledSelections = this.selections.filter(s => s.status === 'PENDING');
  
  // If any selection lost, no cashout
  if (settledSelections.some(s => s.status === 'LOST')) {
    this.cashoutAvailable = false;
    return 0;
  }
  
  // Calculate remaining odds
  const remainingOdds = unsettledSelections.reduce((acc, s) => acc * s.odds, 1);
  const cashoutRatio = remainingOdds / this.totalOdds;
  
  // 95% of fair value
  return Number((this.stake * cashoutRatio * 0.95).toFixed(2));
};

// Check if bet can be cashed out
betSchema.methods.checkCashoutAvailability = function() {
  if (this.status !== 'PENDING') return false;
  if (this.cashoutTaken) return false;
  
  const settledSelections = this.selections.filter(s => s.status !== 'PENDING');
  
  // If any selection lost, no cashout
  if (settledSelections.some(s => s.status === 'LOST')) {
    this.cashoutAvailable = false;
    return false;
  }
  
  const cashoutValue = this.calculateCashout();
  return cashoutValue > 0;
};

// Update selection status
betSchema.methods.updateSelectionStatus = function(matchId, status) {
  const selection = this.selections.find(s => s.match.toString() === matchId.toString());
  if (selection) {
    selection.status = status;
    selection.settledAt = new Date();
  }
  
  // Check if all selections are settled
  const allSettled = this.selections.every(s => s.status !== 'PENDING');
  
  if (allSettled) {
    const anyWon = this.selections.some(s => s.status === 'WON');
    const anyLost = this.selections.some(s => s.status === 'LOST');
    
    if (anyLost) {
      this.status = 'LOST';
    } else if (anyWon) {
      this.status = 'WON';
      this.winnings = this.potentialWin;
    }
    
    this.settledAt = new Date();
    this.cashoutAvailable = false;
  }
  
  return this.save();
};

// Get bet summary
betSchema.virtual('summary').get(function() {
  return {
    reference: this.reference,
    type: this.type,
    selections: this.selections.length,
    stake: this.stake,
    totalOdds: this.totalOdds,
    potentialWin: this.potentialWin,
    status: this.status,
    createdAt: this.createdAt
  };
});

module.exports = mongoose.model('Bet', betSchema);