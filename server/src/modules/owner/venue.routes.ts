import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { checkOwnerRole } from '../../middleware/roleAuth.js';
import { prisma } from '../../utils/prisma.js';
import { FacilityStatus, UserRole } from '@prisma/client';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limiting for venue creation
const createVenueLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 venues per 15 minutes
  message: { error: 'Too many venue creation attempts. Please try again later.' }
});

// Validation schemas
const createVenueSchema = z.object({
  name: z.string().min(3).max(100),
  location: z.string().min(5).max(200),
  description: z.string().min(10).max(1000),
  sports: z.array(z.string()).min(1).max(10),
  amenities: z.array(z.string()).max(20),
  images: z.array(z.string().url()).max(10)
});

const createCourtSchema = z.object({
  name: z.string().min(2).max(50),
  pricePerHour: z.number().positive().max(10000),
  openTime: z.number().min(0).max(1440), // minutes from midnight
  closeTime: z.number().min(0).max(1440)
});

const updateVenueSchema = createVenueSchema.partial();

/**
 * POST /venues
 * Create a new venue (Owner only)
 */
router.post('/', requireAuth, checkOwnerRole, createVenueLimit, async (req, res) => {
  try {
    const validatedData = createVenueSchema.parse(req.body);
    
    const venue = await prisma.facility.create({
      data: {
        ...validatedData,
        ownerId: req.user!.id,
        status: FacilityStatus.PENDING
      },
      include: {
        owner: {
          select: { id: true, email: true, fullName: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: venue,
      message: 'Venue created successfully. It will be reviewed by our team.'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    console.error('Error creating venue:', error);
    res.status(500).json({
      error: 'Failed to create venue'
    });
  }
});

/**
 * GET /venues/my-venues
 * Get owner's venues
 */
router.get('/my-venues', requireAuth, checkOwnerRole, async (req, res) => {
  try {
    const { status, page = '1', limit = '10' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = { ownerId: req.user!.id };
    if (status && Object.values(FacilityStatus).includes(status as FacilityStatus)) {
      where.status = status;
    }

    const [venues, total] = await Promise.all([
      prisma.facility.findMany({
        where,
        include: {
          courts: {
            select: { id: true, name: true, pricePerHour: true }
          },
          _count: {
            select: { courts: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip: offset
      }),
      prisma.facility.count({ where })
    ]);

    res.json({
      success: true,
      data: venues,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching owner venues:', error);
    res.status(500).json({
      error: 'Failed to fetch venues'
    });
  }
});

/**
 * PUT /venues/:id
 * Update venue (Owner only, own venues)
 */
router.put('/:id', requireAuth, checkOwnerRole, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateVenueSchema.parse(req.body);

    // Check if user owns this venue
    const existingVenue = await prisma.facility.findUnique({
      where: { id },
      select: { ownerId: true, status: true }
    });

    if (!existingVenue) {
      return res.status(404).json({
        error: 'Venue not found'
      });
    }

    if (existingVenue.ownerId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
      return res.status(403).json({
        error: 'You can only update your own venues'
      });
    }

    // Don't allow updates to approved venues without admin approval
    if (existingVenue.status === FacilityStatus.APPROVED && req.user!.role !== UserRole.ADMIN) {
      return res.status(400).json({
        error: 'Cannot modify approved venues. Contact support for changes.'
      });
    }

    const venue = await prisma.facility.update({
      where: { id },
      data: validatedData,
      include: {
        courts: true,
        owner: {
          select: { id: true, email: true, fullName: true }
        }
      }
    });

    res.json({
      success: true,
      data: venue,
      message: 'Venue updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    console.error('Error updating venue:', error);
    res.status(500).json({
      error: 'Failed to update venue'
    });
  }
});

/**
 * POST /venues/:id/courts
 * Add court to venue (Owner only)
 */
router.post('/:id/courts', requireAuth, checkOwnerRole, async (req, res) => {
  try {
    const { id: facilityId } = req.params;
    const validatedData = createCourtSchema.parse(req.body);

    // Check if user owns this venue
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: { ownerId: true, status: true }
    });

    if (!facility) {
      return res.status(404).json({
        error: 'Venue not found'
      });
    }

    if (facility.ownerId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
      return res.status(403).json({
        error: 'You can only add courts to your own venues'
      });
    }

    if (facility.status !== FacilityStatus.APPROVED) {
      return res.status(400).json({
        error: 'Can only add courts to approved venues'
      });
    }

    // Validate open/close times
    if (validatedData.openTime >= validatedData.closeTime) {
      return res.status(400).json({
        error: 'Close time must be after open time'
      });
    }

    const court = await prisma.court.create({
      data: {
        ...validatedData,
        facilityId
      }
    });

    res.status(201).json({
      success: true,
      data: court,
      message: 'Court added successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    console.error('Error creating court:', error);
    res.status(500).json({
      error: 'Failed to create court'
    });
  }
});

/**
 * GET /venues/:id/courts
 * Get courts for a venue
 */
router.get('/:id/courts', async (req, res) => {
  try {
    const { id } = req.params;

    const courts = await prisma.court.findMany({
      where: { facilityId: id },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: courts
    });
  } catch (error) {
    console.error('Error fetching courts:', error);
    res.status(500).json({
      error: 'Failed to fetch courts'
    });
  }
});

/**
 * DELETE /venues/:venueId/courts/:courtId
 * Delete court (Owner only)
 */
router.delete('/:venueId/courts/:courtId', requireAuth, checkOwnerRole, async (req, res) => {
  try {
    const { venueId, courtId } = req.params;

    // Check if user owns this venue
    const facility = await prisma.facility.findUnique({
      where: { id: venueId },
      select: { ownerId: true }
    });

    if (!facility) {
      return res.status(404).json({
        error: 'Venue not found'
      });
    }

    if (facility.ownerId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
      return res.status(403).json({
        error: 'You can only delete courts from your own venues'
      });
    }

    // Check if court has any future bookings
    const futureBookings = await prisma.booking.count({
      where: {
        courtId,
        startTime: { gt: new Date() },
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    });

    if (futureBookings > 0) {
      return res.status(400).json({
        error: 'Cannot delete court with future bookings'
      });
    }

    await prisma.court.delete({
      where: { id: courtId }
    });

    res.json({
      success: true,
      message: 'Court deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting court:', error);
    res.status(500).json({
      error: 'Failed to delete court'
    });
  }
});

export { router as ownerVenueRouter };
