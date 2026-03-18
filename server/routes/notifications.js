const express = require('express');
const { protect } = require('../middleware/auth');

// In-memory notification store (use MongoDB in production)
let notifications = [];

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
router.get('/', protect, (req, res) => {
  const userNotifications = notifications
    .filter(n => n.userId === req.user._id.toString() || n.userId === 'all')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json({
    success: true,
    data: userNotifications
  });
});

// @route   GET /api/notifications/unread
// @desc    Get unread notifications count
router.get('/unread', protect, (req, res) => {
  const unreadCount = notifications.filter(
    n => (n.userId === req.user._id.toString() || n.userId === 'all') && !n.read
  ).length;
  
  res.json({
    success: true,
    data: { unread: unreadCount }
  });
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
router.put('/:id/read', protect, (req, res) => {
  const notification = notifications.find(n => n.id === req.params.id);
  
  if (!notification) {
    return res.status(404).json({ 
      success: false,
      message: 'Notification not found' 
    });
  }
  
  if (notification.userId !== req.user._id.toString() && notification.userId !== 'all') {
    return res.status(403).json({ 
      success: false,
      message: 'Not authorized' 
    });
  }
  
  notification.read = true;
  
  res.json({
    success: true,
    message: 'Notification marked as read',
    data: notification
  });
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
router.put('/read-all', protect, (req, res) => {
  notifications.forEach(n => {
    if (n.userId === req.user._id.toString() || n.userId === 'all') {
      n.read = true;
    }
  });
  
  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// @route   POST /api/notifications/create (Admin only)
// @desc    Create a notification (for admin use)
router.post('/create', protect, async (req, res) => {
  // Check if admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
  }
  
  try {
    const { title, message, type, userId } = req.body;
    
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      type: type || 'info',
      userId: userId || 'all',
      read: false,
      createdAt: new Date()
    };
    
    notifications.push(notification);
    
    // Emit via socket.io
    const io = req.app.get('io');
    io.emit('new-notification', notification);
    
    res.status(201).json({
      success: true,
      message: 'Notification created',
      data: notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Helper function to create notifications (for internal use)
const createNotification = (title, message, type = 'info', userId = 'all') => {
  const notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    message,
    type,
    userId,
    read: false,
    createdAt: new Date()
  };
  
  notifications.push(notification);
  
  // Keep only last 100 notifications
  if (notifications.length > 100) {
    notifications = notifications.slice(-100);
  }
  
  return notification;
};

module.exports = router;
module.exports.createNotification = createNotification;