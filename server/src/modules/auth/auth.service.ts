import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { UserRole } from '../../types/enums.js';
import { generateOtp, hashPassword, sha256, verifyPassword } from '../../utils/hash.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { env } from '../../config/env.js';
import { sendEmail } from '../../services/email.js';

const prisma = new PrismaClient();

const userSelect = {
  id: true,
  email: true,
  fullName: true,
  avatarUrl: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  createdAt: true,
  updatedAt: true
};

export async function registerUser(params: { email: string; password: string; fullName: string; role: UserRole; avatarUrl?: string }) {
  const existing = await prisma.user.findUnique({ where: { email: params.email } });
  if (existing) throw new Error('Email already registered');
  const passwordHash = await hashPassword(params.password);
  const user = await prisma.user.create({
    data: {
      email: params.email,
      passwordHash,
      fullName: params.fullName,
      role: params.role,
      avatarUrl: params.avatarUrl,
      emailVerifiedAt: new Date()
    }
  });
  const session = await createSession(user.id, user.role);
  return {
    userId: user.id,
    userRole: user.role,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: session.user
  };
}

export async function verifyOtp(userId: string, otp: string) {
  await prisma.user.updateMany({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  return { success: true };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new Error('Invalid credentials');
  if (user.status === 'BANNED') throw new Error('User banned');
  return createSession(user.id, user.role);
}

export async function resendSignupOtp(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found');
  if (user.emailVerifiedAt) throw new Error('Email is already verified');
  const delivery = await issueOtp(user.id, user.email, 'Verify your QuickCourt account');
  return { userId: user.id, userRole: user.role, delivery };
}

export async function sendLoginOtp(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('No account found for this email');
  if (user.status === 'BANNED') throw new Error('User banned');
  const delivery = await issueOtp(user.id, user.email, 'Your QuickCourt login code');
  return { userId: user.id, userRole: user.role, delivery };
}

export async function verifyLoginOtp(userId: string, otp: string) {
  await verifyOtp(userId, otp);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  if (user.status === 'BANNED') throw new Error('User banned');
  return createSession(user.id, user.role);
}

export async function requestPasswordReset(email: string, baseUrl: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status === 'BANNED') return { queued: false };

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });

  const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${token}`;
  const delivery = await sendEmail(
    user.email,
    'Reset your QuickCourt password',
    `<p>Use this secure link to reset your QuickCourt password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 30 minutes.</p>`
  );

  if ((delivery as { disabled?: boolean }).disabled) {
    console.log(`[password reset] for ${user.email}: ${resetUrl}`);
  }

  return { queued: true };
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = sha256(token);
  const resetToken = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null },
    orderBy: { createdAt: 'desc' }
  });

  if (!resetToken) throw new Error('Invalid or expired reset token');
  if (resetToken.expiresAt < new Date()) throw new Error('Invalid or expired reset token');

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash, emailVerifiedAt: new Date() } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    prisma.refreshToken.updateMany({ where: { userId: resetToken.userId, revokedAt: null }, data: { revokedAt: new Date() } })
  ]);

  return { success: true };
}

async function createSession(userId: string, role: string) {
  const accessToken = signAccessToken({ sub: userId, role });
  const refreshToken = signRefreshToken({ sub: userId, role });
  const tokenHash = sha256(refreshToken);
  const expiresAt = new Date(Date.now() + parseTtl(env.refreshTokenTtl));
  await prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
  const safeUser = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
  return { accessToken, refreshToken, user: safeUser };
}

async function issueOtp(userId: string, email: string, subject: string) {
  const otp = generateOtp();
  const otpHash = sha256(otp);
  const expiresAt = new Date(Date.now() + env.otpTtlMinutes * 60 * 1000);

  await prisma.verificationToken.create({ data: { userId, otpHash, expiresAt } });

  const delivery = await sendEmail(
    email,
    subject,
    `<p>Your QuickCourt verification code is <strong>${otp}</strong>.</p><p>This code expires in ${env.otpTtlMinutes} minutes.</p>`
  );

  if ((delivery as { disabled?: boolean }).disabled) {
    console.log(`[OTP] for ${email}: ${otp}`);
    return { ...delivery, devOtp: otp };
  }

  return delivery;
}

export async function rotateRefreshToken(oldToken: string) {
  let payload;
  try { payload = verifyRefreshToken(oldToken); } catch { throw new Error('Invalid token'); }
  const tokenHash = sha256(oldToken);
  const existing = await prisma.refreshToken.findFirst({ where: { tokenHash, revokedAt: null } });
  if (!existing) throw new Error('Token revoked');
  if (existing.expiresAt < new Date()) throw new Error('Token expired');
  await prisma.refreshToken.update({ where: { id: existing.id }, data: { revokedAt: new Date() } });
  const accessToken = signAccessToken({ sub: payload.sub, role: payload.role });
  const refreshToken = signRefreshToken({ sub: payload.sub, role: payload.role });
  await prisma.refreshToken.create({ data: { userId: payload.sub, tokenHash: sha256(refreshToken), expiresAt: new Date(Date.now() + parseTtl(env.refreshTokenTtl)) } });
  return { accessToken, refreshToken };
}

export async function logout(refreshToken: string) {
  const tokenHash = sha256(refreshToken);
  await prisma.refreshToken.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
  return { success: true };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
  if (!user) throw new Error('User not found');
  return user;
}

export async function updateCurrentUser(
  userId: string,
  params: { fullName?: string; avatarUrl?: string | null; currentPassword?: string; newPassword?: string }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const data: { fullName?: string; avatarUrl?: string | null; passwordHash?: string } = {};
  if (params.fullName !== undefined) data.fullName = params.fullName;
  if (params.avatarUrl !== undefined) data.avatarUrl = params.avatarUrl;

  if (params.newPassword) {
    if (!params.currentPassword) throw new Error('Current password is required');
    const valid = await verifyPassword(params.currentPassword, user.passwordHash);
    if (!valid) throw new Error('Current password is incorrect');
    data.passwordHash = await hashPassword(params.newPassword);
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: userSelect
  });
}

function parseTtl(ttl: string): number {
  const match = ttl.match(/^(\d+)([mhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return value * 1000;
  }
}
