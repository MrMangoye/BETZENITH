const mongoose = require('mongoose');
const Match = require('../models/Match');
const User = require('../models/User');
require('dotenv').config();

const leagues = [
  'Japan. Samurai League',
  'England. Premier League',
  'Spain. La Liga',
  'Germany. Bundesliga',
  'Italy. Serie A',
  'France. Ligue 1',
  'UEFA Champions League',
  'UEFA Europa League'
];

const teams = [
  { name: 'Shadow Warriors', abbr: 'S', country: 'Japan' },
  { name: 'Orchard SC', abbr: 'O', country: 'Japan' },
  { name: 'Red Dragons', abbr: 'R', country: 'England' },
  { name: 'Blue Lions', abbr: 'B', country: 'England' },
  { name: 'Golden Eagles', abbr: 'G', country: 'Spain' },
  { name: 'Silver Hawks', abbr: 'H', country: 'Spain' },
  { name: 'Iron Bulls', abbr: 'I', country: 'Germany' },
  { name: 'Steel Wolves', abbr: 'W', country: 'Germany' },
  { name: 'Thunder Strikers', abbr: 'T', country: 'Italy' },
  { name: 'Lightning Bolts', abbr: 'L', country: 'Italy' },
  { name: 'Phoenix Rising', abbr: 'P', country: 'France' },
  { name: 'Crimson Tide', abbr: 'C', country: 'France' }
];

const generateMatches = () => {
  const matches = [];
  const today = new Date();

  for (let i = 0; i < 60; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + (i % 30));

    const teamIndex1 = i % teams.length;
    const teamIndex2 = (i + 3) % teams.length;

    let status = 'SCHEDULED';
    if (i < 10) status = 'FINISHED';
    if (i >= 10 && i < 15) status = 'LIVE';
    if (i >= 15 && i < 20) status = 'HALFTIME';

    const markets = [
      { 
        name: '1', 
        odds: Number((1.5 + Math.random() * 2).toFixed(2)), 
        isActive: status !== 'FINISHED',
        volume: Math.floor(Math.random() * 100000),
        betsCount: Math.floor(Math.random() * 100)
      },
      { 
        name: 'X', 
        odds: Number((2.5 + Math.random() * 3).toFixed(2)), 
        isActive: status !== 'FINISHED',
        volume: Math.floor(Math.random() * 50000),
        betsCount: Math.floor(Math.random() * 50)
      },
      { 
        name: '2', 
        odds: Number((1.5 + Math.random() * 2).toFixed(2)), 
        isActive: status !== 'FINISHED',
        volume: Math.floor(Math.random() * 100000),
        betsCount: Math.floor(Math.random() * 100)
      },
      { 
        name: 'Over 2.5', 
        odds: Number((1.8 + Math.random() * 1.5).toFixed(2)), 
        isActive: status !== 'FINISHED',
        volume: Math.floor(Math.random() * 80000),
        betsCount: Math.floor(Math.random() * 80)
      }
    ];

    const homeScore = Math.floor(Math.random() * 4);
    const awayScore = Math.floor(Math.random() * 4);

    matches.push({
      league: leagues[i % leagues.length],
      homeTeam: {
        name: teams[teamIndex1].name,
        abbreviation: teams[teamIndex1].abbr,
        logo: `/teams/${teams[teamIndex1].abbr.toLowerCase()}.png`,
        form: ['W', 'W', 'L', 'D', 'W'].map(() => ['W', 'D', 'L'][Math.floor(Math.random() * 3)])
      },
      awayTeam: {
        name: teams[teamIndex2].name,
        abbreviation: teams[teamIndex2].abbr,
        logo: `/teams/${teams[teamIndex2].abbr.toLowerCase()}.png`,
        form: ['W', 'L', 'D', 'W', 'L'].map(() => ['W', 'D', 'L'][Math.floor(Math.random() * 3)])
      },
      date: date,
      time: `${String(10 + (i % 12)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
      venue: `${teams[teamIndex1].name} Stadium`,
      status: status,
      markets: markets,
      score: {
        home: status.includes('LIVE') || status === 'FINISHED' ? homeScore : 0,
        away: status.includes('LIVE') || status === 'FINISHED' ? awayScore : 0
      },
      liveStats: status.includes('LIVE') ? {
        possession: { home: 45 + Math.floor(Math.random() * 20), away: 35 + Math.floor(Math.random() * 20) },
        shotsOnTarget: { home: Math.floor(Math.random() * 8), away: Math.floor(Math.random() * 8) },
        corners: { home: Math.floor(Math.random() * 7), away: Math.floor(Math.random() * 7) },
        yellowCards: { home: Math.floor(Math.random() * 3), away: Math.floor(Math.random() * 3) },
        redCards: { home: Math.random() > 0.9 ? 1 : 0, away: Math.random() > 0.9 ? 1 : 0 }
      } : undefined,
      events: status === 'FINISHED' ? [
        {
          type: 'GOAL',
          minute: Math.floor(Math.random() * 90) + 1,
          team: 'home',
          player: 'Player Name',
          homeScore: 1,
          awayScore: 0
        }
      ] : [],
      betCount: Math.floor(Math.random() * 500),
      totalVolume: Math.floor(Math.random() * 500000),
      views: Math.floor(Math.random() * 10000),
      streamingUrl: status.includes('LIVE') ? 'https://example.com/stream' : undefined,
      hasLiveStream: status.includes('LIVE') && Math.random() > 0.5
    });
  }

  return matches;
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Clear existing data
    await Match.deleteMany({});
    console.log('🗑️ Cleared existing matches');

    // Create admin user if not exists
    const adminExists = await User.findOne({ email: 'admin@betfusion.com' });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@betfusion.com',
        password: 'Admin123!',
        role: 'admin',
        balance: 1000000,
        kycStatus: 'verified',
        kycLevel: 3
      });
      console.log('👤 Admin user created');
    }

    // Create test user if not exists
    const testUserExists = await User.findOne({ email: 'test@betfusion.com' });
    if (!testUserExists) {
      await User.create({
        username: 'testuser',
        email: 'test@betfusion.com',
        password: 'Test123!',
        balance: 5000,
        kycStatus: 'verified',
        kycLevel: 1
      });
      console.log('👤 Test user created');
    }

    // Seed matches
    const matches = generateMatches();
    await Match.insertMany(matches);
    console.log(`✅ Seeded ${matches.length} matches`);

    console.log('\n📝 Login Credentials:');
    console.log('Admin - admin@betfusion.com / Admin123!');
    console.log('Test User - test@betfusion.com / Test123!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();