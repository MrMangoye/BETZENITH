// server/services/aiPredictionService.js
const User = require('../models/User');
const Match = require('../models/Match');
const Bet = require('../models/Bet');

class AIPredictionService {
  
  // Get AI prediction for a match (requires auth for personalized predictions)
  async getMatchPrediction(matchId, userId = null) {
    const match = await Match.findById(matchId).populate('homeTeam awayTeam');
    
    if (!match) return null;
    
    // Base prediction (public)
    const basePrediction = {
      matchId: match._id,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      homeWinProb: 35,
      drawProb: 30,
      awayWinProb: 35,
      confidence: 'Medium',
      insight: "Balanced matchup with both teams showing similar form"
    };
    
    // Personalized prediction (requires authentication)
    if (userId) {
      const user = await User.findById(userId);
      const userBets = await Bet.find({ user: userId, status: 'WON' }).limit(50);
      
      // Analyze user's betting patterns
      const userPreferences = this.analyzeUserPatterns(userBets);
      
      return {
        ...basePrediction,
        personalized: true,
        userInsight: `Based on your betting history, you've had success with ${userPreferences.favoriteMarket} bets.`,
        recommendedStake: this.calculateRecommendedStake(user.balance, basePrediction.confidence),
        similarWins: userPreferences.similarPatterns
      };
    }
    
    return basePrediction;
  }
  
  // Analyze user's betting patterns
  analyzeUserPatterns(userBets) {
    const marketCount = {};
    const leagueCount = {};
    
    userBets.forEach(bet => {
      const market = bet.selections[0]?.marketName || 'Unknown';
      const league = bet.match?.league || 'Unknown';
      marketCount[market] = (marketCount[market] || 0) + 1;
      leagueCount[league] = (leagueCount[league] || 0) + 1;
    });
    
    const favoriteMarket = Object.keys(marketCount).reduce((a, b) => 
      marketCount[a] > marketCount[b] ? a : b, Object.keys(marketCount)[0]);
    
    return {
      favoriteMarket,
      favoriteLeague: Object.keys(leagueCount)[0],
      similarPatterns: userBets.length > 0
    };
  }
  
  // Calculate recommended stake based on user balance and confidence
  calculateRecommendedStake(balance, confidence) {
    const maxStake = balance * 0.1; // Max 10% of balance
    const multiplier = confidence === 'High' ? 0.8 : confidence === 'Medium' ? 0.5 : 0.2;
    return Math.min(5000, Math.max(100, maxStake * multiplier));
  }
  
  // Get betting trends (public, but enhanced for authenticated users)
  async getBettingTrends(userId = null) {
    const trends = {
      mostBetTeams: await this.getMostBetTeams(),
      averageStake: await this.getAverageStake(),
      totalBetsToday: await this.getTotalBetsToday(),
      popularMarkets: await this.getPopularMarkets()
    };
    
    // Add personalized trends if authenticated
    if (userId) {
      const userStats = await this.getUserStats(userId);
      trends.personalized = {
        yourMostBetTeam: userStats.mostBetTeam,
        yourWinRate: userStats.winRate,
        yourAverageStake: userStats.averageStake,
        comparisonMessage: `You bet ${userStats.betCount} times this week. ${userStats.winRate > 50 ? 'Great win rate! 🔥' : 'Keep practicing! 💪'}`
      };
    }
    
    return trends;
  }
  
  async getMostBetTeams() {
    const bets = await Bet.aggregate([
      { $group: { _id: '$selections.match', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    const teams = [];
    for (const bet of bets) {
      const match = await Match.findById(bet._id);
      if (match) {
        teams.push({ name: match.homeTeam.name, betCount: bet.count });
      }
    }
    return teams.length ? teams : [{ name: 'Manchester City', betCount: 1250 }];
  }
  
  async getAverageStake() {
    const result = await Bet.aggregate([
      { $group: { _id: null, avgStake: { $avg: '$stake' } } }
    ]);
    return result[0]?.avgStake || 1250;
  }
  
  async getTotalBetsToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return await Bet.countDocuments({ createdAt: { $gte: today } });
  }
  
  async getPopularMarkets() {
    const result = await Bet.aggregate([
      { $unwind: '$selections' },
      { $group: { _id: '$selections.marketName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);
    return result.map(r => ({ name: r._id, count: r.count }));
  }
  
  async getUserStats(userId) {
    const bets = await Bet.find({ user: userId });
    const wonBets = bets.filter(b => b.status === 'WON');
    const totalStake = bets.reduce((sum, b) => sum + b.stake, 0);
    
    // Get most bet team
    const teamCount = {};
    for (const bet of bets) {
      if (bet.selections[0]?.match) {
        const match = await Match.findById(bet.selections[0].match);
        if (match) {
          teamCount[match.homeTeam.name] = (teamCount[match.homeTeam.name] || 0) + 1;
          teamCount[match.awayTeam.name] = (teamCount[match.awayTeam.name] || 0) + 1;
        }
      }
    }
    
    const mostBetTeam = Object.keys(teamCount).reduce((a, b) => 
      teamCount[a] > teamCount[b] ? a : b, Object.keys(teamCount)[0]);
    
    return {
      betCount: bets.length,
      winRate: bets.length ? (wonBets.length / bets.length * 100).toFixed(1) : 0,
      averageStake: bets.length ? totalStake / bets.length : 0,
      mostBetTeam: mostBetTeam || 'None yet'
    };
  }
}

module.exports = new AIPredictionService();