require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Match = require('./models/Match');

async function testFullSystem() {
  console.log('\n🔍 ========== BETFUSION FULL SYSTEM TEST ==========');
  console.log('📅 Date:', new Date().toLocaleString());
  console.log('=============================================\n');

  // Test 1: Environment Variables
  console.log('📁 TEST 1: Environment Variables');
  console.log('----------------------------------------');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Loaded' : '❌ Missing');
  console.log('SPORTMONKS_KEY:', process.env.SPORTMONKS_KEY ? '✅ Loaded' : '❌ Missing');
  console.log('ODDS_API_KEY:', process.env.ODDS_API_KEY ? '✅ Loaded' : '❌ Missing');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Loaded' : '❌ Missing');
  console.log('');

  // Test 2: MongoDB Connection
  console.log('🗄️ TEST 2: MongoDB Connection');
  console.log('----------------------------------------');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
    
    // Check matches in database
    const matchCount = await Match.countDocuments();
    console.log(`📊 Total matches in database: ${matchCount}`);
    
    if (matchCount > 0) {
      const sampleMatch = await Match.findOne();
      console.log('📋 Sample match:', {
        id: sampleMatch._id,
        league: sampleMatch.league,
        home: sampleMatch.homeTeam.name,
        away: sampleMatch.awayTeam.name,
        status: sampleMatch.status
      });
    }
  } catch (error) {
    console.log('❌ MongoDB Connection Failed:', error.message);
  }
  console.log('');

  // Test 3: Sportmonks API - Live Matches
  console.log('⚽ TEST 3: Sportmonks API - Live Matches');
  console.log('----------------------------------------');
  try {
    const response = await axios.get(
      'https://api.sportmonks.com/v3/football/fixtures/live', {
        params: {
          api_token: process.env.SPORTMONKS_KEY,
          include: 'participants,scores,events,statistics,league',
          per_page: 10
        },
        timeout: 10000
      }
    );
    
    console.log(`✅ Live endpoint works! Status: ${response.status}`);
    console.log(`📊 Live matches found: ${response.data?.data?.length || 0}`);
    
    if (response.data?.data?.length > 0) {
      const match = response.data.data[0];
      console.log('📋 First live match:', {
        league: match.league?.data?.name,
        id: match.id,
        status: match.state_id
      });
    }
  } catch (error) {
    console.log('❌ Live endpoint failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
  console.log('');

  // Test 4: Sportmonks API - Scottish Premiership Fixtures
  console.log('🏴󠁧󠁢󠁳󠁣󠁴󠁿 TEST 4: Scottish Premiership Fixtures (ID: 371)');
  console.log('----------------------------------------');
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await axios.get(
      'https://api.sportmonks.com/v3/football/fixtures', {
        params: {
          api_token: process.env.SPORTMONKS_KEY,
          league_id: 371,
          date: today,
          include: 'participants',
          per_page: 10
        }
      }
    );
    
    console.log(`✅ Scottish Premiership endpoint works!`);
    console.log(`📊 Fixtures found today: ${response.data?.data?.length || 0}`);
    
    if (response.data?.data?.length > 0) {
      const fixture = response.data.data[0];
      const participants = fixture.participants?.data || [];
      const home = participants.find(p => p.meta?.location === 'home');
      const away = participants.find(p => p.meta?.location === 'away');
      
      console.log('📋 First fixture:', {
        id: fixture.id,
        home: home?.name || 'Unknown',
        away: away?.name || 'Unknown',
        date: fixture.starting_at,
        state: fixture.state_id
      });
    }
  } catch (error) {
    console.log('❌ Scottish Premiership failed:', error.message);
  }
  console.log('');

  // Test 5: Sportmonks API - Danish Superliga Fixtures
  console.log('🇩🇰 TEST 5: Danish Superliga Fixtures (ID: 82)');
  console.log('----------------------------------------');
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await axios.get(
      'https://api.sportmonks.com/v3/football/fixtures', {
        params: {
          api_token: process.env.SPORTMONKS_KEY,
          league_id: 82,
          date: today,
          include: 'participants',
          per_page: 10
        }
      }
    );
    
    console.log(`✅ Danish Superliga endpoint works!`);
    console.log(`📊 Fixtures found today: ${response.data?.data?.length || 0}`);
    
    if (response.data?.data?.length > 0) {
      const fixture = response.data.data[0];
      const participants = fixture.participants?.data || [];
      const home = participants.find(p => p.meta?.location === 'home');
      const away = participants.find(p => p.meta?.location === 'away');
      
      console.log('📋 First fixture:', {
        id: fixture.id,
        home: home?.name || 'Unknown',
        away: away?.name || 'Unknown',
        date: fixture.starting_at,
        state: fixture.state_id
      });
    }
  } catch (error) {
    console.log('❌ Danish Superliga failed:', error.message);
  }
  console.log('');

  // Test 6: Odds API
  console.log('💰 TEST 6: Odds API');
  console.log('----------------------------------------');
  try {
    const response = await axios.get(
      'https://api.the-odds-api.com/v4/sports/upcoming/odds', {
        params: {
          apiKey: process.env.ODDS_API_KEY,
          regions: 'uk',
          markets: 'h2h',
          oddsFormat: 'decimal'
        },
        timeout: 10000
      }
    );
    
    console.log(`✅ Odds API works! Status: ${response.status}`);
    console.log(`📊 Upcoming events with odds: ${response.data?.length || 0}`);
    
    if (response.data?.length > 0) {
      console.log('📋 First event:', {
        sport: response.data[0].sport_title,
        home: response.data[0].home_team,
        away: response.data[0].away_team,
        odds: response.data[0].bookmakers?.[0]?.markets?.[0]?.outcomes?.[0]?.price
      });
    }
  } catch (error) {
    console.log('❌ Odds API failed:', error.message);
  }
  console.log('');

  // Test 7: DataFeedService Integration Test
  console.log('🔄 TEST 7: DataFeedService Integration');
  console.log('----------------------------------------');
  try {
    const DataFeedService = require('./services/DataFeedService');
    
    console.log('📡 Testing fetchLiveMatches()...');
    const liveMatches = await DataFeedService.fetchLiveMatches();
    console.log(`✅ fetchLiveMatches() returned ${liveMatches.length} matches`);
    
    console.log('📡 Testing fetchTodaysFixtures()...');
    const fixtures = await DataFeedService.fetchTodaysFixtures();
    console.log(`✅ fetchTodaysFixtures() returned ${fixtures.length} fixtures`);
    
    console.log('📡 Testing fetchLiveOdds()...');
    const odds = await DataFeedService.fetchLiveOdds();
    console.log(`✅ fetchLiveOdds() returned ${odds?.length || 0} odds events`);
    
  } catch (error) {
    console.log('❌ DataFeedService test failed:', error.message);
  }
  console.log('');

  // Test 8: Check Database After Integration
  console.log('💾 TEST 8: Database After Integration');
  console.log('----------------------------------------');
  try {
    const totalMatches = await Match.countDocuments();
    console.log(`📊 Total matches in database: ${totalMatches}`);
    
    const liveMatches = await Match.countDocuments({ status: 'LIVE' });
    console.log(`🔴 Live matches: ${liveMatches}`);
    
    const scheduledMatches = await Match.countDocuments({ status: 'SCHEDULED' });
    console.log(`📅 Scheduled matches: ${scheduledMatches}`);
    
    const finishedMatches = await Match.countDocuments({ status: 'FINISHED' });
    console.log(`🏁 Finished matches: ${finishedMatches}`);
    
    // Show sample of matches by league
    const leagues = await Match.aggregate([
      { $group: { _id: '$league', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    console.log('\n📋 Top leagues in database:');
    leagues.forEach(l => {
      console.log(`   ${l._id}: ${l.count} matches`);
    });
    
  } catch (error) {
    console.log('❌ Database check failed:', error.message);
  }
  console.log('');

  console.log('=============================================');
  console.log('✅ TEST COMPLETE');
  console.log('=============================================\n');
  
  process.exit(0);
}

testFullSystem();