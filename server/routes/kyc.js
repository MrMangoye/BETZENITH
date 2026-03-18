const express = require('express');
const { protect, admin } = require('../middleware/auth');
const User = require('../models/User');

// In-memory KYC storage (use MongoDB in production)
let kycSubmissions = [];

const router = express.Router();

// @route   POST /api/kyc/submit
// @desc    Submit KYC documents
router.post('/submit', protect, async (req, res) => {
  try {
    const { fullName, dateOfBirth, idNumber, idType, address, phoneNumber } = req.body;
    
    // Check if already submitted
    const existing = kycSubmissions.find(s => s.userId === req.user._id.toString());
    if (existing) {
      return res.status(400).json({ 
        success: false,
        message: `KYC already submitted. Status: ${existing.status}` 
      });
    }
    
    const submission = {
      id: `kyc_${Date.now()}_${req.user._id}`,
      userId: req.user._id.toString(),
      fullName,
      dateOfBirth,
      idNumber,
      idType: idType || 'national_id',
      address,
      phoneNumber,
      documents: req.body.documents || [], // Would handle file uploads in production
      status: 'PENDING',
      submittedAt: new Date(),
      updatedAt: new Date()
    };
    
    kycSubmissions.push(submission);
    
    res.status(201).json({
      success: true,
      message: 'KYC submitted successfully',
      data: submission
    });
  } catch (error) {
    console.error('KYC submission error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/kyc/status
// @desc    Get KYC status
router.get('/status', protect, (req, res) => {
  const submission = kycSubmissions.find(s => s.userId === req.user._id.toString());
  
  if (!submission) {
    return res.json({
      success: true,
      data: { status: 'NOT_SUBMITTED' }
    });
  }
  
  res.json({
    success: true,
    data: {
      status: submission.status,
      submittedAt: submission.submittedAt,
      updatedAt: submission.updatedAt
    }
  });
});

// @route   GET /api/kyc/submission
// @desc    Get user's KYC submission
router.get('/submission', protect, (req, res) => {
  const submission = kycSubmissions.find(s => s.userId === req.user._id.toString());
  
  if (!submission) {
    return res.status(404).json({ 
      success: false,
      message: 'No KYC submission found' 
    });
  }
  
  res.json({
    success: true,
    data: submission
  });
});

// ============= ADMIN ROUTES =============

// @route   GET /api/kyc/admin/submissions
// @desc    Get all KYC submissions (admin only)
router.get('/admin/submissions', protect, admin, (req, res) => {
  const { status } = req.query;
  
  let filtered = kycSubmissions;
  if (status) {
    filtered = filtered.filter(s => s.status === status);
  }
  
  res.json({
    success: true,
    count: filtered.length,
    data: filtered
  });
});

// @route   PUT /api/kyc/admin/:id/approve
// @desc    Approve KYC submission
router.put('/admin/:id/approve', protect, admin, async (req, res) => {
  try {
    const submission = kycSubmissions.find(s => s.id === req.params.id);
    
    if (!submission) {
      return res.status(404).json({ 
        success: false,
        message: 'Submission not found' 
      });
    }
    
    submission.status = 'APPROVED';
    submission.updatedAt = new Date();
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    
    // Update user's KYC status (add field to User model in production)
    await User.findByIdAndUpdate(submission.userId, {
      kycStatus: 'APPROVED',
      kycApprovedAt: new Date()
    });
    
    res.json({
      success: true,
      message: 'KYC approved',
      data: submission
    });
  } catch (error) {
    console.error('KYC approve error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   PUT /api/kyc/admin/:id/reject
// @desc    Reject KYC submission
router.put('/admin/:id/reject', protect, admin, (req, res) => {
  const { reason } = req.body;
  const submission = kycSubmissions.find(s => s.id === req.params.id);
  
  if (!submission) {
    return res.status(404).json({ 
      success: false,
      message: 'Submission not found' 
    });
  }
  
  submission.status = 'REJECTED';
  submission.updatedAt = new Date();
  submission.reviewedBy = req.user._id;
  submission.reviewedAt = new Date();
  submission.rejectionReason = reason || 'Documents do not meet requirements';
  
  res.json({
    success: true,
    message: 'KYC rejected',
    data: submission
  });
});

// @route   GET /api/kyc/admin/stats
// @desc    Get KYC statistics
router.get('/admin/stats', protect, admin, (req, res) => {
  const stats = {
    total: kycSubmissions.length,
    pending: kycSubmissions.filter(s => s.status === 'PENDING').length,
    approved: kycSubmissions.filter(s => s.status === 'APPROVED').length,
    rejected: kycSubmissions.filter(s => s.status === 'REJECTED').length
  };
  
  res.json({
    success: true,
    data: stats
  });
});

module.exports = router;