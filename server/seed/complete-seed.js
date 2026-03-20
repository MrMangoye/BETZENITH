// server/seed/complete-seed.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Match = require('../models/Match');
const Bet = require('../models/Bet');
const Transaction = require('../models/Transaction');
require('dotenv').config();

// ============ COMPLETE LEAGUE DATA ============
const LEAGUES = {
  // Soccer Leagues
  'Premier League': { country: 'England', sport: 'soccer', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', matchDuration: 90, matchesPerWeek: 10 },
  'La Liga': { country: 'Spain', sport: 'soccer', icon: '🇪🇸', matchDuration: 90, matchesPerWeek: 10 },
  'Bundesliga': { country: 'Germany', sport: 'soccer', icon: '🇩🇪', matchDuration: 90, matchesPerWeek: 9 },
  'Serie A': { country: 'Italy', sport: 'soccer', icon: '🇮🇹', matchDuration: 90, matchesPerWeek: 10 },
  'Ligue 1': { country: 'France', sport: 'soccer', icon: '🇫🇷', matchDuration: 90, matchesPerWeek: 9 },
  'Champions League': { country: 'Europe', sport: 'soccer', icon: '🏆', matchDuration: 90, matchesPerWeek: 8 },
  'Europa League': { country: 'Europe', sport: 'soccer', icon: '🏆', matchDuration: 90, matchesPerWeek: 8 },
  'World Cup': { country: 'International', sport: 'soccer', icon: '🌍', matchDuration: 90, matchesPerWeek: 4 },
  'MLS': { country: 'USA', sport: 'soccer', icon: '🇺🇸', matchDuration: 90, matchesPerWeek: 7 },
  'Brazil Serie A': { country: 'Brazil', sport: 'soccer', icon: '🇧🇷', matchDuration: 90, matchesPerWeek: 10 },
  'Eredivisie': { country: 'Netherlands', sport: 'soccer', icon: '🇳🇱', matchDuration: 90, matchesPerWeek: 9 },
  'Primeira Liga': { country: 'Portugal', sport: 'soccer', icon: '🇵🇹', matchDuration: 90, matchesPerWeek: 9 },
  'Turkish Super Lig': { country: 'Turkey', sport: 'soccer', icon: '🇹🇷', matchDuration: 90, matchesPerWeek: 9 },
  'Scottish Premiership': { country: 'Scotland', sport: 'soccer', icon: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', matchDuration: 90, matchesPerWeek: 6 },
  'Danish Superliga': { country: 'Denmark', sport: 'soccer', icon: '🇩🇰', matchDuration: 90, matchesPerWeek: 6 },
  'Belgian Pro League': { country: 'Belgium', sport: 'soccer', icon: '🇧🇪', matchDuration: 90, matchesPerWeek: 8 },
  'Austrian Bundesliga': { country: 'Austria', sport: 'soccer', icon: '🇦🇹', matchDuration: 90, matchesPerWeek: 6 },
  'Swiss Super League': { country: 'Switzerland', sport: 'soccer', icon: '🇨🇭', matchDuration: 90, matchesPerWeek: 6 },
  'Greek Super League': { country: 'Greece', sport: 'soccer', icon: '🇬🇷', matchDuration: 90, matchesPerWeek: 7 },
  'Russian Premier League': { country: 'Russia', sport: 'soccer', icon: '🇷🇺', matchDuration: 90, matchesPerWeek: 8 },
  'Ukrainian Premier League': { country: 'Ukraine', sport: 'soccer', icon: '🇺🇦', matchDuration: 90, matchesPerWeek: 6 },
  'Croatian HNL': { country: 'Croatia', sport: 'soccer', icon: '🇭🇷', matchDuration: 90, matchesPerWeek: 5 },
  'Czech First League': { country: 'Czech Republic', sport: 'soccer', icon: '🇨🇿', matchDuration: 90, matchesPerWeek: 5 },
  'Polish Ekstraklasa': { country: 'Poland', sport: 'soccer', icon: '🇵🇱', matchDuration: 90, matchesPerWeek: 6 },
  'Swedish Allsvenskan': { country: 'Sweden', sport: 'soccer', icon: '🇸🇪', matchDuration: 90, matchesPerWeek: 6 },
  'Norwegian Eliteserien': { country: 'Norway', sport: 'soccer', icon: '🇳🇴', matchDuration: 90, matchesPerWeek: 6 },
  'Finnish Veikkausliiga': { country: 'Finland', sport: 'soccer', icon: '🇫🇮', matchDuration: 90, matchesPerWeek: 5 },
  'Irish Premier Division': { country: 'Ireland', sport: 'soccer', icon: '🇮🇪', matchDuration: 90, matchesPerWeek: 5 },
  'Welsh Premier League': { country: 'Wales', sport: 'soccer', icon: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', matchDuration: 90, matchesPerWeek: 4 },
  'Northern Irish Premiership': { country: 'Northern Ireland', sport: 'soccer', icon: '🇬🇧', matchDuration: 90, matchesPerWeek: 4 },

  // Basketball Leagues
  'NBA': { country: 'USA', sport: 'basketball', icon: '🏀', matchDuration: 48, matchesPerWeek: 15 },
  'EuroLeague': { country: 'Europe', sport: 'basketball', icon: '🏀', matchDuration: 40, matchesPerWeek: 8 },
  'WNBA': { country: 'USA', sport: 'basketball', icon: '🏀', matchDuration: 40, matchesPerWeek: 6 },
  'NCAA Basketball': { country: 'USA', sport: 'basketball', icon: '🏀', matchDuration: 40, matchesPerWeek: 20 },
  'ACB': { country: 'Spain', sport: 'basketball', icon: '🏀', matchDuration: 40, matchesPerWeek: 8 },
  'NBL': { country: 'Australia', sport: 'basketball', icon: '🏀', matchDuration: 48, matchesPerWeek: 5 },
  'CBA': { country: 'China', sport: 'basketball', icon: '🏀', matchDuration: 48, matchesPerWeek: 8 },
  'VTB United League': { country: 'Russia', sport: 'basketball', icon: '🏀', matchDuration: 40, matchesPerWeek: 5 },
  'LNB Pro A': { country: 'France', sport: 'basketball', icon: '🏀', matchDuration: 40, matchesPerWeek: 5 },
  'BBL': { country: 'Germany', sport: 'basketball', icon: '🏀', matchDuration: 40, matchesPerWeek: 5 },
  'LBA': { country: 'Italy', sport: 'basketball', icon: '🏀', matchDuration: 40, matchesPerWeek: 5 },

  // American Football
  'NFL': { country: 'USA', sport: 'football', icon: '🏈', matchDuration: 60, matchesPerWeek: 16 },
  'NCAAF': { country: 'USA', sport: 'football', icon: '🏈', matchDuration: 60, matchesPerWeek: 30 },
  'CFL': { country: 'Canada', sport: 'football', icon: '🏈', matchDuration: 60, matchesPerWeek: 4 },
  'XFL': { country: 'USA', sport: 'football', icon: '🏈', matchDuration: 60, matchesPerWeek: 4 },
  'Super Bowl': { country: 'USA', sport: 'football', icon: '🏆', matchDuration: 60, matchesPerWeek: 1 },

  // Tennis
  'Wimbledon': { country: 'UK', sport: 'tennis', icon: '🎾', matchDuration: 5, matchesPerWeek: 60 },
  'US Open': { country: 'USA', sport: 'tennis', icon: '🎾', matchDuration: 5, matchesPerWeek: 60 },
  'French Open': { country: 'France', sport: 'tennis', icon: '🎾', matchDuration: 5, matchesPerWeek: 60 },
  'Australian Open': { country: 'Australia', sport: 'tennis', icon: '🎾', matchDuration: 5, matchesPerWeek: 60 },
  'ATP Tour': { country: 'Global', sport: 'tennis', icon: '🎾', matchDuration: 5, matchesPerWeek: 20 },
  'WTA Tour': { country: 'Global', sport: 'tennis', icon: '🎾', matchDuration: 5, matchesPerWeek: 20 },

  // Baseball
  'MLB': { country: 'USA', sport: 'baseball', icon: '⚾', matchDuration: 9, matchesPerWeek: 15 },
  'MLB Preseason': { country: 'USA', sport: 'baseball', icon: '⚾', matchDuration: 9, matchesPerWeek: 10 },
  'NPB': { country: 'Japan', sport: 'baseball', icon: '⚾', matchDuration: 9, matchesPerWeek: 12 },
  'KBO': { country: 'Korea', sport: 'baseball', icon: '⚾', matchDuration: 9, matchesPerWeek: 10 },

  // Hockey
  'NHL': { country: 'USA/Canada', sport: 'hockey', icon: '🏒', matchDuration: 60, matchesPerWeek: 12 },
  'KHL': { country: 'Russia', sport: 'hockey', icon: '🏒', matchDuration: 60, matchesPerWeek: 8 },
  'World Championship': { country: 'International', sport: 'hockey', icon: '🏒', matchDuration: 60, matchesPerWeek: 6 },
  'SHL': { country: 'Sweden', sport: 'hockey', icon: '🏒', matchDuration: 60, matchesPerWeek: 6 },
  'Liiga': { country: 'Finland', sport: 'hockey', icon: '🏒', matchDuration: 60, matchesPerWeek: 6 },
  'Czech Extraliga': { country: 'Czech Republic', sport: 'hockey', icon: '🏒', matchDuration: 60, matchesPerWeek: 6 },
  'Swiss National League': { country: 'Switzerland', sport: 'hockey', icon: '🏒', matchDuration: 60, matchesPerWeek: 6 },

  // MMA/Boxing
  'UFC': { country: 'USA', sport: 'mma', icon: '🥊', matchDuration: 5, matchesPerWeek: 12 },
  'Bellator': { country: 'USA', sport: 'mma', icon: '🥊', matchDuration: 5, matchesPerWeek: 4 },
  'ONE Championship': { country: 'Singapore', sport: 'mma', icon: '🥊', matchDuration: 5, matchesPerWeek: 4 },
  'PFL': { country: 'USA', sport: 'mma', icon: '🥊', matchDuration: 5, matchesPerWeek: 4 },
  'Heavyweight Boxing': { country: 'Global', sport: 'boxing', icon: '🥊', matchDuration: 12, matchesPerWeek: 3 },
  'Lightweight Boxing': { country: 'Global', sport: 'boxing', icon: '🥊', matchDuration: 12, matchesPerWeek: 3 },
  'Welterweight Boxing': { country: 'Global', sport: 'boxing', icon: '🥊', matchDuration: 12, matchesPerWeek: 3 },

  // Golf
  'PGA Tour': { country: 'USA', sport: 'golf', icon: '⛳', matchDuration: 4, matchesPerWeek: 8 },
  'The Masters': { country: 'USA', sport: 'golf', icon: '⛳', matchDuration: 4, matchesPerWeek: 1 },
  'The Open': { country: 'UK', sport: 'golf', icon: '⛳', matchDuration: 4, matchesPerWeek: 1 },
  'US Open Golf': { country: 'USA', sport: 'golf', icon: '⛳', matchDuration: 4, matchesPerWeek: 1 },
  'PGA Championship': { country: 'USA', sport: 'golf', icon: '⛳', matchDuration: 4, matchesPerWeek: 1 },
  'Ryder Cup': { country: 'International', sport: 'golf', icon: '⛳', matchDuration: 3, matchesPerWeek: 3 },

  // Cricket
  'IPL': { country: 'India', sport: 'cricket', icon: '🏏', matchDuration: 20, matchesPerWeek: 7 },
  'The Ashes': { country: 'England/Australia', sport: 'cricket', icon: '🏏', matchDuration: 5, matchesPerWeek: 2 },
  'Big Bash': { country: 'Australia', sport: 'cricket', icon: '🏏', matchDuration: 20, matchesPerWeek: 5 },
  'T20 World Cup': { country: 'International', sport: 'cricket', icon: '🏆', matchDuration: 20, matchesPerWeek: 4 },
  'World Cup': { country: 'International', sport: 'cricket', icon: '🏆', matchDuration: 50, matchesPerWeek: 4 },
  'County Championship': { country: 'England', sport: 'cricket', icon: '🏏', matchDuration: 4, matchesPerWeek: 6 },
  'Pakistan Super League': { country: 'Pakistan', sport: 'cricket', icon: '🏏', matchDuration: 20, matchesPerWeek: 5 },
  'Caribbean Premier League': { country: 'Caribbean', sport: 'cricket', icon: '🏏', matchDuration: 20, matchesPerWeek: 4 },
  'Bangladesh Premier League': { country: 'Bangladesh', sport: 'cricket', icon: '🏏', matchDuration: 20, matchesPerWeek: 4 },

  // Rugby
  'Six Nations': { country: 'Europe', sport: 'rugby', icon: '🏉', matchDuration: 80, matchesPerWeek: 3 },
  'Rugby World Cup': { country: 'International', sport: 'rugby', icon: '🏆', matchDuration: 80, matchesPerWeek: 4 },
  'Super Rugby': { country: 'Southern Hemisphere', sport: 'rugby', icon: '🏉', matchDuration: 80, matchesPerWeek: 6 },
  'Premiership Rugby': { country: 'England', sport: 'rugby', icon: '🏉', matchDuration: 80, matchesPerWeek: 5 },
  'Top 14': { country: 'France', sport: 'rugby', icon: '🏉', matchDuration: 80, matchesPerWeek: 6 },
  'United Rugby Championship': { country: 'Europe', sport: 'rugby', icon: '🏉', matchDuration: 80, matchesPerWeek: 8 },
  'The Rugby Championship': { country: 'Southern Hemisphere', sport: 'rugby', icon: '🏉', matchDuration: 80, matchesPerWeek: 3 },

  // Formula 1
  'Formula 1': { country: 'Global', sport: 'f1', icon: '🏎️', matchDuration: 58, matchesPerWeek: 1 },
  'F2 Championship': { country: 'Global', sport: 'f1', icon: '🏎️', matchDuration: 40, matchesPerWeek: 1 },
  'F3 Championship': { country: 'Global', sport: 'f1', icon: '🏎️', matchDuration: 30, matchesPerWeek: 1 },

  // Esports
  'League of Legends World Championship': { country: 'International', sport: 'esports', icon: '🎮', matchDuration: 5, matchesPerWeek: 8 },
  'Dota 2 International': { country: 'International', sport: 'esports', icon: '🎮', matchDuration: 5, matchesPerWeek: 8 },
  'CS:GO Major': { country: 'International', sport: 'esports', icon: '🎮', matchDuration: 5, matchesPerWeek: 8 },
  'Valorant Champions': { country: 'International', sport: 'esports', icon: '🎮', matchDuration: 5, matchesPerWeek: 6 },
  'Overwatch League': { country: 'International', sport: 'esports', icon: '🎮', matchDuration: 5, matchesPerWeek: 6 },
  'Rocket League Championship': { country: 'International', sport: 'esports', icon: '🎮', matchDuration: 5, matchesPerWeek: 4 }
};

// ============ TEAM DATA ============
const TEAMS = {
  // Premier League Teams
  'Premier League': [
    { name: 'Arsenal', abbr: 'ARS' }, { name: 'Aston Villa', abbr: 'AVL' }, { name: 'Bournemouth', abbr: 'BOU' },
    { name: 'Brentford', abbr: 'BRE' }, { name: 'Brighton', abbr: 'BHA' }, { name: 'Burnley', abbr: 'BUR' },
    { name: 'Chelsea', abbr: 'CHE' }, { name: 'Crystal Palace', abbr: 'CRY' }, { name: 'Everton', abbr: 'EVE' },
    { name: 'Fulham', abbr: 'FUL' }, { name: 'Liverpool', abbr: 'LIV' }, { name: 'Luton Town', abbr: 'LUT' },
    { name: 'Manchester City', abbr: 'MCI' }, { name: 'Manchester United', abbr: 'MUN' }, { name: 'Newcastle United', abbr: 'NEW' },
    { name: 'Nottingham Forest', abbr: 'NFO' }, { name: 'Sheffield United', abbr: 'SHU' }, { name: 'Tottenham Hotspur', abbr: 'TOT' },
    { name: 'West Ham United', abbr: 'WHU' }, { name: 'Wolverhampton Wanderers', abbr: 'WOL' }
  ],
  'La Liga': [
    { name: 'Real Madrid', abbr: 'RMA' }, { name: 'Barcelona', abbr: 'BAR' }, { name: 'Atletico Madrid', abbr: 'ATM' },
    { name: 'Real Sociedad', abbr: 'RSO' }, { name: 'Athletic Bilbao', abbr: 'ATH' }, { name: 'Real Betis', abbr: 'BET' },
    { name: 'Valencia', abbr: 'VAL' }, { name: 'Villarreal', abbr: 'VIL' }, { name: 'Sevilla', abbr: 'SEV' },
    { name: 'Osasuna', abbr: 'OSA' }, { name: 'Getafe', abbr: 'GET' }, { name: 'Celta Vigo', abbr: 'CEL' },
    { name: 'Alaves', abbr: 'ALA' }, { name: 'Las Palmas', abbr: 'LPA' }, { name: 'Cadiz', abbr: 'CAD' },
    { name: 'Mallorca', abbr: 'MLL' }, { name: 'Granada', abbr: 'GRA' }, { name: 'Almeria', abbr: 'ALM' },
    { name: 'Girona', abbr: 'GIR' }, { name: 'Rayo Vallecano', abbr: 'RAY' }
  ],
  'Bundesliga': [
    { name: 'Bayern Munich', abbr: 'BAY' }, { name: 'Borussia Dortmund', abbr: 'DOR' }, { name: 'RB Leipzig', abbr: 'RBL' },
    { name: 'Bayer Leverkusen', abbr: 'LEV' }, { name: 'Eintracht Frankfurt', abbr: 'SGE' }, { name: 'Wolfsburg', abbr: 'WOL' },
    { name: 'Monchengladbach', abbr: 'BMG' }, { name: 'Stuttgart', abbr: 'STU' }, { name: 'Hoffenheim', abbr: 'HOF' },
    { name: 'Freiburg', abbr: 'FRE' }, { name: 'Mainz', abbr: 'MAI' }, { name: 'Augsburg', abbr: 'AUG' },
    { name: 'Cologne', abbr: 'KOL' }, { name: 'Werder Bremen', abbr: 'BRE' }, { name: 'Union Berlin', abbr: 'UNB' },
    { name: 'Bochum', abbr: 'BOC' }, { name: 'Heidenheim', abbr: 'HEI' }, { name: 'Darmstadt', abbr: 'DAR' }
  ],
  'Serie A': [
    { name: 'Inter Milan', abbr: 'INT' }, { name: 'AC Milan', abbr: 'MIL' }, { name: 'Juventus', abbr: 'JUV' },
    { name: 'Napoli', abbr: 'NAP' }, { name: 'Roma', abbr: 'ROM' }, { name: 'Lazio', abbr: 'LAZ' },
    { name: 'Atalanta', abbr: 'ATA' }, { name: 'Fiorentina', abbr: 'FIO' }, { name: 'Torino', abbr: 'TOR' },
    { name: 'Bologna', abbr: 'BOL' }, { name: 'Monza', abbr: 'MNZ' }, { name: 'Genoa', abbr: 'GEN' },
    { name: 'Udinese', abbr: 'UDI' }, { name: 'Sassuolo', abbr: 'SAS' }, { name: 'Lecce', abbr: 'LEC' },
    { name: 'Empoli', abbr: 'EMP' }, { name: 'Cagliari', abbr: 'CAG' }, { name: 'Salernitana', abbr: 'SAL' },
    { name: 'Verona', abbr: 'VER' }, { name: 'Frosinone', abbr: 'FRO' }
  ],
  'Ligue 1': [
    { name: 'PSG', abbr: 'PSG' }, { name: 'Marseille', abbr: 'MAR' }, { name: 'Monaco', abbr: 'MON' },
    { name: 'Lyon', abbr: 'LYO' }, { name: 'Lille', abbr: 'LIL' }, { name: 'Rennes', abbr: 'REN' },
    { name: 'Nice', abbr: 'NIC' }, { name: 'Lens', abbr: 'LEN' }, { name: 'Strasbourg', abbr: 'STR' },
    { name: 'Montpellier', abbr: 'MPL' }, { name: 'Nantes', abbr: 'NAN' }, { name: 'Reims', abbr: 'REI' },
    { name: 'Toulouse', abbr: 'TLS' }, { name: 'Brest', abbr: 'BRE' }, { name: 'Clermont', abbr: 'CLE' },
    { name: 'Lorient', abbr: 'LOR' }, { name: 'Metz', abbr: 'MET' }, { name: 'Le Havre', abbr: 'LEH' }
  ]
};

// Add default teams for leagues without specific team data
const getDefaultTeams = (leagueName) => {
  return [
    { name: `${leagueName} Team 1`, abbr: `${leagueName.substring(0, 3).toUpperCase()}1` },
    { name: `${leagueName} Team 2`, abbr: `${leagueName.substring(0, 3).toUpperCase()}2` },
    { name: `${leagueName} Team 3`, abbr: `${leagueName.substring(0, 3).toUpperCase()}3` },
    { name: `${leagueName} Team 4`, abbr: `${leagueName.substring(0, 3).toUpperCase()}4` },
    { name: `${leagueName} Team 5`, abbr: `${leagueName.substring(0, 3).toUpperCase()}5` },
    { name: `${leagueName} Team 6`, abbr: `${leagueName.substring(0, 3).toUpperCase()}6` },
    { name: `${leagueName} Team 7`, abbr: `${leagueName.substring(0, 3).toUpperCase()}7` },
    { name: `${leagueName} Team 8`, abbr: `${leagueName.substring(0, 3).toUpperCase()}8` }
  ];
};

// Helper functions
const randomItem = (array) => array[Math.floor(Math.random() * array.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateMatchDate = (league, status) => {
  const now = new Date();
  const matchDate = new Date(now);
  
  switch(status) {
    case 'LIVE':
    case 'FIRST_HALF':
    case 'SECOND_HALF':
      matchDate.setHours(now.getHours() - randomInt(0, 2));
      matchDate.setMinutes(randomInt(0, 59));
      break;
    case 'SCHEDULED':
      matchDate.setDate(now.getDate() + randomInt(1, 7));
      matchDate.setHours(randomInt(12, 22), randomInt(0, 59), 0);
      break;
    case 'FINISHED':
      matchDate.setDate(now.getDate() - randomInt(1, 3));
      matchDate.setHours(randomInt(12, 22), randomInt(0, 59), 0);
      break;
  }
  return matchDate;
};

const generateScore = (sport) => {
  if (sport === 'soccer') return { home: randomInt(0, 3), away: randomInt(0, 3) };
  if (sport === 'basketball') return { home: randomInt(85, 115), away: randomInt(85, 115) };
  if (sport === 'football') return { home: randomInt(7, 35), away: randomInt(7, 35) };
  if (sport === 'baseball') return { home: randomInt(1, 8), away: randomInt(1, 8) };
  if (sport === 'hockey') return { home: randomInt(1, 5), away: randomInt(1, 5) };
  if (sport === 'tennis') return { home: randomInt(0, 3), away: randomInt(0, 3) };
  return { home: randomInt(0, 2), away: randomInt(0, 2) };
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

// ============ UPDATED: Generate Markets with Valid Enum Values ============
const generateMarkets = (sport, odds) => {
  const markets = [
    { name: '1', odds: odds.home, isActive: true },
    ...(odds.draw ? [{ name: 'X', odds: odds.draw, isActive: true }] : []),
    { name: '2', odds: odds.away, isActive: true },
  ];
  
  // Only add extra markets for soccer (using valid enum names)
  if (sport === 'soccer') {
    markets.push(
      { name: 'Over 2.5', odds: 1.95, isActive: true },
      { name: 'Under 2.5', odds: 1.95, isActive: true },
      { name: 'BTTS', odds: 1.90, isActive: true }
    );
  } else if (sport === 'basketball') {
    markets.push(
      { name: 'Over 220.5', odds: 1.90, isActive: true },
      { name: 'Under 220.5', odds: 1.90, isActive: true }
    );
  }
  
  return markets;
};

// Generate matches for ALL leagues
const generateAllMatches = () => {
  const allMatches = [];
  let matchCounter = 0;
  
  Object.keys(LEAGUES).forEach(leagueName => {
    const league = LEAGUES[leagueName];
    
    // Get teams for this league
    let teams = TEAMS[leagueName];
    if (!teams) {
      teams = getDefaultTeams(leagueName);
    }
    
    if (teams.length < 2) return;
    
    // Generate matches for this league (minimum 5, up to matchesPerWeek)
    const numMatches = Math.max(5, league.matchesPerWeek || 8);
    
    for (let i = 0; i < numMatches; i++) {
      matchCounter++;
      
      // Select teams
      const homeTeam = randomItem(teams);
      let awayTeam = randomItem(teams);
      while (awayTeam.name === homeTeam.name) {
        awayTeam = randomItem(teams);
      }
      
      // Determine status (33% live, 33% scheduled, 34% finished)
      const rand = Math.random();
      let status, minute, isFinished;
      
      if (rand < 0.33) {
        status = randomItem(['LIVE', 'FIRST_HALF', 'SECOND_HALF']);
        minute = randomInt(10, league.matchDuration - 5);
        isFinished = false;
      } else if (rand < 0.66) {
        status = 'SCHEDULED';
        minute = 0;
        isFinished = false;
      } else {
        status = 'FINISHED';
        minute = league.matchDuration;
        isFinished = true;
      }
      
      const matchDate = generateMatchDate(leagueName, status);
      const score = generateScore(league.sport);
      const odds = generateOdds(league.sport);
      const markets = generateMarkets(league.sport, odds);
      
      allMatches.push({
        _id: new mongoose.Types.ObjectId(),
        sport: league.sport,
        league: leagueName,
        country: league.country,
        homeTeam: {
          name: homeTeam.name,
          abbreviation: homeTeam.abbr,
          logo: null
        },
        awayTeam: {
          name: awayTeam.name,
          abbreviation: awayTeam.abbr,
          logo: null
        },
        score: score,
        status: status,
        minute: minute,
        date: matchDate,
        time: matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        startsAt: matchDate.toISOString(),
        odds: odds,
        markets: markets,
        isFinished: isFinished,
        result: isFinished ? (score.home > score.away ? 'HOME' : score.away > score.home ? 'AWAY' : 'DRAW') : null
      });
    }
  });
  
  console.log(`✅ Generated ${allMatches.length} matches across ${Object.keys(LEAGUES).length} leagues`);
  return allMatches;
};

// Main seed function
const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Match.deleteMany({});
    await Bet.deleteMany({});
    await Transaction.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Create users
    const superAdmin = await User.create({
      username: 'superadmin',
      email: 'superadmin@betfusion.com',
      password: 'SuperAdmin123!',
      role: 'superadmin',
      balance: 1000000,
      kycStatus: 'verified',
      kycLevel: 3,
      isVerified: true,
      phoneNumber: '+254700000001',
      country: 'Kenya'
    });
    console.log('👑 Super Admin created');

    const admin = await User.create({
      username: 'admin',
      email: 'admin@betfusion.com',
      password: 'Admin123!',
      role: 'admin',
      balance: 500000,
      kycStatus: 'verified',
      kycLevel: 3,
      isVerified: true,
      phoneNumber: '+254700000002',
      country: 'Kenya'
    });
    console.log('👤 Admin created');

    const testUser = await User.create({
      username: 'testuser',
      email: 'test@betfusion.com',
      password: 'Test123!',
      balance: 5000,
      kycStatus: 'verified',
      kycLevel: 1,
      phoneNumber: '+254700000003',
      country: 'Kenya'
    });
    console.log('👤 Test user created');

    // Generate and save matches
    const matches = generateAllMatches();
    await Match.insertMany(matches);
    console.log(`✅ Seeded ${matches.length} matches`);

    // Create sample bets for test user
    const finishedMatches = matches.filter(m => m.isFinished);
    const liveMatches = matches.filter(m => m.status === 'LIVE' || m.status === 'FIRST_HALF' || m.status === 'SECOND_HALF');
    
    // Winning bets
    for (let i = 0; i < 3 && i < finishedMatches.length; i++) {
      const match = finishedMatches[i];
      await Bet.create({
        user: testUser._id,
        type: 'SINGLE',
        selections: [{
          match: match._id,
          marketIndex: 0,
          marketName: '1',
          odds: match.odds.home,
          status: 'WON'
        }],
        totalOdds: match.odds.home,
        stake: randomInt(100, 500),
        potentialWin: randomInt(200, 1000),
        status: 'WON',
        winnings: randomInt(200, 1000),
        createdAt: new Date(Date.now() - randomInt(1, 5) * 24 * 60 * 60 * 1000)
      });
    }
    
    // Losing bets
    for (let i = 0; i < 3 && i < finishedMatches.length; i++) {
      const match = finishedMatches[i];
      await Bet.create({
        user: testUser._id,
        type: 'SINGLE',
        selections: [{
          match: match._id,
          marketIndex: 2,
          marketName: '2',
          odds: match.odds.away,
          status: 'LOST'
        }],
        totalOdds: match.odds.away,
        stake: randomInt(100, 500),
        potentialWin: randomInt(200, 1000),
        status: 'LOST',
        createdAt: new Date(Date.now() - randomInt(1, 5) * 24 * 60 * 60 * 1000)
      });
    }
    
    // Pending bets
    for (let i = 0; i < 3 && i < liveMatches.length; i++) {
      const match = liveMatches[i];
      await Bet.create({
        user: testUser._id,
        type: 'SINGLE',
        selections: [{
          match: match._id,
          marketIndex: 0,
          marketName: '1',
          odds: match.odds.home,
          status: 'PENDING'
        }],
        totalOdds: match.odds.home,
        stake: randomInt(100, 500),
        potentialWin: randomInt(200, 1000),
        status: 'PENDING',
        createdAt: new Date()
      });
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📝 LOGIN CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 Super Admin: superadmin@betfusion.com / SuperAdmin123!');
    console.log('👤 Admin: admin@betfusion.com / Admin123!');
    console.log('👤 Test User: test@betfusion.com / Test123!\n');
    
    console.log('📊 STATISTICS:');
    console.log(`👥 Total Users: 3`);
    console.log(`⚽ Total Matches: ${matches.length}`);
    console.log(`🏆 Leagues: ${Object.keys(LEAGUES).length}`);
    console.log(`🔴 Live: ${matches.filter(m => m.status === 'LIVE' || m.status === 'FIRST_HALF' || m.status === 'SECOND_HALF').length}`);
    console.log(`📅 Scheduled: ${matches.filter(m => m.status === 'SCHEDULED').length}`);
    console.log(`🏁 Finished: ${matches.filter(m => m.isFinished).length}`);
    console.log(`🎲 Sample Bets: ${await Bet.countDocuments()}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();