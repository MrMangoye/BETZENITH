const mongoose = require('mongoose');
const Match = require('../models/Match');
const axios = require('axios');

class AIMatchService {
  constructor() {
    this.updateInterval = null;
    this.isRunning = false;
  }

  // Start the AI match update service
  start() {
    if (this.isRunning) return;
    
    console.log('🤖 AI Match Service Started');
    
    // Update matches every 30 seconds
    this.updateInterval = setInterval(async () => {
      await this.updateAllMatches();
    }, 30000);
    
    this.isRunning = true;
  }

  // Stop the service
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
    console.log('🤖 AI Match Service Stopped');
  }

  // Main update function
  async updateAllMatches() {
    try {
      const now = new Date();
      
      // Update live matches
      await this.updateLiveMatches();
      
      // Update upcoming matches (scheduled for next 7 days)
      await this.updateUpcomingMatches();
      
      // Archive finished matches
      await this.archiveFinishedMatches();
      
      // Generate AI predictions for all active matches
      await this.generateAIPredictions();
      
      console.log('✅ AI Match Service: All matches updated');
    } catch (error) {
      console.error('❌ AI Match Service Error:', error.message);
    }
  }

  // Update live matches
  async updateLiveMatches() {
    const liveMatches = await Match.find({
      status: { $in: ['LIVE', 'FIRST_HALF', 'SECOND_HALF', 'HALFTIME'] }
    });
    
    for (const match of liveMatches) {
      // Update match progress
      await this.updateMatchProgress(match);
      
      // Update odds based on match events
      await this.updateDynamicOdds(match);
      
      // Check if match should be finished
      if (this.shouldFinishMatch(match)) {
        match.status = 'FINISHED';
        match.result = this.determineResult(match);
        match.result.isSettled = true;
        match.result.settledAt = new Date();
        await match.save();
        
        // Emit match finished event
        const io = match.$app?.get('io');
        if (io) {
          io.emit('match-finished', {
            matchId: match._id,
            result: match.result
          });
        }
      } else {
        await match.save();
      }
    }
  }

  // Update upcoming matches (scheduled matches)
  async updateUpcomingMatches() {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Find matches that are scheduled but should be started
    const scheduledMatches = await Match.find({
      status: 'SCHEDULED',
      startsAt: { $lte: now }
    });
    
    for (const match of scheduledMatches) {
      // Start the match
      match.status = 'LIVE';
      match.minute = 0;
      match.score = { home: 0, away: 0 };
      await match.save();
      
      // Emit match started event
      const io = match.$app?.get('io');
      if (io) {
        io.emit('match-started', {
          matchId: match._id,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam
        });
      }
    }
    
    // Check if we need more upcoming matches
    const upcomingCount = await Match.countDocuments({
      status: 'SCHEDULED',
      startsAt: { $gt: now }
    });
    
    if (upcomingCount < 20) {
      await this.generateUpcomingMatches(10);
    }
  }

  // Archive finished matches
  async archiveFinishedMatches() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const oldFinishedMatches = await Match.find({
      status: 'FINISHED',
      updatedAt: { $lt: twentyFourHoursAgo }
    });
    
    // Archive or delete old matches
    for (const match of oldFinishedMatches) {
      // Keep for history but mark as archived
      match.isArchived = true;
      await match.save();
    }
  }

  // Update match progress (minute, score, etc.)
  async updateMatchProgress(match) {
    // Increase minute based on time passed
    const timeSinceLastUpdate = (Date.now() - (match.lastUpdated || match.createdAt)) / 1000;
    const minuteIncrement = Math.floor(timeSinceLastUpdate / 60);
    
    if (minuteIncrement > 0) {
      match.minute = Math.min(match.minute + minuteIncrement, 90);
      match.lastUpdated = new Date();
      
      // AI-based score update (30% chance of goal every 10 minutes)
      if (Math.random() < 0.3 && match.minute % 10 < 2) {
        const isHomeGoal = Math.random() < 0.55;
        if (isHomeGoal) {
          match.score.home += 1;
        } else {
          match.score.away += 1;
        }
        
        // Add event
        match.events = match.events || [];
        match.events.push({
          type: 'GOAL',
          minute: match.minute,
          team: isHomeGoal ? 'home' : 'away',
          player: this.generateRandomPlayer(isHomeGoal ? match.homeTeam.name : match.awayTeam.name),
          homeScore: match.score.home,
          awayScore: match.score.away
        });
      }
    }
  }

  // Update odds dynamically based on match events
  async updateDynamicOdds(match) {
    const oddsChanged = false;
    
    for (let i = 0; i < match.markets.length; i++) {
      const market = match.markets[i];
      let newOdds = market.odds;
      
      // AI odds adjustment based on score
      if (match.score.home > match.score.away) {
        if (market.name === '1') newOdds *= 0.92;
        if (market.name === '2') newOdds *= 1.12;
        if (market.name === 'X') newOdds *= 1.08;
      } else if (match.score.away > match.score.home) {
        if (market.name === '2') newOdds *= 0.92;
        if (market.name === '1') newOdds *= 1.12;
        if (market.name === 'X') newOdds *= 1.08;
      }
      
      // Time factor - odds change more in last 15 minutes
      if (match.minute > 75) {
        newOdds *= 0.98;
      }
      
      newOdds = Math.max(1.01, Math.min(1000, newOdds));
      newOdds = Number(newOdds.toFixed(2));
      
      if (Math.abs(newOdds - market.odds) > 0.01) {
        match.markets[i].odds = newOdds;
        match.markets[i].previousOdds = market.odds;
      }
    }
    
    if (oddsChanged) {
      // Emit odds update
      const io = match.$app?.get('io');
      if (io) {
        io.to(`match-${match._id}`).emit('odds-updated', {
          matchId: match._id,
          markets: match.markets
        });
      }
    }
  }

  // Generate upcoming matches using AI
  async generateUpcomingMatches(count = 10) {
    const leagues = [
      'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1',
      'UEFA Champions League', 'EPL', 'NBA', 'NFL', 'MLB', 'NHL'
    ];
    
    const teams = {
      'Premier League': ['Arsenal', 'Liverpool', 'Man City', 'Chelsea', 'Man United', 'Tottenham'],
      'La Liga': ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla'],
      'Bundesliga': ['Bayern Munich', 'Borussia Dortmund', 'RB Leipzig'],
      'Serie A': ['Juventus', 'Inter Milan', 'AC Milan', 'Napoli'],
      'Ligue 1': ['PSG', 'Marseille', 'Monaco', 'Lyon'],
      'NBA': ['Lakers', 'Warriors', 'Celtics', 'Bucks', 'Nets'],
      'NFL': ['Chiefs', '49ers', 'Bills', 'Eagles', 'Cowboys'],
      'MLB': ['Yankees', 'Dodgers', 'Red Sox', 'Astros'],
      'NHL': ['Maple Leafs', 'Canadiens', 'Bruins', 'Avalanche']
    };
    
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const randomLeague = leagues[Math.floor(Math.random() * leagues.length)];
      const leagueTeams = teams[randomLeague] || teams['Premier League'];
      
      const homeTeam = leagueTeams[Math.floor(Math.random() * leagueTeams.length)];
      let awayTeam = leagueTeams[Math.floor(Math.random() * leagueTeams.length)];
      while (awayTeam === homeTeam) {
        awayTeam = leagueTeams[Math.floor(Math.random() * leagueTeams.length)];
      }
      
      // Random date in next 1-7 days
      const daysFromNow = Math.floor(Math.random() * 7) + 1;
      const hoursFromNow = Math.floor(Math.random() * 24);
      const minutesFromNow = Math.floor(Math.random() * 60);
      
      const startsAt = new Date(now);
      startsAt.setDate(now.getDate() + daysFromNow);
      startsAt.setHours(hoursFromNow, minutesFromNow, 0);
      
      // AI-generated odds
      const homeOdds = Number((1.5 + Math.random() * 2).toFixed(2));
      const drawOdds = Number((2.8 + Math.random() * 1.5).toFixed(2));
      const awayOdds = Number((1.5 + Math.random() * 2).toFixed(2));
      
      const existingMatch = await Match.findOne({
        homeTeam: { name: homeTeam },
        awayTeam: { name: awayTeam },
        startsAt: { $gte: new Date() }
      });
      
      if (!existingMatch) {
        await Match.create({
          league: randomLeague,
          homeTeam: { name: homeTeam, abbreviation: homeTeam.substring(0, 3).toUpperCase() },
          awayTeam: { name: awayTeam, abbreviation: awayTeam.substring(0, 3).toUpperCase() },
          startsAt: startsAt,
          date: startsAt,
          time: startsAt.toLocaleTimeString(),
          status: 'SCHEDULED',
          score: { home: 0, away: 0 },
          minute: 0,
          markets: [
            { name: '1', odds: homeOdds, isActive: true },
            { name: 'X', odds: drawOdds, isActive: true },
            { name: '2', odds: awayOdds, isActive: true },
            { name: 'Over 2.5', odds: 1.95, isActive: true },
            { name: 'Under 2.5', odds: 1.95, isActive: true },
            { name: 'BTTS', odds: 1.90, isActive: true }
          ],
          aiPrediction: {
            predictedWinner: homeOdds < awayOdds ? 'HOME' : awayOdds < homeOdds ? 'AWAY' : 'DRAW',
            confidence: Math.floor(Math.random() * 40 + 60),
            probability: {
              home: ((1/homeOdds) * 100).toFixed(1),
              draw: ((1/drawOdds) * 100).toFixed(1),
              away: ((1/awayOdds) * 100).toFixed(1)
            },
            insight: this.generateMatchInsight(homeTeam, awayTeam, homeOdds, awayOdds)
          }
        });
      }
    }
  }

  // Generate AI predictions for all active matches
  async generateAIPredictions() {
    const matches = await Match.find({
      status: { $in: ['SCHEDULED', 'LIVE'] }
    });
    
    for (const match of matches) {
      const prediction = await this.calculateAIPrediction(match);
      match.aiPrediction = prediction;
      await match.save();
    }
  }

  // Calculate AI prediction for a match
  async calculateAIPrediction(match) {
    const homeOdds = match.markets.find(m => m.name === '1')?.odds || 2.0;
    const drawOdds = match.markets.find(m => m.name === 'X')?.odds || 3.4;
    const awayOdds = match.markets.find(m => m.name === '2')?.odds || 2.0;
    
    const homeProb = (1 / homeOdds) * 100;
    const drawProb = (1 / drawOdds) * 100;
    const awayProb = (1 / awayOdds) * 100;
    
    // Normalize probabilities
    const total = homeProb + drawProb + awayProb;
    const normalizedHome = (homeProb / total) * 100;
    const normalizedDraw = (drawProb / total) * 100;
    const normalizedAway = (awayProb / total) * 100;
    
    let predictedWinner = 'DRAW';
    let confidence = 0;
    
    if (normalizedHome > normalizedAway && normalizedHome > normalizedDraw) {
      predictedWinner = 'HOME';
      confidence = normalizedHome;
    } else if (normalizedAway > normalizedHome && normalizedAway > normalizedDraw) {
      predictedWinner = 'AWAY';
      confidence = normalizedAway;
    } else {
      predictedWinner = 'DRAW';
      confidence = normalizedDraw;
    }
    
    return {
      predictedWinner,
      confidence: Math.floor(confidence),
      probability: {
        home: normalizedHome.toFixed(1),
        draw: normalizedDraw.toFixed(1),
        away: normalizedAway.toFixed(1)
      },
      insight: this.generateMatchInsight(match.homeTeam.name, match.awayTeam.name, homeOdds, awayOdds),
      recommendedBet: this.getRecommendedBet(normalizedHome, normalizedDraw, normalizedAway, homeOdds, awayOdds),
      riskLevel: this.calculateRiskLevel(homeOdds, awayOdds)
    };
  }

  // Generate match insight
  generateMatchInsight(homeTeam, awayTeam, homeOdds, awayOdds) {
    if (homeOdds < awayOdds) {
      return `${homeTeam} are favored to win with odds of ${homeOdds}. They have strong home advantage.`;
    } else if (awayOdds < homeOdds) {
      return `${awayTeam} are favored to win with odds of ${awayOdds}. They have been in good form.`;
    } else {
      return `This is a closely contested match. Both teams have similar winning probabilities.`;
    }
  }

  // Get recommended bet
  getRecommendedBet(homeProb, drawProb, awayProb, homeOdds, awayOdds) {
    if (homeProb > 40 && homeOdds > 1.8) {
      return { type: 'HOME WIN', reason: 'Good value on home team at current odds' };
    } else if (awayProb > 40 && awayOdds > 1.8) {
      return { type: 'AWAY WIN', reason: 'Away team offers good value' };
    } else if (drawProb > 30) {
      return { type: 'DRAW', reason: 'Draw is a strong possibility in this matchup' };
    }
    return { type: 'OVER 2.5', reason: 'Both teams capable of scoring' };
  }

  // Calculate risk level
  calculateRiskLevel(homeOdds, awayOdds) {
    const diff = Math.abs(homeOdds - awayOdds);
    if (diff < 0.3) return 'High';
    if (diff < 0.8) return 'Medium';
    return 'Low';
  }

  // Determine if match should be finished
  shouldFinishMatch(match) {
    return match.minute >= 90 || (match.minute >= 45 && match.status === 'HALFTIME' && Math.random() < 0.05);
  }

  // Determine match result
  determineResult(match) {
    if (match.score.home > match.score.away) return { winner: 'HOME', score: match.score };
    if (match.score.away > match.score.home) return { winner: 'AWAY', score: match.score };
    return { winner: 'DRAW', score: match.score };
  }

  // Generate random player name
  generateRandomPlayer(teamName) {
    const players = [
      'Player 1', 'Star Player', 'Captain', 'Striker', 'Midfielder',
      'Defender', 'Winger', 'Forward', 'Playmaker'
    ];
    return players[Math.floor(Math.random() * players.length)];
  }
}

module.exports = new AIMatchService();