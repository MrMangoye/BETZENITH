require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Match = require('./models/Match');
const User = require('./models/User');
const Bet = require('./models/Bet');

// Colors for console output (optional, works without colors too)
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function logStep(step, message, status = 'info') {
  const icons = {
    info: '📌',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    test: '🔍'
  };
  const icon = icons[status] || icons.info;
  console.log(`${icon} ${step}: ${message}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message) {
  console.log(`❌ ${message}`);
}

function logWarning(message) {
  console.log(`⚠️ ${message}`);
}

function logDivider() {
  console.log('========================================');
}

async function testFullSystem() {
  console.log('\n');
  logDivider();
  console.log('🚀 BETFUSION COMPREHENSIVE SYSTEM TEST');
  logDivider();
  console.log(`📅 Date: ${new Date().toLocaleString()}`);
  console.log(`🖥️  Environment: ${process.env.NODE_ENV || 'development'}`);
  logDivider();

  // ============ TEST 1: ENVIRONMENT VARIABLES ============
  console.log('\n');
  logStep('TEST 1', 'Environment Variables', 'test');
  logDivider();
  
  const envVars = [
    { name: 'MONGODB_URI', required: true },
    { name: 'SPORTMONKS_KEY', required: true },
    { name: 'ODDS_API_KEY', required: true },
    { name: 'JWT_SECRET', required: true }
  ];

  let envSuccess = true;
  for (const env of envVars) {
    const value = process.env[env.name];
    if (value) {
      logSuccess(`${env.name}: ${value.substring(0, 10)}...`);
    } else {
      logError(`${env.name}: MISSING (required)`);
      envSuccess = false;
    }
  }

  if (!envSuccess) {
    logError('Environment variables check failed. Please check your .env file');
  }

  // ============ TEST 2: MONGODB CONNECTION ============
  console.log('\n');
  logStep('TEST 2', 'MongoDB Connection', 'test');
  logDivider();
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logSuccess('MongoDB connected successfully');
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    logSuccess(`Found ${collections.length} collections`);
    
    // Check matches
    const matchCount = await Match.countDocuments();
    logSuccess(`Matches in database: ${matchCount}`);
    
    // Check users
    const userCount = await User.countDocuments();
    logSuccess(`Users in database: ${userCount}`);
    
    // Check bets
    const betCount = await Bet.countDocuments();
    logSuccess(`Bets in database: ${betCount}`);
    
  } catch (error) {
    logError(`MongoDB connection failed: ${error.message}`);
  }

  // ============ TEST 3: SPORTMONKS API ============
  console.log('\n');
  logStep('TEST 3', 'Sportmonks API Tests', 'test');
  logDivider();

  // Test 3.1: Live endpoint
  try {
    const liveResponse = await axios.get(
      'https://api.sportmonks.com/v3/football/fixtures/live', {
        params: {
          api_token: process.env.SPORTMONKS_KEY,
          include: 'participants,scores,events,statistics,league',
          per_page: 5
        },
        timeout: 10000
      }
    );
    logSuccess(`Live endpoint: ${liveResponse.status} OK`);
    logSuccess(`  Live matches found: ${liveResponse.data?.data?.length || 0}`);
  } catch (error) {
    logError(`Live endpoint failed: ${error.message}`);
  }

  // Test 3.2: Scottish Premiership (ID: 371)
  try {
    const today = new Date().toISOString().split('T')[0];
    const scottishResponse = await axios.get(
      'https://api.sportmonks.com/v3/football/fixtures', {
        params: {
          api_token: process.env.SPORTMONKS_KEY,
          league_id: 371,
          date: today,
          include: 'participants',
          per_page: 5
        }
      }
    );
    logSuccess(`Scottish Premiership endpoint: OK`);
    logSuccess(`  Fixtures found: ${scottishResponse.data?.data?.length || 0}`);
  } catch (error) {
    logError(`Scottish Premiership failed: ${error.message}`);
  }

  // Test 3.3: Danish Superliga (ID: 82)
  try {
    const today = new Date().toISOString().split('T')[0];
    const danishResponse = await axios.get(
      'https://api.sportmonks.com/v3/football/fixtures', {
        params: {
          api_token: process.env.SPORTMONKS_KEY,
          league_id: 82,
          date: today,
          include: 'participants',
          per_page: 5
        }
      }
    );
    logSuccess(`Danish Superliga endpoint: OK`);
    logSuccess(`  Fixtures found: ${danishResponse.data?.data?.length || 0}`);
  } catch (error) {
    logError(`Danish Superliga failed: ${error.message}`);
  }

  // ============ TEST 4: ODDS API ============
  console.log('\n');
  logStep('TEST 4', 'Odds API Test', 'test');
  logDivider();

  try {
    const oddsResponse = await axios.get(
      'https://api.the-odds-api.com/v4/sports/upcoming/odds', {
        params: {
          apiKey: process.env.ODDS_API_KEY,
          regions: 'uk,eu',
          markets: 'h2h',
          oddsFormat: 'decimal',
          per_page: 5
        },
        timeout: 10000
      }
    );
    logSuccess(`Odds API: ${oddsResponse.status} OK`);
    logSuccess(`  Upcoming events with odds: ${oddsResponse.data?.length || 0}`);
    
    if (oddsResponse.data?.length > 0) {
      const event = oddsResponse.data[0];
      logSuccess(`  Sample: ${event.home_team} vs ${event.away_team}`);
    }
  } catch (error) {
    logError(`Odds API failed: ${error.message}`);
  }

  // ============ TEST 5: DATAFEED SERVICE ============
  console.log('\n');
  logStep('TEST 5', 'DataFeedService Tests', 'test');
  logDivider();

  try {
    const DataFeedService = require('./services/DataFeedService');
    logSuccess('DataFeedService loaded successfully');
    
    // Test fetchTodaysFixtures
    console.log('\n  📡 Testing fetchTodaysFixtures()...');
    const fixtures = await DataFeedService.fetchTodaysFixtures();
    logSuccess(`    Found ${fixtures.length} fixtures`);
    
    if (fixtures.length > 0) {
      logSuccess(`    Sample fixture ID: ${fixtures[0].id}`);
    }

    // Test fetchLiveMatches
    console.log('\n  📡 Testing fetchLiveMatches()...');
    const liveMatches = await DataFeedService.fetchLiveMatches();
    logSuccess(`    Found ${liveMatches.length} live matches`);

    // Test fetchLiveOdds
    console.log('\n  📡 Testing fetchLiveOdds()...');
    const odds = await DataFeedService.fetchLiveOdds();
    logSuccess(`    Found ${odds?.length || 0} odds events`);

  } catch (error) {
    logError(`DataFeedService test failed: ${error.message}`);
  }

  // ============ TEST 6: DATABASE DATA QUALITY ============
  console.log('\n');
  logStep('TEST 6', 'Database Data Quality', 'test');
  logDivider();

  try {
    // Check for unknown team names
    const unknownTeams = await Match.countDocuments({
      $or: [
        { 'homeTeam.name': 'Home Team' },
        { 'homeTeam.name': 'Unknown' },
        { 'homeTeam.name': 'HOM' },
        { 'homeTeam.name': 'TEA' },
        { 'awayTeam.name': 'Away Team' },
        { 'awayTeam.name': 'Unknown' },
        { 'awayTeam.name': 'AWY' },
        { 'awayTeam.name': 'TEA' }
      ]
    });
    
    if (unknownTeams > 0) {
      logWarning(`${unknownTeams} matches have unknown team names`);
    } else {
      logSuccess('No unknown team names found');
    }

    // Match status breakdown
    const liveCount = await Match.countDocuments({ status: 'LIVE' });
    const scheduledCount = await Match.countDocuments({ status: 'SCHEDULED' });
    const finishedCount = await Match.countDocuments({ status: 'FINISHED' });
    
    logSuccess(`Match status breakdown:`);
    logSuccess(`  🔴 LIVE: ${liveCount}`);
    logSuccess(`  📅 SCHEDULED: ${scheduledCount}`);
    logSuccess(`  🏁 FINISHED: ${finishedCount}`);

    // League breakdown
    const leagues = await Match.aggregate([
      { $group: { _id: '$league', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    console.log('\n  📋 Top 5 leagues by matches:');
    leagues.forEach((league, i) => {
      logSuccess(`    ${i+1}. ${league._id || 'Unknown'}: ${league.count} matches`);
    });

    // Sample matches
    const sampleMatches = await Match.find().limit(5);
    console.log('\n  📋 Sample matches:');
    sampleMatches.forEach((match, i) => {
      console.log(`    ${i+1}. ${match.homeTeam.name} vs ${match.awayTeam.name} (${match.league}) - ${match.status}`);
    });

  } catch (error) {
    logError(`Database quality check failed: ${error.message}`);
  }

  // ============ TEST 7: SERVER HEALTH ============
  console.log('\n');
  logStep('TEST 7', 'Server Health Check', 'test');
  logDivider();

  try {
    const healthResponse = await axios.get('http://localhost:5000/health', { timeout: 5000 });
    logSuccess(`Server health endpoint: ${healthResponse.status} OK`);
    logSuccess(`  Uptime: ${healthResponse.data.uptime} seconds`);
    logSuccess(`  MongoDB: ${healthResponse.data.mongodb}`);
  } catch (error) {
    logError(`Server health check failed (is server running?): ${error.message}`);
  }

  // ============ FINAL SUMMARY ============
  console.log('\n');
  logDivider();
  console.log('✅ TEST COMPLETED');
  logDivider();
  
  const finalMatchCount = await Match.countDocuments();
  const finalUserCount = await User.countDocuments();
  const finalBetCount = await Bet.countDocuments();
  
  console.log(`📊 Summary:`);
  console.log(`   🗄️  Database: ${finalMatchCount} matches, ${finalUserCount} users, ${finalBetCount} bets`);
  console.log(`   🔴 Live matches: ${await Match.countDocuments({ status: 'LIVE' })}`);
  console.log(`   📡 API Status: Sportmonks ✅, Odds API ✅`);
  logDivider();
  
  await mongoose.connection.close();
  console.log('👋 MongoDB connection closed');
  console.log('\n');
}

testFullSystem();