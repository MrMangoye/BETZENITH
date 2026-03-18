const Match = require('../models/Match');

module.exports = (io) => {
  // Track active match rooms
  const matchRooms = new Map();

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Subscribe to match updates
    socket.on('subscribe-match', async (matchId) => {
      socket.join(`match-${matchId}`);
      
      // Track subscription
      if (!matchRooms.has(matchId)) {
        matchRooms.set(matchId, new Set());
      }
      matchRooms.get(matchId).add(socket.id);

      // Send current match state
      const match = await Match.findById(matchId);
      if (match) {
        socket.emit('match-state', {
          _id: match._id,
          status: match.status,
          score: match.score,
          minute: match.minute,
          stats: match.liveStats,
          events: match.events?.slice(-10),
          markets: match.markets
        });
      }

      console.log(`📊 Client ${socket.id} subscribed to match ${matchId}`);
    });

    // Unsubscribe from match
    socket.on('unsubscribe-match', (matchId) => {
      socket.leave(`match-${matchId}`);
      
      if (matchRooms.has(matchId)) {
        matchRooms.get(matchId).delete(socket.id);
        if (matchRooms.get(matchId).size === 0) {
          matchRooms.delete(matchId);
        }
      }
    });

    // Get live matches list
    socket.on('get-live-matches', async () => {
      const liveMatches = await Match.find({
        status: { $in: ['LIVE', 'HALFTIME'] }
      }).select('homeTeam awayTeam score minute status league');

      socket.emit('live-matches-list', liveMatches);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
      
      // Clean up subscriptions
      for (const [matchId, subscribers] of matchRooms) {
        if (subscribers.has(socket.id)) {
          subscribers.delete(socket.id);
        }
      }
    });
  });

  // Return match rooms for external use
  return matchRooms;
};