require('dotenv').config();
const axios = require('axios');

async function testOddsAPI() {
  const key = process.env.ODDS_API_KEY;
  console.log('Testing Odds-API...');
  console.log('API Key:', key ? `${key.substring(0, 10)}...` : 'MISSING');
  
  try {
    // Test sports endpoint first
    const response = await axios.get(
      `https://api.odds-api.io/v1/sports`,
      {
        params: {
          apiKey: key
        },
        timeout: 5000
      }
    );
    
    console.log('✅ Odds-API connection successful!');
    console.log('Sports found:', response.data.data?.length || 0);
  } catch (error) {
    console.log('❌ Odds-API connection failed:');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

testOddsAPI();