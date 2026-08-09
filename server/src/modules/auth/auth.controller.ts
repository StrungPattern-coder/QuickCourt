import { Request, Response } from 'express';
import { z } from 'zod';
import { getCurrentUser, login, logout, registerUser, rotateRefreshToken, updateCurrentUser, verifyOtp } from './auth.service.js';
import { UserRole } from '../../types/enums.js';
import { AuthRequest } from '../../middleware/auth.js';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.nativeEnum(UserRole),
  avatarUrl: z.string().url().optional(),
  inviteSecret: z.string().optional()
});

export async function signupHandler(req: Request, res: Response) {
  try {
    const data = signupSchema.parse(req.body);
    if (data.role === UserRole.ADMIN) {
      if (!data.inviteSecret || data.inviteSecret !== process.env.ADMIN_INVITE_SECRET) {
        return res.status(403).json({ message: 'Invalid admin invite secret' });
      }
    }
    const { inviteSecret, ...rest } = data;
    const out = await registerUser(rest as any); // cast due to zod unknown -> any
    res.status(201).json({ message: 'User created. Verify OTP sent to email.', ...out });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
}

export async function verifyOtpHandler(req: Request, res: Response) {
  const schema = z.object({ userId: z.string(), otp: z.string().length(6) });
  try {
    const { userId, otp } = schema.parse(req.body);
    await verifyOtp(userId, otp);
    res.json({ message: 'Verification successful' });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
}

export async function loginHandler(req: Request, res: Response) {
  const schema = z.object({ email: z.string().email(), password: z.string() });
  try {
    const { email, password } = schema.parse(req.body);
    const tokens = await login(email, password);
    res.json(tokens);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
}

export async function refreshHandler(req: Request, res: Response) {
  const schema = z.object({ refreshToken: z.string() });
  try {
    const { refreshToken } = schema.parse(req.body);
    const tokens = await rotateRefreshToken(refreshToken);
    res.json(tokens);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
}

export async function logoutHandler(req: Request, res: Response) {
  const schema = z.object({ refreshToken: z.string() });
  try {
    const { refreshToken } = schema.parse(req.body);
    await logout(refreshToken);
    res.json({ message: 'Logged out' });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
}

export async function meHandler(req: AuthRequest, res: Response) {
  try {
    const user = await getCurrentUser(req.user!.id);
    res.json(user);
  } catch (e: any) {
    res.status(404).json({ message: e.message });
  }
}

export async function updateProfileHandler(req: AuthRequest, res: Response) {
  const schema = z.object({
    fullName: z.string().min(2).optional(),
    avatarUrl: z.string().url().nullable().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).optional()
  }).refine((data) => !data.newPassword || !!data.currentPassword, {
    message: 'Current password is required to change password',
    path: ['currentPassword']
  });

  try {
    const data = schema.parse(req.body);
    const user = await updateCurrentUser(req.user!.id, data);
    res.json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
}
