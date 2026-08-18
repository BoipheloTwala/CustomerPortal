//CODE ATTRIBUTION
//01
//Express.js Controller Pattern
//Adapted from: OpenJS Foundation. (2025). Express Controllers. [online] Express.js Documentation.
//Available at: https://expressjs.com/en/guide/routing.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//MongoDB Aggregation Pipeline
//Adapted from: MongoDB Inc. (2025). Aggregation. [online] MongoDB Documentation.
//Available at: https://docs.mongodb.com/manual/aggregation/
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//OWASP Input Validation
//Adapted from: OWASP. (2025). Input Validation Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
//Date Accessed: 10 October 2025

import User from '../models/User.js';
import Payment from '../models/Payment.js';
import { authenticateToken } from '../service/authService.js';
import { sanitizeInput } from '../utils/validation.js';

// Middleware to check admin role
export const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      users: users.map(user => user.toSafeObject()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
};

// Get user by ID (admin only)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toSafeObject() });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
};

// Update user status (admin only)
export const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    // Validate input
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toSafeObject() });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

// Get user activity statistics (admin only)
export const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          inactiveCount: {
            $sum: { $cond: ['$isActive', 0, 1] }
          }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const customerUsers = await User.countDocuments({ role: 'customer' });

    res.json({
      summary: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        adminUsers,
        customerUsers
      },
      byRole: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve user statistics' });
  }
};

// Get recent login activity (admin only)
export const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const recentLogins = await User.find({
      lastLogin: { $exists: true }
    })
      .select('firstName lastName email role lastLogin')
      .sort({ lastLogin: -1 })
      .limit(limit);

    res.json({ recentActivity: recentLogins });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ error: 'Failed to retrieve recent activity' });
  }
};

// Get all payments (admin only)
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate('customerId', 'firstName lastName email phoneNumber')
      .sort({ createdAt: -1 });

    res.json({
      payments: payments.map(p => ({
        id: p.paymentId,
        customerEmail: p.customerEmail,
        customerName: `${p.customerName.firstName} ${p.customerName.lastName}`,
        customerPhone: p.customerId?.phoneNumber || 'N/A',
        amount: p.amount,
        currency: p.currency,
        recipient: p.recipient,
        paymentProvider: p.paymentProvider,
        swiftCode: p.swiftCode || '',
        status: p.status,
        createdAt: p.createdAt,
        verifiedAt: p.verifiedAt,
        processedAt: p.processedAt
      })),
      total: payments.length
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to retrieve payments' });
  }
};

// Process payment (admin only) - Verify or process payment
export const processPayment = async (req, res) => {
  try {
    const { paymentId, action, swiftCode } = req.body;

    // Validate input
    if (!paymentId || !action) {
      return res.status(400).json({ error: 'paymentId and action are required' });
    }

    if (!['approve', 'reject', 'verify'].includes(action)) {
      return res.status(400).json({ error: 'Action must be approve, reject, or verify' });
    }

    // Find payment
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (action === 'verify') {
      // Verify payment with SWIFT code
      if (!swiftCode) {
        return res.status(400).json({ error: 'SWIFT code is required for verification' });
      }
      
      // Validate SWIFT code format
      const swiftRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
      if (!swiftRegex.test(swiftCode.toUpperCase())) {
        return res.status(400).json({ error: 'Invalid SWIFT code format' });
      }

      payment.swiftCode = swiftCode.toUpperCase();
      payment.status = 'verified';
      payment.verifiedBy = req.userId;
      payment.verifiedAt = new Date();
      await payment.save();

      return res.json({
        message: 'Payment verified successfully',
        payment: {
          id: payment.paymentId,
          status: payment.status,
          swiftCode: payment.swiftCode
        }
      });
    }

    if (action === 'approve') {
      if (payment.status !== 'verified') {
        return res.status(400).json({ error: 'Payment must be verified before approval' });
      }

      payment.status = 'completed';
      payment.processedAt = new Date();
      await payment.save();

      return res.json({
        message: 'Payment approved and forwarded to SWIFT',
        payment: {
          id: payment.paymentId,
          status: payment.status
        }
      });
    }

    if (action === 'reject') {
      payment.status = 'rejected';
      payment.rejectedReason = req.body.reason || 'Rejected by administrator';
      await payment.save();

      return res.json({
        message: 'Payment rejected',
        payment: {
          id: payment.paymentId,
          status: payment.status
        }
      });
    }
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
};

// Get payment statistics (admin only)
export const getPaymentStats = async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments();
    const completedPayments = await Payment.countDocuments({ status: 'completed' });
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    const verifiedPayments = await Payment.countDocuments({ status: 'verified' });
    const rejectedPayments = await Payment.countDocuments({ status: 'rejected' });

    const completedPaymentsData = await Payment.find({ status: 'completed' });
    const totalAmount = completedPaymentsData.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      summary: {
        totalPayments,
        completedPayments,
        pendingPayments,
        verifiedPayments,
        rejectedPayments,
        totalAmountProcessed: totalAmount
      }
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve payment statistics' });
  }
};

