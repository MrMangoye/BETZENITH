require('dotenv').config();
const mongoose = require('mongoose');
const Match = require('./models/Match');
const DataFeedService = require('./services/DataFeedService');

async function fixTeamNames() {
  console.log('🔧 Starting team name fix script...');
  console.log('=====================================');
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    
    // Run the fix
    console.log('\n🔨 Fixing team names via API...');
    const fixed = await DataFeedService.fixUnknownTeamNames();
    
    console.log('\n=====================================');
    console.log(`✅ Fixed ${fixed} matches`);
    console.log('=====================================');
    
    // Show sample of fixed matches
    const sampleMatches = await Match.find({
      league: { $in: ['Scottish Premiership', 'Danish Superliga'] }
    }).limit(5);
    
    console.log('\n📋 Sample matches in database:');
    sampleMatches.forEach((match, i) => {
      console.log(`   ${i+1}. ${match.homeTeam.name} vs ${match.awayTeam.name} (${match.league})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 MongoDB connection closed');
    process.exit(0);
  }
}

fixTeamNames();