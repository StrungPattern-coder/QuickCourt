import { Router } from 'express';
import { authLimiter } from '../../middleware/rateLimit.js';
import { requireAuth } from '../../middleware/auth.js';
import { loginHandler, logoutHandler, meHandler, refreshHandler, signupHandler, updateProfileHandler, verifyOtpHandler } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/signup', authLimiter, signupHandler);
authRouter.post('/verify-otp', authLimiter, verifyOtpHandler);
authRouter.post('/login', authLimiter, loginHandler);
authRouter.post('/refresh', refreshHandler);
authRouter.post('/logout', logoutHandler);
authRouter.get('/me', requireAuth, meHandler);
authRouter.put('/me', requireAuth, updateProfileHandler);
