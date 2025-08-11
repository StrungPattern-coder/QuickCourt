import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { NotificationService } from '../../services/notification.js';
import { NotificationStatus, UserRole } from '@prisma/client';

const router = Router();

/**
 * GET /owners/:ownerId/notifications
 * Get notifications for owner (Owner/Admin only)
 */
router.get('/owners/:ownerId/notifications', requireAuth, async (req, res) => {
  try {
    const { ownerId } = req.params;
    
    // Check permission
    if (req.user!.id !== ownerId && req.user!.role !== UserRole.ADMIN) {
      return res.status(403).json({
        error: 'You can only view your own notifications'
      });
    }

    const { status, limit = '50', includeRead = 'true' } = req.query;
    
    const limitNum = parseInt(limit as string);
    const includeReadBool = includeRead === 'true';
    
    const options: any = {
      limit: limitNum,
      includeRead: includeReadBool
    };

    if (status && Object.values(NotificationStatus).includes(status as NotificationStatus)) {
      options.status = status as NotificationStatus;
    }

    const notifications = await NotificationService.getUserNotifications(ownerId, options);

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications'
    });
  }
});

/**
 * GET /notifications/my-notifications
 * Get current user's notifications
 */
router.get('/my-notifications', requireAuth, async (req, res) => {
  try {
    const { status, limit = '50', includeRead = 'true' } = req.query;
    
    const limitNum = parseInt(limit as string);
    const includeReadBool = includeRead === 'true';
    
    const options: any = {
      limit: limitNum,
      includeRead: includeReadBool
    };

    if (status && Object.values(NotificationStatus).includes(status as NotificationStatus)) {
      options.status = status as NotificationStatus;
    }

    const notifications = await NotificationService.getUserNotifications(req.user!.id, options);

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications'
    });
  }
});

/**
 * GET /notifications/unread-count
 * Get unread notification count for current user
 */
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user!.id);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      error: 'Failed to fetch unread count'
    });
  }
});

/**
 * PUT /notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await NotificationService.markAsRead(id, req.user!.id);

    if (result.count === 0) {
      return res.status(404).json({
        error: 'Notification not found or already read'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read'
    });
  }
});

/**
 * PUT /notifications/mark-all-read
 * Mark all notifications as read for current user
 */
router.put('/mark-all-read', requireAuth, async (req, res) => {
  try {
    const result = await NotificationService.markAllAsRead(req.user!.id);

    res.json({
      success: true,
      data: { markedCount: result.count },
      message: `${result.count} notifications marked as read`
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read'
    });
  }
});

export { router as notificationRouter };
