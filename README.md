<div align="center">
  <h1>QuickCourt</h1>
  <p><strong>Multi-sport venue discovery, booking, owner management, and admin approval platform.</strong></p>
  <p><em>React + Vite frontend · Express API · Prisma/PostgreSQL · Vercel deployment</em></p>
  <p>
    <a href="docs/INTERVIEW_GUIDE.md"><strong>Interview Guide</strong></a>
    ·
    <a href="docs/INTERVIEW_TALK_TRACK.md"><strong>Interview Talk Track</strong></a>
  </p>
</div>

---

## Current Features

| Area | Status |
| --- | --- |
| Authentication | Email/password signup and login, OTP verification token generation, JWT access/refresh tokens, `/auth/me`, profile update, password change |
| Roles | `USER`, `OWNER`, and `ADMIN` role guards |
| Venue Discovery | Dynamic facility listing, search, sport filters, property type filters (`PLAY`, `BOOK`, `TRAIN`), price filters, amenity filters, ratings, review counts |
| Venue Details | Dynamic venue profile, court availability, live booking availability refresh over Socket.IO, real review list and review submission |
| Booking | Transactional overlap prevention, confirmed booking creation, auto-completion for elapsed bookings, cancellation, deletion for cancelled/completed bookings |
| Owner Dashboard | Add venues/courts, view status, court inventory, booking/revenue stats, real-time booking notifications |
| Admin Dashboard | User/facility/booking management, facility approval/rejection, user ban/unban, analytics |
| Loyalty | Points, streaks, referral code generation/application, badge evaluation |
| Receipts | In-app receipt generation and PDF download through jsPDF |
| Deployment | Vercel-ready Vite frontend plus Express serverless API bridge |

Payments currently run in receipt-only mode. The old Razorpay-facing UI/hooks remain in the codebase, but the active booking flow creates confirmed bookings and receipts directly.

---

## Project Layout

```text
.
├── api/[...path].ts        # Vercel serverless bridge to Express
├── public/                 # Static assets
├── src/                    # React + Vite frontend
│   ├── components/
│   ├── contexts/
│   ├── lib/
│   └── pages/
├── server/                 # Express + Prisma backend
│   ├── prisma/
│   └── src/
├── vercel.json             # Vercel build, function, and rewrite config
└── package.json            # Frontend scripts/dependencies
```

---

## Local Setup

### Prerequisites

- Node.js 22.x recommended for parity with Vercel
- npm
- PostgreSQL, locally or hosted

### Install

```bash
npm install
npm install --prefix server
```

### Environment

Local env files are ignored by git.

Frontend `.env`:

```bash
VITE_API_BASE_URL=http://localhost:4000
VITE_RAZORPAY_KEY_ID=
VITE_APP_NAME=QuickCourt
VITE_APP_VERSION=1.0.0
```

Backend `server/.env`:

```bash
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/quickcourt?schema=public
ACCESS_TOKEN_SECRET=<64+ char random secret>
REFRESH_TOKEN_SECRET=<64+ char random secret>
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
OTP_TTL_MINUTES=10
CORS_ORIGIN=http://localhost:8080,http://localhost:5173
ADMIN_INVITE_SECRET=<random admin invite secret>
SENTRY_DSN=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=QuickCourt <no-reply@quickcourt.local>
```

Generate secrets:

```bash
openssl rand -hex 64
openssl rand -hex 32
```

### Database

Local Docker example:

```bash
docker run --name quickcourt-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=quickcourt \
  -p 5432:5432 \
  -d postgres:16
```

Migrate and optionally seed:

```bash
cd server
npx prisma generate
npx prisma migrate deploy
npm run seed
```

### Run

Backend:

```bash
cd server
npm run dev
```

Frontend:

```bash
npm run dev
```

Default frontend URL: `http://localhost:8080`
API health check: `http://localhost:4000/health`

---

## Verification

Run before committing or deploying:

```bash
npm run build
npm run lint
npm --prefix server run build
npm --prefix server run lint
npx tsc --module ESNext --moduleResolution bundler --target ES2022 --noEmit --skipLibCheck "api/[...path].ts"
```

Production dependency audit:

```bash
npm audit --omit=dev --audit-level=high
npm --prefix server audit --omit=dev --audit-level=high
```

Current state: build and lint pass. Production audit has no high or critical findings.

---

## Fresh Vercel Deployment

The app deploys as a single Vercel project:

- `npm run build` builds the Vite frontend to `dist/`.
- `api/[...path].ts` exposes the Express app as a Vercel Function.
- `vercel.json` rewrites existing API paths (`/auth`, `/facilities`, `/bookings`, `/reviews`, etc.) to the serverless function.

### 1. Create a Hosted PostgreSQL Database

Use Neon, Supabase, Railway, Vercel Marketplace Postgres, or any PostgreSQL provider that supports Prisma.

For serverless Vercel deployments, Neon pooled connections are recommended. Use a connection string like:

```text
postgresql://<user>:<password>@<host>/<database>?sslmode=require
```

### 2. Link or Create the Vercel Project

```bash
npx vercel link --yes
```

If creating from scratch, use project name `quickcourt` when prompted or create it first:

```bash
npx vercel project add quickcourt
npx vercel link --yes --project quickcourt
```

### 3. Add Vercel Environment Variables

Required production variables:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Hosted PostgreSQL connection string |
| `ACCESS_TOKEN_SECRET` | Yes | 64+ char random secret |
| `REFRESH_TOKEN_SECRET` | Yes | 64+ char random secret |
| `ADMIN_INVITE_SECRET` | Yes | Required for admin signup |
| `NODE_ENV` | Yes | `production` |
| `ACCESS_TOKEN_TTL` | No | Defaults to `15m` |
| `REFRESH_TOKEN_TTL` | No | Defaults to `7d` |
| `OTP_TTL_MINUTES` | No | Defaults to `10` |
| `CORS_ORIGIN` | No | Optional; Vercel deployment URLs are inferred if unset |
| `SENTRY_DSN` | No | Enables Sentry if present |
| `SMTP_*` | No | Enables real email sending if present |

Example commands:

```bash
npx vercel env add DATABASE_URL production --value "<postgres-url>" --yes --force
npx vercel env add NODE_ENV production --value "production" --yes --force
npx vercel env add ACCESS_TOKEN_SECRET production --value "<access-secret>" --yes --force
npx vercel env add REFRESH_TOKEN_SECRET production --value "<refresh-secret>" --yes --force
npx vercel env add ADMIN_INVITE_SECRET production --value "<admin-secret>" --yes --force
```

Repeat for `preview` if preview deployments should work.

### 4. Run Production Migrations

After linking the project and adding `DATABASE_URL`:

```bash
npx vercel env run --environment=production -- npm --prefix server run prisma:deploy
```

Optional seed:

```bash
npx vercel env run --environment=production -- npm --prefix server run seed
```

### 5. Deploy

```bash
npx vercel --prod
```

---

## Useful Accounts for Seeded Local Data

Some legacy seed scripts create test users such as:

| Role | Email | Password |
| --- | --- | --- |
| Owner | `owner@quickcourt.com` | `testowner123` |
| User | `user@quickcourt.com` | `testuser123` |

Check the specific seed script before relying on these in a shared database.

---

## Security Notes

- Do not commit real `.env` files. They are ignored by `.gitignore`.
- JWT access and refresh secrets must be different values.
- Admin signup is gated by `ADMIN_INVITE_SECRET`.
- OTP values are logged in development; configure SMTP before relying on email verification in production.
- Uploaded files are served from local function storage in the current Express implementation. For durable production uploads, move uploads to Blob/S3/Cloudinary.
- Remaining production audit findings are moderate and currently tied to dependency chains that need separate compatibility review.

---

## Known Follow-Ups

- Move uploaded venue images to durable object storage for production.
- Remove unused legacy Razorpay components or reintroduce a real payment provider end to end.
- Add automated API tests for auth, booking overlap prevention, owner/admin workflows, and reviews.
- Split the large frontend bundle with route-level dynamic imports.
- Replace logged OTP delivery with SMTP/SMS.

---

## License

Internal project. All rights reserved.
