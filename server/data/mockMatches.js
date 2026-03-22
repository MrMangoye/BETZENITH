// server/data/mockMatches.js
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Limit constants
const MAX_LIVE_MATCHES_PER_LEAGUE = 2;
const MAX_SCHEDULED_MATCHES_PER_LEAGUE = 8;
const MAX_FINISHED_MATCHES_PER_LEAGUE = 3;

// League configurations
const leagues = {
  'Premier League': {
    country: 'England',
    sport: 'soccer',
    teams: ['Arsenal', 'Liverpool', 'Man City', 'Chelsea', 'Man United', 'Tottenham', 'Newcastle', 'Aston Villa'],
    abbreviations: ['ARS', 'LIV', 'MCI', 'CHE', 'MUN', 'TOT', 'NEW', 'AVL']
  },
  'La Liga': {
    country: 'Spain',
    sport: 'soccer',
    teams: ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla', 'Real Sociedad', 'Athletic Bilbao'],
    abbreviations: ['RMA', 'BAR', 'ATM', 'SEV', 'RSO', 'ATH']
  },
  'Bundesliga': {
    country: 'Germany',
    sport: 'soccer',
    teams: ['Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen', 'Eintracht Frankfurt'],
    abbreviations: ['BAY', 'DOR', 'RBL', 'LEV', 'SGE']
  },
  'Serie A': {
    country: 'Italy',
    sport: 'soccer',
    teams: ['Juventus', 'Inter Milan', 'AC Milan', 'Napoli', 'Roma', 'Lazio'],
    abbreviations: ['JUV', 'INT', 'MIL', 'NAP', 'ROM', 'LAZ']
  },
  'Ligue 1': {
    country: 'France',
    sport: 'soccer',
    teams: ['PSG', 'Marseille', 'Monaco', 'Lyon', 'Lille', 'Rennes'],
    abbreviations: ['PSG', 'MAR', 'MON', 'LYO', 'LIL', 'REN']
  }
};

// Generate matches with distribution
const generateMatches = () => {
  const allMatches = [];
  let matchCounter = 0;
  const now = new Date();
  
  Object.entries(leagues).forEach(([leagueName, config]) => {
    const { sport, teams, abbreviations, country } = config;
    const numTeams = teams.length;
    
    // Generate SCHEDULED matches (most)
    for (let i = 0; i < MAX_SCHEDULED_MATCHES_PER_LEAGUE; i++) {
      matchCounter++;
      
      const daysFromNow = randomInt(1, 14);
      const hoursFromNow = randomInt(12, 22);
      const startsAt = new Date(now);
      startsAt.setDate(now.getDate() + daysFromNow);
      startsAt.setHours(hoursFromNow, randomInt(0, 59), 0);
      
      const homeIdx = randomInt(0, numTeams - 1);
      let awayIdx = randomInt(0, numTeams - 1);
      while (awayIdx === homeIdx) awayIdx = randomInt(0, numTeams - 1);
      
      const homeOdds = Number((1.5 + Math.random() * 2).toFixed(2));
      const drawOdds = Number((2.8 + Math.random() * 1.5).toFixed(2));
      const awayOdds = Number((1.5 + Math.random() * 2).toFixed(2));
      
      allMatches.push({
        id: `match-${matchCounter}`,
        _id: `match-${matchCounter}`,
        sport: sport,
        league: leagueName,
        country: country,
        homeTeam: { name: teams[homeIdx], abbreviation: abbreviations[homeIdx] },
        awayTeam: { name: teams[awayIdx], abbreviation: abbreviations[awayIdx] },
        score: { home: 0, away: 0 },
        status: 'SCHEDULED',
        minute: 0,
        startsAt: startsAt.toISOString(),
        odds: { home: homeOdds, draw: drawOdds, away: awayOdds },
        markets: [
          { name: '1', odds: homeOdds, isActive: true },
          { name: 'X', odds: drawOdds, isActive: true },
          { name: '2', odds: awayOdds, isActive: true },
          { name: 'Over 2.5', odds: 1.95, isActive: true },
          { name: 'Under 2.5', odds: 1.95, isActive: true },
          { name: 'BTTS', odds: 1.90, isActive: true }
        ],
        isFinished: false,
        result: null,
        aiPrediction: {
          predictedWinner: homeOdds < awayOdds ? 'HOME' : awayOdds < homeOdds ? 'AWAY' : 'DRAW',
          confidence: randomInt(55, 85),
          probability: {
            home: ((1/homeOdds) * 100).toFixed(1),
            draw: ((1/drawOdds) * 100).toFixed(1),
            away: ((1/awayOdds) * 100).toFixed(1)
          },
          insight: `Based on form analysis, ${teams[homeIdx]} have a slight advantage at home.`,
          riskLevel: Math.abs(homeOdds - awayOdds) < 0.5 ? 'Medium' : 'Low'
        }
      });
    }
    
    // Generate LIVE matches
    for (let i = 0; i < MAX_LIVE_MATCHES_PER_LEAGUE; i++) {
      matchCounter++;
      
      const homeIdx = randomInt(0, numTeams - 1);
      let awayIdx = randomInt(0, numTeams - 1);
      while (awayIdx === homeIdx) awayIdx = randomInt(0, numTeams - 1);
      
      const minute = randomInt(5, 85);
      const homeScore = randomInt(0, 2);
      const awayScore = randomInt(0, 2);
      const homeOdds = Number((1.2 + Math.random() * 2.5).toFixed(2));
      const drawOdds = Number((2.5 + Math.random() * 2).toFixed(2));
      const awayOdds = Number((1.2 + Math.random() * 2.5).toFixed(2));
      
      allMatches.push({
        id: `match-${matchCounter}`,
        _id: `match-${matchCounter}`,
        sport: sport,
        league: leagueName,
        country: country,
        homeTeam: { name: teams[homeIdx], abbreviation: abbreviations[homeIdx] },
        awayTeam: { name: teams[awayIdx], abbreviation: abbreviations[awayIdx] },
        score: { home: homeScore, away: awayScore },
        status: 'LIVE',
        minute: minute,
        startsAt: new Date(Date.now() - (minute * 60 * 1000)).toISOString(),
        odds: { home: homeOdds, draw: drawOdds, away: awayOdds },
        markets: [
          { name: '1', odds: homeOdds, isActive: true },
          { name: 'X', odds: drawOdds, isActive: true },
          { name: '2', odds: awayOdds, isActive: true },
          { name: 'Over 2.5', odds: 1.95, isActive: true },
          { name: 'Under 2.5', odds: 1.95, isActive: true },
          { name: 'BTTS', odds: 1.90, isActive: true }
        ],
        isFinished: false,
        result: null,
        events: homeScore + awayScore > 0 ? [{
          type: 'GOAL',
          minute: randomInt(10, minute),
          team: homeScore > awayScore ? 'home' : 'away',
          player: 'Player',
          homeScore: homeScore,
          awayScore: awayScore
        }] : [],
        aiPrediction: {
          predictedWinner: homeScore > awayScore ? 'HOME' : awayScore > homeScore ? 'AWAY' : 'DRAW',
          confidence: randomInt(70, 95),
          probability: {
            home: ((1/homeOdds) * 100).toFixed(1),
            draw: ((1/drawOdds) * 100).toFixed(1),
            away: ((1/awayOdds) * 100).toFixed(1)
          },
          insight: homeScore > awayScore ? `${teams[homeIdx]} are controlling the game.` : `Close match, both teams competing well.`,
          riskLevel: 'Medium'
        }
      });
    }
    
    // Generate FINISHED matches
    for (let i = 0; i < MAX_FINISHED_MATCHES_PER_LEAGUE; i++) {
      matchCounter++;
      
      const homeIdx = randomInt(0, numTeams - 1);
      let awayIdx = randomInt(0, numTeams - 1);
      while (awayIdx === homeIdx) awayIdx = randomInt(0, numTeams - 1);
      
      const homeScore = randomInt(0, 4);
      const awayScore = randomInt(0, 3);
      const winner = homeScore > awayScore ? 'HOME' : awayScore > homeScore ? 'AWAY' : 'DRAW';
      
      const daysAgo = randomInt(1, 7);
      const startsAt = new Date(now);
      startsAt.setDate(now.getDate() - daysAgo);
      startsAt.setHours(randomInt(15, 22), randomInt(0, 59), 0);
      
      allMatches.push({
        id: `match-${matchCounter}`,
        _id: `match-${matchCounter}`,
        sport: sport,
        league: leagueName,
        country: country,
        homeTeam: { name: teams[homeIdx], abbreviation: abbreviations[homeIdx] },
        awayTeam: { name: teams[awayIdx], abbreviation: abbreviations[awayIdx] },
        score: { home: homeScore, away: awayScore },
        status: 'FINISHED',
        minute: 90,
        startsAt: startsAt.toISOString(),
        odds: { home: 2.0, draw: 3.4, away: 2.0 },
        markets: [
          { name: '1', odds: 2.0, isActive: false },
          { name: 'X', odds: 3.4, isActive: false },
          { name: '2', odds: 2.0, isActive: false }
        ],
        isFinished: true,
        result: { winner, score: { home: homeScore, away: awayScore }, isSettled: true },
        events: [{ type: 'GOAL', minute: randomInt(10, 85), team: 'home', player: 'Player', homeScore: homeScore, awayScore: awayScore }]
      });
    }
  });
  
  console.log(`✅ Generated ${allMatches.length} matches: Scheduled: ${allMatches.filter(m => m.status === 'SCHEDULED').length}, Live: ${allMatches.filter(m => m.status === 'LIVE').length}, Finished: ${allMatches.filter(m => m.status === 'FINISHED').length}`);
  
  return allMatches;
};

const allMatches = generateMatches();

const getLiveMatches = (sport = null) => {
  let filtered = allMatches.filter(m => m.status === 'LIVE');
  if (sport && sport !== 'all') {
    filtered = filtered.filter(m => m.sport === sport);
  }
  return filtered;
};

const getUpcomingMatches = (sport = null) => {
  let filtered = allMatches.filter(m => m.status === 'SCHEDULED');
  if (sport && sport !== 'all') {
    filtered = filtered.filter(m => m.sport === sport);
  }
  return filtered;
};

const getFinishedMatches = (sport = null) => {
  let filtered = allMatches.filter(m => m.status === 'FINISHED');
  if (sport && sport !== 'all') {
    filtered = filtered.filter(m => m.sport === sport);
  }
  return filtered;
};

const searchMatches = (query, sport = null) => {
  const lowerQuery = query.toLowerCase();
  return allMatches.filter(m => 
    (!sport || m.sport === sport) &&
    (m.homeTeam.name.toLowerCase().includes(lowerQuery) ||
     m.awayTeam.name.toLowerCase().includes(lowerQuery) ||
     m.league.toLowerCase().includes(lowerQuery))
  );
};

module.exports = {
  getLiveMatches,
  getUpcomingMatches,
  getFinishedMatches,
  searchMatches,
  allMatches
};