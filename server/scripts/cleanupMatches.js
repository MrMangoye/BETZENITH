// server/scripts/cleanupMatches.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Match = require('../models/Match');

async function cleanupMatches() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Count before cleanup
    const beforeCount = await Match.countDocuments();
    console.log(`📊 Before cleanup: ${beforeCount} matches`);
    
    // Keep only:
    // - Scheduled matches (next 30 days)
    // - Live matches
    // - Finished matches from last 7 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    // Delete old finished matches (older than 7 days)
    const deletedOldFinished = await Match.deleteMany({
      status: 'FINISHED',
      startsAt: { $lt: sevenDaysAgo }
    });
    console.log(`🗑️ Deleted ${deletedOldFinished.deletedCount} old finished matches`);
    
    // Delete old scheduled matches (older than 30 days ago - shouldn't exist but just in case)
    const deletedOldScheduled = await Match.deleteMany({
      status: 'SCHEDULED',
      startsAt: { $lt: thirtyDaysAgo }
    });
    console.log(`🗑️ Deleted ${deletedOldScheduled.deletedCount} old scheduled matches`);
    
    // Limit scheduled matches to next 30 days
    const scheduledCount = await Match.countDocuments({
      status: 'SCHEDULED',
      startsAt: { $gt: new Date(), $lt: thirtyDaysFromNow }
    });
    console.log(`📅 Scheduled matches (next 30 days): ${scheduledCount}`);
    
    // Limit live matches
    const liveCount = await Match.countDocuments({ status: 'LIVE' });
    console.log(`🔴 Live matches: ${liveCount}`);
    
    // Limit finished matches (last 7 days)
    const finishedCount = await Match.countDocuments({
      status: 'FINISHED',
      startsAt: { $gt: sevenDaysAgo }
    });
    console.log(`🏁 Finished matches (last 7 days): ${finishedCount}`);
    
    // After cleanup
    const afterCount = await Match.countDocuments();
    console.log(`📊 After cleanup: ${afterCount} matches`);
    
    await mongoose.disconnect();
    console.log('✅ Cleanup complete');
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}

cleanupMatches();