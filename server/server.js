const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// ============ CONNECT DATAFEEDSERVICE TO SOCKET.IO ============
const DataFeedService = require('./services/DataFeedService');
DataFeedService.setSocketIO(io);

// ============ SECURITY MIDDLEWARE ============
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:5173'],
      imgSrc: ["'self'", "data:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
    }
  }
}));

// ============ RATE LIMITING ============
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// ============ CORS ============
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  exposedHeaders: ['Authorization']
}));

// ============ MIDDLEWARE ============
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());
app.use(morgan('dev'));

// ============ STATIC FILES ============
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============ SOCKET.IO ============
app.set('io', io);

// Track online users and match subscribers
const onlineUsers = new Map();
const matchSubscribers = new Map();

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  // User authentication
  socket.on('authenticate', (userId) => {
    socket.join(`user-${userId}`);
    onlineUsers.set(userId, socket.id);
    io.emit('user-online', { userId, online: onlineUsers.size });
    console.log(`👤 User ${userId} authenticated`);
  });
  
  // Subscribe to match updates
  socket.on('subscribe-to-match', (matchId) => {
    socket.join(`match-${matchId}`);
    
    // Track subscribers
    if (!matchSubscribers.has(matchId)) {
      matchSubscribers.set(matchId, new Set());
    }
    matchSubscribers.get(matchId).add(socket.id);
    
    console.log(`📊 Socket ${socket.id} subscribed to match ${matchId} (${matchSubscribers.get(matchId).size} total)`);
  });
  
  // Unsubscribe from match
  socket.on('unsubscribe-from-match', (matchId) => {
    socket.leave(`match-${matchId}`);
    
    if (matchSubscribers.has(matchId)) {
      matchSubscribers.get(matchId).delete(socket.id);
      if (matchSubscribers.get(matchId).size === 0) {
        matchSubscribers.delete(matchId);
      }
    }
  });
  
  // Get all live matches - FOR THE LIVE TICKER
  socket.on('get-live-matches', async () => {
    try {
      const Match = require('./models/Match');
      const liveMatches = await Match.find({
        status: { $in: ['LIVE', 'HALFTIME'] }
      }).select('homeTeam awayTeam score minute status league');
      
      socket.emit('live-matches-list', liveMatches);
      console.log(`📋 Sent ${liveMatches.length} live matches to client ${socket.id}`);
    } catch (error) {
      console.error('❌ Error fetching live matches:', error);
    }
  });
  
  // Join bet slip room (for cashout updates)
  socket.on('join-bet-slip', (betId) => {
    socket.join(`bet-${betId}`);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    // Remove from online users
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit('user-offline', { userId });
        break;
      }
    }
    
    // Remove from match subscribers
    for (const [matchId, subscribers] of matchSubscribers.entries()) {
      if (subscribers.has(socket.id)) {
        subscribers.delete(socket.id);
        if (subscribers.size === 0) {
          matchSubscribers.delete(matchId);
        }
      }
    }
    
    console.log('❌ Client disconnected:', socket.id);
  });
});

// ============ DATABASE CONNECTION ============
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    
    // ============ START REAL-TIME UPDATES ============
    try {
      const scheduler = require('./services/UpdateScheduler');
      scheduler.start();
      console.log('⏰ Real-time update scheduler started');
    } catch (error) {
      console.log('⚠️ Update scheduler not available yet');
    }
    
    // Check if we have matches, if not fetch from API
    const Match = require('./models/Match');
    
    Match.countDocuments().then(async (count) => {
      if (count === 0) {
        console.log('📋 No matches found, fetching from API...');
        try {
          const feedService = require('./services/DataFeedService');
          const fixtures = await feedService.fetchTodaysFixtures();
          console.log(`✅ Fetched ${fixtures.length} fixtures from API`);
        } catch (error) {
          console.log('⚠️ Could not fetch from API:', error.message);
        }
      } else {
        console.log(`📊 Found ${count} existing matches in database`);
      }
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

// ============ ROUTES ============
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/bets', require('./routes/bets'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/live', require('./routes/live'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/kyc', require('./routes/kyc'));
app.use('/api/odds', require('./routes/odds')); // ADDED ODDS ROUTE

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    onlineUsers: onlineUsers.size
  });
});

// ============ 404 HANDLER ============
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  // Don't leak error details in production
  const error = process.env.NODE_ENV === 'production' ? {} : { stack: err.stack };
  
  res.status(status).json({
    success: false,
    message,
    ...error
  });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Client URL: ${process.env.CLIENT_URL}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});