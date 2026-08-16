import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { FacilityStatus, UserRole } from '../../types/enums.js';
import { verifyAccessToken } from '../../utils/jwt.js';
import { z } from 'zod';
import { AuthRequest, requireAuth, requireRoles } from '../../middleware/auth.js';

const prisma = new PrismaClient();
export const facilityRouter = Router();

// Facilities currently operate in India.  Store all booking instants in UTC,
// but build a venue's calendar day and clock-time slots in IST.  Relying on
// the Node process timezone here made availability differ between local
// development and Vercel (which runs in UTC).
const VENUE_TIMEZONE_OFFSET_MINUTES = 5 * 60 + 30;
const PENDING_HOLD_MINUTES = 10;

const formatLocalDateInput = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDateInput = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);

  // `YYYY-MM-DD` represents a calendar date at the venue, not midnight in
  // whichever timezone happens to run this server.
  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      - VENUE_TIMEZONE_OFFSET_MINUTES * 60 * 1000
  );
};

const createSchema = z.object({
  name: z.string().min(2),
  location: z.string().min(2),
  description: z.string().min(10),
  sports: z.array(z.string()).min(1),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
  propertyTypes: z.array(z.enum(["PLAY","BOOK","TRAIN"]))
    .default(["BOOK"]) // default to BOOK to match current behavior
});

facilityRouter.post('/', requireAuth, requireRoles(UserRole.OWNER), async (req: AuthRequest, res: Response) => {
  try {
  const data = createSchema.parse(req.body);
  const facility = await prisma.facility.create({
    data: {
      name: data.name,
      location: data.location,
      description: data.description,
      sports: data.sports,
      amenities: data.amenities,
      images: data.images,
      propertyTypes: data.propertyTypes,
      owner: { connect: { id: req.user!.id } }
    }
  });
    res.status(201).json(facility);
  } catch (e: any) { res.status(400).json({ message: e.message }); }
});

facilityRouter.get('/owner/me', requireAuth, requireRoles(UserRole.OWNER), async (req: AuthRequest, res: Response) => {
  try {
    const facilities = await prisma.facility.findMany({
      where: { ownerId: req.user!.id },
      include: {
        courts: true,
        reviews: { select: { rating: true } },
        _count: { select: { courts: true, reviews: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(facilities.map(withFacilityStats));
  } catch (e) {
    console.error('Failed to fetch owner facilities:', e);
    res.status(500).json({ message: 'Failed to fetch owner facilities' });
  }
});

facilityRouter.get('/', async (req: Request, res: Response) => {
  const {
    sport,
    q,
    status,
    propertyType,
    priceMin,
    priceMax,
    amenities,
    sort = 'newest',
    page = '1',
    pageSize = '10'
  } = req.query as Record<string, string>;
  const where: any = { status: FacilityStatus.APPROVED };
  if (status && Object.values(FacilityStatus).includes(status as FacilityStatus)) where.status = status;
  if (sport) where.sports = { has: sport };
  if (propertyType && ['PLAY', 'BOOK', 'TRAIN'].includes(propertyType)) where.propertyTypes = { has: propertyType };
  if (amenities) {
    const amenityList = amenities.split(',').map(a => a.trim()).filter(Boolean);
    if (amenityList.length > 0) where.amenities = { hasEvery: amenityList };
  }
  if (priceMin || priceMax) {
    where.courts = {
      some: {
        pricePerHour: {
          ...(priceMin ? { gte: Number(priceMin) } : {}),
          ...(priceMax ? { lte: Number(priceMax) } : {})
        }
      }
    };
  }
  if (q) where.OR = [ { name: { contains: q, mode: 'insensitive' } }, { location: { contains: q, mode: 'insensitive' } } ];
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);
  const [rawItems, total] = await Promise.all([
    prisma.facility.findMany({
      where,
      skip,
      take,
      orderBy: sort === 'newest' ? { createdAt: 'desc' } : { createdAt: 'desc' },
      include: {
        courts: true,
        reviews: { select: { rating: true } },
        _count: { select: { reviews: true } }
      }
    }),
    prisma.facility.count({ where })
  ]);
  const items = rawItems.map(withFacilityStats).sort((a, b) => {
    if (sort === 'price_low') return a.minPrice - b.minPrice;
    if (sort === 'price_high') return b.minPrice - a.minPrice;
    if (sort === 'rating') return b.rating - a.rating;
    if (sort === 'popular') return b.reviewCount - a.reviewCount;
    return 0;
  });
  res.json({ items, total, page: parseInt(page), pageSize: take });
});

facilityRouter.get('/:id', async (req: Request, res: Response) => {
  const facility = await prisma.facility.findUnique({
    where: { id: req.params.id },
    include: {
      courts: true,
      reviews: { select: { rating: true } },
      _count: { select: { reviews: true } }
    }
  });
  if (!facility) return res.status(404).json({ message: 'Not found' });
  if (facility.status !== FacilityStatus.APPROVED) {
    // Allow owner or admin to view unapproved facility if authenticated
    try {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) return res.status(404).json({ message: 'Not found' });
      const payload = verifyAccessToken(auth.slice(7));
      if (payload.role !== 'ADMIN' && payload.sub !== facility.ownerId) return res.status(404).json({ message: 'Not found' });
    } catch {
      return res.status(404).json({ message: 'Not found' });
    }
  }
  res.json(withFacilityStats(facility));
});

// Admin routes BEFORE dynamic :id to avoid route shadowing
facilityRouter.get('/admin/pending/list', requireAuth, requireRoles(UserRole.ADMIN), async (_req: Request, res: Response) => {
  const pending = await prisma.facility.findMany({ where: { status: FacilityStatus.PENDING }, orderBy: { createdAt: 'asc' } });
  res.json(pending);
});

function withFacilityStats(facility: any) {
  const courts = facility.courts || [];
  const prices = courts.map((court: any) => Number(court.pricePerHour)).filter((price: number) => Number.isFinite(price));
  const ratings = facility.reviews || [];
  const reviewCount = facility._count?.reviews ?? ratings.length;
  const rating = ratings.length
    ? Math.round((ratings.reduce((sum: number, review: any) => sum + Number(review.rating), 0) / ratings.length) * 10) / 10
    : 0;
  const { reviews, _count, ...rest } = facility;

  return {
    ...rest,
    rating,
    reviewCount,
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
    _count
  };
}

facilityRouter.post('/admin/:id/approve', requireAuth, requireRoles(UserRole.ADMIN), async (req: Request, res: Response) => {
  const updated = await prisma.facility.update({ where: { id: req.params.id }, data: { status: FacilityStatus.APPROVED } });
  res.json(updated);
});

facilityRouter.post('/admin/:id/reject', requireAuth, requireRoles(UserRole.ADMIN), async (req: Request, res: Response) => {
  const updated = await prisma.facility.update({ where: { id: req.params.id }, data: { status: FacilityStatus.REJECTED } });
  res.json(updated);
});

// Facility availability (hourly slots per court)
facilityRouter.get('/:id/availability', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rawDate = (req.query.date as string) || formatLocalDateInput();

    // Auto-expire stale pending bookings older than 10 minutes
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    await prisma.booking.updateMany({
      where: {
        status: 'PENDING' as any,
        createdAt: { lt: tenMinsAgo }
      },
      data: { status: 'CANCELLED' as any }
    }).catch(err => console.warn('Stale booking cleanup warning:', err));

    // Normalize dateParam to YYYY-MM-DD
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(rawDate);
    const dateParam = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : formatLocalDateInput();

    // Standardize day range in UTC
    const dayStart = new Date(`${dateParam}T00:00:00.000Z`);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    // Get facility with courts
    const facility = await prisma.facility.findUnique({
      where: { id },
      include: {
        courts: {
          select: {
            id: true,
            name: true,
            openTime: true,
            closeTime: true,
            pricePerHour: true,
            maintenance: {
              where: {
                startTime: { lt: dayEnd },
                endTime: { gt: dayStart }
              },
              select: { id: true, startTime: true, endTime: true, reason: true }
            }
          }
        }
      }
    });
    if (!facility) return res.status(404).json({ message: 'Not found' });
    if (facility.status !== FacilityStatus.APPROVED) {
      // Validate auth to allow owner/admin preview availability
      try {
        const auth = req.headers.authorization;
        if (!auth?.startsWith('Bearer ')) return res.status(404).json({ message: 'Not found' });
        const payload = verifyAccessToken(auth.slice(7));
        if (payload.role !== 'ADMIN' && payload.sub !== facility.ownerId) return res.status(404).json({ message: 'Not found' });
      } catch {
        return res.status(404).json({ message: 'Not found' });
      }
    }

    const courtIds = facility.courts.map(c => c.id);
    // Fetch bookings for the day for these courts (PENDING < 10min or CONFIRMED)
    const activePendingSince = new Date(Date.now() - PENDING_HOLD_MINUTES * 60 * 1000);
    const bookings = await prisma.booking.findMany({
      where: {
        courtId: { in: courtIds },
        // A pending payment is a short-lived checkout hold.  Old abandoned
        // holds must not leave recurring phantom "BOOKED" slots in the UI.
        OR: [
          { status: 'CONFIRMED' as any },
          { status: 'PENDING' as any, createdAt: { gte: activePendingSince } },
        ],
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
      select: { id: true, courtId: true, startTime: true, endTime: true, status: true }
    });

    const now = new Date();
    const todayStr = formatLocalDateInput(now);
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const slots: Array<{ id: string; startTime: string; endTime: string; price: number; isAvailable: boolean; courtId: string; courtName: string; }>
      = [];

    // Helper to format minutes to HH:mm
    const toHM = (mins: number) => {
      const h = Math.floor(mins / 60).toString().padStart(2, '0');
      const m = (mins % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
    };

    for (const court of facility.courts) {
      // Generate 1-hour slots between open and close
      for (let startMin = court.openTime; startMin + 60 <= court.closeTime; startMin += 60) {
        const endMin = startMin + 60;
        const slotStart = new Date(dayStart.getTime() + startMin * 60 * 1000);
        const slotEnd = new Date(dayStart.getTime() + endMin * 60 * 1000);

        // Check overlap with bookings
        const hasOverlap = bookings.some(b => {
          if (b.courtId !== court.id) return false;
          const bStart = new Date(b.startTime).getTime();
          const bEnd = new Date(b.endTime).getTime();
          return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart;
        });

        const hasMaintenance = court.maintenance.some(block => {
          const mStart = new Date(block.startTime).getTime();
          const mEnd = new Date(block.endTime).getTime();
          return slotStart.getTime() < mEnd && slotEnd.getTime() > mStart;
        });

        // Determine if slot has already passed
        const isPast = dateParam < todayStr || (dateParam === todayStr && endMin <= currentMins);

        slots.push({
          id: `${court.id}-${dateParam}-${startMin}`,
          startTime: toHM(startMin),
          endTime: toHM(endMin),
          price: Number(court.pricePerHour),
          isAvailable: !hasOverlap && !hasMaintenance && !isPast,
          courtId: court.id,
          courtName: court.name,
        });
      }
    }

    // Sort by time then court name for stable ordering
    slots.sort((a, b) => a.startTime.localeCompare(b.startTime) || a.courtName.localeCompare(b.courtName));

    res.json(slots);
  } catch (e) {
    console.error('Failed to get availability:', e);
    res.status(500).json({ message: 'Failed to get availability' });
  }
});
