// src/hooks/useOddsData.js
import { useState, useEffect, useCallback } from 'react';

// ============ COMPLETE LEAGUE DATA WITH ALL SPORTS ============
const LEAGUES = {
  // ============ SOCCER LEAGUES ============
  'Premier League': { country: 'England', sport: 'soccer', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', matchDuration: 90 },
  'La Liga': { country: 'Spain', sport: 'soccer', icon: '🇪🇸', matchDuration: 90 },
  'Bundesliga': { country: 'Germany', sport: 'soccer', icon: '🇩🇪', matchDuration: 90 },
  'Serie A': { country: 'Italy', sport: 'soccer', icon: '🇮🇹', matchDuration: 90 },
  'Ligue 1': { country: 'France', sport: 'soccer', icon: '🇫🇷', matchDuration: 90 },
  'Champions League': { country: 'Europe', sport: 'soccer', icon: '🏆', matchDuration: 90 },
  'Europa League': { country: 'Europe', sport: 'soccer', icon: '🏆', matchDuration: 90 },
  'World Cup': { country: 'International', sport: 'soccer', icon: '🌍', matchDuration: 90 },
  'MLS': { country: 'USA', sport: 'soccer', icon: '🇺🇸', matchDuration: 90 },
  'Brazil Serie A': { country: 'Brazil', sport: 'soccer', icon: '🇧🇷', matchDuration: 90 },
  'Eredivisie': { country: 'Netherlands', sport: 'soccer', icon: '🇳🇱', matchDuration: 90 },
  'Primeira Liga': { country: 'Portugal', sport: 'soccer', icon: '🇵🇹', matchDuration: 90 },
  'Turkish Super Lig': { country: 'Turkey', sport: 'soccer', icon: '🇹🇷', matchDuration: 90 },
  
  // ============ BASKETBALL LEAGUES ============
  'NBA': { country: 'USA', sport: 'basketball', icon: '🏀', matchDuration: 48 },
  'EuroLeague': { country: 'Europe', sport: 'basketball', icon: '🏀', matchDuration: 40 },
  'WNBA': { country: 'USA', sport: 'basketball', icon: '🏀', matchDuration: 40 },
  
  // ============ AMERICAN FOOTBALL ============
  'NFL': { country: 'USA', sport: 'football', icon: '🏈', matchDuration: 60 },
  'Super Bowl': { country: 'USA', sport: 'football', icon: '🏆', matchDuration: 60 },
  
  // ============ TENNIS ============
  'Wimbledon': { country: 'UK', sport: 'tennis', icon: '🎾', matchDuration: 5 },
  'US Open': { country: 'USA', sport: 'tennis', icon: '🎾', matchDuration: 5 },
  
  // ============ BASEBALL ============
  'MLB': { country: 'USA', sport: 'baseball', icon: '⚾', matchDuration: 9 },
  
  // ============ HOCKEY ============
  'NHL': { country: 'USA/Canada', sport: 'hockey', icon: '🏒', matchDuration: 60 },
  
  // ============ MMA ============
  'UFC': { country: 'USA', sport: 'mma', icon: '🥊', matchDuration: 5 },
  
  // ============ GOLF ============
  'PGA Tour': { country: 'USA', sport: 'golf', icon: '⛳', matchDuration: 4 },
  
  // ============ CRICKET ============
  'IPL': { country: 'India', sport: 'cricket', icon: '🏏', matchDuration: 20 },
  
  // ============ RUGBY ============
  'Six Nations': { country: 'Europe', sport: 'rugby', icon: '🏉', matchDuration: 80 },
  
  // ============ FORMULA 1 ============
  'Formula 1': { country: 'Global', sport: 'f1', icon: '🏎️', matchDuration: 58 },
};

// ============ LEAGUE-SPECIFIC TEAMS ============
const LEAGUE_TEAMS = {
  // Premier League Teams (20 teams)
  'Premier League': [
    { name: 'Arsenal', abbr: 'ARS' },
    { name: 'Aston Villa', abbr: 'AVL' },
    { name: 'Bournemouth', abbr: 'BOU' },
    { name: 'Brentford', abbr: 'BRE' },
    { name: 'Brighton', abbr: 'BHA' },
    { name: 'Burnley', abbr: 'BUR' },
    { name: 'Chelsea', abbr: 'CHE' },
    { name: 'Crystal Palace', abbr: 'CRY' },
    { name: 'Everton', abbr: 'EVE' },
    { name: 'Fulham', abbr: 'FUL' },
    { name: 'Liverpool', abbr: 'LIV' },
    { name: 'Luton Town', abbr: 'LUT' },
    { name: 'Manchester City', abbr: 'MCI' },
    { name: 'Manchester United', abbr: 'MUN' },
    { name: 'Newcastle United', abbr: 'NEW' },
    { name: 'Nottingham Forest', abbr: 'NFO' },
    { name: 'Sheffield United', abbr: 'SHU' },
    { name: 'Tottenham Hotspur', abbr: 'TOT' },
    { name: 'West Ham United', abbr: 'WHU' },
    { name: 'Wolverhampton Wanderers', abbr: 'WOL' }
  ],
  
  // La Liga Teams (20 teams)
  'La Liga': [
    { name: 'Alaves', abbr: 'ALA' },
    { name: 'Almeria', abbr: 'ALM' },
    { name: 'Athletic Bilbao', abbr: 'ATH' },
    { name: 'Atletico Madrid', abbr: 'ATM' },
    { name: 'Barcelona', abbr: 'BAR' },
    { name: 'Cadiz', abbr: 'CAD' },
    { name: 'Celta Vigo', abbr: 'CEL' },
    { name: 'Getafe', abbr: 'GET' },
    { name: 'Girona', abbr: 'GIR' },
    { name: 'Granada', abbr: 'GRA' },
    { name: 'Las Palmas', abbr: 'LPA' },
    { name: 'Mallorca', abbr: 'MLL' },
    { name: 'Osasuna', abbr: 'OSA' },
    { name: 'Rayo Vallecano', abbr: 'RAY' },
    { name: 'Real Betis', abbr: 'BET' },
    { name: 'Real Madrid', abbr: 'RMA' },
    { name: 'Real Sociedad', abbr: 'RSO' },
    { name: 'Sevilla', abbr: 'SEV' },
    { name: 'Valencia', abbr: 'VAL' },
    { name: 'Villarreal', abbr: 'VIL' }
  ],
  
  // Bundesliga Teams (18 teams)
  'Bundesliga': [
    { name: 'FC Augsburg', abbr: 'AUG' },
    { name: 'Bayer Leverkusen', abbr: 'LEV' },
    { name: 'Bayern Munich', abbr: 'BAY' },
    { name: 'VfL Bochum', abbr: 'BOC' },
    { name: 'Borussia Dortmund', abbr: 'DOR' },
    { name: 'Borussia Mönchengladbach', abbr: 'BMG' },
    { name: 'Darmstadt 98', abbr: 'DAR' },
    { name: 'Eintracht Frankfurt', abbr: 'SGE' },
    { name: 'SC Freiburg', abbr: 'FRE' },
    { name: 'FC Heidenheim', abbr: 'HEI' },
    { name: 'TSG Hoffenheim', abbr: 'HOF' },
    { name: '1.FC Köln', abbr: 'KOL' },
    { name: 'RB Leipzig', abbr: 'RBL' },
    { name: 'Mainz 05', abbr: 'MAI' },
    { name: 'FC St. Pauli', abbr: 'STP' },
    { name: 'VfB Stuttgart', abbr: 'STU' },
    { name: 'Union Berlin', abbr: 'UNB' },
    { name: 'Werder Bremen', abbr: 'BRE' },
    { name: 'VfL Wolfsburg', abbr: 'WOB' }
  ],
  
  // Serie A Teams (20 teams)
  'Serie A': [
    { name: 'Atalanta', abbr: 'ATA' },
    { name: 'Bologna', abbr: 'BOL' },
    { name: 'Cagliari', abbr: 'CAG' },
    { name: 'Como', abbr: 'COM' },
    { name: 'Empoli', abbr: 'EMP' },
    { name: 'Fiorentina', abbr: 'FIO' },
    { name: 'Genoa', abbr: 'GEN' },
    { name: 'Inter Milan', abbr: 'INT' },
    { name: 'Juventus', abbr: 'JUV' },
    { name: 'Lazio', abbr: 'LAZ' },
    { name: 'Lecce', abbr: 'LEC' },
    { name: 'AC Milan', abbr: 'MIL' },
    { name: 'Monza', abbr: 'MNZ' },
    { name: 'Napoli', abbr: 'NAP' },
    { name: 'Parma', abbr: 'PAR' },
    { name: 'Roma', abbr: 'ROM' },
    { name: 'Salernitana', abbr: 'SAL' },
    { name: 'Sassuolo', abbr: 'SAS' },
    { name: 'Torino', abbr: 'TOR' },
    { name: 'Udinese', abbr: 'UDI' },
    { name: 'Venezia', abbr: 'VEN' },
    { name: 'Verona', abbr: 'VER' }
  ],
  
  // Ligue 1 Teams (18 teams)
  'Ligue 1': [
    { name: 'Angers', abbr: 'ANG' },
    { name: 'Auxerre', abbr: 'AUX' },
    { name: 'Brest', abbr: 'BRE' },
    { name: 'Le Havre', abbr: 'HAC' },
    { name: 'Lens', abbr: 'LEN' },
    { name: 'Lille', abbr: 'LIL' },
    { name: 'Lorient', abbr: 'LOR' },
    { name: 'Lyon', abbr: 'LYO' },
    { name: 'Marseille', abbr: 'MAR' },
    { name: 'Metz', abbr: 'MET' },
    { name: 'Monaco', abbr: 'MON' },
    { name: 'Montpellier', abbr: 'MPL' },
    { name: 'Nantes', abbr: 'NAN' },
    { name: 'Nice', abbr: 'NIC' },
    { name: 'Paris Saint-Germain', abbr: 'PSG' },
    { name: 'Reims', abbr: 'REI' },
    { name: 'Rennes', abbr: 'REN' },
    { name: 'Strasbourg', abbr: 'STR' },
    { name: 'Toulouse', abbr: 'TLS' }
  ],
  
  // Champions League (top European teams)
  'Champions League': [
    { name: 'Real Madrid', abbr: 'RMA' },
    { name: 'Manchester City', abbr: 'MCI' },
    { name: 'Bayern Munich', abbr: 'BAY' },
    { name: 'Paris Saint-Germain', abbr: 'PSG' },
    { name: 'Liverpool', abbr: 'LIV' },
    { name: 'Inter Milan', abbr: 'INT' },
    { name: 'Borussia Dortmund', abbr: 'DOR' },
    { name: 'Barcelona', abbr: 'BAR' },
    { name: 'Arsenal', abbr: 'ARS' },
    { name: 'Atletico Madrid', abbr: 'ATM' },
    { name: 'RB Leipzig', abbr: 'RBL' },
    { name: 'Porto', abbr: 'POR' },
    { name: 'Napoli', abbr: 'NAP' },
    { name: 'Benfica', abbr: 'BEN' },
    { name: 'Shakhtar Donetsk', abbr: 'SHA' },
    { name: 'AC Milan', abbr: 'MIL' },
    { name: 'Celtic', abbr: 'CEL' },
    { name: 'Galatasaray', abbr: 'GAL' },
    { name: 'Lazio', abbr: 'LAZ' },
    { name: 'PSV Eindhoven', abbr: 'PSV' }
  ],
  
  // NBA Teams
  'NBA': [
    { name: 'Atlanta Hawks', abbr: 'ATL' },
    { name: 'Boston Celtics', abbr: 'BOS' },
    { name: 'Brooklyn Nets', abbr: 'BKN' },
    { name: 'Charlotte Hornets', abbr: 'CHA' },
    { name: 'Chicago Bulls', abbr: 'CHI' },
    { name: 'Cleveland Cavaliers', abbr: 'CLE' },
    { name: 'Dallas Mavericks', abbr: 'DAL' },
    { name: 'Denver Nuggets', abbr: 'DEN' },
    { name: 'Detroit Pistons', abbr: 'DET' },
    { name: 'Golden State Warriors', abbr: 'GSW' },
    { name: 'Houston Rockets', abbr: 'HOU' },
    { name: 'Indiana Pacers', abbr: 'IND' },
    { name: 'LA Clippers', abbr: 'LAC' },
    { name: 'Los Angeles Lakers', abbr: 'LAL' },
    { name: 'Memphis Grizzlies', abbr: 'MEM' },
    { name: 'Miami Heat', abbr: 'MIA' },
    { name: 'Milwaukee Bucks', abbr: 'MIL' },
    { name: 'Minnesota Timberwolves', abbr: 'MIN' },
    { name: 'New Orleans Pelicans', abbr: 'NOP' },
    { name: 'New York Knicks', abbr: 'NYK' },
    { name: 'Oklahoma City Thunder', abbr: 'OKC' },
    { name: 'Orlando Magic', abbr: 'ORL' },
    { name: 'Philadelphia 76ers', abbr: 'PHI' },
    { name: 'Phoenix Suns', abbr: 'PHX' },
    { name: 'Portland Trail Blazers', abbr: 'POR' },
    { name: 'Sacramento Kings', abbr: 'SAC' },
    { name: 'San Antonio Spurs', abbr: 'SAS' },
    { name: 'Toronto Raptors', abbr: 'TOR' },
    { name: 'Utah Jazz', abbr: 'UTA' },
    { name: 'Washington Wizards', abbr: 'WAS' }
  ],
  
  // NFL Teams
  'NFL': [
    { name: 'Arizona Cardinals', abbr: 'ARI' },
    { name: 'Atlanta Falcons', abbr: 'ATL' },
    { name: 'Baltimore Ravens', abbr: 'BAL' },
    { name: 'Buffalo Bills', abbr: 'BUF' },
    { name: 'Carolina Panthers', abbr: 'CAR' },
    { name: 'Chicago Bears', abbr: 'CHI' },
    { name: 'Cincinnati Bengals', abbr: 'CIN' },
    { name: 'Cleveland Browns', abbr: 'CLE' },
    { name: 'Dallas Cowboys', abbr: 'DAL' },
    { name: 'Denver Broncos', abbr: 'DEN' },
    { name: 'Detroit Lions', abbr: 'DET' },
    { name: 'Green Bay Packers', abbr: 'GB' },
    { name: 'Houston Texans', abbr: 'HOU' },
    { name: 'Indianapolis Colts', abbr: 'IND' },
    { name: 'Jacksonville Jaguars', abbr: 'JAX' },
    { name: 'Kansas City Chiefs', abbr: 'KC' },
    { name: 'Las Vegas Raiders', abbr: 'LV' },
    { name: 'Los Angeles Chargers', abbr: 'LAC' },
    { name: 'Los Angeles Rams', abbr: 'LAR' },
    { name: 'Miami Dolphins', abbr: 'MIA' },
    { name: 'Minnesota Vikings', abbr: 'MIN' },
    { name: 'New England Patriots', abbr: 'NE' },
    { name: 'New Orleans Saints', abbr: 'NO' },
    { name: 'New York Giants', abbr: 'NYG' },
    { name: 'New York Jets', abbr: 'NYJ' },
    { name: 'Philadelphia Eagles', abbr: 'PHI' },
    { name: 'Pittsburgh Steelers', abbr: 'PIT' },
    { name: 'San Francisco 49ers', abbr: 'SF' },
    { name: 'Seattle Seahawks', abbr: 'SEA' },
    { name: 'Tampa Bay Buccaneers', abbr: 'TB' },
    { name: 'Tennessee Titans', abbr: 'TEN' },
    { name: 'Washington Commanders', abbr: 'WAS' }
  ],
  
  'Super Bowl': [
    { name: 'Kansas City Chiefs', abbr: 'KC' },
    { name: 'San Francisco 49ers', abbr: 'SF' },
    { name: 'Philadelphia Eagles', abbr: 'PHI' },
    { name: 'Cincinnati Bengals', abbr: 'CIN' },
    { name: 'Los Angeles Rams', abbr: 'LAR' },
    { name: 'Tampa Bay Buccaneers', abbr: 'TB' },
    { name: 'New England Patriots', abbr: 'NE' },
    { name: 'Green Bay Packers', abbr: 'GB' },
    { name: 'Dallas Cowboys', abbr: 'DAL' },
    { name: 'Pittsburgh Steelers', abbr: 'PIT' }
  ]
};

// Helper functions
const randomItem = (array) => array[Math.floor(Math.random() * array.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const calculateWinner = (sport) => {
  const rand = Math.random();
  if (sport === 'soccer') {
    if (rand < 0.4) return 'HOME';
    if (rand < 0.7) return 'AWAY';
    return 'DRAW';
  }
  return rand < 0.55 ? 'HOME' : 'AWAY';
};

const generateScore = (sport, winner) => {
  if (sport === 'soccer') {
    if (winner === 'HOME') return { home: randomInt(1, 4), away: randomInt(0, 2) };
    if (winner === 'AWAY') return { home: randomInt(0, 2), away: randomInt(1, 4) };
    return { home: randomInt(0, 2), away: randomInt(0, 2) };
  } else if (sport === 'basketball') {
    if (winner === 'HOME') return { home: randomInt(100, 125), away: randomInt(85, 105) };
    return { home: randomInt(85, 105), away: randomInt(100, 125) };
  } else if (sport === 'football') {
    if (winner === 'HOME') return { home: randomInt(21, 38), away: randomInt(7, 20) };
    return { home: randomInt(7, 20), away: randomInt(21, 38) };
  }
  return { home: randomInt(1, 5), away: randomInt(1, 5) };
};

const generateOdds = (sport) => {
  if (sport === 'soccer') {
    return {
      home: parseFloat((1.5 + Math.random() * 3).toFixed(2)),
      draw: parseFloat((2.8 + Math.random() * 1.5).toFixed(2)),
      away: parseFloat((1.5 + Math.random() * 3).toFixed(2))
    };
  }
  return {
    home: parseFloat((1.2 + Math.random() * 2.5).toFixed(2)),
    draw: null,
    away: parseFloat((1.2 + Math.random() * 2.5).toFixed(2))
  };
};

// ============ GENERATE INITIAL MATCHES ============
let allMatches = [];
let matchCounter = 0;

Object.keys(LEAGUES).forEach(leagueName => {
  const league = LEAGUES[leagueName];
  const leagueTeams = LEAGUE_TEAMS[leagueName] || [];
  
  if (leagueTeams.length < 2) return;
  
  const numMatches = randomInt(8, 12);
  
  for (let i = 0; i < numMatches; i++) {
    matchCounter++;
    
    const homeTeam = randomItem(leagueTeams);
    let awayTeam = randomItem(leagueTeams);
    
    while (awayTeam.name === homeTeam.name) {
      awayTeam = randomItem(leagueTeams);
    }
    
    const minute = randomInt(5, league.matchDuration - 5);
    
    let status = 'LIVE';
    if (minute < league.matchDuration * 0.25) status = 'FIRST_HALF';
    else if (minute > league.matchDuration * 0.75) status = 'SECOND_HALF';
    else if (minute === Math.floor(league.matchDuration / 2)) status = 'HALFTIME';
    
    const winner = calculateWinner(league.sport);
    const score = generateScore(league.sport, winner);
    const odds = generateOdds(league.sport);
    
    const markets = [
      { name: '1', odds: odds.home, isActive: true },
      ...(odds.draw ? [{ name: 'X', odds: odds.draw, isActive: true }] : []),
      { name: '2', odds: odds.away, isActive: true },
    ];
    
    if (league.sport === 'soccer') {
      markets.push(
        { name: 'O 2.5', odds: 1.95, isActive: true },
        { name: 'U 2.5', odds: 1.95, isActive: true },
        { name: 'BTTS', odds: 1.90, isActive: true }
      );
    }
    
    allMatches.push({
      id: `match-${matchCounter}`,
      _id: `match-${matchCounter}`,
      sport: league.sport,
      league: leagueName,
      country: league.country,
      homeTeam: {
        name: homeTeam.name,
        abbreviation: homeTeam.abbr
      },
      awayTeam: {
        name: awayTeam.name,
        abbreviation: awayTeam.abbr
      },
      score: score,
      status: status,
      minute: minute,
      startsAt: new Date().toISOString(),
      odds: odds,
      markets: markets,
      winner: winner,
      isFinished: false,
      result: null
    });
  }
});

console.log(`✅ Generated ${allMatches.length} initial matches`);

// ============ UPDATE FUNCTION WITH FINISHED MATCH HANDLING ============
const updateMatches = () => {
  const updatedMatches = [];
  const finishedMatches = [];
  
  allMatches.forEach(match => {
    if (match.isFinished) {
      finishedMatches.push(match);
      return;
    }
    
    const league = LEAGUES[match.league];
    if (!league) {
      updatedMatches.push(match);
      return;
    }
    
    const maxMinute = league.matchDuration || 90;
    
    let newMinute = match.minute + 1;
    let newStatus = match.status;
    let newScore = { ...match.score };
    let isFinished = false;
    let result = null;
    
    // Check if match is finished
    if (newMinute >= maxMinute) {
      isFinished = true;
      newStatus = 'FINISHED';
      result = match.winner; // 'HOME', 'AWAY', or 'DRAW'
    } else if (newMinute === Math.floor(maxMinute / 2)) {
      newStatus = 'HALFTIME';
    } else if (newMinute > maxMinute / 2) {
      newStatus = 'SECOND_HALF';
    }
    
    // Random scoring (5% chance per update)
    if (!isFinished && Math.random() < 0.05) {
      if (match.sport === 'soccer' || match.sport === 'hockey' || match.sport === 'rugby') {
        if (Math.random() < 0.5) newScore.home += 1;
        else newScore.away += 1;
      } else if (match.sport === 'basketball') {
        newScore.home += randomInt(2, 3);
        newScore.away += randomInt(2, 3);
      } else if (match.sport === 'football') {
        if (Math.random() < 0.5) newScore.home += 3;
        else newScore.away += 3;
      } else if (match.sport === 'baseball') {
        if (Math.random() < 0.5) newScore.home += 1;
        else newScore.away += 1;
      }
    }
    
    updatedMatches.push({
      ...match,
      minute: newMinute,
      status: newStatus,
      score: newScore,
      isFinished,
      result
    });
  });
  
  // Generate 2-5 new matches to replace finished ones
  const newMatchesNeeded = randomInt(2, 5);
  for (let i = 0; i < newMatchesNeeded; i++) {
    matchCounter++;
    
    const randomLeagueName = randomItem(Object.keys(LEAGUES));
    const league = LEAGUES[randomLeagueName];
    const leagueTeams = LEAGUE_TEAMS[randomLeagueName] || [];
    
    if (leagueTeams.length < 2) continue;
    
    const homeTeam = randomItem(leagueTeams);
    let awayTeam = randomItem(leagueTeams);
    
    while (awayTeam.name === homeTeam.name) {
      awayTeam = randomItem(leagueTeams);
    }
    
    const minute = randomInt(1, 10);
    const winner = calculateWinner(league.sport);
    const score = generateScore(league.sport, winner);
    const odds = generateOdds(league.sport);
    
    updatedMatches.push({
      id: `match-${matchCounter}`,
      _id: `match-${matchCounter}`,
      sport: league.sport,
      league: randomLeagueName,
      country: league.country,
      homeTeam: {
        name: homeTeam.name,
        abbreviation: homeTeam.abbr
      },
      awayTeam: {
        name: awayTeam.name,
        abbreviation: awayTeam.abbr
      },
      score: score,
      status: 'FIRST_HALF',
      minute: minute,
      startsAt: new Date().toISOString(),
      odds: odds,
      markets: [],
      winner: winner,
      isFinished: false,
      result: null
    });
  }
  
  // Keep finished matches for history (limit to 100)
  const keepFinished = finishedMatches.slice(-100);
  allMatches = [...updatedMatches, ...keepFinished];
  
  console.log(`🔄 Matches updated: ${updatedMatches.filter(m => !m.isFinished).length} live, ${keepFinished.length} finished`);
  
  return allMatches;
};

// Start update interval (every 10 seconds)
setInterval(() => {
  updateMatches();
}, 10000);

// ============ EXPORTED HOOK ============
export const useOddsData = (initialSport = 'all') => {
  const [liveEvents, setLiveEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedSport, setSelectedSport] = useState(initialSport);

  const fetchLiveEvents = useCallback(() => {
    try {
      // Filter live matches (not finished)
      let filtered = allMatches.filter(m => !m.isFinished);
      
      if (selectedSport !== 'all') {
        filtered = filtered.filter(m => m.sport === selectedSport);
      }
      
      setLiveEvents(filtered);
      setLastUpdated(new Date());
      setError(null);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch live events');
      setLoading(false);
    }
  }, [selectedSport]);

  const fetchUpcomingEvents = useCallback(() => {
    try {
      // Show finished matches as "upcoming" (for history)
      let filtered = allMatches.filter(m => m.isFinished).slice(0, 30);
      
      if (selectedSport !== 'all') {
        filtered = filtered.filter(m => m.sport === selectedSport);
      }
      
      setUpcomingEvents(filtered);
    } catch (err) {
      console.error('Error fetching upcoming events:', err);
    }
  }, [selectedSport]);

  const changeSport = (sport) => {
    setSelectedSport(sport);
  };

  const refreshAll = () => {
    fetchLiveEvents();
    fetchUpcomingEvents();
  };

  const getMatchResult = (matchId) => {
    const match = allMatches.find(m => m.id === matchId || m._id === matchId);
    if (!match || !match.isFinished) return null;
    return match.result;
  };

  const getMatchById = (matchId) => {
    return allMatches.find(m => m.id === matchId || m._id === matchId);
  };

  useEffect(() => {
    fetchLiveEvents();
    fetchUpcomingEvents();

    const interval = setInterval(() => {
      fetchLiveEvents();
      fetchUpcomingEvents();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchLiveEvents, fetchUpcomingEvents]);

  useEffect(() => {
    fetchLiveEvents();
    fetchUpcomingEvents();
  }, [selectedSport, fetchLiveEvents, fetchUpcomingEvents]);

  return {
    liveEvents,
    upcomingEvents,
    loading,
    error,
    lastUpdated,
    selectedSport,
    changeSport,
    refreshAll,
    getMatchResult,
    getMatchById
  };
};