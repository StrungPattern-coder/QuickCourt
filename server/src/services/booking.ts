import { prisma } from '../utils/prisma.js';
import { BookingStatus } from '@prisma/client';

export interface CreateBookingParams {
  userId: string;
  courtId: string;
  startTime: Date;
  endTime: Date;
  price: number;
}

export interface BookingConflict {
  id: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
}

export class BookingService {
  /**
   * Atomically check availability and create booking
   * Uses database transaction to prevent race conditions
   */
  static async createBookingAtomic(params: CreateBookingParams) {
    const { userId, courtId, startTime, endTime, price } = params;

    try {
      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // 1. Check for any overlapping bookings
        const conflictingBookings = await tx.booking.findMany({
          where: {
            courtId,
            status: {
              in: [BookingStatus.PENDING, BookingStatus.CONFIRMED]
            },
            OR: [
              // Booking starts before our end time and ends after our start time
              {
                AND: [
                  { startTime: { lt: endTime } },
                  { endTime: { gt: startTime } }
                ]
              }
            ]
          },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true
          }
        });

        if (conflictingBookings.length > 0) {
          throw new Error('SLOT_UNAVAILABLE');
        }

        // 2. Check for maintenance blocks
        const maintenanceBlocks = await tx.maintenanceBlock.findMany({
          where: {
            courtId,
            OR: [
              {
                AND: [
                  { startTime: { lt: endTime } },
                  { endTime: { gt: startTime } }
                ]
              }
            ]
          }
        });

        if (maintenanceBlocks.length > 0) {
          throw new Error('COURT_UNDER_MAINTENANCE');
        }

        // 3. Validate court operating hours
        const court = await tx.court.findUnique({
          where: { id: courtId },
          include: {
            facility: {
              include: {
                owner: {
                  select: { id: true, email: true, fullName: true }
                }
              }
            }
          }
        });

        if (!court) {
          throw new Error('COURT_NOT_FOUND');
        }

        // Check if court is within operating hours
        const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
        const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

        if (startMinutes < court.openTime || endMinutes > court.closeTime) {
          throw new Error('OUTSIDE_OPERATING_HOURS');
        }

        // 4. Create the booking
        const booking = await tx.booking.create({
          data: {
            userId,
            courtId,
            startTime,
            endTime,
            price,
            status: BookingStatus.PENDING
          },
          include: {
            user: {
              select: { id: true, email: true, fullName: true }
            },
            court: {
              include: {
                facility: {
                  include: {
                    owner: {
                      select: { id: true, email: true, fullName: true }
                    }
                  }
                }
              }
            }
          }
        });

        return { booking, court };
      });

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('BOOKING_CREATION_FAILED');
    }
  }

  /**
   * Check availability for a time slot
   */
  static async checkAvailability(courtId: string, startTime: Date, endTime: Date) {
    // Check for conflicting bookings
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        courtId,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED]
        },
        OR: [
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gt: startTime } }
            ]
          }
        ]
      }
    });

    // Check for maintenance blocks
    const maintenanceBlocks = await prisma.maintenanceBlock.findMany({
      where: {
        courtId,
        OR: [
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gt: startTime } }
            ]
          }
        ]
      }
    });

    return {
      available: conflictingBookings.length === 0 && maintenanceBlocks.length === 0,
      conflicts: conflictingBookings.map(booking => ({
        id: booking.id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status
      })),
      maintenanceBlocks: maintenanceBlocks.map(block => ({
        id: block.id,
        startTime: block.startTime,
        endTime: block.endTime,
        reason: block.reason
      }))
    };
  }

  /**
   * Get bookings for a venue owner
   */
  static async getOwnerBookings(ownerId: string, options?: {
    facilityId?: string;
    status?: BookingStatus;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }) {
    const { facilityId, status, from, to, limit = 50, offset = 0 } = options || {};

    const where: any = {
      court: {
        facility: {
          ownerId: ownerId
        }
      }
    };

    if (facilityId) {
      where.court.facility.id = facilityId;
    }

    if (status) {
      where.status = status;
    }

    if (from || to) {
      where.startTime = {};
      if (from) where.startTime.gte = from;
      if (to) where.startTime.lte = to;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, fullName: true }
          },
          court: {
            include: {
              facility: {
                select: { id: true, name: true, location: true }
              }
            }
          },
          payment: {
            select: { id: true, amount: true, status: true, provider: true }
          }
        },
        orderBy: { startTime: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.booking.count({ where })
    ]);

    return {
      bookings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  /**
   * Get bookings for a user
   */
  static async getUserBookings(userId: string, options?: {
    status?: BookingStatus;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }) {
    const { status, from, to, limit = 50, offset = 0 } = options || {};

    const where: any = {
      userId: userId
    };

    if (status) {
      where.status = status;
    }

    if (from || to) {
      where.startTime = {};
      if (from) where.startTime.gte = from;
      if (to) where.startTime.lte = to;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          court: {
            include: {
              facility: {
                select: { id: true, name: true, location: true }
              }
            }
          },
          payment: {
            select: { id: true, amount: true, status: true, provider: true }
          }
        },
        orderBy: { startTime: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.booking.count({ where })
    ]);

    return {
      bookings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  /**
   * Cancel a booking
   */
  static async cancelBooking(bookingId: string, userId: string, userRole: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        court: {
          include: {
            facility: {
              include: { owner: true }
            }
          }
        }
      }
    });

    if (!booking) {
      throw new Error('BOOKING_NOT_FOUND');
    }

    // Check permission: user owns booking, or owner of facility, or admin
    const canCancel = booking.userId === userId || 
                     booking.court.facility.ownerId === userId || 
                     userRole === 'ADMIN';

    if (!canCancel) {
      throw new Error('UNAUTHORIZED_CANCELLATION');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new Error('BOOKING_ALREADY_CANCELLED');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new Error('CANNOT_CANCEL_COMPLETED_BOOKING');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
      include: {
        user: {
          select: { id: true, email: true, fullName: true }
        },
        court: {
          include: {
            facility: {
              include: { owner: true }
            }
          }
        }
      }
    });

    return updatedBooking;
  }

  /**
   * Confirm a booking (owner only)
   */
  static async confirmBooking(bookingId: string, ownerId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        court: {
          include: {
            facility: true
          }
        }
      }
    });

    if (!booking) {
      throw new Error('BOOKING_NOT_FOUND');
    }

    if (booking.court.facility.ownerId !== ownerId) {
      throw new Error('UNAUTHORIZED_CONFIRMATION');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new Error('BOOKING_NOT_PENDING');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED }
    });

    return updatedBooking;
  }
}
