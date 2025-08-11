import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { checkUserRole, checkOwnerRole } from '../../middleware/roleAuth.js';
import { BookingService } from '../../services/booking.js';
import { NotificationService } from '../../services/notification.js';
import { rateLimit } from 'express-rate-limit';
import { UserRole } from '@prisma/client';

const router = Router();

// Rate limiting for booking creation
const createBookingLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 bookings per 5 minutes
  message: { error: 'Too many booking attempts. Please try again later.' }
});

// Validation schemas
const createBookingSchema = z.object({
  courtId: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  price: z.number().positive()
}).refine(data => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: 'End time must be after start time'
}).refine(data => {
  const start = new Date(data.startTime);
  const now = new Date();
  return start > now;
}, {
  message: 'Booking must be in the future'
});

const checkAvailabilitySchema = z.object({
  courtId: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime()
});

/**
 * POST /bookings
 * Create a new booking (User role)
 */
router.post('/', requireAuth, checkUserRole, createBookingLimit, async (req, res) => {
  try {
    const validatedData = createBookingSchema.parse(req.body);
    
    const { courtId, startTime: startTimeStr, endTime: endTimeStr, price } = validatedData;
    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);

    // Create booking atomically
    const result = await BookingService.createBookingAtomic({
      userId: req.user!.id,
      courtId,
      startTime,
      endTime,
      price
    });

    // Send notification to venue owner
    try {
      await NotificationService.notifyBookingCreated(
        result.court.facility.owner.id,
        result.booking,
        result.court,
        result.court.facility
      );
    } catch (notificationError) {
      console.error('Failed to send booking notification:', notificationError);
      // Don't fail the booking if notification fails
    }

    res.status(201).json({
      success: true,
      data: result.booking,
      message: 'Booking created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }

    if (error instanceof Error) {
      switch (error.message) {
        case 'SLOT_UNAVAILABLE':
          return res.status(409).json({
            error: 'Time slot is not available',
            code: 'SLOT_UNAVAILABLE'
          });
        case 'COURT_UNDER_MAINTENANCE':
          return res.status(409).json({
            error: 'Court is under maintenance during this time',
            code: 'COURT_UNDER_MAINTENANCE'
          });
        case 'COURT_NOT_FOUND':
          return res.status(404).json({
            error: 'Court not found',
            code: 'COURT_NOT_FOUND'
          });
        case 'OUTSIDE_OPERATING_HOURS':
          return res.status(400).json({
            error: 'Booking is outside court operating hours',
            code: 'OUTSIDE_OPERATING_HOURS'
          });
        default:
          console.error('Booking creation error:', error);
          return res.status(500).json({
            error: 'Failed to create booking'
          });
      }
    }

    console.error('Unexpected booking error:', error);
    res.status(500).json({
      error: 'Failed to create booking'
    });
  }
});

/**
 * POST /bookings/check-availability
 * Check availability for a time slot
 */
router.post('/check-availability', async (req, res) => {
  try {
    const validatedData = checkAvailabilitySchema.parse(req.body);
    
    const { courtId, startTime: startTimeStr, endTime: endTimeStr } = validatedData;
    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);

    const availability = await BookingService.checkAvailability(courtId, startTime, endTime);

    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }

    console.error('Availability check error:', error);
    res.status(500).json({
      error: 'Failed to check availability'
    });
  }
});

/**
 * GET /bookings/my-bookings
 * Get user's bookings
 */
router.get('/my-bookings', requireAuth, async (req, res) => {
  try {
    const { status, from, to, page = '1', limit = '10' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const options: any = {
      limit: limitNum,
      offset
    };

    if (status) options.status = status;
    if (from) options.from = new Date(from as string);
    if (to) options.to = new Date(to as string);

    // Use a different method for user bookings
    const result = await BookingService.getUserBookings(req.user!.id, options);

    res.json({
      success: true,
      data: result.bookings,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      error: 'Failed to fetch bookings'
    });
  }
});

/**
 * GET /owners/:ownerId/bookings
 * Get bookings for owner's venues (Owner/Admin only)
 */
router.get('/owners/:ownerId/bookings', requireAuth, async (req, res) => {
  try {
    const { ownerId } = req.params;
    
    // Check permission
    if (req.user!.id !== ownerId && req.user!.role !== UserRole.ADMIN) {
      return res.status(403).json({
        error: 'You can only view your own venue bookings'
      });
    }

    const { facilityId, status, from, to, page = '1', limit = '10' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const options: any = {
      limit: limitNum,
      offset
    };

    if (facilityId) options.facilityId = facilityId as string;
    if (status) options.status = status;
    if (from) options.from = new Date(from as string);
    if (to) options.to = new Date(to as string);

    const result = await BookingService.getOwnerBookings(ownerId, options);

    res.json({
      success: true,
      data: result.bookings,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching owner bookings:', error);
    res.status(500).json({
      error: 'Failed to fetch bookings'
    });
  }
});

/**
 * PUT /bookings/:id/cancel
 * Cancel a booking
 */
router.put('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await BookingService.cancelBooking(id, req.user!.id, req.user!.role);

    // Send notification to venue owner if user cancelled
    if (booking.userId === req.user!.id) {
      try {
        await NotificationService.notifyBookingCancelled(
          booking.court.facility.owner.id,
          booking,
          booking.court,
          booking.court.facility
        );
      } catch (notificationError) {
        console.error('Failed to send cancellation notification:', notificationError);
      }
    }

    res.json({
      success: true,
      data: booking,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'BOOKING_NOT_FOUND':
          return res.status(404).json({
            error: 'Booking not found',
            code: 'BOOKING_NOT_FOUND'
          });
        case 'UNAUTHORIZED_CANCELLATION':
          return res.status(403).json({
            error: 'You are not authorized to cancel this booking',
            code: 'UNAUTHORIZED_CANCELLATION'
          });
        case 'BOOKING_ALREADY_CANCELLED':
          return res.status(400).json({
            error: 'Booking is already cancelled',
            code: 'BOOKING_ALREADY_CANCELLED'
          });
        case 'CANNOT_CANCEL_COMPLETED_BOOKING':
          return res.status(400).json({
            error: 'Cannot cancel completed booking',
            code: 'CANNOT_CANCEL_COMPLETED_BOOKING'
          });
        default:
          console.error('Booking cancellation error:', error);
          return res.status(500).json({
            error: 'Failed to cancel booking'
          });
      }
    }

    console.error('Unexpected cancellation error:', error);
    res.status(500).json({
      error: 'Failed to cancel booking'
    });
  }
});

/**
 * PUT /bookings/:id/confirm
 * Confirm a booking (Owner only)
 */
router.put('/:id/confirm', requireAuth, checkOwnerRole, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await BookingService.confirmBooking(id, req.user!.id);

    res.json({
      success: true,
      data: booking,
      message: 'Booking confirmed successfully'
    });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'BOOKING_NOT_FOUND':
          return res.status(404).json({
            error: 'Booking not found',
            code: 'BOOKING_NOT_FOUND'
          });
        case 'UNAUTHORIZED_CONFIRMATION':
          return res.status(403).json({
            error: 'You are not authorized to confirm this booking',
            code: 'UNAUTHORIZED_CONFIRMATION'
          });
        case 'BOOKING_NOT_PENDING':
          return res.status(400).json({
            error: 'Only pending bookings can be confirmed',
            code: 'BOOKING_NOT_PENDING'
          });
        default:
          console.error('Booking confirmation error:', error);
          return res.status(500).json({
            error: 'Failed to confirm booking'
          });
      }
    }

    console.error('Unexpected confirmation error:', error);
    res.status(500).json({
      error: 'Failed to confirm booking'
    });
  }
});

export { router as secureBookingRouter };
