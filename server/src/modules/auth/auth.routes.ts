import { Router } from 'express';
import { authLimiter } from '../../middleware/rateLimit.js';
import { requireAuth } from '../../middleware/auth.js';
import {
  loginHandler,
  logoutHandler,
  forgotPasswordHandler,
  meHandler,
  refreshHandler,
  resendOtpHandler,
  sendLoginOtpHandler,
  signupHandler,
  resetPasswordHandler,
  updateProfileHandler,
  verifyLoginOtpHandler,
  verifyOtpHandler
} from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/signup', authLimiter, signupHandler);
authRouter.post('/verify-otp', authLimiter, verifyOtpHandler);
authRouter.post('/resend-otp', authLimiter, resendOtpHandler);
authRouter.post('/login', authLimiter, loginHandler);
authRouter.post('/send-login-otp', authLimiter, sendLoginOtpHandler);
authRouter.post('/verify-login-otp', authLimiter, verifyLoginOtpHandler);
authRouter.post('/forgot-password', authLimiter, forgotPasswordHandler);
authRouter.post('/reset-password', authLimiter, resetPasswordHandler);
authRouter.post('/refresh', refreshHandler);
authRouter.post('/logout', logoutHandler);
authRouter.get('/me', requireAuth, meHandler);
authRouter.put('/me', requireAuth, updateProfileHandler);
