import { NotificationType, NotificationStatus } from '@prisma/client';
import { prisma } from '../utils/prisma.js';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  static async createNotification(params: CreateNotificationParams) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          metadata: params.metadata || {},
          status: NotificationStatus.UNREAD
        }
      });

      console.log(`Notification created for user ${params.userId}:`, {
        type: params.type,
        title: params.title
      });

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  static async getUserNotifications(userId: string, options?: {
    limit?: number;
    status?: NotificationStatus;
    includeRead?: boolean;
  }) {
    const { limit = 50, status, includeRead = true } = options || {};

    const where: any = { userId };
    
    if (status) {
      where.status = status;
    } else if (!includeRead) {
      where.status = NotificationStatus.UNREAD;
    }

    return await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  static async markAsRead(notificationId: string, userId: string) {
    return await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId,
        status: NotificationStatus.UNREAD
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date()
      }
    });
  }

  static async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: {
        userId: userId,
        status: NotificationStatus.UNREAD
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date()
      }
    });
  }

  static async getUnreadCount(userId: string) {
    return await prisma.notification.count({
      where: {
        userId: userId,
        status: NotificationStatus.UNREAD
      }
    });
  }

  // Helper methods for specific notification types
  static async notifyBookingCreated(ownerId: string, booking: any, court: any, facility: any) {
    return await this.createNotification({
      userId: ownerId,
      type: NotificationType.BOOKING_CREATED,
      title: 'New Booking Received',
      message: `A new booking has been made for ${court.name} at ${facility.name} on ${booking.startTime.toLocaleDateString()}.`,
      metadata: {
        bookingId: booking.id,
        courtId: court.id,
        facilityId: facility.id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        price: booking.price
      }
    });
  }

  static async notifyBookingCancelled(ownerId: string, booking: any, court: any, facility: any) {
    return await this.createNotification({
      userId: ownerId,
      type: NotificationType.BOOKING_CANCELLED,
      title: 'Booking Cancelled',
      message: `A booking for ${court.name} at ${facility.name} has been cancelled.`,
      metadata: {
        bookingId: booking.id,
        courtId: court.id,
        facilityId: facility.id
      }
    });
  }

  static async notifyFacilityApproved(ownerId: string, facility: any) {
    return await this.createNotification({
      userId: ownerId,
      type: NotificationType.FACILITY_APPROVED,
      title: 'Facility Approved',
      message: `Your facility "${facility.name}" has been approved and is now available for bookings.`,
      metadata: {
        facilityId: facility.id
      }
    });
  }

  static async notifyFacilityRejected(ownerId: string, facility: any, reason?: string) {
    return await this.createNotification({
      userId: ownerId,
      type: NotificationType.FACILITY_REJECTED,
      title: 'Facility Rejected',
      message: `Your facility "${facility.name}" has been rejected. ${reason ? `Reason: ${reason}` : ''}`,
      metadata: {
        facilityId: facility.id,
        reason
      }
    });
  }

  // Admin notification methods
  static async notifyAdminsOfNewFacility(facility: any, owner: any) {
    try {
      // Get all admin users
      const admins = await prisma.user.findMany({
        where: { 
          role: 'ADMIN',
          status: 'ACTIVE'
        },
        select: { id: true, email: true, fullName: true }
      });

      console.log(`🔔 Found ${admins.length} admins to notify about new facility`);

      // Create notifications for all admins - using FACILITY_APPROVED temporarily until schema update
      const notifications = await Promise.all(
        admins.map(admin => 
          this.createNotification({
            userId: admin.id,
            type: NotificationType.FACILITY_APPROVED, // Will change to ADMIN_ALERT after schema update
            title: '🏟️ New Venue Awaiting Approval',
            message: `${owner.fullName} has submitted a new venue "${facility.name}" for approval. Location: ${facility.location}`,
            metadata: {
              facilityId: facility.id,
              facilityName: facility.name,
              ownerName: owner.fullName,
              ownerEmail: owner.email,
              ownerId: owner.id,
              location: facility.location,
              sports: facility.sports,
              amenities: facility.amenities,
              action: 'VENUE_APPROVAL_REQUIRED',
              priority: 'HIGH',
              notificationType: 'ADMIN_ALERT' // Store the actual type in metadata
            }
          })
        )
      );

      console.log(`✅ Created ${notifications.length} admin notifications for facility: ${facility.name}`);
      return notifications;
    } catch (error) {
      console.error('❌ Failed to notify admins of new facility:', error);
      throw error;
    }
  }

  static async notifyAdminOfFacilityUpdate(facilityId: string, updateType: string, details: any) {
    try {
      const admins = await prisma.user.findMany({
        where: { 
          role: 'ADMIN',
          status: 'ACTIVE'
        },
        select: { id: true }
      });

      const notifications = await Promise.all(
        admins.map(admin => 
          this.createNotification({
            userId: admin.id,
            type: NotificationType.FACILITY_APPROVED, // Temporary type
            title: `Facility ${updateType}`,
            message: `A facility has been ${updateType.toLowerCase()}: ${details.facilityName}`,
            metadata: {
              facilityId,
              updateType,
              notificationType: 'ADMIN_ALERT',
              ...details
            }
          })
        )
      );

      return notifications;
    } catch (error) {
      console.error('Failed to notify admins of facility update:', error);
      throw error;
    }
  }

  static async getAdminNotifications(adminId: string, options?: {
    limit?: number;
    unreadOnly?: boolean;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  }) {
    const { limit = 50, unreadOnly = false, priority } = options || {};

    const where: any = { 
      userId: adminId,
      // Filter by metadata to get admin notifications
      metadata: {
        path: ['notificationType'],
        equals: 'ADMIN_ALERT'
      }
    };
    
    if (unreadOnly) {
      where.status = NotificationStatus.UNREAD;
    }

    if (priority) {
      where.metadata = {
        path: ['priority'],
        equals: priority
      };
    }

    return await prisma.notification.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // Unread first
        { createdAt: 'desc' }
      ],
      take: limit
    });
  }
}
