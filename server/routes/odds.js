const express = require('express');
const externalOddsService = require('../services/externalOddsService');
const axios = require('axios');
const router = express.Router();

// @route   GET /api/odds/live
// @desc    Get live events with odds
// @access  Public
router.get('/live', async (req, res) => {
  try {
    const { sport = 'football' } = req.query;
    console.log(`🎯 Processing /odds/live request for sport: ${sport}`);
    
    const data = await externalOddsService.getLiveEvents(sport);
    
    res.json({
      success: true,
      data: data.data || data || []
    });
  } catch (error) {
    console.error('❌ Live odds error:', error.message);
    res.json({
      success: true,
      data: []
    });
  }
});

// @route   GET /api/odds/upcoming
// @desc    Get upcoming events with odds
// @access  Public
router.get('/upcoming', async (req, res) => {
  try {
    const { sport = 'football', date = 'today' } = req.query;
    console.log(`🎯 Processing /odds/upcoming request for sport: ${sport}, date: ${date}`);
    
    const data = await externalOddsService.getUpcomingEvents(sport, date);
    
    res.json({
      success: true,
      data: data.data || data || []
    });
  } catch (error) {
    console.error('❌ Upcoming odds error:', error.message);
    res.json({
      success: true,
      data: []
    });
  }
});

// @route   GET /api/odds/scores/live
// @desc    Get live scores
// @access  Public
router.get('/scores/live', async (req, res) => {
  try {
    const { sport = 'football' } = req.query;
    console.log(`🎯 Processing /odds/scores/live request for sport: ${sport}`);
    
    const data = await externalOddsService.getLiveScores(sport);
    
    res.json({
      success: true,
      data: data.data || data || []
    });
  } catch (error) {
    console.error('❌ Live scores error:', error.message);
    res.json({
      success: true,
      data: []
    });
  }
});

// @route   GET /api/odds/sports
// @desc    Get all available sports
// @access  Public
router.get('/sports', async (req, res) => {
  try {
    console.log('🎯 Processing /odds/sports request');
    
    const sports = [
      { id: 'soccer', name: 'Soccer', icon: '⚽', regions: ['uk', 'eu', 'us'] },
      { id: 'football', name: 'American Football', icon: '🏈', regions: ['us'] },
      { id: 'basketball', name: 'Basketball', icon: '🏀', regions: ['us', 'eu'] },
      { id: 'tennis', name: 'Tennis', icon: '🎾', regions: ['eu', 'us', 'uk'] },
      { id: 'baseball', name: 'Baseball', icon: '⚾', regions: ['us', 'jp'] },
      { id: 'hockey', name: 'Ice Hockey', icon: '🏒', regions: ['us', 'eu'] },
      { id: 'mma', name: 'MMA', icon: '🥊', regions: ['us'] },
      { id: 'boxing', name: 'Boxing', icon: '🥊', regions: ['us', 'uk'] },
      { id: 'golf', name: 'Golf', icon: '⛳', regions: ['us', 'uk'] },
      { id: 'cricket', name: 'Cricket', icon: '🏏', regions: ['uk', 'au', 'in'] },
      { id: 'rugby', name: 'Rugby', icon: '🏉', regions: ['uk', 'fr', 'au'] },
      { id: 'f1', name: 'Formula 1', icon: '🏎️', regions: ['eu', 'uk'] }
    ];
    
    res.json({
      success: true,
      count: sports.length,
      data: sports
    });
  } catch (error) {
    console.error('❌ Sports list error:', error);
    res.json({
      success: true,
      data: []
    });
  }
});

// @route   GET /api/odds/search
// @desc    Search events across all sports
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, sport, date } = req.query;
    
    console.log(`🔍 Processing /odds/search request: query="${q}", sport=${sport || 'all'}`);
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: { 
          events: [], 
          query: q,
          total: 0
        }
      });
    }
    
    const results = await externalOddsService.searchEvents(q, sport, date);
    
    res.json({
      success: true,
      data: {
        query: q,
        sport: sport || 'all',
        date: date || 'any',
        events: results.data || [],
        total: results.data?.length || 0
      }
    });
  } catch (error) {
    console.error('❌ Search error:', error.message);
    res.json({
      success: true,
      data: { 
        events: [],
        query: req.query.q || '',
        total: 0
      }
    });
  }
});

// @route   GET /api/odds/popular
// @desc    Get popular/trending events
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    console.log('🎯 Processing /odds/popular request');
    
    const popularEvents = [
      {
        id: 'pop-1',
        sport: 'soccer',
        league: 'UEFA Champions League',
        homeTeam: { name: 'Real Madrid' },
        awayTeam: { name: 'Manchester City' },
        startsAt: new Date(Date.now() + 172800000).toISOString(),
        bettingVolume: 12500,
        odds: { home: 2.40, draw: 3.50, away: 2.80 }
      },
      {
        id: 'pop-2',
        sport: 'basketball',
        league: 'NBA',
        homeTeam: { name: 'LA Lakers' },
        awayTeam: { name: 'Golden State Warriors' },
        startsAt: new Date(Date.now() + 86400000).toISOString(),
        bettingVolume: 10200,
        odds: { home: 1.95, away: 1.95 }
      },
      {
        id: 'pop-3',
        sport: 'soccer',
        league: 'Premier League',
        homeTeam: { name: 'Arsenal' },
        awayTeam: { name: 'Chelsea' },
        startsAt: new Date(Date.now() + 43200000).toISOString(),
        bettingVolume: 9800,
        odds: { home: 2.10, draw: 3.30, away: 3.50 }
      }
    ];
    
    res.json({
      success: true,
      data: popularEvents
    });
  } catch (error) {
    console.error('❌ Popular events error:', error.message);
    res.json({
      success: true,
      data: []
    });
  }
});

// @route   GET /api/odds/leagues
// @desc    Get all leagues for a sport
// @access  Public
router.get('/leagues', async (req, res) => {
  try {
    const { sport } = req.query;
    console.log(`🎯 Processing /odds/leagues request for sport: ${sport || 'all'}`);
    
    const leagues = {
      soccer: [
        { id: 'pl', name: 'Premier League', country: 'England' },
        { id: 'laliga', name: 'La Liga', country: 'Spain' },
        { id: 'bundesliga', name: 'Bundesliga', country: 'Germany' },
        { id: 'seriea', name: 'Serie A', country: 'Italy' },
        { id: 'ligue1', name: 'Ligue 1', country: 'France' },
        { id: 'ucl', name: 'Champions League', country: 'Europe' }
      ],
      basketball: [
        { id: 'nba', name: 'NBA', country: 'USA' },
        { id: 'euroleague', name: 'EuroLeague', country: 'Europe' }
      ]
    };
    
    if (sport && leagues[sport]) {
      res.json({
        success: true,
        data: leagues[sport]
      });
    } else {
      res.json({
        success: true,
        data: Object.values(leagues).flat()
      });
    }
  } catch (error) {
    console.error('❌ Leagues error:', error.message);
    res.json({
      success: true,
      data: []
    });
  }
});

// @route   GET /api/odds/test-live
// @desc    Test endpoint to verify Sportmonks connection
// @access  Public
router.get('/test-live', async (req, res) => {
  try {
    const sportmonksKey = process.env.SPORTMONKS_KEY;
    const response = await axios.get('https://api.sportmonks.com/v3/football/livescores', {
      params: {
        api_token: sportmonksKey,
        include: 'participants;league'
      },
      timeout: 5000
    });
    
    res.json({
      success: true,
      message: 'Direct Sportmonks test',
      data: response.data
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
      error: error.response?.data || error.message
    });
  }
});

module.exports = router;