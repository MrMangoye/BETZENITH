// server/services/DataFeedService.js
const axios = require('axios');
const Match = require('../models/Match');
const mockMatches = require('../data/mockMatches');

class DataFeedService {
  constructor() {
    this.sportmonksBase = 'https://api.sportmonks.com/v3/football';
    this.oddsApiBase = 'https://api.the-odds-api.com/v4';
    this.io = null;
    this.updateInterval = null;
    
    this.freeLeagues = [
      { id: 371, name: 'Scottish Premiership' },
      { id: 82, name: 'Danish Superliga' }
    ];
  }

  setSocketIO(io) {
    this.io = io;
    console.log('✅ Socket.io connected to DataFeedService');
  }

  async fetchTodaysFixtures() {
    try {
      let allFixtures = [];
      
      for (const league of this.freeLeagues) {
        try {
          const response = await axios.get(
            `${this.sportmonksBase}/fixtures`, {
              params: {
                api_token: process.env.SPORTMONKS_KEY,
                league_id: league.id,
                date: this.getTodaysDate(),
                include: 'participants',
                per_page: 15
              },
              timeout: 5000
            }
          );
          if (response.data?.data) {
            allFixtures = [...allFixtures, ...response.data.data];
          }
        } catch (error) {
          // Silently fail - use mock data
        }
      }
      
      return allFixtures.slice(0, 20);
    } catch (error) {
      return [];
    }
  }

  async fetchLiveMatches() {
    try {
      const fixtures = await this.fetchTodaysFixtures();
      const liveMatches = fixtures.filter(f => f.state_id === 5);
      return liveMatches.slice(0, 10);
    } catch (error) {
      return [];
    }
  }

  async fetchLiveOdds() {
    try {
      const response = await axios.get(
        `${this.oddsApiBase}/sports/upcoming/odds`, {
          params: {
            apiKey: process.env.ODDS_API_KEY,
            regions: 'uk',
            markets: 'h2h',
            oddsFormat: 'decimal'
          },
          timeout: 5000
        }
      );
      return response.data || [];
    } catch (error) {
      return [];
    }
  }

  async processLiveMatches() {
    try {
      const liveMatches = await this.fetchLiveMatches();
      for (const apiMatch of liveMatches) {
        await this.updateMatchFromAPI(apiMatch);
      }
    } catch (error) {
      // Silently fail
    }
  }

  async updateMatchFromAPI(apiMatch) {
    try {
      let match = await Match.findOne({ externalId: apiMatch.id.toString() });
      if (!match) return;
      
      match.status = this.mapV3Status(apiMatch);
      match.minute = apiMatch.time?.minute || 0;
      match.score = {
        home: this.getHomeScore(apiMatch.scores?.data || []),
        away: this.getAwayScore(apiMatch.scores?.data || [])
      };
      await match.save();
      
      if (this.io) {
        this.io.to(`match-${match._id}`).emit('match-updated', match);
      }
    } catch (error) {
      // Silently fail
    }
  }

  getHomeScore(scores) {
    const homeScore = scores.find(s => s?.participant?.data?.meta?.location === 'home');
    return homeScore?.goals || 0;
  }

  getAwayScore(scores) {
    const awayScore = scores.find(s => s?.participant?.data?.meta?.location === 'away');
    return awayScore?.goals || 0;
  }

  mapV3Status(match) {
    const stateId = match.state_id;
    const statusMap = {
      1: 'SCHEDULED', 2: 'SCHEDULED', 3: 'SCHEDULED', 4: 'SCHEDULED',
      5: 'LIVE', 6: 'HALFTIME', 7: 'LIVE', 8: 'LIVE',
      9: 'FINISHED', 10: 'FINISHED', 11: 'FINISHED'
    };
    return statusMap[stateId] || 'SCHEDULED';
  }

  getTodaysDate() {
    return new Date().toISOString().split('T')[0];
  }

  getAbbreviation(teamName) {
    if (!teamName) return 'TEA';
    return teamName.substring(0, 3).toUpperCase();
  }

  generateDefaultMarkets() {
    return [
      { name: '1', odds: 2.10, isActive: true, volume: 0, betsCount: 0 },
      { name: 'X', odds: 3.40, isActive: true, volume: 0, betsCount: 0 },
      { name: '2', odds: 2.10, isActive: true, volume: 0, betsCount: 0 },
      { name: 'Over 2.5', odds: 1.95, isActive: true, volume: 0, betsCount: 0 }
    ];
  }
}

module.exports = new DataFeedService();