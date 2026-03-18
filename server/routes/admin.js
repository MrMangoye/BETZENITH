const express = require('express');
const { protect, admin } = require('../middleware/auth');
const { 
  createMatchValidation, 
  updateMatchValidation, 
  settleMatchValidation,
  updateUserRoleValidation 
} = require('../middleware/validation');
const User = require('../models/User');
const Match = require('../models/Match');
const Bet = require('../models/Bet');
const Transaction = require('../models/Transaction');

const router = express.Router();

// All routes require admin authentication
router.use(protect, admin);

// ============ DASHBOARD ============

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    // Get statistics
    const stats = {
      users: {
        total: await User.countDocuments(),
        today: await User.countDocuments({ createdAt: { $gte: today } }),
        week: await User.countDocuments({ createdAt: { $gte: weekAgo } }),
        month: await User.countDocuments({ createdAt: { $gte: monthAgo } }),
        active: await User.countDocuments({ lastLogin: { $gte: weekAgo } }),
        online: 0 // Would come from socket.io
      },
      matches: {
        total: await Match.countDocuments(),
        live: await Match.countDocuments({ status: { $in: ['LIVE', 'HALFTIME', 'SECOND_HALF'] } }),
        today: await Match.countDocuments({ 
          date: { $gte: today },
          status: { $ne: 'FINISHED' }
        }),
        finished: await Match.countDocuments({ status: 'FINISHED' })
      },
      bets: {
        total: await Bet.countDocuments(),
        pending: await Bet.countDocuments({ status: 'PENDING' }),
        today: await Bet.countDocuments({ createdAt: { $gte: today } }),
        week: await Bet.countDocuments({ createdAt: { $gte: weekAgo } }),
        month: await Bet.countDocuments({ createdAt: { $gte: monthAgo } })
      },
      volume: {
        totalStake: (await Bet.aggregate([
          { $group: { _id: null, total: { $sum: '$stake' } } }
        ]))[0]?.total || 0,
        todayStake: (await Bet.aggregate([
          { $match: { createdAt: { $gte: today } } },
          { $group: { _id: null, total: { $sum: '$stake' } } }
        ]))[0]?.total || 0,
        totalPayout: (await Bet.aggregate([
          { $match: { status: 'WON' } },
          { $group: { _id: null, total: { $sum: '$potentialWin' } } }
        ]))[0]?.total || 0,
        profit: 0 // Would calculate from stakes minus payouts
      },
      transactions: {
        totalDeposits: (await Transaction.aggregate([
          { $match: { type: 'DEPOSIT', status: 'COMPLETED' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]))[0]?.total || 0,
        totalWithdrawals: (await Transaction.aggregate([
          { $match: { type: 'WITHDRAWAL', status: 'COMPLETED' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]))[0]?.total || 0,
        pendingWithdrawals: await Transaction.countDocuments({ 
          type: 'WITHDRAWAL', 
          status: 'PROCESSING' 
        })
      }
    };

    // Calculate profit
    stats.volume.profit = stats.volume.totalStake - stats.volume.totalPayout;

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ============ MATCH MANAGEMENT ============

// @route   POST /api/admin/matches
// @desc    Create match
// @access  Admin
router.post('/matches', createMatchValidation, async (req, res) => {
  try {
    const match = await Match.create(req.body);
    
    // Emit socket event
    const io = req.app.get('io');
    io.emit('new-match', match);
    
    res.status(201).json({
      success: true,
      message: 'Match created successfully',
      data: match
    });
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/matches/:id
// @desc    Update match
// @access  Admin
router.put('/matches/:id', updateMatchValidation, async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`match-${match._id}`).emit('match-updated', match);
    
    res.json({
      success: true,
      message: 'Match updated successfully',
      data: match
    });
  } catch (error) {
    console.error('Update match error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/matches/:id/odds
// @desc    Update match odds
// @access  Admin
router.post('/matches/:id/odds', async (req, res) => {
  try {
    const { marketIndex, newOdds } = req.body;
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    await match.updateOdds(marketIndex, newOdds, 'admin');
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`match-${match._id}`).emit('odds-updated', {
      matchId: match._id,
      marketIndex,
      newOdds
    });
    
    res.json({
      success: true,
      message: 'Odds updated successfully'
    });
  } catch (error) {
    console.error('Update odds error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/matches/:id/status
// @desc    Update match status
// @access  Admin
router.post('/matches/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    match.status = status;
    await match.save();
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`match-${match._id}`).emit('match-status-updated', {
      matchId: match._id,
      status
    });
    
    res.json({
      success: true,
      message: 'Match status updated',
      data: { status: match.status }
    });
  } catch (error) {
    console.error('Update match status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/matches/:id/event
// @desc    Add match event (goal, card, etc.)
// @access  Admin
router.post('/matches/:id/event', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    const event = await match.addEvent(req.body);
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`match-${match._id}`).emit('match-event', {
      matchId: match._id,
      event
    });
    
    // If goal, also emit score update
    if (event.type === 'GOAL') {
      io.to(`match-${match._id}`).emit('score-updated', {
        matchId: match._id,
        score: match.score
      });
    }
    
    res.json({
      success: true,
      message: 'Event added',
      data: event
    });
  } catch (error) {
    console.error('Add event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/matches/:id/stats
// @desc    Update live stats
// @access  Admin
router.post('/matches/:id/stats', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    await match.updateLiveStats(req.body);
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`match-${match._id}`).emit('stats-updated', {
      matchId: match._id,
      stats: match.liveStats
    });
    
    res.json({
      success: true,
      message: 'Stats updated',
      data: match.liveStats
    });
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/matches/:id/settle
// @desc    Settle match
// @access  Admin
router.post('/matches/:id/settle', settleMatchValidation, async (req, res) => {
  try {
    const { winner } = req.body;
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    if (match.status === 'FINISHED') {
      return res.status(400).json({
        success: false,
        message: 'Match already settled'
      });
    }
    
    match.status = 'FINISHED';
    match.result = { 
      winner, 
      isSettled: true, 
      settledAt: new Date(),
      settledBy: req.user._id
    };
    await match.save();
    
    // Find all pending bets for this match
    const bets = await Bet.find({
      'selections.match': match._id,
      'selections.status': 'PENDING'
    }).populate('user');
    
    const settledBets = [];
    let totalPayout = 0;

    for (const bet of bets) {
      let betUpdated = false;
      
      for (const selection of bet.selections) {
        if (selection.match.toString() === match._id.toString()) {
          // Determine if selection won based on market
          // This is simplified - would need proper market mapping
          if (winner === 'HOME' && selection.marketName === '1') {
            selection.status = 'WON';
          } else if (winner === 'AWAY' && selection.marketName === '2') {
            selection.status = 'WON';
          } else if (winner === 'DRAW' && selection.marketName === 'X') {
            selection.status = 'WON';
          } else {
            selection.status = 'LOST';
          }
          selection.settledAt = new Date();
          betUpdated = true;
        }
      }
      
      // Check if all selections are settled
      const allSettled = bet.selections.every(s => s.status !== 'PENDING');
      const anyWon = bet.selections.some(s => s.status === 'WON');
      const anyLost = bet.selections.some(s => s.status === 'LOST');
      
      if (allSettled) {
        if (anyWon && !anyLost) {
          bet.status = 'WON';
          bet.winnings = bet.potentialWin;
          
          // Pay out winnings
          bet.user.balance += bet.potentialWin;
          await bet.user.save();
          
          totalPayout += bet.potentialWin;
          
          await Transaction.create({
            user: bet.user._id,
            type: 'BET_WON',
            amount: bet.potentialWin,
            bet: bet._id,
            description: `Bet won: ${bet.reference}`
          });
        } else if (anyLost) {
          bet.status = 'LOST';
        }
        
        bet.settledAt = new Date();
        bet.cashoutAvailable = false;
        settledBets.push(bet._id);
      }
      
      if (betUpdated) {
        await bet.save();
      }
    }
    
    // Emit socket events
    const io = req.app.get('io');
    io.emit('match-settled', { 
      matchId: match._id, 
      winner,
      result: match.score
    });
    
    // Notify users with bets on this match
    for (const bet of bets) {
      if (bet.user) {
        io.to(`user-${bet.user._id}`).emit('bet-settled', {
          betId: bet._id,
          status: bet.status,
          winnings: bet.status === 'WON' ? bet.potentialWin : 0
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Match settled successfully',
      data: {
        matchId: match._id,
        winner,
        betsSettled: settledBets.length,
        totalPayout
      }
    });
  } catch (error) {
    console.error('Settle match error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/matches/:id
// @desc    Delete match
// @access  Admin
router.delete('/matches/:id', async (req, res) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Void any pending bets
    await Bet.updateMany(
      { 'selections.match': match._id, status: 'PENDING' },
      { status: 'VOID' }
    );
    
    res.json({
      success: true,
      message: 'Match deleted successfully'
    });
  } catch (error) {
    console.error('Delete match error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ============ USER MANAGEMENT ============

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, kycStatus } = req.query;
    let query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) query.role = role;
    if (kycStatus) query.kycStatus = kycStatus;
    
    const users = await User.find(query)
      .select('-password -loginHistory -devices')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user
// @access  Admin
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user statistics
    const bets = await Bet.find({ user: user._id });
    const transactions = await Transaction.find({ user: user._id });
    
    res.json({
      success: true,
      data: {
        user,
        stats: {
          totalBets: bets.length,
          totalStake: bets.reduce((acc, b) => acc + b.stake, 0),
          totalWon: bets.filter(b => b.status === 'WON').reduce((acc, b) => acc + b.potentialWin, 0),
          totalDeposits: transactions.filter(t => t.type === 'DEPOSIT' && t.status === 'COMPLETED')
            .reduce((acc, t) => acc + t.amount, 0),
          totalWithdrawals: transactions.filter(t => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED')
            .reduce((acc, t) => acc + Math.abs(t.amount), 0)
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Admin
router.put('/users/:id/role', updateUserRoleValidation, async (req, res) => {
  try {
    const { role } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User role updated',
      data: user
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Toggle user active status
// @access  Admin
router.put('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'}`,
      data: user
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/users/:id/balance
// @desc    Adjust user balance
// @access  Admin
router.post('/users/:id/balance', async (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const oldBalance = user.balance;
    user.balance += amount;
    await user.save();
    
    await Transaction.create({
      user: user._id,
      type: 'ADJUSTMENT',
      amount,
      balance: {
        before: oldBalance,
        after: user.balance
      },
      status: 'COMPLETED',
      description: reason || 'Admin balance adjustment',
      metadata: { adjustedBy: req.user._id }
    });
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`user-${user._id}`).emit('balance-update', {
      newBalance: user.balance,
      reason
    });
    
    res.json({
      success: true,
      message: 'Balance adjusted',
      data: {
        oldBalance,
        newBalance: user.balance,
        adjustment: amount
      }
    });
  } catch (error) {
    console.error('Adjust balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ============ BET MANAGEMENT ============

// @route   GET /api/admin/bets
// @desc    Get all bets
// @access  Admin
router.get('/bets', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (userId) query.user = userId;
    
    const bets = await Bet.find(query)
      .populate('user', 'username email')
      .populate('selections.match', 'homeTeam awayTeam league')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Bet.countDocuments(query);
    
    res.json({
      success: true,
      data: bets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all bets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/bets/:id/void
// @desc    Void a bet
// @access  Admin
router.post('/bets/:id/void', async (req, res) => {
  try {
    const bet = await Bet.findById(req.params.id).populate('user');
    
    if (!bet) {
      return res.status(404).json({
        success: false,
        message: 'Bet not found'
      });
    }
    
    if (bet.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bets can be voided'
      });
    }
    
    // Refund stake
    bet.user.balance += bet.stake;
    await bet.user.save();
    
    bet.status = 'VOID';
    await bet.save();
    
    await Transaction.create({
      user: bet.user._id,
      type: 'BET_REFUND',
      amount: bet.stake,
      bet: bet._id,
      description: `Bet voided: ${bet.reference}`
    });
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`user-${bet.user._id}`).emit('bet-voided', {
      betId: bet._id,
      refundAmount: bet.stake
    });
    
    res.json({
      success: true,
      message: 'Bet voided and refunded'
    });
  } catch (error) {
    console.error('Void bet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ============ REPORTS ============

// @route   GET /api/admin/reports/daily
// @desc    Get daily report
// @access  Admin
router.get('/reports/daily', async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();
    reportDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(reportDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Get daily stats
    const [bets, transactions, users] = await Promise.all([
      Bet.aggregate([
        {
          $match: {
            createdAt: { $gte: reportDate, $lt: nextDay }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalStake: { $sum: '$stake' },
            totalPayout: {
              $sum: { $cond: [{ $eq: ['$status', 'WON'] }, '$potentialWin', 0] }
            }
          }
        }
      ]),
      
      Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: reportDate, $lt: nextDay },
            status: 'COMPLETED'
          }
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      
      User.countDocuments({
        createdAt: { $gte: reportDate, $lt: nextDay }
      })
    ]);
    
    res.json({
      success: true,
      data: {
        date: reportDate,
        bets: bets[0] || { count: 0, totalStake: 0, totalPayout: 0 },
        transactions: transactions,
        newUsers: users
      }
    });
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/reports/leagues
// @desc    Get league performance report
// @access  Admin
router.get('/reports/leagues', async (req, res) => {
  try {
    const report = await Bet.aggregate([
      {
        $lookup: {
          from: 'matches',
          localField: 'selections.match',
          foreignField: '_id',
          as: 'matchInfo'
        }
      },
      { $unwind: '$matchInfo' },
      {
        $group: {
          _id: '$matchInfo.league',
          totalBets: { $sum: 1 },
          totalStake: { $sum: '$stake' },
          totalPayout: {
            $sum: { $cond: [{ $eq: ['$status', 'WON'] }, '$potentialWin', 0] }
          },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          league: '$_id',
          totalBets: 1,
          totalStake: 1,
          totalPayout: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          profit: { $subtract: ['$totalStake', '$totalPayout'] }
        }
      },
      { $sort: { totalStake: -1 } }
    ]);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('League report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;