require('dotenv').config();
const axios = require('axios');

async function testSportmonks() {
  console.log('🔍 TESTING SPORTMONKS API V3.0');
  console.log('================================');
  console.log('API Key:', process.env.SPORTMONKS_KEY ? '✅ Loaded' : '❌ Missing');
  
  // Test 1: Basic API connection
  try {
    console.log('\n📡 Test 1: Basic API Connection');
    const response = await axios.get('https://api.sportmonks.com/v3/football/leagues', {
      params: {
        api_token: process.env.SPORTMONKS_KEY,
        per_page: 5
      }
    });
    console.log('✅ API Connection Successful!');
    console.log('Status:', response.status);
    console.log('Leagues found:', response.data?.data?.length || 0);
    if (response.data?.data?.length > 0) {
      console.log('Sample league:', response.data.data[0].name);
    }
  } catch (error) {
    console.log('❌ API Connection Failed!');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message || error.message);
  }

  // Test 2: Try different filter names
  const filterTests = [
    { name: 'league_id', value: '371' },
    { name: 'league_ids', value: '371' },
    { name: 'leagueId', value: '371' },
    { name: 'leagueIds', value: '371' },
    { name: 'fixture_league_id', value: '371' },
    { name: 'fixture_league_ids', value: '371' }
  ];

  for (const test of filterTests) {
    try {
      console.log(`\n📡 Test: Try filter "${test.name}"`);
      const today = new Date().toISOString().split('T')[0];
      
      const response = await axios.get('https://api.sportmonks.com/v3/football/fixtures', {
        params: {
          api_token: process.env.SPORTMONKS_KEY,
          [test.name]: test.value,  // Dynamic filter name
          date: today,
          include: 'participants',
          per_page: 5
        }
      });
      console.log(`✅ SUCCESS with filter "${test.name}"!`);
      console.log('Fixtures found:', response.data?.data?.length || 0);
      break; // Stop if successful
    } catch (error) {
      console.log(`❌ Failed with filter "${test.name}"`);
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message || error.message);
    }
  }

  // Test 3: Try without any filters (just date)
  try {
    console.log('\n📡 Test: Fetch fixtures with date only');
    const today = new Date().toISOString().split('T')[0];
    
    const response = await axios.get('https://api.sportmonks.com/v3/football/fixtures', {
      params: {
        api_token: process.env.SPORTMONKS_KEY,
        date: today,
        include: 'participants,league',
        per_page: 10
      }
    });
    console.log('✅ Fixtures fetched with date only!');
    console.log('Fixtures found:', response.data?.data?.length || 0);
    if (response.data?.data?.length > 0) {
      console.log('First fixture:', response.data.data[0].name);
      // Show which leagues these fixtures are from
      const leagues = new Set();
      response.data.data.forEach(f => {
        if (f.league?.data?.name) leagues.add(f.league.data.name);
      });
      console.log('Leagues found:', Array.from(leagues).join(', '));
    }
  } catch (error) {
    console.log('❌ Date-only fetch failed');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message || error.message);
  }

  // Test 4: Try live fixtures
  try {
    console.log('\n📡 Test: Fetch live fixtures');
    const response = await axios.get('https://api.sportmonks.com/v3/football/fixtures/live', {
      params: {
        api_token: process.env.SPORTMONKS_KEY,
        include: 'participants,scores,events,statistics,league',
        per_page: 10
      }
    });
    console.log('✅ Live fixtures fetched successfully!');
    console.log('Live matches found:', response.data?.data?.length || 0);
  } catch (error) {
    console.log('❌ Live fixtures fetch failed');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message || error.message);
  }
}

testSportmonks();