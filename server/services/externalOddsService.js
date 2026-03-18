// server/services/externalOddsService.js
const axios = require('axios');
const mockMatches = require('../data/mockMatches');

class ExternalOddsService {
  constructor() {
    // Odds-API
    this.oddsApiKey = process.env.ODDS_API_KEY;
    this.oddsApiUrl = 'https://api.the-odds-api.com/v4';
    
    // Sportmonks V3.0
    this.sportmonksKey = process.env.SPORTMONKS_KEY;
    this.sportmonksUrl = 'https://api.sportmonks.com/v3/football';
    
    console.log('🔧 ExternalOddsService initialized');
    console.log('  - Odds-API Key present:', !!this.oddsApiKey);
    console.log('  - Odds-API URL:', this.oddsApiUrl);
    console.log('  - Sportmonks Key present:', !!this.sportmonksKey);
    console.log('  - Sportmonks URL:', this.sportmonksUrl);
    console.log('  - Mock data loaded as fallback only');
  }

  // ============ MAIN PUBLIC METHODS ============

  async getLiveEvents(sport = 'football') {
    try {
      console.log(`📡 Fetching live events for ${sport}...`);
      
      // Map 'football' to 'soccer' for Sportmonks
      const sportmonksSport = (sport === 'football') ? 'soccer' : sport;
      
      // TRY SPORTMONKS FIRST (for soccer)
      if (sportmonksSport === 'soccer') {
        try {
          const sportmonksData = await this.getSportmonksLive();
          if (sportmonksData && sportmonksData.data && sportmonksData.data.length > 0) {
            console.log('✅ Using Sportmonks live data');
            return sportmonksData;
          }
          console.log('⚠️ No live matches from Sportmonks');
        } catch (error) {
          console.log('⚠️ Sportmonks error:', error.message);
        }
      }
      
      // TRY ODDS-API SECOND (for all sports)
      try {
        const oddsData = await this.getOddsApiLive(sport);
        if (oddsData && oddsData.data && oddsData.data.length > 0) {
          console.log('✅ Using Odds-API live data');
          return oddsData;
        }
        console.log('⚠️ No live matches from Odds-API');
      } catch (error) {
        console.log('⚠️ Odds-API error:', error.message);
      }
      
      // ONLY USE MOCK DATA IF BOTH APIS FAIL
      console.log('⚠️ BOTH APIS FAILED - Using mock data as fallback');
      return this.getMockLiveEvents(sport);
      
    } catch (error) {
      console.error('❌ Error in getLiveEvents:', error.message);
      return this.getMockLiveEvents(sport);
    }
  }

  async getUpcomingEvents(sport = 'football', date = 'today') {
    try {
      console.log(`📡 Fetching upcoming events for ${sport} on ${date}...`);
      
      // Map 'football' to 'soccer' for Sportmonks
      const sportmonksSport = (sport === 'football') ? 'soccer' : sport;
      
      // TRY SPORTMONKS FIRST (for soccer)
      if (sportmonksSport === 'soccer') {
        try {
          const sportmonksData = await this.getSportmonksFixtures(date);
          if (sportmonksData && sportmonksData.data && sportmonksData.data.length > 0) {
            console.log('✅ Using Sportmonks fixtures');
            return sportmonksData;
          }
          console.log('⚠️ No fixtures from Sportmonks');
        } catch (error) {
          console.log('⚠️ Sportmonks error:', error.message);
        }
      }
      
      // TRY ODDS-API SECOND (for all sports)
      try {
        const oddsData = await this.getOddsApiUpcoming(sport, date);
        if (oddsData && oddsData.data && oddsData.data.length > 0) {
          console.log('✅ Using Odds-API upcoming data');
          return oddsData;
        }
        console.log('⚠️ No upcoming from Odds-API');
      } catch (error) {
        console.log('⚠️ Odds-API error:', error.message);
      }
      
      // ONLY USE MOCK DATA IF BOTH APIS FAIL
      console.log('⚠️ BOTH APIS FAILED - Using mock data as fallback');
      return this.getMockUpcomingEvents(sport);
      
    } catch (error) {
      console.error('❌ Error in getUpcomingEvents:', error.message);
      return this.getMockUpcomingEvents(sport);
    }
  }

  async getLiveScores(sport = 'football') {
    try {
      console.log(`📡 Fetching live scores for ${sport}...`);
      
      // Map 'football' to 'soccer' for Sportmonks
      const sportmonksSport = (sport === 'football') ? 'soccer' : sport;
      
      // TRY SPORTMONKS FIRST (for soccer)
      if (sportmonksSport === 'soccer') {
        try {
          const sportmonksData = await this.getSportmonksLive();
          if (sportmonksData && sportmonksData.data && sportmonksData.data.length > 0) {
            console.log('✅ Using Sportmonks live scores');
            return sportmonksData;
          }
          console.log('⚠️ No live scores from Sportmonks');
        } catch (error) {
          console.log('⚠️ Sportmonks error:', error.message);
        }
      }
      
      // TRY ODDS-API SECOND
      try {
        const oddsData = await this.getOddsApiScores(sport);
        if (oddsData && oddsData.data && oddsData.data.length > 0) {
          console.log('✅ Using Odds-API scores');
          return oddsData;
        }
        console.log('⚠️ No scores from Odds-API');
      } catch (error) {
        console.log('⚠️ Odds-API error:', error.message);
      }
      
      // ONLY USE MOCK DATA IF BOTH APIS FAIL
      console.log('⚠️ BOTH APIS FAILED - Using mock scores as fallback');
      return this.getMockLiveScores(sport);
      
    } catch (error) {
      console.error('❌ Error in getLiveScores:', error.message);
      return this.getMockLiveScores(sport);
    }
  }

  async searchEvents(query, sport = null, date = null) {
    try {
      console.log(`🔍 Searching for: "${query}" in sport: ${sport || 'all'}`);
      
      const results = [];
      
      // TRY SPORTMONKS FIRST (for soccer)
      if (!sport || sport === 'soccer' || sport === 'football') {
        try {
          const fixtures = await this.getSportmonksFixtures(date || 'today');
          if (fixtures && fixtures.data) {
            const filtered = fixtures.data.filter(match => 
              match.homeTeam.name.toLowerCase().includes(query.toLowerCase()) ||
              match.awayTeam.name.toLowerCase().includes(query.toLowerCase()) ||
              match.league.toLowerCase().includes(query.toLowerCase())
            );
            results.push(...filtered);
          }
        } catch (error) {
          console.log('⚠️ Sportmonks search error:', error.message);
        }
      }
      
      // TRY ODDS-API SECOND
      try {
        const oddsData = await this.getOddsApiSearch(query, sport);
        if (oddsData && oddsData.data) {
          results.push(...oddsData.data);
        }
      } catch (error) {
        console.log('⚠️ Odds-API search error:', error.message);
      }
      
      // If we have real results, return them
      if (results.length > 0) {
        console.log(`✅ Found ${results.length} real results`);
        return {
          data: results.slice(0, 20),
          total: results.length
        };
      }
      
      // ONLY USE MOCK DATA IF APIS RETURN NO RESULTS
      console.log('⚠️ NO API RESULTS - Using mock search results');
      return this.getMockSearchResults(query, sport);
      
    } catch (error) {
      console.error('❌ Error in searchEvents:', error.message);
      return this.getMockSearchResults(query, sport);
    }
  }

  // ============ SPORTMONKS V3.0 METHODS ============

  async getSportmonksLive() {
    try {
      if (!this.sportmonksKey) {
        console.log('  - No Sportmonks API key');
        return null;
      }
      
      console.log('  - Fetching from Sportmonks V3...');
      const response = await axios.get(`${this.sportmonksUrl}/livescores`, {
        params: {
          api_token: this.sportmonksKey,
          include: 'participants;league'
        },
        timeout: 5000
      });
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        console.log(`  - Found ${response.data.data.length} live matches from Sportmonks`);
        
        const formatted = {
          data: response.data.data.map(match => ({
            id: match.id,
            sport: 'soccer',
            league: match.league?.name || 'Unknown League',
            homeTeam: { 
              name: match.participants?.[0]?.name || 'Home',
              logo: null
            },
            awayTeam: { 
              name: match.participants?.[1]?.name || 'Away',
              logo: null
            },
            score: {
              home: match.scores?.home || 0,
              away: match.scores?.away || 0
            },
            status: this.mapSportmonksStatus(match.state?.name || match.status),
            minute: match.minute || 0,
            startsAt: match.starts_at || null,
            odds: {
              home: 2.00,
              draw: 3.40,
              away: 3.20
            }
          }))
        };
        
        return formatted;
      } else {
        console.log('  - No live matches currently from Sportmonks');
        return null;
      }
    } catch (error) {
      console.error('  - Sportmonks live error:', error.message);
      throw error; // Throw to be caught by parent
    }
  }

  async getSportmonksFixtures(date = 'today') {
    try {
      if (!this.sportmonksKey) return null;
      
      // Format date for Sportmonks
      let dateStr;
      if (date === 'today') {
        dateStr = new Date().toISOString().split('T')[0];
      } else if (date === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateStr = tomorrow.toISOString().split('T')[0];
      } else {
        dateStr = date;
      }
      
      console.log(`  - Fetching Sportmonks fixtures for ${dateStr}...`);
      const response = await axios.get(`${this.sportmonksUrl}/fixtures/date/${dateStr}`, {
        params: {
          api_token: this.sportmonksKey,
          include: 'participants;league'
        },
        timeout: 5000
      });
      
      if (response.data && response.data.data) {
        console.log(`  - Found ${response.data.data.length} fixtures from Sportmonks`);
        
        const formatted = {
          data: response.data.data.map(match => ({
            id: match.id,
            sport: 'soccer',
            league: match.league?.name || 'Unknown League',
            homeTeam: { 
              name: match.participants?.[0]?.name || 'Home',
              logo: null
            },
            awayTeam: { 
              name: match.participants?.[1]?.name || 'Away',
              logo: null
            },
            startsAt: match.starts_at || null,
            status: match.state?.name || 'SCHEDULED',
            odds: {
              home: 2.00,
              draw: 3.40,
              away: 3.20
            }
          }))
        };
        
        return formatted;
      }
      
      return null;
    } catch (error) {
      console.error('  - Sportmonks fixtures error:', error.message);
      throw error; // Throw to be caught by parent
    }
  }

  mapSportmonksStatus(status) {
    if (!status) return 'SCHEDULED';
    
    const statusMap = {
      'NS': 'SCHEDULED',
      'LIVE': 'LIVE',
      'HT': 'HALFTIME',
      'FT': 'FINISHED',
      'ET': 'EXTRA_TIME',
      'PEN_LIVE': 'PENALTIES',
      'FT_PEN': 'FINISHED',
      'CANC': 'CANCELLED',
      'POSTP': 'POSTPONED',
      'ABAN': 'ABANDONED',
      'SUSP': 'SUSPENDED',
      'notstarted': 'SCHEDULED',
      'inprogress': 'LIVE',
      'halftime': 'HALFTIME',
      'fulltime': 'FINISHED'
    };
    
    return statusMap[status] || 'SCHEDULED';
  }

  // ============ ODDS-API METHODS ============

  async getOddsApiLive(sport) {
    try {
      if (!this.oddsApiKey) return null;
      
      // Map your sport names to Odds-API sport keys
      const sportMap = {
        'football': 'americanfootball_nfl',
        'soccer': 'soccer_epl',
        'basketball': 'basketball_nba',
        'baseball': 'baseball_mlb',
        'hockey': 'icehockey_nhl',
        'tennis': 'tennis_atp',
        'mma': 'mma_mixed_martial_arts',
        'boxing': 'boxing_boxing'
      };
      
      const apiSport = sportMap[sport] || sport;
      
      console.log(`  - Fetching from Odds-API for ${apiSport}...`);
      
      const response = await axios.get(`${this.oddsApiUrl}/odds`, {
        params: {
          apiKey: this.oddsApiKey,
          sport: apiSport,
          regions: 'us,uk,eu',
          markets: 'h2h',
          oddsFormat: 'decimal'
        },
        timeout: 5000
      });
      
      if (response.data && response.data.length > 0) {
        console.log(`  - Found ${response.data.length} events from Odds-API`);
        
        const formatted = {
          data: response.data.map(event => ({
            id: event.id,
            sport: sport,
            league: event.sport_title || 'Unknown',
            homeTeam: { name: event.home_team },
            awayTeam: { name: event.away_team },
            startsAt: event.commence_time,
            odds: this.formatOdds(event.bookmakers)
          }))
        };
        
        return formatted;
      }
      
      return null;
    } catch (error) {
      console.error('  - Odds-API error:', error.message);
      throw error; // Throw to be caught by parent
    }
  }

  async getOddsApiUpcoming(sport, date) {
    try {
      if (!this.oddsApiKey) return null;
      
      const sportMap = {
        'football': 'americanfootball_nfl',
        'soccer': 'soccer_epl',
        'basketball': 'basketball_nba',
        'baseball': 'baseball_mlb',
        'hockey': 'icehockey_nhl',
        'tennis': 'tennis_atp',
        'mma': 'mma_mixed_martial_arts',
        'boxing': 'boxing_boxing'
      };
      
      const apiSport = sportMap[sport] || sport;
      
      const response = await axios.get(`${this.oddsApiUrl}/odds`, {
        params: {
          apiKey: this.oddsApiKey,
          sport: apiSport,
          regions: 'us,uk,eu',
          markets: 'h2h',
          oddsFormat: 'decimal'
        },
        timeout: 5000
      });
      
      if (response.data && response.data.length > 0) {
        const formatted = {
          data: response.data.map(event => ({
            id: event.id,
            sport: sport,
            league: event.sport_title,
            homeTeam: { name: event.home_team },
            awayTeam: { name: event.away_team },
            startsAt: event.commence_time,
            odds: this.formatOdds(event.bookmakers)
          }))
        };
        
        return formatted;
      }
      
      return null;
    } catch (error) {
      console.error('  - Odds-API upcoming error:', error.message);
      throw error; // Throw to be caught by parent
    }
  }

  async getOddsApiScores(sport) {
    // Odds-API doesn't have live scores endpoint, so just return null
    return null;
  }

  async getOddsApiSearch(query, sport) {
    // Odds-API doesn't have search endpoint
    return null;
  }

  formatOdds(bookmakers) {
    try {
      if (bookmakers && bookmakers[0] && bookmakers[0].markets && bookmakers[0].markets[0]) {
        const outcomes = bookmakers[0].markets[0].outcomes;
        const homeTeam = outcomes.find(o => o.name === 'home_team' || o.name === 'Home')?.price || 2.00;
        const awayTeam = outcomes.find(o => o.name === 'away_team' || o.name === 'Away')?.price || 3.20;
        const draw = outcomes.find(o => o.name === 'Draw')?.price || 3.40;
        
        return {
          home: homeTeam,
          draw: draw,
          away: awayTeam
        };
      }
    } catch (e) {
      // If formatting fails, return default odds
    }
    
    return { home: 2.00, draw: 3.40, away: 3.20 };
  }

  // ============ MOCK DATA METHODS (FALLBACK ONLY) ============

  getMockLiveEvents(sport) {
    console.log('📋 Returning mock live events (FALLBACK)');
    const sportKey = sport === 'football' ? 'football' : sport;
    const matches = mockMatches[sportKey] || mockMatches.soccer;
    return {
      data: matches.filter(m => m.status.includes('LIVE') || m.status.includes('FIRST_HALF')).slice(0, 5)
    };
  }

  getMockUpcomingEvents(sport) {
    console.log('📋 Returning mock upcoming events (FALLBACK)');
    const sportKey = sport === 'football' ? 'football' : sport;
    const matches = mockMatches[sportKey] || mockMatches.soccer;
    return {
      data: matches.filter(m => m.status === 'SCHEDULED').slice(0, 5)
    };
  }

  getMockLiveScores(sport) {
    console.log('📋 Returning mock live scores (FALLBACK)');
    const sportKey = sport === 'football' ? 'football' : sport;
    const matches = mockMatches[sportKey] || mockMatches.soccer;
    const liveMatches = matches.filter(m => m.status.includes('LIVE') || m.status.includes('FIRST_HALF'));
    
    return {
      data: liveMatches.map(m => ({
        id: m.id,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        score: typeof m.score === 'object' ? `${m.score.home}-${m.score.away}` : m.score,
        status: m.status,
        minute: m.minute || 0
      }))
    };
  }

  getMockSearchResults(query, sport) {
    console.log('📋 Returning mock search results (FALLBACK)');
    const results = mockMatches.searchMatches(query, sport);
    return {
      data: results.slice(0, 10),
      total: results.length
    };
  }
}

module.exports = new ExternalOddsService();