const cron = require('node-cron');
const feedService = require('./DataFeedService');

class UpdateScheduler {
  constructor() {
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    
    console.log('⏰ Starting real-time update scheduler...');

    // Update live matches every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
      await feedService.processLiveMatches();
    });

    // Clean up old matches at midnight
    cron.schedule('0 0 * * *', async () => {
      await this.cleanupOldMatches();
    });

    this.isRunning = true;
    console.log('✅ Real-time updates activated');
  }

  async cleanupOldMatches() {
    const Match = require('../models/Match');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await Match.deleteMany({
      status: 'FINISHED',
      date: { $lt: sevenDaysAgo }
    });

    console.log('🧹 Cleaned up old matches');
  }
}

module.exports = new UpdateScheduler();