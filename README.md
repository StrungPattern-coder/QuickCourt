# QuickCourt

Real-time sports facility booking platform for Odoo Hackathon 2025 Finals.

## Monorepo Structure (WIP)

Current:
- `src/` – Existing Vite prototype (will migrate to Next.js App Router).
- `server/` – Express + Prisma backend (PostgreSQL) with JWT auth & Socket.IO.

Planned:
- `web/` – Next.js 15 + Tailwind + shadcn/ui + Framer Motion + GSAP.

## Backend Setup

1. Copy `server/.env.example` to `server/.env` and fill secrets.
2. Start PostgreSQL (Docker example below).
3. Install dependencies & run migrations.

### Docker (local Postgres)

```bash
docker run --name quickcourt-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=quickcourt -p 5432:5432 -d postgres:16
```

### Install & migrate

```bash
cd server
npm install
npx prisma migrate dev --name init
npm run dev
```

Health: http://localhost:4000/health

## Auth Flow (Implemented)

1. POST /auth/signup -> returns userId & logs OTP (stub for email).
2. POST /auth/verify-otp { userId, otp }
3. POST /auth/login { email, password } -> { accessToken, refreshToken }
4. POST /auth/refresh { refreshToken }
5. POST /auth/logout { refreshToken }

Tokens currently returned in body for speed; production: move refresh to HttpOnly cookie.

## Facilities & Bookings (MVP)

- Owners create facilities (PENDING until admin approval).
- Admin approves/rejects facility.
- Public list of APPROVED facilities with filters (sport, query, pagination).
- Users create bookings; transaction prevents overlapping (double) bookings.

## Real-time (Scaffold)

Socket.IO server ready. Upcoming events:
- `facility:approved`
- `facility:rejected`
- `booking:created`
- `booking:slot-unavailable`
- `user:banned`

## Roadmap (Next Milestones)

1. Stripe test payments & Payment Intent webhooks.
2. Court CRUD & maintenance block logic.
3. Admin user management (ban/unban) + facility analytics.
4. Dashboard stats aggregation queries (owner & admin).
5. Migrate UI to Next.js, integrate auth & real-time.
6. Emit & consume Socket.IO events in frontend.
7. Security hardening (CSRF strategy, logger, email provider, brute-force detection).
8. Add automated tests (Jest + supertest) for auth, facilities, bookings.

## Conventions

- Branch prefixes: `feat/`, `fix/`, `chore/`, `refactor/`.
- Commit style: Conventional Commits.
- Validate all request payloads with Zod.
- Keep controllers thin; move logic to service layer.

## License

Internal hackathon project. All rights reserved.
