// test-odds.js
const axios = require('axios');

const oddsApiKey = '3204d7545d2a97b99921fba3258ae18d';

async function testOddsAPI() {
    console.log('🔍 TESTING ODDS-API KEY\n');
    console.log(`Key: ${oddsApiKey}`);
    
    try {
        // Test 1: Get sports list
        console.log('\n📡 Test 1: Fetching sports list...');
        const response = await axios.get('https://api.the-odds-api.com/v4/sports', {
            params: { apiKey: oddsApiKey },
            timeout: 5000
        });
        
        console.log('✅ SUCCESS!');
        console.log(`Status: ${response.status}`);
        console.log(`Sports found: ${response.data.length}`);
        
        if (response.data.length > 0) {
            console.log('\nSample sports:');
            response.data.slice(0, 5).forEach(sport => {
                console.log(`  - ${sport.title} (${sport.key})`);
            });
        }
        
        // Test 2: Check rate limit status
        console.log('\n📡 Test 2: Checking rate limits...');
        console.log(`Requests remaining: ${response.headers['x-requests-remaining'] || 'N/A'}`);
        console.log(`Requests used: ${response.headers['x-requests-used'] || 'N/A'}`);
        
    } catch (error) {
        console.log('❌ FAILED!');
        console.log(`Status: ${error.response?.status}`);
        console.log(`Message: ${error.response?.data?.message || error.message}`);
        
        if (error.response?.status === 401) {
            console.log('\n⚠️  Your API key is invalid or expired!');
            console.log('🔑 Get a new free key from: https://the-odds-api.com');
        }
    }
}

testOddsAPI();