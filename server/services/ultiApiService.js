// server/services/multiApiService.js
const axios = require('axios');

class MultiApiService {
  constructor() {
    this.apis = {
      oddsApi: {
        key: process.env.ODDS_API_KEY,
        url: process.env.ODDS_API_URL,
        priority: 1,
        enabled: true
      },
      sportsOdds: {
        key: process.env.SPORTS_ODDS_API_KEY,
        url: process.env.SPORTS_ODDS_API_URL,
        priority: 2,
        enabled: !!process.env.SPORTS_ODDS_API_KEY
      },
      sportmonks: {
        key: process.env.SPORTMONKS_API_KEY,
        url: process.env.SPORTMONKS_API_URL,
        priority: 3,
        enabled: !!process.env.SPORTMONKS_API_KEY
      },
      theSportsDB: {
        url: process.env.THESPORTSDB_API_URL,
        priority: 4,
        enabled: true // Free API, always enabled
      }
    };
  }

  async getLiveEvents(sport) {
    // Try APIs in priority order
    const errors = [];
    
    for (const [apiName, api] of Object.entries(this.apis).sort((a, b) => a.priority - b.priority)) {
      if (!api.enabled) continue;
      
      try {
        console.log(`Trying ${apiName} for live events...`);
        
        switch(apiName) {
          case 'oddsApi':
            const oddsResponse = await axios.get(`${api.url}/live`, {
              params: { apiKey: api.key, sport }
            });
            return oddsResponse.data;
            
          case 'sportsOdds':
            const sportsResponse = await axios.get(`${api.url}/live-events`, {
              params: { api_key: api.key, sport }
            });
            return sportsResponse.data;
            
          case 'sportmonks':
            const monkResponse = await axios.get(`${api.url}/livescores`, {
              params: { api_token: api.key, sport }
            });
            return monkResponse.data;
            
          case 'theSportsDB':
            const freeResponse = await axios.get(`${api.url}/eventsnextleague.php`, {
              params: { sport }
            });
            return freeResponse.data;
        }
      } catch (error) {
        console.log(`${apiName} failed:`, error.message);
        errors.push({ api: apiName, error: error.message });
        continue; // Try next API
      }
    }
    
    // If all APIs fail
    throw new Error('All APIs failed: ' + JSON.stringify(errors));
  }

  async getUpcomingEvents(sport, date) {
    // Similar fallback logic
    // Try each API in order until one works
  }

  async searchEvents(query) {
    // Try search across multiple APIs
    const results = [];
    
    // Try primary API first
    try {
      const primaryResults = await this.searchOddsApi(query);
      results.push(...primaryResults);
    } catch (error) {
      console.log('Primary search failed, trying secondary...');
    }
    
    // Try secondary API
    try {
      const secondaryResults = await this.searchSportsDB(query);
      results.push(...secondaryResults);
    } catch (error) {
      console.log('Secondary search failed');
    }
    
    return results;
  }
}

module.exports = new MultiApiService();