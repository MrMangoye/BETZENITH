// server/data/mockMatches.js

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// League configurations
const leagues = {
  'Premier League': {
    country: 'England',
    sport: 'soccer',
    teams: ['Arsenal', 'Liverpool', 'Man City', 'Chelsea', 'Man United', 'Tottenham', 'Newcastle', 'Aston Villa', 'Brighton', 'West Ham'],
    abbreviations: ['ARS', 'LIV', 'MCI', 'CHE', 'MUN', 'TOT', 'NEW', 'AVL', 'BHA', 'WHU']
  },
  'La Liga': {
    country: 'Spain',
    sport: 'soccer',
    teams: ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla', 'Real Sociedad', 'Athletic Bilbao', 'Valencia', 'Villarreal'],
    abbreviations: ['RMA', 'BAR', 'ATM', 'SEV', 'RSO', 'ATH', 'VAL', 'VIL']
  },
  'Bundesliga': {
    country: 'Germany',
    sport: 'soccer',
    teams: ['Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen', 'Eintracht Frankfurt', 'Wolfsburg', 'Monchengladbach'],
    abbreviations: ['BAY', 'DOR', 'RBL', 'LEV', 'SGE', 'WOL', 'BMG']
  },
  'Serie A': {
    country: 'Italy',
    sport: 'soccer',
    teams: ['Juventus', 'Inter Milan', 'AC Milan', 'Napoli', 'Roma', 'Lazio', 'Atalanta', 'Fiorentina'],
    abbreviations: ['JUV', 'INT', 'MIL', 'NAP', 'ROM', 'LAZ', 'ATA', 'FIO']
  },
  'Ligue 1': {
    country: 'France',
    sport: 'soccer',
    teams: ['PSG', 'Marseille', 'Monaco', 'Lyon', 'Lille', 'Rennes', 'Nice', 'Lens'],
    abbreviations: ['PSG', 'MAR', 'MON', 'LYO', 'LIL', 'REN', 'NIC', 'LEN']
  },
  'UEFA Champions League': {
    country: 'Europe',
    sport: 'soccer',
    teams: ['Real Madrid', 'Man City', 'Bayern Munich', 'PSG', 'Liverpool', 'Inter Milan', 'Barcelona', 'Arsenal', 'Borussia Dortmund', 'Atletico Madrid'],
    abbreviations: ['RMA', 'MCI', 'BAY', 'PSG', 'LIV', 'INT', 'BAR', 'ARS', 'DOR', 'ATM']
  },
  'NBA': {
    country: 'USA',
    sport: 'basketball',
    teams: ['LA Lakers', 'Golden State', 'Boston Celtics', 'Milwaukee Bucks', 'Miami Heat', 'Denver Nuggets', 'Phoenix Suns', 'Philadelphia 76ers'],
    abbreviations: ['LAL', 'GSW', 'BOS', 'MIL', 'MIA', 'DEN', 'PHX', 'PHI']
  },
  'NFL': {
    country: 'USA',
    sport: 'football',
    teams: ['Kansas City Chiefs', 'San Francisco 49ers', 'Baltimore Ravens', 'Buffalo Bills', 'Philadelphia Eagles', 'Dallas Cowboys', 'Cincinnati Bengals'],
    abbreviations: ['KC', 'SF', 'BAL', 'BUF', 'PHI', 'DAL', 'CIN']
  }
};

// ============ 1. LIVE MATCHES (Currently Playing) ============
const generateLiveMatches = () => {
  const liveMatches = [];
  const now = new Date();
  
  Object.entries(leagues).forEach(([leagueName, config]) => {
    const { sport, teams, abbreviations, country } = config;
    const numTeams = teams.length;
    
    // 2-3 live matches per league (currently playing)
    const numMatches = randomInt(2, 3);
    
    for (let i = 0; i < numMatches; i++) {
      let homeIdx = randomInt(0, numTeams - 1);
      let awayIdx = randomInt(0, numTeams - 1);
      while (awayIdx === homeIdx) awayIdx = randomInt(0, numTeams - 1);
      
      const minute = randomInt(10, 88); // Game in progress
      const homeScore = randomInt(0, 3);
      const awayScore = randomInt(0, 2);
      
      // Calculate live odds based on current score
      let homeOdds, drawOdds, awayOdds;
      if (homeScore > awayScore) {
        homeOdds = Number((1.1 + Math.random() * 0.8).toFixed(2));
        drawOdds = Number((3.0 + Math.random() * 1.5).toFixed(2));
        awayOdds = Number((4.0 + Math.random() * 3).toFixed(2));
      } else if (awayScore > homeScore) {
        homeOdds = Number((4.0 + Math.random() * 3).toFixed(2));
        drawOdds = Number((3.0 + Math.random() * 1.5).toFixed(2));
        awayOdds = Number((1.1 + Math.random() * 0.8).toFixed(2));
      } else {
        homeOdds = Number((2.0 + Math.random() * 1).toFixed(2));
        drawOdds = Number((2.5 + Math.random() * 1).toFixed(2));
        awayOdds = Number((2.0 + Math.random() * 1).toFixed(2));
      }
      
      liveMatches.push({
        id: `live-${sport}-${leagueName}-${i}-${Date.now()}`,
        _id: `live-${sport}-${leagueName}-${i}-${Date.now()}`,
        sport: sport,
        league: leagueName,
        country: country,
        homeTeam: { name: teams[homeIdx], abbreviation: abbreviations[homeIdx] },
        awayTeam: { name: teams[awayIdx], abbreviation: abbreviations[awayIdx] },
        score: { home: homeScore, away: awayScore },
        status: 'LIVE',
        minute: minute,
        startsAt: new Date(now.getTime() - minute * 60000).toISOString(),
        odds: { home: homeOdds, draw: sport === 'soccer' ? drawOdds : null, away: awayOdds },
        markets: [
          { name: '1', odds: homeOdds, isActive: true },
          ...(sport === 'soccer' ? [{ name: 'X', odds: drawOdds, isActive: true }] : []),
          { name: '2', odds: awayOdds, isActive: true },
          { name: 'Over 2.5', odds: 1.95, isActive: true },
          { name: 'Under 2.5', odds: 1.95, isActive: true }
        ],
        isFinished: false,
        events: homeScore + awayScore > 0 ? [{
          type: 'GOAL',
          minute: randomInt(5, minute),
          team: homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'home',
          player: 'Player',
          homeScore: homeScore,
          awayScore: awayScore
        }] : []
      });
    }
  });
  
  console.log(`🔴 Generated ${liveMatches.length} LIVE matches`);
  return liveMatches;
};

// ============ 2. FINISHED MATCHES (Already Played) ============
const generateFinishedMatches = () => {
  const finishedMatches = [];
  const now = Date.now();
  
  Object.entries(leagues).forEach(([leagueName, config]) => {
    const { sport, teams, abbreviations, country } = config;
    const numTeams = teams.length;
    
    // 3-4 finished matches per league (already played)
    const numMatches = randomInt(3, 4);
    
    for (let i = 0; i < numMatches; i++) {
      let homeIdx = randomInt(0, numTeams - 1);
      let awayIdx = randomInt(0, numTeams - 1);
      while (awayIdx === homeIdx) awayIdx = randomInt(0, numTeams - 1);
      
      // Past dates (1-10 days ago)
      const daysAgo = randomInt(1, 10);
      const hoursAgo = randomInt(14, 22);
      const startTime = new Date(now - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000));
      
      const homeScore = randomInt(0, 5);
      const awayScore = randomInt(0, 4);
      const winner = homeScore > awayScore ? 'HOME' : awayScore > homeScore ? 'AWAY' : 'DRAW';
      
      finishedMatches.push({
        id: `finished-${sport}-${leagueName}-${i}-${Date.now()}`,
        _id: `finished-${sport}-${leagueName}-${i}-${Date.now()}`,
        sport: sport,
        league: leagueName,
        country: country,
        homeTeam: { name: teams[homeIdx], abbreviation: abbreviations[homeIdx] },
        awayTeam: { name: teams[awayIdx], abbreviation: abbreviations[awayIdx] },
        score: { home: homeScore, away: awayScore },
        status: 'FINISHED',
        minute: 90,
        startsAt: startTime.toISOString(),
        odds: { home: 2.0, draw: sport === 'soccer' ? 3.4 : null, away: 2.0 },
        markets: [
          { name: '1', odds: 2.0, isActive: false },
          ...(sport === 'soccer' ? [{ name: 'X', odds: 3.4, isActive: false }] : []),
          { name: '2', odds: 2.0, isActive: false }
        ],
        result: { winner, homeScore, awayScore, isSettled: true },
        isFinished: true
      });
    }
  });
  
  console.log(`🏁 Generated ${finishedMatches.length} FINISHED matches`);
  return finishedMatches;
};

// ============ 3. SCHEDULED MATCHES (To Be Played Later) ============
const generateScheduledMatches = () => {
  const scheduledMatches = [];
  const now = Date.now();
  
  Object.entries(leagues).forEach(([leagueName, config]) => {
    const { sport, teams, abbreviations, country } = config;
    const numTeams = teams.length;
    
    // 8-12 scheduled matches per league (to be played later)
    const numMatches = randomInt(8, 12);
    
    for (let i = 0; i < numMatches; i++) {
      let homeIdx = randomInt(0, numTeams - 1);
      let awayIdx = randomInt(0, numTeams - 1);
      while (awayIdx === homeIdx) awayIdx = randomInt(0, numTeams - 1);
      
      // Future dates (1-14 days from now)
      const daysFromNow = randomInt(1, 14);
      const hoursFromNow = randomInt(12, 22);
      const minutesFromNow = randomInt(0, 59);
      
      const startTime = new Date(now + (daysFromNow * 24 * 60 * 60 * 1000) + (hoursFromNow * 60 * 60 * 1000) + (minutesFromNow * 60 * 1000));
      
      const homeOdds = Number((1.5 + Math.random() * 2).toFixed(2));
      const drawOdds = sport === 'soccer' ? Number((2.8 + Math.random() * 1.5).toFixed(2)) : null;
      const awayOdds = Number((1.5 + Math.random() * 2).toFixed(2));
      
      scheduledMatches.push({
        id: `scheduled-${sport}-${leagueName}-${i}-${Date.now()}`,
        _id: `scheduled-${sport}-${leagueName}-${i}-${Date.now()}`,
        sport: sport,
        league: leagueName,
        country: country,
        homeTeam: { name: teams[homeIdx], abbreviation: abbreviations[homeIdx] },
        awayTeam: { name: teams[awayIdx], abbreviation: abbreviations[awayIdx] },
        score: { home: 0, away: 0 },
        status: 'SCHEDULED',
        minute: 0,
        startsAt: startTime.toISOString(),
        odds: { home: homeOdds, draw: drawOdds, away: awayOdds },
        markets: [
          { name: '1', odds: homeOdds, isActive: true },
          ...(drawOdds ? [{ name: 'X', odds: drawOdds, isActive: true }] : []),
          { name: '2', odds: awayOdds, isActive: true },
          { name: 'Over 2.5', odds: 1.95, isActive: true },
          { name: 'Under 2.5', odds: 1.95, isActive: true }
        ],
        isFinished: false,
        aiPrediction: {
          predictedWinner: homeOdds < awayOdds ? 'HOME' : awayOdds < homeOdds ? 'AWAY' : 'DRAW',
          confidence: randomInt(55, 85),
          probability: {
            home: ((1/homeOdds) * 100).toFixed(1),
            draw: drawOdds ? ((1/drawOdds) * 100).toFixed(1) : 0,
            away: ((1/awayOdds) * 100).toFixed(1)
          },
          insight: `${teams[homeIdx]} have home advantage. ${teams[awayIdx]} looking to upset.`,
          riskLevel: Math.abs(homeOdds - awayOdds) < 0.5 ? 'Medium' : 'Low'
        }
      });
    }
  });
  
  console.log(`📅 Generated ${scheduledMatches.length} SCHEDULED matches`);
  return scheduledMatches;
};

// Generate all matches
const liveMatches = generateLiveMatches();
const finishedMatches = generateFinishedMatches();
const scheduledMatches = generateScheduledMatches();

// Combine all for search
const allMatches = [...liveMatches, ...finishedMatches, ...scheduledMatches];

console.log('\n📊 MATCH DISTRIBUTION SUMMARY:');
console.log('═══════════════════════════════════════');
console.log(`🔴 LIVE (Currently Playing):  ${liveMatches.length} matches`);
console.log(`🏁 FINISHED (Already Played): ${finishedMatches.length} matches`);
console.log(`📅 SCHEDULED (To Be Played):  ${scheduledMatches.length} matches`);
console.log(`📋 TOTAL:                    ${allMatches.length} matches`);
console.log('═══════════════════════════════════════\n');

// Helper functions
const getLiveMatches = (sport = null) => {
  if (!sport || sport === 'all') return liveMatches;
  const sportKey = sport === 'football' ? 'soccer' : sport;
  return liveMatches.filter(m => m.sport === sportKey);
};

const getFinishedMatches = (sport = null) => {
  if (!sport || sport === 'all') return finishedMatches;
  const sportKey = sport === 'football' ? 'soccer' : sport;
  return finishedMatches.filter(m => m.sport === sportKey);
};

const getUpcomingMatches = (sport = null) => {
  if (!sport || sport === 'all') return scheduledMatches;
  const sportKey = sport === 'football' ? 'soccer' : sport;
  return scheduledMatches.filter(m => m.sport === sportKey);
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

const updateLiveScores = () => {
  liveMatches.forEach(match => {
    if (Math.random() < 0.3 && match.minute < 90) {
      if (match.sport === 'soccer') {
        if (Math.random() < 0.08) {
          if (Math.random() < 0.5) match.score.home += 1;
          else match.score.away += 1;
        }
        match.minute += 1;
      } else if (match.sport === 'basketball') {
        if (Math.random() < 0.4) {
          match.score.home += randomInt(2, 3);
          match.score.away += randomInt(2, 3);
        }
        match.minute += 1;
      }
    }
  });
  return liveMatches;
};

// Update scores every 30 seconds
setInterval(() => {
  updateLiveScores();
}, 30000);

module.exports = {
  getLiveMatches,
  getFinishedMatches,
  getUpcomingMatches,
  searchMatches,
  updateLiveScores,
  allMatches,
  // Sport-specific exports
  soccer: allMatches.filter(m => m.sport === 'soccer'),
  basketball: allMatches.filter(m => m.sport === 'basketball'),
  football: allMatches.filter(m => m.sport === 'football')
};