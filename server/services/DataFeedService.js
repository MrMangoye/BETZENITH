const axios = require('axios');
const Match = require('../models/Match');

class DataFeedService {
  constructor() {
    this.sportmonksBase = 'https://api.sportmonks.com/v3/football';
    this.oddsApiBase = 'https://api.the-odds-api.com/v4';
    this.activeMatches = new Map();
    this.updateCallbacks = new Map();
    this.io = null; // Will be set when server is running
    
    // Scottish Premiership (371) and Danish Superliga (82)
    this.freeLeagues = [
      { id: 371, name: 'Scottish Premiership' },
      { id: 82, name: 'Danish Superliga' }
    ];
    
    this.freeLeagueIds = this.freeLeagues.map(l => l.id);
  }

  // Call this method to set Socket.io instance when server starts
  setSocketIO(io) {
    this.io = io;
    console.log('✅ Socket.io connected to DataFeedService');
  }

  // ============ SPORTMONKS INTEGRATION ============

  async fetchLiveMatches() {
    try {
      console.log('📡 Checking for live matches...');
      
      const fixtures = await this.fetchTodaysFixtures();
      const liveMatches = fixtures.filter(f => f.state_id === 5);
      
      if (liveMatches.length > 0) {
        console.log(`✅ Found ${liveMatches.length} live matches from fixtures`);
        return liveMatches;
      }
      
      console.log('No live matches at this time');
      return [];
      
    } catch (error) {
      console.error('❌ Error checking live matches:', error.message);
      return [];
    }
  }

  async fetchTodaysFixtures() {
    try {
      console.log('📡 Fetching today\'s fixtures...');
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
                per_page: 50
              }
            }
          );

          if (response.data?.data) {
            console.log(`📅 Found ${response.data.data.length} fixtures in ${league.name}`);
            allFixtures = [...allFixtures, ...response.data.data];
          }
        } catch (error) {
          console.error(`❌ Error fetching ${league.name} fixtures:`, error.message);
        }
      }

      return allFixtures;
    } catch (error) {
      console.error('❌ Error fetching fixtures:', error.message);
      return [];
    }
  }

  // ============ ODDS API INTEGRATION ============

  async fetchLiveOdds() {
    try {
      console.log('📊 Fetching live odds from Odds API...');
      
      const response = await axios.get(
        `${this.oddsApiBase}/sports/upcoming/odds`, {
          params: {
            apiKey: process.env.ODDS_API_KEY,
            regions: 'uk,eu',
            markets: 'h2h',
            oddsFormat: 'decimal',
            dateFormat: 'iso'
          },
          timeout: 15000 // Increased timeout
        }
      );

      console.log(`📊 Found ${response.data?.length || 0} odds events`);
      return response.data || [];
    } catch (error) {
      console.error('❌ Odds API error:', error.message);
      return [];
    }
  }

  // ============ PROCESS AND UPDATE MATCHES ============

  async processLiveMatches() {
    try {
      const liveMatches = await this.fetchLiveMatches();
      
      if (liveMatches.length > 0) {
        for (const apiMatch of liveMatches) {
          await this.updateMatchFromAPI(apiMatch);
        }
        console.log(`✅ Updated ${liveMatches.length} live matches`);
      } else {
        console.log('No live matches in free tier leagues at this time');
        
        const fixtures = await this.fetchTodaysFixtures();
        if (fixtures.length > 0) {
          console.log(`📅 Found ${fixtures.length} scheduled fixtures for today`);
          
          for (const fixture of fixtures) {
            await this.createMatchIfNotExists(fixture);
          }
        }
      }

      const oddsData = await this.fetchLiveOdds();
      await this.updateOddsFromAPI(oddsData);

    } catch (error) {
      console.error('❌ Error processing live matches:', error);
    }
  }

  async createMatchIfNotExists(apiMatch) {
    try {
      const exists = await Match.findOne({ externalId: apiMatch.id.toString() });
      if (!exists) {
        await this.createMatchFromAPI(apiMatch);
      }
    } catch (error) {
      console.error(`❌ Error creating match ${apiMatch.id}:`, error);
    }
  }

  async updateMatchFromAPI(apiMatch) {
    try {
      let match = await Match.findOne({ externalId: apiMatch.id.toString() });
      
      if (!match) {
        match = await this.createMatchFromAPI(apiMatch);
      }

      const updates = {
        status: this.mapV3Status(apiMatch),
        minute: apiMatch.time?.minute || 0,
        score: {
          home: this.getHomeScore(apiMatch.scores?.data || []),
          away: this.getAwayScore(apiMatch.scores?.data || [])
        },
        lastFeedUpdate: new Date()
      };

      if (apiMatch.league?.data) {
        updates.league = apiMatch.league.data.name;
      }

      if (apiMatch.statistics?.data) {
        updates.liveStats = this.parseV3Stats(apiMatch.statistics.data);
      }

      if (apiMatch.events?.data) {
        const newEvents = this.parseV3Events(apiMatch.events.data);
        if (newEvents.length > 0) {
          updates.events = [...(match.events || []), ...newEvents];
        }
      }

      const updatedMatch = await Match.findByIdAndUpdate(
        match._id,
        { $set: updates },
        { new: true }
      );

      this.broadcastMatchUpdate(updatedMatch);
      await this.updateOddsBasedOnMatch(updatedMatch);

    } catch (error) {
      console.error(`❌ Error updating match ${apiMatch.id}:`, error);
    }
  }

  async createMatchFromAPI(apiMatch) {
    let homeTeamName = 'Home Team';
    let awayTeamName = 'Away Team';
    let leagueName = apiMatch.league?.data?.name || 'Free Tier League';
    
    try {
      if (apiMatch.participants?.data && apiMatch.participants.data.length >= 2) {
        const participants = apiMatch.participants.data;
        
        if (participants[0]?.participant?.data?.name) {
          homeTeamName = participants[0].participant.data.name;
          
          if (participants[1]?.participant?.data?.name) {
            awayTeamName = participants[1].participant.data.name;
          } else if (participants[1]?.name) {
            awayTeamName = participants[1].name;
          }
        } else if (participants[0]?.name) {
          homeTeamName = participants[0].name;
          awayTeamName = participants[1]?.name || 'Away Team';
        }
        
        const homeParticipant = participants.find(p => p.meta?.location === 'home');
        const awayParticipant = participants.find(p => p.meta?.location === 'away');
        
        if (homeParticipant) {
          homeTeamName = homeParticipant.participant?.data?.name || homeParticipant.name || homeTeamName;
        }
        if (awayParticipant) {
          awayTeamName = awayParticipant.participant?.data?.name || awayParticipant.name || awayTeamName;
        }
      }
      
      if (homeTeamName === 'Home Team' && apiMatch.name) {
        const nameParts = apiMatch.name.split(' vs ');
        if (nameParts.length === 2) {
          homeTeamName = nameParts[0];
          awayTeamName = nameParts[1];
        }
      }
      
    } catch (e) {
      console.log('⚠️ Error extracting team names:', e.message);
    }
    
    const matchData = {
      externalId: apiMatch.id.toString(),
      league: leagueName,
      homeTeam: {
        name: homeTeamName,
        abbreviation: this.getAbbreviation(homeTeamName),
      },
      awayTeam: {
        name: awayTeamName,
        abbreviation: this.getAbbreviation(awayTeamName),
      },
      date: new Date(apiMatch.starting_at) || new Date(),
      time: new Date(apiMatch.starting_at).toLocaleTimeString() || '00:00',
      status: this.mapV3Status(apiMatch),
      minute: apiMatch.time?.minute || 0,
      markets: this.generateDefaultMarkets(),
      score: {
        home: this.getHomeScore(apiMatch.scores?.data || []),
        away: this.getAwayScore(apiMatch.scores?.data || [])
      },
      venue: 'Stadium',
      hasLiveStream: false
    };

    const match = await Match.create(matchData);
    console.log(`✅ Created new match: ${match.homeTeam.name} vs ${match.awayTeam.name} (${leagueName})`);
    return match;
  }

  // ============ V3 HELPER METHODS ============

  getHomeScore(scores) {
    const homeScore = scores.find(s => s?.participant?.data?.meta?.location === 'home');
    return homeScore?.goals || 0;
  }

  getAwayScore(scores) {
    const awayScore = scores.find(s => s?.participant?.data?.meta?.location === 'away');
    return awayScore?.goals || 0;
  }

  mapV3Status(match) {
    const stateId = match.state_id || match.state?.id;
    
    const statusMap = {
      1: 'SCHEDULED',
      2: 'SCHEDULED',
      3: 'SCHEDULED',
      4: 'SCHEDULED',
      5: 'LIVE',
      6: 'HALFTIME',
      7: 'LIVE',
      8: 'LIVE',
      9: 'FINISHED',
      10: 'FINISHED',
      11: 'FINISHED',
      12: 'POSTPONED',
      13: 'CANCELLED',
      14: 'ABANDONED'
    };
    return statusMap[stateId] || 'SCHEDULED';
  }

  parseV3Stats(statsData) {
    if (!statsData || !Array.isArray(statsData)) return {};

    const stats = {
      possession: { home: 50, away: 50 },
      shotsOnTarget: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      yellowCards: { home: 0, away: 0 },
      redCards: { home: 0, away: 0 }
    };

    statsData.forEach(statGroup => {
      statGroup.data?.forEach(stat => {
        if (stat.key === 'possession-stats' && stat.value) {
          stats.possession = { 
            home: parseInt(stat.value.home) || 50, 
            away: parseInt(stat.value.away) || 50 
          };
        } else if (stat.key === 'shots-on-target') {
          stats.shotsOnTarget = { 
            home: stat.value?.home || 0, 
            away: stat.value?.away || 0 
          };
        } else if (stat.key === 'corners') {
          stats.corners = { 
            home: stat.value?.home || 0, 
            away: stat.value?.away || 0 
          };
        } else if (stat.key === 'yellow-cards') {
          stats.yellowCards = { 
            home: stat.value?.home || 0, 
            away: stat.value?.away || 0 
          };
        } else if (stat.key === 'red-cards') {
          stats.redCards = { 
            home: stat.value?.home || 0, 
            away: stat.value?.away || 0 
          };
        }
      });
    });

    return stats;
  }

  parseV3Events(eventsData) {
    const events = [];

    eventsData.forEach(event => {
      if (event.type_id === 1) { // Goal
        events.push({
          type: 'GOAL',
          minute: event.minute,
          team: event.participant?.data?.meta?.location === 'home' ? 'home' : 'away',
          player: event.player?.data?.name || 'Unknown',
          homeScore: event.result?.home || 0,
          awayScore: event.result?.away || 0
        });
      } else if (event.type_id === 2) { // Yellow Card
        events.push({
          type: 'YELLOW_CARD',
          minute: event.minute,
          team: event.participant?.data?.meta?.location === 'home' ? 'home' : 'away',
          player: event.player?.data?.name || 'Unknown'
        });
      } else if (event.type_id === 3) { // Red Card
        events.push({
          type: 'RED_CARD',
          minute: event.minute,
          team: event.participant?.data?.meta?.location === 'home' ? 'home' : 'away',
          player: event.player?.data?.name || 'Unknown'
        });
      }
    });

    return events;
  }

  async updateOddsFromAPI(oddsData) {
    if (!oddsData || !Array.isArray(oddsData)) return;

    for (const apiOdds of oddsData) {
      try {
        const matches = await Match.find({
          date: {
            $gte: new Date(apiOdds.commence_time),
            $lt: new Date(new Date(apiOdds.commence_time).getTime() + 3*60*60*1000)
          }
        });

        let matchedMatch = null;
        for (const match of matches) {
          const homeMatch = match.homeTeam.name.toLowerCase().includes(apiOdds.home_team?.toLowerCase() || '') ||
                           apiOdds.home_team?.toLowerCase().includes(match.homeTeam.name.toLowerCase());
          const awayMatch = match.awayTeam.name.toLowerCase().includes(apiOdds.away_team?.toLowerCase() || '') ||
                           apiOdds.away_team?.toLowerCase().includes(match.awayTeam.name.toLowerCase());
          
          if (homeMatch && awayMatch) {
            matchedMatch = match;
            break;
          }
        }

        if (!matchedMatch || matchedMatch.status === 'FINISHED') continue;

        const bookmaker = apiOdds.bookmakers?.[0];
        if (!bookmaker) continue;

        for (const market of bookmaker.markets || []) {
          if (market.key === 'h2h' && market.outcomes) {
            for (const outcome of market.outcomes) {
              let marketIndex = -1;
              if (outcome.name === apiOdds.home_team) marketIndex = 0;
              else if (outcome.name === apiOdds.away_team) marketIndex = 2;
              else if (outcome.name === 'Draw') marketIndex = 1;

              if (marketIndex >= 0 && matchedMatch.markets[marketIndex]) {
                matchedMatch.markets[marketIndex].odds = Number(outcome.price.toFixed(2));
              }
            }
          }
        }

        await matchedMatch.save();
      } catch (error) {
        console.error('Error updating odds for match:', error.message);
      }
    }
  }

  // ============ HELPER METHODS ============

  getTodaysDate() {
    return new Date().toISOString().split('T')[0];
  }

  getAbbreviation(teamName) {
    if (!teamName || teamName === 'Home Team' || teamName === 'Away Team') return 'TEA';
    return teamName.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 3);
  }

  generateDefaultMarkets() {
    return [
      { name: '1', odds: 2.10, isActive: true, volume: 0, betsCount: 0 },
      { name: 'X', odds: 3.40, isActive: true, volume: 0, betsCount: 0 },
      { name: '2', odds: 2.10, isActive: true, volume: 0, betsCount: 0 },
      { name: 'Over 2.5', odds: 1.95, isActive: true, volume: 0, betsCount: 0 }
    ];
  }

  async updateOddsBasedOnMatch(match) {
    if (match.status !== 'LIVE') return;

    let oddsChanged = false;

    for (let i = 0; i < match.markets.length; i++) {
      const market = match.markets[i];
      let newOdds = market.odds;

      if (match.score.home > match.score.away) {
        if (market.name === '1') newOdds *= 0.95;
        if (market.name === '2') newOdds *= 1.08;
        if (market.name === 'X') newOdds *= 1.05;
      } else if (match.score.away > match.score.home) {
        if (market.name === '2') newOdds *= 0.95;
        if (market.name === '1') newOdds *= 1.08;
        if (market.name === 'X') newOdds *= 1.05;
      }

      if (match.minute > 75) newOdds *= 0.98;

      newOdds = Math.max(1.01, Math.min(1000, newOdds));
      newOdds = Number(newOdds.toFixed(2));

      if (Math.abs(newOdds - market.odds) > 0.01) {
        match.markets[i].odds = newOdds;
        oddsChanged = true;
      }
    }

    if (oddsChanged) {
      await match.save();
      
      // Only broadcast if Socket.io is available
      if (this.io) {
        for (let i = 0; i < match.markets.length; i++) {
          this.io.to(`match-${match._id}`).emit('odds-updated', {
            matchId: match._id,
            marketIndex: i,
            newOdds: match.markets[i].odds
          });
        }
      }
    }
  }

  broadcastMatchUpdate(match) {
    // Only broadcast if Socket.io is available
    if (!this.io) return;
    
    try {
      this.io.to(`match-${match._id}`).emit('match-updated', {
        matchId: match._id,
        status: match.status,
        score: match.score,
        minute: match.minute,
        stats: match.liveStats,
        events: match.events?.slice(-5)
      });

      if (match.status === 'LIVE') {
        this.io.emit('live-match-update', {
          matchId: match._id,
          homeTeam: match.homeTeam.abbreviation,
          awayTeam: match.awayTeam.abbreviation,
          score: match.score,
          minute: match.minute
        });
      }
    } catch (error) {
      // Silently fail - broadcasting is optional
    }
  }

  async fixUnknownTeamNames() {
    console.log('🔧 Fixing unknown team names in database...');
    
    try {
      const matches = await Match.find({ 
        $or: [
          { 'homeTeam.name': 'Home Team' },
          { 'homeTeam.name': 'Unknown' },
          { 'homeTeam.name': 'HOM' },
          { 'awayTeam.name': 'Away Team' },
          { 'awayTeam.name': 'Unknown' },
          { 'awayTeam.name': 'AWY' }
        ]
      });
      
      console.log(`Found ${matches.length} matches with unknown team names`);
      
      let fixed = 0;
      for (const match of matches) {
        try {
          const response = await axios.get(
            `${this.sportmonksBase}/fixtures/${match.externalId}`, {
              params: {
                api_token: process.env.SPORTMONKS_KEY,
                include: 'participants'
              },
              timeout: 5000
            }
          );
          
          if (response.data?.data) {
            const apiMatch = response.data.data;
            
            let homeTeamName = match.homeTeam.name;
            let awayTeamName = match.awayTeam.name;
            
            if (apiMatch.participants?.data && apiMatch.participants.data.length >= 2) {
              const participants = apiMatch.participants.data;
              
              if (participants[0]?.participant?.data?.name) {
                homeTeamName = participants[0].participant.data.name;
                
                if (participants[1]?.participant?.data?.name) {
                  awayTeamName = participants[1].participant.data.name;
                }
              }
              
              const homeParticipant = participants.find(p => p.meta?.location === 'home');
              const awayParticipant = participants.find(p => p.meta?.location === 'away');
              
              if (homeParticipant) {
                homeTeamName = homeParticipant.participant?.data?.name || homeParticipant.name || homeTeamName;
              }
              if (awayParticipant) {
                awayTeamName = awayParticipant.participant?.data?.name || awayParticipant.name || awayTeamName;
              }
            }
            
            if (homeTeamName !== match.homeTeam.name || awayTeamName !== match.awayTeam.name) {
              match.homeTeam.name = homeTeamName;
              match.awayTeam.name = awayTeamName;
              match.homeTeam.abbreviation = this.getAbbreviation(homeTeamName);
              match.awayTeam.abbreviation = this.getAbbreviation(awayTeamName);
              await match.save();
              fixed++;
              console.log(`✅ Fixed: ${match.homeTeam.name} vs ${match.awayTeam.name}`);
            }
          }
        } catch (error) {
          console.log(`⚠️ Could not fetch from API for match ${match._id}: ${error.message}`);
        }
      }
      
      console.log(`✅ Fixed ${fixed} matches with unknown team names`);
      return fixed;
      
    } catch (error) {
      console.error('❌ Error fixing team names:', error.message);
      return 0;
    }
  }
}

module.exports = new DataFeedService();