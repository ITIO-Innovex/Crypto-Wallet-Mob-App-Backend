const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all notification routes
router.use(authMiddleware);

// ========== GET ALL NOTIFICATIONS ==========
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const userId = req.user.userId;

    // Build filter object
    const filter = { userId };
    if (status === 'read') {
      filter.read = true;
    } else if (status === 'unread') {
      filter.read = false;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get notifications with pagination
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'email');

    // Get total count for pagination
    const totalCount = await Notification.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    // Get counts for different statuses
    const unreadCount = await Notification.countDocuments({ userId, read: false });
    const readCount = await Notification.countDocuments({ userId, read: true });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        counts: {
          total: totalCount,
          unread: unreadCount,
          read: readCount
        }
      }
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch notifications' 
    });
  }
});

// ========== GET UNREAD NOTIFICATIONS ==========
router.get('/unread', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.userId;

    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ userId, read: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'email');

    const totalCount = await Notification.countDocuments({ userId, read: false });
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (err) {
    console.error('Get unread notifications error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch unread notifications' 
    });
  }
});

// ========== GET SINGLE NOTIFICATION ==========
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findOne({ _id: id, userId })
      .populate('userId', 'email');

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (err) {
    console.error('Get notification error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch notification' 
    });
  }
});

// ========== MARK SINGLE NOTIFICATION AS READ ==========
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (err) {
    console.error('Mark notification as read error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark notification as read' 
    });
  }
});

// ========== MARK SINGLE NOTIFICATION AS UNREAD ==========
router.patch('/:id/unread', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: false },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as unread',
      data: notification
    });
  } catch (err) {
    console.error('Mark notification as unread error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark notification as unread' 
    });
  }
});

// ========== MARK ALL NOTIFICATIONS AS READ ==========
router.patch('/mark-all/read', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (err) {
    console.error('Mark all as read error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark all notifications as read' 
    });
  }
});

// ========== MARK ALL NOTIFICATIONS AS UNREAD ==========
router.patch('/mark-all/unread', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await Notification.updateMany(
      { userId, read: true },
      { read: false }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as unread`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (err) {
    console.error('Mark all as unread error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark all notifications as unread' 
    });
  }
});

// ========== CLEAR ALL NOTIFICATIONS ==========
router.delete('/clear-all', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await Notification.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} notifications cleared`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (err) {
    console.error('Clear all notifications error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear all notifications' 
    });
  }
});

// ========== CLEAR READ NOTIFICATIONS ==========
router.delete('/clear-read', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await Notification.deleteMany({ userId, read: true });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} read notifications cleared`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (err) {
    console.error('Clear read notifications error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear read notifications' 
    });
  }
});

// ========== DELETE SINGLE NOTIFICATION ==========
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findOneAndDelete({ _id: id, userId });

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      data: notification
    });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete notification' 
    });
  }
});

// ========== CREATE NOTIFICATION (Admin/System use) ==========
router.post('/', async (req, res) => {
  try {
    const { title, message, currency, amount, userId: targetUserId } = req.body;
    
    // Use targetUserId if provided (for admin), otherwise use authenticated user
    const userId = targetUserId || req.user.userId;

    if (!title || !message || !currency || amount === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title, message, currency, and amount are required' 
      });
    }

    const notification = new Notification({
      userId,
      title,
      message,
      currency,
      amount
    });

    await notification.save();
    await notification.populate('userId', 'email');

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (err) {
    console.error('Create notification error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create notification' 
    });
  }
});

// ========== GET NOTIFICATION STATISTICS ==========
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = req.user.userId;

    const [totalCount, unreadCount, readCount] = await Promise.all([
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, read: false }),
      Notification.countDocuments({ userId, read: true })
    ]);

    // Get recent notifications (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentCount = await Notification.countDocuments({
      userId,
      createdAt: { $gte: sevenDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalCount,
        unread: unreadCount,
        read: readCount,
        recent: recentCount,
        readPercentage: totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0
      }
    });
  } catch (err) {
    console.error('Get notification stats error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch notification statistics' 
    });
  }
});

module.exports = router;