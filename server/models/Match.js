const mongoose = require('mongoose');

const marketSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['1', 'X', '2', 'Over 0.5', 'Over 1.5', 'Over 2.5', 'Under 2.5', 'BTTS', 'BTTS No', 'Double Chance 1X', 'Double Chance 12', 'Double Chance X2']
  },
  odds: {
    type: Number,
    required: true,
    min: 1.01,
    max: 1000
  },
  previousOdds: Number,
  oddsHistory: [{
    odds: Number,
    timestamp: { type: Date, default: Date.now },
    reason: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  volume: {
    type: Number,
    default: 0
  },
  betsCount: {
    type: Number,
    default: 0
  },
  minBet: {
    type: Number,
    default: 10
  },
  maxBet: {
    type: Number,
    default: 1000000
  },
  suspended: {
    type: Boolean,
    default: false
  },
  handicap: Number,
  total: Number
});

const liveStatsSchema = new mongoose.Schema({
  possession: { home: Number, away: Number },
  shots: { home: Number, away: Number },
  shotsOnTarget: { home: Number, away: Number },
  corners: { home: Number, away: Number },
  fouls: { home: Number, away: Number },
  yellowCards: { home: Number, away: Number },
  redCards: { home: Number, away: Number },
  offsides: { home: Number, away: Number },
  injuries: { home: Number, away: Number },
  substitutions: { home: Number, away: Number },
  updatedAt: Date
});

const matchSchema = new mongoose.Schema({
  // League Information
  league: {
    type: String,
    required: true,
    index: true
  },
  leagueId: { type: mongoose.Schema.Types.ObjectId, ref: 'League' },
  season: String,
  round: String,
  
  // Team Information
  homeTeam: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    name: { type: String, required: true },
    abbreviation: { type: String, required: true },
    logo: String,
    form: [String],
    standing: Number,
    coach: String
  },
  awayTeam: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    name: { type: String, required: true },
    abbreviation: { type: String, required: true },
    logo: String,
    form: [String],
    standing: Number,
    coach: String
  },
  
  // Match Details
  date: {
    type: Date,
    required: true,
    index: true
  },
  time: {
    type: String,
    required: true
  },
  venue: {
    name: String,
    city: String,
    capacity: Number
  },
  referee: String,
  
  // Match Status
  status: {
    type: String,
    enum: ['SCHEDULED', 'LIVE', 'HALFTIME', 'SECOND_HALF', 'EXTRA_TIME', 'PENALTIES', 'FINISHED', 'POSTPONED', 'CANCELLED', 'ABANDONED', 'INTERRUPTED'],
    default: 'SCHEDULED',
    index: true
  },
  statusTimeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Score
  score: {
    home: { type: Number, default: 0 },
    away: { type: Number, default: 0 },
    halftime: { home: Number, away: Number },
    fulltime: { home: Number, away: Number },
    extratime: { home: Number, away: Number },
    penalties: { home: Number, away: Number }
  },
  
  // Live Statistics
  liveStats: liveStatsSchema,
  minute: Number,
  addedTime: Number,
  
  // Events
  events: [{
    type: { type: String, enum: ['GOAL', 'PENALTY', 'RED_CARD', 'YELLOW_CARD', 'SUBSTITUTION', 'INJURY', 'VAR'] },
    minute: Number,
    addedTime: Number,
    team: String, // 'home' or 'away'
    player: String,
    playerId: { type: mongoose.Schema.Types.ObjectId },
    assistedBy: String,
    homeScore: Number,
    awayScore: Number,
    reason: String
  }],
  
  // Markets
  markets: [marketSchema],
  
  // Betting Information
  cashoutEnabled: {
    type: Boolean,
    default: true
  },
  liveBettingEnabled: {
    type: Boolean,
    default: true
  },
  
  // Streaming
  streamingUrl: String,
  hasLiveStream: {
    type: Boolean,
    default: false
  },
  streamProviders: [String],
  
  // Statistics
  views: {
    type: Number,
    default: 0
  },
  betCount: {
    type: Number,
    default: 0
  },
  totalVolume: {
    type: Number,
    default: 0
  },
  
  // Result (for settled matches)
  result: {
    winner: { type: String, enum: ['HOME', 'AWAY', 'DRAW'] },
    isSettled: { type: Boolean, default: false },
    settledAt: Date,
    settledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Metadata
  externalId: String,
  source: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for performance
matchSchema.index({ date: 1, status: 1 });
matchSchema.index({ 'homeTeam.name': 'text', 'awayTeam.name': 'text', league: 'text' });
matchSchema.index({ status: 1, date: 1 });
matchSchema.index({ league: 1, status: 1 });

// Update timestamps
matchSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Track status changes
  if (this.isModified('status')) {
    if (!this.statusTimeline) this.statusTimeline = [];
    this.statusTimeline.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  
  next();
});

// Update odds and save history
matchSchema.methods.updateOdds = async function(marketIndex, newOdds, reason = 'admin') {
  if (this.status === 'FINISHED') {
    throw new Error('Cannot update odds for finished match');
  }
  
  const market = this.markets[marketIndex];
  if (!market) throw new Error('Market not found');
  
  // Save current odds to history
  if (!market.oddsHistory) market.oddsHistory = [];
  market.oddsHistory.push({
    odds: market.odds,
    timestamp: new Date(),
    reason
  });
  
  // Update odds
  market.previousOdds = market.odds;
  market.odds = newOdds;
  
  await this.save();
  
  return market;
};

// Add event (goal, card, etc.)
matchSchema.methods.addEvent = async function(eventData) {
  if (!this.events) this.events = [];
  
  // Update score if goal
  if (eventData.type === 'GOAL') {
    if (eventData.team === 'home') {
      this.score.home += 1;
      eventData.homeScore = this.score.home;
      eventData.awayScore = this.score.away;
    } else {
      this.score.away += 1;
      eventData.homeScore = this.score.home;
      eventData.awayScore = this.score.away;
    }
  }
  
  this.events.push(eventData);
  await this.save();
  
  return eventData;
};

// Update live stats
matchSchema.methods.updateLiveStats = async function(stats) {
  if (!this.liveStats) this.liveStats = {};
  
  Object.assign(this.liveStats, stats);
  this.liveStats.updatedAt = new Date();
  
  await this.save();
  
  return this.liveStats;
};

// Check if betting is available
matchSchema.methods.isBettingAvailable = function() {
  if (this.status === 'FINISHED' || this.status === 'CANCELLED' || this.status === 'POSTPONED') {
    return false;
  }
  if (this.status === 'LIVE' && !this.liveBettingEnabled) {
    return false;
  }
  return true;
};

// Get available markets
matchSchema.methods.getAvailableMarkets = function() {
  return this.markets.filter(m => m.isActive && !m.suspended);
};

// Calculate volume by market
matchSchema.virtual('volumeByMarket').get(function() {
  const volumes = {};
  this.markets.forEach(market => {
    volumes[market.name] = market.volume;
  });
  return volumes;
});

module.exports = mongoose.model('Match', matchSchema);