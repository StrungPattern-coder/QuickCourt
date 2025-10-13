# QuickCourt – Interview Walkthrough (Balanced Tech + Product)

Use this as a clean, to‑the‑point script you can rehearse. It balances product storytelling with enough technical depth. Aim for ~5–7 minutes, then dive deeper only when asked.

---

## 1) One‑liner
QuickCourt is a platform to discover sports facilities, check live court availability, book a slot, and pay securely — with loyalty rewards and admin/owner workflows.

## 2) What problem it solves
- Users struggle to find available courts at the right time and price.
- Owners need simple tools to list facilities, manage courts, and avoid double bookings.
- Platforms need trust: verified bookings, reviews, and transparent management.

## 3) Who it’s for
- Players who want a fast way to book.
- Facility owners who want an easy management dashboard.
- Admins who curate facilities and monitor the system.

## 4) The core user journey (happy path)
1. Sign up and verify via OTP.
2. Browse facilities by sport, view details and 1‑hour slot availability.
3. Pick a court, pick a time, confirm the booking.
4. Pay (Razorpay flow) and receive instant confirmation.
5. Earn points and badges; later, leave a verified review.

## 5) What makes it work (key features)
- Live availability: time‑slot view per court with overlap prevention.
- Seamless checkout: integrated payment flow and receipt.
- Engagement: loyalty points, streaks, badges, and referral rewards.
- Role‑based workflows: USER, OWNER, ADMIN; owner court management; admin approvals + analytics.

## 6) Architecture at a glance
- Frontend: React + Vite + Tailwind + shadcn/ui (SPA + PWA) with React Router and React Query.
- Backend: Node.js/Express API with Prisma over PostgreSQL; JWT auth; Socket.IO for real‑time events.
- Integrations: Razorpay for payments; Sentry for monitoring; optional SMTP for OTP/email later.

Why this setup?
- Fast iteration with type safety.
- Clear separation of concerns: UI, API, and data.
- Scales horizontally and easy to harden for production.

## 7) Data model (just enough detail)
- Users (roles + status, loyalty data, refresh tokens, referrals)
- Facilities and Courts (price, open/close, images, property types)
- Bookings (start/end, status, price) and Payments (status, provider)
- Reviews (one per user per facility; verified if booked)
- Loyalty (points ledger), Badges (criteria), Referrals (rewards)

## 8) How the core flows map to the system
- Availability: compute 60‑min slots between court open/close; mark unavailable if overlapping bookings exist.
- Booking: transactional check → create booking → emit real‑time events → award points.
- Payments: create order → Razorpay checkout → verify signature → confirm booking.
- Reviews: allowed only if the user completed a booking for that facility.
- Admin: approve facilities, view users/facilities/bookings, and analytics (timeseries + top facilities).

## 9) Security and reliability
- JWT access/refresh with rotation and hashed refresh tokens.
- Role guards for owner/admin routes; rate limiting on auth.
- Error handling and optional Sentry.
- Can add DB exclusion constraints to hard‑enforce no double bookings.

## 10) What I’m proud of
- The availability and overlap prevention logic — clear, predictable, and scalable.
- The balanced UX: quick booking with optional gamification that doesn’t get in the way.
- Clean module boundaries: auth, booking, payment, loyalty/badges, admin.

## 11) Trade‑offs and future improvements
- Payments have a dev‑friendly stub; in production, enforce Razorpay HMAC verification and idempotency.
- Move local image uploads to object storage + CDN.
- Add background jobs for referrals/badges and email; add analytics caching.
- Enforce a DB‑level exclusion constraint to make overlap prevention race‑proof.
- Migrate refresh tokens to HttpOnly cookies in production.

## 12) Demo outline (if asked)
- Show browsing facilities and viewing slots.
- Book a 1‑hour slot and complete payment.
- Show the booking in “My Bookings” and points earned.
- Switch to owner/admin dashboards to show management and analytics.

## 13) Deep‑dive pointers (if they ask)
- Availability math and booking transaction: `server/src/modules/facility/facility.routes.ts`, `server/src/modules/booking/booking.routes.ts`
- Auth/JWT/roles: `server/src/middleware/auth.ts`, `server/src/utils/jwt.ts`
- Payments: `server/src/modules/payment/*`, `server/src/services/razorpay.ts`
- Loyalty/streaks/badges: `server/src/services/loyalty.ts`, `server/src/services/badges.ts`
- Admin analytics: `server/src/modules/admin/admin.routes.ts`

## 14) One‑minute recap
QuickCourt lets players book courts in minutes with live availability and secure payment. It supports owners with management tools and admins with approvals and analytics. It’s built with a clean Node/Express + Prisma/Postgres backend and a modern React SPA frontend, with JWT auth, role‑based access, and real‑time events. It’s production‑friendly and easy to evolve.
