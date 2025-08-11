import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, requireRoles } from '../../middleware/auth.js';
import { NotificationService } from '../../services/notification.js';

const prisma = new PrismaClient();
export const facilityRouter = Router();

// Validation schemas
const createVenueSchema = z.object({
  name: z.string().min(2).max(100),
  location: z.string().min(5).max(200),
  description: z.string().min(10).max(1000),
  sports: z.array(z.string()).min(1).max(10),
  amenities: z.array(z.string()).max(20).default([]),
  images: z.array(z.string().url()).max(10).default([])
});

const createCourtSchema = z.object({
  name: z.string().min(2).max(50),
  pricePerHour: z.number().positive().max(10000),
  openTime: z.number().min(0).max(1440),
  closeTime: z.number().min(0).max(1440)
});

/**
 * POST /facilities
 * Create a new venue/facility (Owner only)
 */
facilityRouter.post('/', requireAuth, requireRoles('OWNER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const data = createVenueSchema.parse(req.body);
    
    const facility = await prisma.facility.create({
      data: {
        ...data,
        ownerId: req.user!.id,
        status: 'PENDING' // Requires admin approval
      },
      include: {
        owner: {
          select: { id: true, email: true, fullName: true }
        }
      }
    });

    // 🔔 NOTIFY ALL ADMINS OF NEW VENUE SUBMISSION
    try {
      await NotificationService.notifyAdminsOfNewFacility(facility, facility.owner);
      console.log(`✅ Admin notifications sent for new facility: ${facility.name}`);
    } catch (notificationError) {
      console.error('❌ Failed to send admin notifications:', notificationError);
      // Don't fail the venue creation if notifications fail
    }

    res.status(201).json({
      success: true,
      data: facility,
      message: 'Venue created successfully. It will be reviewed by our team before going live.'
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    console.error('Error creating facility:', error);
    res.status(500).json({
      error: 'Failed to create venue'
    });
  }
});

/**
 * GET /facilities
 * Browse all approved venues (Public endpoint)
 */
facilityRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      sport, 
      location,
      q, 
      page = '1', 
      limit = '12',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query as Record<string, string>;

    // Build where clause
    const where: any = { 
      status: 'APPROVED' // Only show approved venues
    };

    if (sport) {
      where.sports = { has: sport };
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [venues, total] = await Promise.all([
      prisma.facility.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          courts: {
            select: {
              id: true,
              name: true,
              pricePerHour: true,
              openTime: true,
              closeTime: true
            }
          },
          owner: {
            select: {
              id: true,
              fullName: true
            }
          },
          _count: {
            select: {
              courts: true
            }
          }
        }
      }),
      prisma.facility.count({ where })
    ]);

    // Calculate price range for each venue
    const venuesWithPricing = venues.map(venue => ({
      ...venue,
      priceRange: venue.courts.length > 0 ? {
        min: Math.min(...venue.courts.map(c => Number(c.pricePerHour))),
        max: Math.max(...venue.courts.map(c => Number(c.pricePerHour)))
      } : { min: 0, max: 0 }
    }));

    res.json({
      success: true,
      data: venuesWithPricing,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasMore: pageNum * limitNum < total
      }
    });
  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({
      error: 'Failed to fetch venues'
    });
  }
});

/**
 * GET /facilities/my-venues
 * Get owner's venues (Owner only)
 */
facilityRouter.get('/my-venues', requireAuth, requireRoles('OWNER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { status, page = '1', limit = '10' } = req.query as Record<string, string>;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { ownerId: req.user!.id };
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status;
    }

    const [venues, total] = await Promise.all([
      prisma.facility.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          courts: {
            select: {
              id: true,
              name: true,
              pricePerHour: true,
              openTime: true,
              closeTime: true
            }
          },
          _count: {
            select: {
              courts: true
            }
          }
        }
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
      error: 'Failed to fetch your venues'
    });
  }
});

/**
 * GET /facilities/:id
 * Get venue details (Public endpoint for approved venues)
 */
facilityRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const facility = await prisma.facility.findUnique({
      where: { id },
      include: {
        courts: {
          orderBy: { name: 'asc' }
        },
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    if (!facility) {
      return res.status(404).json({
        error: 'Venue not found'
      });
    }

    // Only allow public access to approved facilities
    if (facility.status !== 'APPROVED') {
      // Allow owner and admin to view their own pending/rejected facilities
      if (!req.user || (req.user.id !== facility.ownerId && req.user.role !== 'ADMIN')) {
        return res.status(404).json({
          error: 'Venue not found'
        });
      }
    }

    res.json({
      success: true,
      data: facility
    });
  } catch (error) {
    console.error('Error fetching venue:', error);
    res.status(500).json({
      error: 'Failed to fetch venue'
    });
  }
});

/**
 * PUT /facilities/:id
 * Update venue (Owner only, own venues)
 */
facilityRouter.put('/:id', requireAuth, requireRoles('OWNER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = createVenueSchema.partial().parse(req.body);

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

    if (existingVenue.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'You can only update your own venues'
      });
    }

    // Don't allow updates to approved venues without admin approval
    if (existingVenue.status === 'APPROVED' && req.user!.role !== 'ADMIN') {
      return res.status(400).json({
        error: 'Cannot modify approved venues. Contact support for changes.'
      });
    }

    const venue = await prisma.facility.update({
      where: { id },
      data: updateData,
      include: {
        courts: true,
        owner: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });

    res.json({
      success: true,
      data: venue,
      message: 'Venue updated successfully'
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
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
 * POST /facilities/:id/courts
 * Add court to venue (Owner only)
 */
facilityRouter.post('/:id/courts', requireAuth, requireRoles('OWNER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id: facilityId } = req.params;
    const courtData = createCourtSchema.parse(req.body);

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

    if (facility.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'You can only add courts to your own venues'
      });
    }

    if (facility.status !== 'APPROVED') {
      return res.status(400).json({
        error: 'Can only add courts to approved venues'
      });
    }

    // Validate open/close times
    if (courtData.openTime >= courtData.closeTime) {
      return res.status(400).json({
        error: 'Close time must be after open time'
      });
    }

    const court = await prisma.court.create({
      data: {
        ...courtData,
        facilityId
      }
    });

    res.status(201).json({
      success: true,
      data: court,
      message: 'Court added successfully'
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
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
 * GET /facilities/sports/list
 * Get list of available sports (for filtering)
 */
facilityRouter.get('/sports/list', async (req: Request, res: Response) => {
  try {
    const sports = await prisma.facility.findMany({
      where: { status: 'APPROVED' },
      select: { sports: true }
    });

    // Extract unique sports
    const uniqueSports = [...new Set(sports.flatMap(f => f.sports))];

    res.json({
      success: true,
      data: uniqueSports.sort()
    });
  } catch (error) {
    console.error('Error fetching sports list:', error);
    res.status(500).json({
      error: 'Failed to fetch sports list'
    });
  }
});

// Admin routes for facility approval
facilityRouter.get('/admin/pending', requireAuth, requireRoles('ADMIN'), async (req: Request, res: Response) => {
  try {
    const pending = await prisma.facility.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });

    res.json({
      success: true,
      data: pending
    });
  } catch (error) {
    console.error('Error fetching pending facilities:', error);
    res.status(500).json({
      error: 'Failed to fetch pending facilities'
    });
  }
});

/**
 * POST /facilities/admin/:id/approve
 * Approve pending venue (Admin only)
 */
facilityRouter.post('/admin/:id/approve', requireAuth, requireRoles('ADMIN'), async (req: Request, res: Response) => {
  try {
    const updated = await prisma.facility.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED' },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });

    res.json({
      success: true,
      data: updated,
      message: 'Venue approved successfully'
    });
  } catch (error) {
    console.error('Error approving venue:', error);
    res.status(500).json({
      error: 'Failed to approve venue'
    });
  }
});

/**
 * POST /facilities/admin/:id/reject
 * Reject pending venue (Admin only)
 */
facilityRouter.post('/admin/:id/reject', requireAuth, requireRoles('ADMIN'), async (req: Request, res: Response) => {
  try {
    const updated = await prisma.facility.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });

    res.json({
      success: true,
      data: updated,
      message: 'Venue rejected'
    });
  } catch (error) {
    console.error('Error rejecting venue:', error);
    res.status(500).json({
      error: 'Failed to reject venue'
    });
  }
});
