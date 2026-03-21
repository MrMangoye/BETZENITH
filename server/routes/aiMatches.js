const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Match = require('../models/Match');
const aiMatchService = require('../services/aiMatchService');

// Get all matches with AI predictions
router.get('/all', async (req, res) => {
  try {
    const { status, league, page = 1, limit = 50 } = req.query;
    
    let query = {};
    if (status && status !== 'ALL') {
      if (status === 'LIVE') {
        query.status = { $in: ['LIVE', 'FIRST_HALF', 'SECOND_HALF'] };
      } else {
        query.status = status;
      }
    }
    if (league) query.league = league;
    
    const matches = await Match.find(query)
      .sort({ startsAt: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Match.countDocuments(query);
    
    res.json({
      success: true,
      data: matches,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get live matches
router.get('/live', async (req, res) => {
  try {
    const matches = await Match.find({
      status: { $in: ['LIVE', 'FIRST_HALF', 'SECOND_HALF', 'HALFTIME'] }
    }).sort({ minute: -1 });
    
    res.json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    console.error('Error fetching live matches:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get upcoming matches (scheduled)
router.get('/upcoming', async (req, res) => {
  try {
    const matches = await Match.find({
      status: 'SCHEDULED',
      startsAt: { $gt: new Date() }
    }).sort({ startsAt: 1 }).limit(50);
    
    res.json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get finished matches
router.get('/finished', async (req, res) => {
  try {
    const matches = await Match.find({
      status: 'FINISHED'
    }).sort({ startsAt: -1 }).limit(50);
    
    res.json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    console.error('Error fetching finished matches:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get AI prediction for a specific match
router.get('/prediction/:matchId', async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    
    res.json({
      success: true,
      data: {
        matchId: match._id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        prediction: match.aiPrediction || await aiMatchService.calculateAIPrediction(match),
        status: match.status,
        score: match.score,
        minute: match.minute
      }
    });
  } catch (error) {
    console.error('Error fetching prediction:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get matches by league
router.get('/league/:leagueName', async (req, res) => {
  try {
    const { leagueName } = req.params;
    const { status } = req.query;
    
    let query = { league: decodeURIComponent(leagueName) };
    if (status && status !== 'ALL') {
      query.status = status;
    }
    
    const matches = await Match.find(query).sort({ startsAt: 1 });
    
    res.json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    console.error('Error fetching league matches:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get match statistics
router.get('/stats/:matchId', async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    
    const stats = {
      possession: match.liveStats?.possession || { home: 50, away: 50 },
      shots: match.liveStats?.shots || { home: 0, away: 0 },
      shotsOnTarget: match.liveStats?.shotsOnTarget || { home: 0, away: 0 },
      corners: match.liveStats?.corners || { home: 0, away: 0 },
      fouls: match.liveStats?.fouls || { home: 0, away: 0 },
      yellowCards: match.liveStats?.yellowCards || { home: 0, away: 0 },
      redCards: match.liveStats?.redCards || { home: 0, away: 0 },
      events: match.events || []
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching match stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start the AI match service (admin only)
router.post('/admin/start-service', async (req, res) => {
  try {
    aiMatchService.start();
    res.json({ success: true, message: 'AI Match Service started' });
  } catch (error) {
    console.error('Error starting service:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Stop the AI match service (admin only)
router.post('/admin/stop-service', async (req, res) => {
  try {
    aiMatchService.stop();
    res.json({ success: true, message: 'AI Match Service stopped' });
  } catch (error) {
    console.error('Error stopping service:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;