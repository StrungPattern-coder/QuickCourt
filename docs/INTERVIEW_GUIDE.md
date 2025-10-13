# QuickCourt – Interview Guide

This guide is a concise, code-accurate walkthrough of the entire project so you can explain it confidently and answer deep-dive questions. File paths in backticks point to exact implementations.

## Elevator pitch
QuickCourt is a real-time sports court discovery and booking platform. Users can browse facilities and courts, view live availability, book slots, pay via Razorpay, and earn loyalty points, streaks, and badges. Facility owners manage courts; admins approve facilities and monitor analytics.

- Frontend: Vite + React + TS + Tailwind + shadcn/ui, React Router, React Query, PWA.
- Backend: Express + Prisma + PostgreSQL, JWT auth (access/refresh), Zod validation, rate limiting, Sentry, Socket.IO.
- DB: Prisma schema with users, facilities, courts, bookings, payments, reviews, loyalty, referrals, badges.

## Tech stack

- Languages
  - TypeScript (frontend and backend)
  - SQL (PostgreSQL via Prisma)
- Frontend
  - React 18, Vite 5, React Router 6
  - Tailwind CSS, shadcn/ui (Radix UI primitives)
  - TanStack React Query, Framer Motion, Leaflet/React-Leaflet
  - zod for client validation, Socket.IO client, PWA via `vite-plugin-pwa`, `@sentry/react`
- Backend
  - Node.js 18+, Express 4, Prisma 5 (ORM), PostgreSQL
  - JSON Web Tokens (`jsonwebtoken`), bcryptjs, zod validation
  - Middleware: helmet, cors, morgan, express-rate-limit, multer
  - Socket.IO 4 (server), `@sentry/node`, dotenv, nodemailer (optional)
- Infrastructure & tooling
  - Postgres (local Docker or Neon serverless), static `/uploads` for images
  - TypeScript, `tsx` runner, ESLint, Tailwind, Vite; package manager: pnpm/bun/npm
  - Observability: Sentry (optional DSN)
  - Testing (planned): Jest + Supertest

## Architecture (high-level)
- Client (SPA): `src/`
  - Routing and app shell: `src/App.tsx`, `src/main.tsx`
  - Data fetching: `src/lib/api.ts` (+ React Query usage across pages)
  - Auth state: `src/contexts/AuthContext.tsx`
  - Feature pages: `src/pages/*`, UI components: `src/components/*`
- API Server: `server/src/`
  - Entrypoints: `index.ts` (HTTP + Socket.IO), `app.ts` (Express app)
  - Config: `config/env.ts`, Sentry: `sentry.ts`
  - Middleware: auth, errors, rateLimit, CORS
  - Modules (feature routers): auth, facility, court, booking (+extras), review, loyalty, badge, payment, admin
  - Services: `services/*` (loyalty, badges, razorpay)
- Data: Prisma models and migrations: `server/prisma/schema.prisma`

Request lifecycle: Helmet → CORS → JSON parser → cookies → morgan → static `/uploads` → Sentry request context → feature routers → notFound → Sentry error handler → error handler.

## High-level system design

Conceptual components and interactions:

```
[ Browser SPA (Vite/React) ]
         |  HTTPS (REST, WebSocket)
         v
[ Express API + Socket.IO ]  -- calls --> [ Razorpay API ]
         |  Prisma ORM
         v
[ PostgreSQL (Neon/local) ]
         |
         +--> [ /uploads static (multer) ]
         +--> [ SMTP provider (optional) ]
         +--> [ Sentry (optional DSN) ]
```

- Browsing flow: SPA calls `/facilities` and `/facilities/:id/availability` to render venues and time slots.
- Booking flow: SPA posts to `/bookings` to create a booking; emits Socket.IO events to owner/user rooms.
- Payments (prod): SPA uses `/payments/orders` → opens Razorpay checkout → `/payments/verify` to confirm.
- Engagement: Loyalty/streaks awarded on booking; referral codes and badges are evaluated via services/routes.
- Admin: `/admin/*` endpoints aggregate metrics and timeseries for dashboard.

Scalability and reliability considerations:
- Stateless API instances behind a load balancer; sticky sessions (or Redis adapter) for Socket.IO at scale.
- Postgres with pooled connections; add read replicas if analytics grow heavy.
- Move `/uploads` to object storage + CDN; add signed URLs.
- Background jobs (workers/cron) for referral/badge processing and email delivery.
- Add caching for hot read endpoints (facilities list/availability windows) if needed.

## Data model cheat sheet (Prisma)
See: `server/prisma/schema.prisma`

- User: role USER/OWNER/ADMIN, status ACTIVE/BANNED, profile fields; relations to Facilities (owner), Bookings, Reviews, RefreshTokens; loyaltyPoints/currentStreak; referralCode and referredBy; badges via UserBadge; points ledger.
- Facility: belongs to Owner (User), status PENDING/APPROVED/REJECTED, sports/amenities/images, propertyTypes [PLAY/BOOK/TRAIN], has Courts and Reviews.
- Court: belongs to Facility, pricePerHour, openTime/closeTime (minutes from midnight), has Bookings, MaintenanceBlock.
- Booking: belongs to User and Court, startTime/endTime, status (PENDING/CONFIRMED/CANCELLED/COMPLETED), price, has one Payment, invites, share link.
- Payment: belongs to Booking, amount, provider (internal|razorpay), providerRef, status (PENDING/SUCCEEDED/FAILED/REFUNDED).
- Review: unique per (user, facility); rating 1–5; optional comment/sport; isVerified=true only if user completed booking.
- Loyalty: PointsLedger entries track changes; UserBadge joins earned badges.
- Referrals: ReferralReward tracks pending→earned for referrer/referee; processed by service.
- Share & Invites: ShareableBookingLink (slug), BookingInvite with token and status (PENDING/ACCEPTED/DECLINED/EXPIRED).

Indexes exist on hot paths: bookings by (courtId, startTime,endTime), payments by status, etc.

## Auth & security
- JWT access + refresh tokens: `server/src/utils/jwt.ts`
- Auth middleware: `requireAuth`, `requireRoles`: `server/src/middleware/auth.ts`
- Access token TTL default 15m; refresh TTL default 7d (`env.ts`).
- Refresh tokens stored hashed (sha256) in DB (`RefreshToken`), rotated on refresh.
- OTP signup: `auth.controller.ts` → `auth.service.ts` generates OTP, stores hash in `VerificationToken` (logged to console in dev). Verified marks token used.
- Admin signup guarded by `ADMIN_INVITE_SECRET`.
- Rate limiting for auth endpoints: `middleware/rateLimit.ts`.
- CORS: permissive on localhost in dev; allow-list in prod (`app.ts`, `config/env.ts`).
- Error handling: normalized JSON via `middleware/error.ts`; Sentry hooks in `sentry.ts`.

## Low-level system design

Request lifecycle (Express):
1. `initSentry()` (optional) and `sentryRequestHandler` for breadcrumb context
2. `helmet`, `cors` (dynamic allow-list), `express.json/urlencoded`, `cookie-parser`, `morgan`
3. Static `/uploads`
4. Routers: `/auth`, `/facilities`, `/courts`, `/bookings`, `/reviews`, `/loyalty`, `/badges`, `/payments`, `/admin`, `/upload`
5. `notFound` → `sentryErrorHandler` → `errorHandler`

Security/auth details:
- `requireAuth` verifies Bearer JWT, attaches `{ id, role }` to `req.user`.
- `requireRoles(...roles)` guards OWNER/ADMIN/USER paths.
- Refresh tokens are hashed (sha256) and stored with expiry; rotated on `/auth/refresh`.
- OTP verification stores hashed OTP in `VerificationToken` with expiry and marks `usedAt` when verified.

Booking sequence (demo mode as implemented in `booking.routes.ts`):
1. Validate payload (courtId, startTime, endTime) via zod.
2. Prisma transaction:
  - Query overlap on same court for `[PENDING|CONFIRMED]` where `slotStart < end` and `slotEnd > start`.
  - Compute hours and price from court `pricePerHour`.
  - Create booking with status `CONFIRMED` and create `Payment` with `provider='internal'` and `SUCCEEDED`.
3. Emit Socket.IO events to `owner:<ownerId>` and `user:<userId>`.
4. Award loyalty points (hours×10) and record daily streak.

Booking sequence (Razorpay mode expected by `payments/*`):
1. Create booking in `PENDING` state.
2. `/payments/orders` creates Razorpay order and DB Payment(PENDING).
3. Frontend opens Razorpay checkout; on success calls `/payments/verify` (HMAC signature verification in prod) which sets Payment to `SUCCEEDED` and Booking to `CONFIRMED`.
4. `/payments/refund` can mark Payment `REFUNDED` and Booking `CANCELLED` (pre-start safeguard).

Facility availability calculation (`facility.routes.ts`):
- Build 60-min slots between `openTime` and `closeTime` (minutes-from-midnight) for a given day.
- Fetch bookings in that day window for the facility’s courts; mark `isAvailable = !overlap && !past`.

Cancel policy and authorization:
- Only booker/owner/admin can cancel. Disallow <30 minutes before start (unless owner/admin). Refund status updated best-effort.

Reviews (`review.service.ts`):
- Enforce one review per (user, facility), rating 1–5, only if user has a `COMPLETED` booking; mark `isVerified=true`.

Loyalty & referrals (`services/loyalty.ts`):
- `addPoints` updates user balance and appends `PointsLedger` in a transaction.
- `recordActivityForStreak` updates `lastActivityDate` and `currentStreak` (same day/no change; consecutive days increments; otherwise reset).
- Referral: `ensureReferralCode`, `applyReferral(code, userId)`, `processReferralRewards()` promotes pending rewards when referee has first `CONFIRMED` booking and grants points to both.

Badges (`services/badges.ts`):
- Criteria JSON (e.g., `minTotalBookings`, `minStreak`); evaluate per user and upsert `UserBadge` if not owned.

Admin analytics (`admin.routes.ts`):
- Build buckets by day or month based on `range` (7d/30d/90d/12m). Aggregate counts and revenue; compute `topFacilities` by revenue/bookings.

Sockets (`server/src/index.ts`):
- Authenticate on connection using token from `handshake.auth.token` or `Authorization` header.
- Join rooms: `user:<id>` for all; `owner:<id>` for owners. Emit booking events to both rooms.

PWA and caching (`vite.config.ts`):
- `vite-plugin-pwa` caches images (CacheFirst) and sets a navigation fallback to `/index.html`.

## Real-time events (Socket.IO)
`server/src/index.ts` creates `io` and authenticates socket connections (optional Bearer token). Authenticated users join `user:<id>`; owners also join `owner:<id>`. Booking create/cancel emits events to both channels.

## Endpoints by feature (server/src/modules/*)
Paths below are relative to API base. All require JWT unless noted.

Auth (`/auth`)
- POST /signup → create user, send/emit OTP (dev: console) [Zod validated]
- POST /verify-otp → verifies OTP
- POST /login → returns {accessToken, refreshToken}
- POST /refresh → rotates refresh token
- POST /logout → revokes given refresh token

Facilities (`/facilities`)
- POST / (OWNER) → create facility (PENDING by default)
- GET / → list facilities with filters sport/q/status + pagination (defaults to APPROVED)
- GET /:id → get facility; if not APPROVED, only owner/admin can access
- GET /:id/availability?date=YYYY-MM-DD → compute 1h slots per court between open/close; disallow overlap and past slots for today
- Admin: GET /admin/pending/list, POST /admin/:id/approve, POST /admin/:id/reject

Courts (`/courts`)
- POST / (OWNER) → create court for owned facility with Zod validation
- GET /facility/:facilityId → list facility’s courts
- GET /owner (OWNER) → all owner courts with counts
- PUT /:id (OWNER) → update court (must own)
- DELETE /:id (OWNER) → delete court if no future bookings
- GET /:id → court details

Bookings (`/bookings`)
- POST / (USER/OWNER/ADMIN) → transactional create with overlap check, compute price from duration, creates Payment record, emits events, awards loyalty points
- PUT /:id/cancel → only booker/owner/admin; disallow within 30 minutes unless owner/admin; marks payment REFUNDED
- DELETE /:id → only booker/admin; only if CANCELLED/COMPLETED
- GET /my → my bookings with court+facility
- GET /owner/stats (OWNER/ADMIN) → aggregates on payments and bookings

Booking Extras (`/bookings`)
- POST /:id/invites → create email invites (tokens), expires in 24h
- POST /invites/:token/respond → ACCEPT/DECLINE (requires auth)
- GET /:id/invites → list invites (owner of booking)
- POST /:id/share-link → idempotent shareable slug generator
- GET /public/slug/:slug (public) → limited booking view by slug

Payments (`/payments`) – Razorpay integration paths
- POST /orders (auth) → create order for PENDING booking
- POST /verify (auth) → verify signature; set Payment/Booking status
- GET /booking/:bookingId/status (auth) → payment detail
- GET /config (public) → exposes keyId
- POST /refund (auth) → initiate refund for SUCCEEDED payment
- POST /webhook (public) → webhook intake (signature validation stubbed)

Notes: Two booking modes exist in code:
- Demo flow (current booking router) confirms Booking immediately and creates Payment with provider="internal" SUCCEEDED.
- Razorpay flow expects Booking to start as PENDING and be CONFIRMED after /payments/verify. Align by switching create to PENDING when using Razorpay end-to-end.

Reviews (`/reviews`)
- POST / (auth) → only if user has COMPLETED booking for facility; marks isVerified
- GET /facility/:facilityId → paginated
- GET /facility/:facilityId/stats → avg + distribution
- GET /my (auth) → user’s reviews
- PUT /:reviewId (auth) → only author
- DELETE /:reviewId (auth) → only author

Loyalty & Referrals (`/loyalty`)
- GET /me (auth) → points + current streak
- GET /ledger (auth) → last 100 ledger entries
- POST /adjust (auth) → admin-only (enforced in handler)
- GET /referral/code (auth) → ensures & returns code
- POST /referral/apply (auth) → set referredBy; enqueue ReferralReward
- POST /referral/process (ADMIN) → grant pending rewards when referee has first CONFIRMED booking

Badges (`/badges`)
- GET / → active catalog
- GET /me (auth) → evaluate then list user-earned badges
- POST /evaluate-all (ADMIN) → batch evaluate

Uploads (`/uploads` static, `/upload` router)
- POST /upload/image (auth, multer) → returns image URL
- POST /upload/images (auth) → multiple images (max 10)

Admin (`/admin`)
- GET /stats → high-level cards (counts, totals, growth)
- GET /analytics?range=7d|30d|90d|12m → series (users/bookings/revenue), top facilities
- GET /users → users with counts
- GET /facilities → facilities with owner & counts
- GET /bookings → latest 100 bookings with joined facility/user
- PUT /facilities/:id/approve|reject
- PUT /users/:id/ban|unban

## Key business logic details
- Overlap prevention: `booking.routes.ts` uses a DB transaction and time-window check where (slotStart < booking.endTime && slotEnd > booking.startTime) and status in PENDING/CONFIRMED.
  - Optimization/robustness: consider a Postgres exclusion constraint on (courtId, tstzrange) to hard-enforce at DB layer for race-proofing.
- Availability: `facility.routes.ts` builds 60-minute slots from court open/close time (minutes from midnight), marks available if no overlap and not in the past for today.
- Price calc: price = hours × court.pricePerHour.
- Cancel policy: prevents cancels within 30 minutes of start (unless owner/admin). Marks Payment REFUNDED.
- Loyalty: `services/loyalty.ts` addPoints + ledger, daily streak via lastActivityDate/currentStreak.
- Referrals: pending rewards created on apply; processor promotes to EARNED after referee’s first CONFIRMED booking.
- Badges: `services/badges.ts` criteria JSON supports minTotalBookings/minStreak; evaluated on demand.
- Admin Analytics: time bucket series by day/month; top facilities by revenue/bookings.
- Uploads: multer to local `uploads/`, image-only filter, 5MB limit; served from `/uploads/*` path.
- Observability: optional Sentry DSN enables request breadcrumbs + error capture.
- Realtime: on booking events, emits to `owner:<id>` and `user:<id>`.

## Frontend integration overview
- API client: `src/lib/api.ts` centralizes endpoints and token refresh fallback.
- Auth: `src/contexts/AuthContext.tsx` persists tokens in localStorage; decodes minimal user info from access token. UI guards via `components/ProtectedRoute.tsx`.
- Booking flow: `src/components/SlotPicker.tsx` + `src/pages/VenueDetailsPage.tsx` navigate to `BookingPageNew.tsx`/`BookingPage.tsx` → POST /bookings. Optional payment modal uses `useRazorpayPayment` to create/verify orders.
- Admin dashboard: `src/pages/AdminDashboard.tsx` calls `/admin/*` APIs to render stats, tables, approve/reject, ban/unban.
- PWA: `vite-plugin-pwa` with basic image caching.

## Configuration & running
- Frontend dev server: Vite on 8080/5173 (see `vite.config.ts`).
- Backend server: Express on port 4000; health at `/health`.
- CORS: dev allows common localhost ports; prod requires `CORS_ORIGIN`.
- Required env (server/.env): DATABASE_URL, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET; optional SMTP, SENTRY_DSN, ADMIN_INVITE_SECRET, Razorpay keys (see README).

## Edge cases & trade-offs to discuss
- Concurrency: transaction + read-then-create can race under high contention; consider DB-level exclusion constraints, or retry on conflict.
- Timezones: availability uses local Date objects; ensure consistent TZ (UTC) for server and client or normalize inputs.
- Minutes-from-midnight representation simplifies slot math but requires care at DST changes.
- Payment flow transition: pick one mode (demo vs Razorpay) and align booking status transitions consistently.
- Security hardening: move refresh token to HttpOnly cookies in prod; add stronger email/OTP delivery; sanitize image filenames; add file scanning/CDN.
- Indexing: additional composite indexes for analytics queries as data grows.

## Quick answers (by topic)
- Overlapping bookings prevention? Transactional check in `server/src/modules/booking/booking.routes.ts` with time-window overlap; recommend DB exclusion constraint for absolute safety.
- How do roles gate actions? `requireRoles` checks decoded JWT role; e.g., owner-only court creation. See `middleware/auth.ts`.
- How are refresh tokens secured? Stored as sha256 hash with expiry and revocation; rotated on `/auth/refresh`.
- How are reviews verified? Only allowed if user has a COMPLETED booking for the facility; set `isVerified=true`. See `review.service.ts`.
- How are loyalty points awarded? On booking create: hours×10 points; plus referral processing. See `services/loyalty.ts`.
- Where are admin analytics computed? `modules/admin/admin.routes.ts` aggregates users/bookings/payments and builds timeseries.
- Payment verification path? `modules/payment/*.ts`; service stub simulates Razorpay (dev). Real integration replaces stubs and aligns booking status.

## Files to cite in answers
- App/init: `server/src/index.ts`, `server/src/app.ts`, `server/src/config/env.ts`
- Security: `server/src/middleware/auth.ts`, `server/src/utils/jwt.ts`, `server/src/middleware/rateLimit.ts`
- Booking: `server/src/modules/booking/*`
- Facilities/Courts: `server/src/modules/facility/*`, `server/src/modules/court/*`
- Payments: `server/src/modules/payment/*`, `server/src/services/razorpay.ts`
- Loyalty/Badges: `server/src/services/loyalty.ts`, `server/src/services/badges.ts`, `server/src/modules/loyalty/*`, `server/src/modules/badge/*`
- Reviews: `server/src/modules/review/*`
- Admin: `server/src/modules/admin/*`
- Frontend API + Auth: `src/lib/api.ts`, `src/contexts/AuthContext.tsx`

## Suggested future improvements (mention proactively)
- DB exclusion constraints for timeslot conflicts; background jobs for referral/badge processing; structured logging; pagination on admin tables; E2E and API tests; deploy manifests (Dockerfile, CI); cloud file storage; full Socket-driven availability updates.

---
This guide mirrors the current codebase. If you change flows (e.g., enforce Razorpay), update booking status transitions accordingly and remove the demo payment path.
