import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { facilityRouter } from './modules/facility/facility.routes.js';
import { bookingRouter } from './modules/booking/booking.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { errorHandler, notFound } from './middleware/error.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/auth', authRouter);
app.use('/facilities', facilityRouter);
app.use('/bookings', bookingRouter);
app.use('/admin', adminRouter);

app.use(notFound);
app.use(errorHandler);
