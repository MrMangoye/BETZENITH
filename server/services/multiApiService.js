// server/services/multiApiService.js
const axios = require('axios');

class MultiApiService {
  constructor() {
    // Sportmonks API (great for football/soccer)
    this.sportmonksKey = process.env.SPORTMONKS_KEY;
    this.sportmonksUrl = 'https://soccer.sportmonks.com/api/v2.0';
    
    // Odds-API (for odds across multiple sports)
    this.oddsApiKey = process.env.ODDS_API_KEY;
    this.oddsApiUrl = 'https://api.odds-api.io/v1';
    
    console.log('🔧 MultiApiService initialized');
    console.log('  - Sportmonks Key:', !!this.sportmonksKey);
    console.log('  - Odds-API Key:', !!this.oddsApiKey);
  }

  // ============ SPORTMONKS METHODS (Football/Soccer) ============
  
  async getSportmonksLiveScores() {
    try {
      if (!this.sportmonksKey) return null;
      
      const response = await axios.get(`${this.sportmonksUrl}/livescores`, {
        params: {
          api_token: this.sportmonksKey,
          include: 'localTeam,visitorTeam,league,events'
        },
        timeout: 5000
      });
      
      return this.formatSportmonksData(response.data);
    } catch (error) {
      console.error('Sportmonks live scores error:', error.message);
      return null;
    }
  }

  async getSportmonksFixtures(date = 'today') {
    try {
      if (!this.sportmonksKey) return null;
      
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
      
      const response = await axios.get(`${this.sportmonksUrl}/fixtures/date/${dateStr}`, {
        params: {
          api_token: this.sportmonksKey,
          include: 'localTeam,visitorTeam,league'
        },
        timeout: 5000
      });
      
      return this.formatSportmonksData(response.data);
    } catch (error) {
      console.error('Sportmonks fixtures error:', error.message);
      return null;
    }
  }

  // ============ ODDS-API METHODS ============

  async getOddsApiLive(sport = 'football') {
    try {
      if (!this.oddsApiKey) return null;
      
      const response = await axios.get(`${this.oddsApiUrl}/live`, {
        params: {
          apiKey: this.oddsApiKey,
          sport: sport
        },
        timeout: 5000
      });
      
      return this.formatOddsApiData(response.data);
    } catch (error) {
      console.error('Odds-API live error:', error.message);
      return null;
    }
  }

  async getOddsApiUpcoming(sport = 'football', date = 'today') {
    try {
      if (!this.oddsApiKey) return null;
      
      const response = await axios.get(`${this.oddsApiUrl}/events`, {
        params: {
          apiKey: this.oddsApiKey,
          sport: sport,
          date: date
        },
        timeout: 5000
      });
      
      return this.formatOddsApiData(response.data);
    } catch (error) {
      console.error('Odds-API upcoming error:', error.message);
      return null;
    }
  }

  async getOddsApiScores(sport = 'football') {
    try {
      if (!this.oddsApiKey) return null;
      
      const response = await axios.get(`${this.oddsApiUrl}/scores/live`, {
        params: {
          apiKey: this.oddsApiKey,
          sport: sport
        },
        timeout: 5000
      });
      
      return this.formatOddsApiData(response.data);
    } catch (error) {
      console.error('Odds-API scores error:', error.message);
      return null;
    }
  }

  // ============ FORMATTERS ============

  formatSportmonksData(data) {
    if (!data || !data.data) return { data: [] };
    
    const formatted = data.data.map(match => ({
      id: match.id,
      sport: 'soccer',
      league: match.league?.name || 'Unknown League',
      homeTeam: {
        name: match.localTeam?.name || 'Home',
        logo: match.localTeam?.logo_path || null
      },
      awayTeam: {
        name: match.visitorTeam?.name || 'Away',
        logo: match.visitorTeam?.logo_path || null
      },
      score: {
        home: match.scores?.localteam_score || 0,
        away: match.scores?.visitorteam_score || 0
      },
      status: this.mapSportmonksStatus(match.time?.status),
      minute: match.time?.minute || 0,
      startsAt: match.time?.starting_at?.date_time || null,
      odds: {
        home: 2.00, // Sportmonks doesn't provide odds, so we'll use defaults
        draw: 3.40,
        away: 3.20
      }
    }));
    
    return { data: formatted };
  }

  formatOddsApiData(data) {
    if (!data) return { data: [] };
    return { data: data.data || data || [] };
  }

  mapSportmonksStatus(status) {
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
      'SUSP': 'SUSPENDED'
    };
    return statusMap[status] || 'SCHEDULED';
  }

  // ============ COMBINED METHODS ============

  async getLiveEvents(sport = 'football') {
    // For soccer, try Sportmonks first (better live data)
    if (sport === 'soccer' || sport === 'football') {
      const sportmonksData = await this.getSportmonksLiveScores();
      if (sportmonksData) return sportmonksData;
    }
    
    // Fallback to Odds-API
    const oddsApiData = await this.getOddsApiLive(sport);
    if (oddsApiData) return oddsApiData;
    
    // If both fail, return mock data
    return this.getMockLiveEvents(sport);
  }

  async getUpcomingEvents(sport = 'football', date = 'today') {
    // For soccer, try Sportmonks first
    if (sport === 'soccer' || sport === 'football') {
      const sportmonksData = await this.getSportmonksFixtures(date);
      if (sportmonksData) return sportmonksData;
    }
    
    // Fallback to Odds-API
    const oddsApiData = await this.getOddsApiUpcoming(sport, date);
    if (oddsApiData) return oddsApiData;
    
    // If both fail, return mock data
    return this.getMockUpcomingEvents(sport);
  }

  async getLiveScores(sport = 'football') {
    // For soccer, try Sportmonks first
    if (sport === 'soccer' || sport === 'football') {
      const sportmonksData = await this.getSportmonksLiveScores();
      if (sportmonksData) return sportmonksData;
    }
    
    // Fallback to Odds-API
    const oddsApiData = await this.getOddsApiScores(sport);
    if (oddsApiData) return oddsApiData;
    
    // If both fail, return mock data
    return this.getMockLiveScores(sport);
  }

  // ============ MOCK DATA ============

  getMockLiveEvents(sport) {
    return {
      data: [
        {
          id: 'live-1',
          sport: sport,
          league: 'Premier League',
          homeTeam: { name: 'Manchester United' },
          awayTeam: { name: 'Liverpool' },
          score: { home: 1, away: 1 },
          status: 'LIVE',
          minute: 67,
          odds: { home: 2.10, draw: 3.40, away: 3.20 }
        }
      ]
    };
  }

  getMockUpcomingEvents(sport) {
    return {
      data: [
        {
          id: 'upcoming-1',
          sport: sport,
          league: 'Champions League',
          homeTeam: { name: 'Bayern Munich' },
          awayTeam: { name: 'PSG' },
          startsAt: new Date(Date.now() + 86400000).toISOString(),
          odds: { home: 1.85, draw: 3.60, away: 4.20 }
        }
      ]
    };
  }

  getMockLiveScores(sport) {
    return {
      data: [
        {
          id: 'score-1',
          homeTeam: 'Arsenal',
          awayTeam: 'Chelsea',
          score: '2-1',
          status: 'LIVE',
          minute: 78
        }
      ]
    };
  }
}

module.exports = new MultiApiService();