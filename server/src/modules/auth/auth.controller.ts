import { Request, Response } from 'express';
import { z } from 'zod';
import { login, logout, registerUser, rotateRefreshToken, verifyOtp } from './auth.service.js';
import { UserRole } from '../../types/enums.js';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.nativeEnum(UserRole),
  avatarUrl: z.string().url().optional()
});

export async function signupHandler(req: Request, res: Response) {
  try {
    const data = signupSchema.parse(req.body);
  const out = await registerUser(data as any); // cast due to zod unknown -> any
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
