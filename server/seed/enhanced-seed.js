// server/seed/enhanced-seed.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Match = require('../models/Match');
const Bet = require('../models/Bet');
const Transaction = require('../models/Transaction');
const { generateAllMatches } = require('../data/enhancedMatches');
require('dotenv').config();

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
    const matches = generateAllMatches();
    await Match.insertMany(matches);
    console.log(`✅ Seeded ${matches.length} matches`);

    // ============ CREATE SAMPLE BETS ============
    const finishedMatches = matches.filter(m => m.isFinished);
    const scheduledMatches = matches.filter(m => m.status === 'SCHEDULED');
    
    // Create some winning bets for test user
    for (let i = 0; i < 5; i++) {
      if (finishedMatches[i]) {
        const match = finishedMatches[i];
        const marketIndex = 0; // '1' market
        const stake = randomInt(100, 1000);
        const odds = match.odds.home;
        const potentialWin = stake * odds;
        
        const bet = await Bet.create({
          user: testUser._id,
          type: 'SINGLE',
          selections: [{
            match: match._id,
            marketIndex: marketIndex,
            marketName: '1',
            odds: odds,
            status: 'WON'
          }],
          totalOdds: odds,
          stake: stake,
          potentialWin: potentialWin,
          status: 'WON',
          winnings: potentialWin,
          createdAt: new Date(Date.now() - randomInt(1, 10) * 24 * 60 * 60 * 1000)
        });
        
        // Create transaction
        await Transaction.create({
          user: testUser._id,
          type: 'BET_WON',
          amount: potentialWin,
          bet: bet._id,
          status: 'COMPLETED',
          description: `Bet won: ${match.homeTeam.name} vs ${match.awayTeam.name}`
        });
      }
    }
    
    // Create some losing bets
    for (let i = 5; i < 10; i++) {
      if (finishedMatches[i]) {
        const match = finishedMatches[i];
        const marketIndex = 1; // 'X' market
        const stake = randomInt(100, 1000);
        const odds = match.odds.draw || 3.40;
        
        await Bet.create({
          user: testUser._id,
          type: 'SINGLE',
          selections: [{
            match: match._id,
            marketIndex: marketIndex,
            marketName: 'X',
            odds: odds,
            status: 'LOST'
          }],
          totalOdds: odds,
          stake: stake,
          potentialWin: stake * odds,
          status: 'LOST',
          createdAt: new Date(Date.now() - randomInt(1, 10) * 24 * 60 * 60 * 1000)
        });
      }
    }
    
    // Create some pending bets
    for (let i = 0; i < 3; i++) {
      if (scheduledMatches[i]) {
        const match = scheduledMatches[i];
        const marketIndex = randomInt(0, 2);
        const marketName = marketIndex === 0 ? '1' : marketIndex === 1 ? 'X' : '2';
        const stake = randomInt(200, 800);
        const odds = marketIndex === 0 ? match.odds.home : 
                    marketIndex === 1 ? (match.odds.draw || 3.40) : match.odds.away;
        
        await Bet.create({
          user: testUser._id,
          type: 'SINGLE',
          selections: [{
            match: match._id,
            marketIndex: marketIndex,
            marketName: marketName,
            odds: odds,
            status: 'PENDING'
          }],
          totalOdds: odds,
          stake: stake,
          potentialWin: stake * odds,
          status: 'PENDING',
          createdAt: new Date()
        });
      }
    }
    
    console.log('✅ Created sample bets for test user');

    // Update test user balance after bets
    testUser.balance = 5000 - 3000 + 2000; // Rough estimate
    await testUser.save();

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
    console.log(`🔴 Live: ${matches.filter(m => !m.isFinished && m.status !== 'SCHEDULED' && m.status !== 'FINISHED').length}`);
    console.log(`📅 Scheduled: ${matches.filter(m => m.status === 'SCHEDULED').length}`);
    console.log(`🏁 Finished: ${matches.filter(m => m.isFinished).length}`);
    console.log(`🎲 Sample Bets: ${await Bet.countDocuments({ user: testUser._id })}`);

    console.log('\n🚀 Server ready to start!');
    console.log('='.repeat(50));

    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Helper function
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

seedDatabase();