import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { FacilityStatus, UserRole } from '../../types/enums.js';
import { z } from 'zod';
import { AuthRequest, requireAuth, requireRoles } from '../../middleware/auth.js';

const prisma = new PrismaClient();
export const facilityRouter = Router();

const createSchema = z.object({
  name: z.string().min(2),
  location: z.string().min(2),
  description: z.string().min(10),
  sports: z.array(z.string()).min(1),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([])
});

facilityRouter.post('/', requireAuth, requireRoles(UserRole.OWNER), async (req: AuthRequest, res: Response) => {
  try {
    const data = createSchema.parse(req.body);
    const facility = await prisma.facility.create({ data: { ...data, ownerId: req.user!.id } });
    res.status(201).json(facility);
  } catch (e: any) { res.status(400).json({ message: e.message }); }
});

facilityRouter.get('/', async (req: Request, res: Response) => {
  const { sport, q, status, page = '1', pageSize = '10' } = req.query as Record<string, string>;
  const where: any = { status: FacilityStatus.APPROVED };
  if (status && Object.values(FacilityStatus).includes(status as FacilityStatus)) where.status = status;
  if (sport) where.sports = { has: sport };
  if (q) where.OR = [ { name: { contains: q, mode: 'insensitive' } }, { location: { contains: q, mode: 'insensitive' } } ];
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);
  const [items, total] = await Promise.all([
    prisma.facility.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { courts: true } }),
    prisma.facility.count({ where })
  ]);
  res.json({ items, total, page: parseInt(page), pageSize: take });
});

facilityRouter.get('/:id', async (req: Request, res: Response) => {
  const facility = await prisma.facility.findUnique({ where: { id: req.params.id }, include: { courts: true } });
  if (!facility || facility.status !== 'APPROVED') return res.status(404).json({ message: 'Not found' });
  res.json(facility);
});

// Admin routes BEFORE dynamic :id to avoid route shadowing
facilityRouter.get('/admin/pending/list', requireAuth, requireRoles(UserRole.ADMIN), async (_req: Request, res: Response) => {
  const pending = await prisma.facility.findMany({ where: { status: FacilityStatus.PENDING }, orderBy: { createdAt: 'asc' } });
  res.json(pending);
});

facilityRouter.post('/admin/:id/approve', requireAuth, requireRoles(UserRole.ADMIN), async (req: Request, res: Response) => {
  const updated = await prisma.facility.update({ where: { id: req.params.id }, data: { status: FacilityStatus.APPROVED } });
  res.json(updated);
});

facilityRouter.post('/admin/:id/reject', requireAuth, requireRoles(UserRole.ADMIN), async (req: Request, res: Response) => {
  const updated = await prisma.facility.update({ where: { id: req.params.id }, data: { status: FacilityStatus.REJECTED } });
  res.json(updated);
});
