import { Router, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { BookingStatus, UserRole } from '../../types/enums.js';
import { z } from 'zod';
import { AuthRequest, requireAuth, requireRoles } from '../../middleware/auth.js';

const prisma = new PrismaClient();
export const bookingRouter = Router();

const bookingSchema = z.object({ courtId: z.string(), startTime: z.string().datetime(), endTime: z.string().datetime() });

bookingRouter.post('/', requireAuth, requireRoles(UserRole.USER, UserRole.OWNER, UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const { courtId, startTime, endTime } = bookingSchema.parse(req.body);
    const start = new Date(startTime); const end = new Date(endTime);
    if (end <= start) return res.status(400).json({ message: 'Invalid time range' });
  const booking = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const overlap = await tx.booking.findFirst({
        where: {
          courtId,
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          OR: [
            { startTime: { lt: end }, endTime: { gt: start } }
          ]
        }
      });
      if (overlap) throw new Error('Slot unavailable');
      const court = await tx.court.findUnique({ where: { id: courtId } });
      if (!court) throw new Error('Court not found');
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      const price = hours * Number(court.pricePerHour);
      // Create booking with PENDING status - payment will confirm it
      return tx.booking.create({ 
        data: { 
          courtId, 
          userId: req.user!.id, 
          startTime: start, 
          endTime: end, 
          price: price.toFixed(2) as any, 
          status: BookingStatus.PENDING 
        },
        include: {
          court: {
            include: {
              facility: true
            }
          }
        }
      });
    });
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully. Please complete payment to confirm.',
      data: {
        booking: {
          id: booking.id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          price: booking.price,
          status: booking.status,
          court: booking.court,
        }
      }
    });
  } catch (e: any) { 
    res.status(400).json({ 
      success: false,
      message: e.message 
    }); 
  }
});

bookingRouter.get('/my', requireAuth, async (req: AuthRequest, res: Response) => {
  const bookings = await prisma.booking.findMany({ where: { userId: req.user!.id }, orderBy: { startTime: 'desc' }, include: { court: { include: { facility: true } } } });
  res.json(bookings);
});
