const express = require('express');
const { protect } = require('../middleware/auth');
const Match = require('../models/Match');
const Bet = require('../models/Bet');

const router = express.Router();

// @route   GET /api/live/matches
// @desc    Get all live matches
router.get('/matches', async (req, res) => {
  try {
    const liveMatches = await Match.find({ 
      status: 'LIVE' 
    }).sort({ date: 1 });
    
    res.json({
      success: true,
      count: liveMatches.length,
      data: liveMatches
    });
  } catch (error) {
    console.error('Live matches error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/live/match/:id
// @desc    Get specific live match details
router.get('/match/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ 
        success: false,
        message: 'Match not found' 
      });
    }
    
    res.json({
      success: true,
      data: match
    });
  } catch (error) {
    console.error('Live match detail error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   POST /api/live/bet/:id
// @desc    Place live bet
router.post('/bet/:id', protect, async (req, res) => {
  try {
    const { marketIndex, stake } = req.body;
    const matchId = req.params.id;
    
    const match = await Match.findById(matchId);
    
    if (!match) {
      return res.status(404).json({ 
        success: false,
        message: 'Match not found' 
      });
    }
    
    if (match.status !== 'LIVE') {
      return res.status(400).json({ 
        success: false,
        message: 'Match is not live' 
      });
    }
    
    const market = match.markets[marketIndex];
    if (!market || !market.isActive) {
      return res.status(400).json({ 
        success: false,
        message: 'Market not available' 
      });
    }
    
    const user = await User.findById(req.user._id);
    if (user.balance < stake) {
      return res.status(400).json({ 
        success: false,
        message: 'Insufficient balance' 
      });
    }
    
    const potentialWin = stake * market.odds;
    
    const bet = await Bet.create({
      user: user._id,
      match: match._id,
      marketIndex,
      odds: market.odds,
      stake,
      potentialWin,
      status: 'PENDING'
    });
    
    user.balance -= stake;
    await user.save();
    
    // Emit live update via socket.io
    const io = req.app.get('io');
    io.emit('new-live-bet', {
      matchId: match._id,
      marketIndex,
      stake,
      username: user.username
    });
    
    res.status(201).json({
      success: true,
      message: 'Live bet placed',
      data: bet
    });
  } catch (error) {
    console.error('Live bet error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/live/stats
// @desc    Get live betting statistics
router.get('/stats', async (req, res) => {
  try {
    const liveMatches = await Match.find({ status: 'LIVE' });
    const totalBets = await Bet.countDocuments({
      match: { $in: liveMatches.map(m => m._id) },
      status: 'PENDING'
    });
    
    res.json({
      success: true,
      data: {
        liveMatches: liveMatches.length,
        activeBets: totalBets,
        totalStake: 0 // Calculate if needed
      }
    });
  } catch (error) {
    console.error('Live stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;