import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { facilityRouter } from './modules/facility/facility.routes.js';
import { courtRouter } from './modules/court/court.routes.js';
import { bookingRouter } from './modules/booking/booking.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import reviewRouter from './modules/review/review.routes.js';
import { errorHandler, notFound } from './middleware/error.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: '50mb' })); // Increase JSON payload limit
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Increase URL-encoded payload limit
app.use(cookieParser());
app.use(morgan('dev'));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/auth', authRouter);
app.use('/facilities', facilityRouter);
app.use('/courts', courtRouter);
app.use('/bookings', bookingRouter);
app.use('/admin', adminRouter);
app.use('/reviews', reviewRouter);

app.use(notFound);
app.use(errorHandler);
