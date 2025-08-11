import { Router, Response, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, requireRoles } from '../../middleware/auth.js';
import { UserRole } from '../../types/enums.js';
import { NotificationService } from '../../services/notification.js';

const prisma = new PrismaClient();
const router = Router();

// Get dashboard statistics
router.get('/stats', requireAuth, requireRoles(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalFacilities,
      totalBookings,
      pendingFacilities,
      activeBookings,
      totalRevenue,
      usersLastMonth,
      revenueLastMonth
    ] = await Promise.all([
      prisma.user.count(),
      prisma.facility.count(),
      prisma.booking.count(),
      prisma.facility.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.aggregate({
        _sum: { price: true },
        where: { status: { in: ['CONFIRMED', 'COMPLETED'] } }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.booking.aggregate({
        _sum: { price: true },
        where: {
          status: { in: ['CONFIRMED', 'COMPLETED'] },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    const currentMonthUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const currentMonthRevenue = await prisma.booking.aggregate({
      _sum: { price: true },
      where: {
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const userGrowth = usersLastMonth > 0 
      ? ((currentMonthUsers - usersLastMonth) / usersLastMonth) * 100 
      : 0;

    const revenueGrowth = Number(revenueLastMonth._sum?.price || 0) > 0 
      ? (((Number(currentMonthRevenue._sum?.price || 0)) - Number(revenueLastMonth._sum?.price || 0)) / Number(revenueLastMonth._sum?.price || 1)) * 100 
      : 0;

    res.json({
      totalUsers,
      totalFacilities,
      totalBookings,
      totalRevenue: Number(totalRevenue._sum?.price || 0),
      pendingFacilities,
      activeBookings,
      userGrowth: Math.round(userGrowth * 100) / 100,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100
    });
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get all users with counts
router.get('/users', requireAuth, requireRoles(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            bookings: true,
            facilities: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all facilities with filtering  
router.get('/facilities', requireAuth, requireRoles(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const facilities = await prisma.facility.findMany({
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        _count: {
          select: {
            courts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add a fake pricePerHour field for compatibility
    const facilitiesWithPrice = facilities.map(facility => ({
      ...facility,
      pricePerHour: 50, // Default price since it's stored per court
      _count: {
        ...facility._count,
        bookings: 0 // We'll calculate this separately if needed
      }
    }));

    res.json(facilitiesWithPrice);
  } catch (error) {
    console.error('Failed to fetch facilities:', error);
    res.status(500).json({ error: 'Failed to fetch facilities' });
  }
});

// Get all bookings with filtering
router.get('/bookings', requireAuth, requireRoles(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        court: {
          include: {
            facility: {
              select: {
                id: true,
                name: true,
                location: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to recent 100 bookings for performance
    });

    // Transform bookings to match expected format
    const transformedBookings = bookings.map((booking: any) => ({
      id: booking.id,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalPrice: Number(booking.price),
      status: booking.status,
      createdAt: booking.createdAt,
      user: booking.user,
      facility: {
        id: booking.court.facility.id,
        name: booking.court.facility.name,
        location: booking.court.facility.location
      }
    }));

    res.json(transformedBookings);
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Approve facility
router.put('/facilities/:id/approve', requireAuth, requireRoles(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const facility = await prisma.facility.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: {
        owner: {
          select: { email: true, fullName: true }
        }
      }
    });

    // TODO: Send approval email to facility owner
    console.log(`Facility ${facility.name} approved for ${facility.owner.fullName}`);

    res.json({ message: 'Facility approved successfully', facility });
  } catch (error) {
    console.error('Failed to approve facility:', error);
    res.status(500).json({ error: 'Failed to approve facility' });
  }
});

// Reject facility
router.put('/facilities/:id/reject', requireAuth, requireRoles(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const facility = await prisma.facility.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: {
        owner: {
          select: { email: true, fullName: true }
        }
      }
    });

    // TODO: Send rejection email to facility owner with reason
    console.log(`Facility ${facility.name} rejected for ${facility.owner.fullName}. Reason: ${reason}`);

    res.json({ message: 'Facility rejected', facility });
  } catch (error) {
    console.error('Failed to reject facility:', error);
    res.status(500).json({ error: 'Failed to reject facility' });
  }
});

// Ban user
router.put('/users/:id/ban', requireAuth, requireRoles(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'BANNED' }
    });

    // TODO: Send ban notification email
    console.log(`User ${user.fullName} banned. Reason: ${reason}`);

    res.json({ message: 'User banned successfully', user });
  } catch (error) {
    console.error('Failed to ban user:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// Unban user
router.put('/users/:id/unban', requireAuth, requireRoles(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' }
    });

    // TODO: Send unban notification email
    console.log(`User ${user.fullName} unbanned`);

    res.json({ message: 'User unbanned successfully', user });
  } catch (error) {
    console.error('Failed to unban user:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

// ================= ADMIN NOTIFICATION ENDPOINTS =================

/**
 * GET /admin/notifications
 * Get admin notifications (venue approval requests, system alerts, etc.)
 */
router.get('/notifications', requireAuth, requireRoles(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { unreadOnly = 'false', limit = '50', priority } = req.query;

    const notifications = await NotificationService.getAdminNotifications(req.user!.id, {
      unreadOnly: unreadOnly === 'true',
      limit: parseInt(limit as string),
      priority: priority as 'HIGH' | 'MEDIUM' | 'LOW'
    });

    // Get unread count
    const unreadCount = await NotificationService.getUnreadCount(req.user!.id);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        total: notifications.length
      }
    });
  } catch (error) {
    console.error('Failed to fetch admin notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * PUT /admin/notifications/:id/read
 * Mark a notification as read
 */
router.put('/notifications/:id/read', requireAuth, requireRoles(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await NotificationService.markAsRead(id, req.user!.id);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

/**
 * PUT /admin/notifications/read-all
 * Mark all notifications as read for the admin
 */
router.put('/notifications/read-all', requireAuth, requireRoles(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    await NotificationService.markAllAsRead(req.user!.id);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

/**
 * GET /admin/notifications/unread-count
 * Get count of unread notifications
 */
router.get('/notifications/unread-count', requireAuth, requireRoles(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const unreadCount = await NotificationService.getUnreadCount(req.user!.id);

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Failed to get unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

export { router as adminRouter };
