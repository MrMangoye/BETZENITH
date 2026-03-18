const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Match = require('../models/Match');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Match.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // ============ CREATE USERS ============
    
    // Super Admin
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
    console.log('👑 Super Admin created:', superAdmin.email);

    // Admin
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
    console.log('👤 Admin created:', admin.email);

    // Test User
    const testUser = await User.create({
      username: 'testuser',
      email: 'test@betfusion.com',
      password: 'Test123!',
      balance: 5000,
      kycStatus: 'verified',
      kycLevel: 1,
      phoneNumber: '+254700000003',
      country: 'Kenya',
      notificationSettings: {
        email: { bets: true, promotions: true, security: true },
        push: { bets: true, live: true, promotions: false }
      }
    });
    console.log('👤 Test user created:', testUser.email);

    // ============ CREATE MATCHES ============

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

    const matches = [];
    const today = new Date();

    // Create 60 matches exactly like BetCenic
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + (i % 30));

      const team1 = teams[i % teams.length];
      const team2 = teams[(i + 3) % teams.length];
      
      // 80% finished, 10% live, 10% scheduled
      let status = 'SCHEDULED';
      let score = { home: 0, away: 0 };
      let isActive = true;
      
      if (i < 48) { // 48 matches finished (80%)
        status = 'FINISHED';
        score = {
          home: Math.floor(Math.random() * 4) + 1,
          away: Math.floor(Math.random() * 3)
        };
        isActive = false;
      } else if (i < 54) { // 6 matches live (10%)
        status = Math.random() > 0.5 ? 'LIVE' : 'HALFTIME';
        score = {
          home: Math.floor(Math.random() * 3),
          away: Math.floor(Math.random() * 3)
        };
      }

      matches.push({
        league: leagues[i % leagues.length],
        homeTeam: {
          name: team1.name,
          abbreviation: team1.abbr,
          logo: `/teams/${team1.abbr.toLowerCase()}.png`,
          form: ['W', 'W', 'L', 'D', 'W'].map(() => 
            ['W', 'D', 'L'][Math.floor(Math.random() * 3)]
          )
        },
        awayTeam: {
          name: team2.name,
          abbreviation: team2.abbr,
          logo: `/teams/${team2.abbr.toLowerCase()}.png`,
          form: ['W', 'L', 'D', 'W', 'L'].map(() => 
            ['W', 'D', 'L'][Math.floor(Math.random() * 3)]
          )
        },
        date: date,
        time: '02:45',
        venue: `${team1.name} Stadium`,
        status: status,
        markets: [
          { 
            name: '1', 
            odds: Number((1.5 + Math.random() * 2).toFixed(2)), 
            isActive: isActive,
            volume: Math.floor(Math.random() * 100000),
            betsCount: Math.floor(Math.random() * 100)
          },
          { 
            name: 'X', 
            odds: Number((2.5 + Math.random() * 3).toFixed(2)), 
            isActive: isActive,
            volume: Math.floor(Math.random() * 50000),
            betsCount: Math.floor(Math.random() * 50)
          },
          { 
            name: '2', 
            odds: Number((1.5 + Math.random() * 2).toFixed(2)), 
            isActive: isActive,
            volume: Math.floor(Math.random() * 100000),
            betsCount: Math.floor(Math.random() * 100)
          },
          { 
            name: 'Over 2.5', 
            odds: Number((1.8 + Math.random() * 1.5).toFixed(2)), 
            isActive: isActive,
            volume: Math.floor(Math.random() * 80000),
            betsCount: Math.floor(Math.random() * 80)
          }
        ],
        score: score,
        views: Math.floor(Math.random() * 10000),
        betCount: Math.floor(Math.random() * 500),
        totalVolume: Math.floor(Math.random() * 500000)
      });
    }

    await Match.insertMany(matches);
    console.log(`✅ Seeded ${matches.length} matches`);

    console.log('\n' + '='.repeat(50));
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📝 LOGIN CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 Super Admin:');
    console.log('   Email: superadmin@betfusion.com');
    console.log('   Password: SuperAdmin123!');
    console.log('   Role: superadmin\n');
    
    console.log('👤 Admin:');
    console.log('   Email: admin@betfusion.com');
    console.log('   Password: Admin123!');
    console.log('   Role: admin\n');
    
    console.log('👤 Test User:');
    console.log('   Email: test@betfusion.com');
    console.log('   Password: Test123!');
    console.log('   Role: user\n');
    
    console.log('📊 STATISTICS:');
    console.log('━━━━━━━━━━━━━━');
    console.log(`👥 Total Users: 3`);
    console.log(`⚽ Total Matches: ${matches.length}`);
    console.log(`🏁 Finished: ${matches.filter(m => m.status === 'FINISHED').length}`);
    console.log(`🔴 Live: ${matches.filter(m => ['LIVE', 'HALFTIME'].includes(m.status)).length}`);
    console.log(`📅 Scheduled: ${matches.filter(m => m.status === 'SCHEDULED').length}`);
    
    console.log('\n🚀 Server ready to start!');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();