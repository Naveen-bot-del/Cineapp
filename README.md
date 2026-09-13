# 🎬 CineBook - Production Cinema Ticket Booking Platform

**CineBook** is a full-stack, production-ready cinema ticket-booking web application built with **Next.js 15+ (App Router)**, **Neon Serverless PostgreSQL**, **Drizzle ORM**, **Tailwind CSS**, secure authentication, Stripe test-mode payments, QR ticketing, and strict database transaction-level concurrency control for seat reservations.

---

## 🌟 Architecture & Three-Agent Design

### 1. Agent 1 - App Agent (Frontend & Experience)
- **Framework:** Next.js 15+ App Router, React 19, Tailwind CSS.
- **Cinematic Dark Theme:** Custom glassmorphism, curved projector screen visuals, responsive layouts.
- **Key Screens:**
  - **Home Showcase (`/`):** Hero trailers (*Runner* starring Alan Ritchson, *Avengers: Doomsday*, *Dune: Part Two*), real-time search, genre and language filter chips.
  - **Movie Details (`/movies/[slug]`):** Synopsis, cast, ratings, format filters, cinema-specific showtime grid.
  - **Cinema Theaters (`/cinemas`, `/cinemas/[slug]`):** Theater locations, amenities, daily schedules.
  - **Interactive Seat Map (`/booking/[showtimeId]`):** Real-time multi-tier seat selection (Standard, VIP Lounger, Couple Sofas, Wheelchair spaces) with dynamic price calculation.
  - **Checkout (`/checkout/[bookingId]`):** Live 10-minute hold expiration timer, taxes & service fees breakdown, Stripe test checkout, and idempotency safeguards.
  - **Digital Ticket Pass (`/tickets/[bookingReference]`):** High-contrast dynamic QR codes, barcode reference, print action, and 1-click booking cancellation.
  - **Customer Booking Portal (`/my-bookings`):** Upcoming & past tickets, status badges, and refunds.
  - **Executive Admin Suite (`/admin`):** Live revenue metrics, catalog manager, showtime scheduler, and manual cron cleanup trigger.

### 2. Agent 2 - Database Engine Agent (Neon PostgreSQL & Drizzle ORM)
- **Database Rules:**
  - UUID primary keys (`uuid("id").defaultRandom()`).
  - UTC timestamps (`timestamp with time zone`).
  - Money stored strictly as integer minor units (cents) — never floating point values.
  - Enums: Seat status (`AVAILABLE`, `HELD`, `BOOKED`, `BLOCKED`), Booking status (`PENDING`, `CONFIRMED`, `CANCELLED`, `EXPIRED`, `REFUNDED`), Payment status (`PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`).
- **10-Step Concurrency-Safe Booking Transaction:**
  1. Begin database transaction (`ISOLATION LEVEL READ COMMITTED`).
  2. Lock requested `showtime_seats` rows (`FOR UPDATE`).
  3. Confirm every requested seat is available or has an expired hold.
  4. Create temporary seat hold with 10-minute expiration (`held_until = NOW() + INTERVAL '10 MINUTE'`).
  5. Calculate exact server-side pricing (base price * multiplier + 8.875% tax + $1.50/seat fee).
  6. Create pending booking with 6-character alphanumeric reference code.
  7. Commit transaction.
  8. Confirm seats to `BOOKED` status only after verified payment.
  9. Track payment idempotency keys to eliminate duplicate bookings.
  10. Automated idempotent seat hold release endpoint `/api/cron/release-expired-holds` protected by `CRON_SECRET`.

### 3. Agent 3 - QA Agent (Automated Verification)
- **Concurrency Test (`scripts/test-concurrency.ts`):** Fires 10 simultaneous requests for the same seat to verify mutex / transaction locks ensure exactly one winner.
- **End-to-End Suite (`scripts/test-e2e-flow.ts`):** Validates auth, search, seat holding, pricing, payment idempotency, QR code generation, hold cleanup, and booking cancellation.

---

## 🚀 Quick Start & Local Development

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon PostgreSQL connection string with pooler | `postgresql://postgres:postgres@localhost:5432/cinebook` |
| `JWT_SECRET` | Secret key for signing session tokens | Secure random string (min 32 chars) |
| `STRIPE_SECRET_KEY` | Stripe Secret Key (Test mode supported) | `sk_test_mock_secret_key` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key | `pk_test_mock_publishable_key` |
| `CRON_SECRET` | Bearer authorization secret for Vercel Cron | `cinebook_cron_secret_auth_token_99812738` |
| `NEXT_PUBLIC_APP_URL` | Base application URL | `http://localhost:3000` |

### 3. Seed the Database
```bash
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running QA Verification Tests

### Concurrency Race Condition Test
```bash
npm run test:concurrency
```
*Asserts that sending 10 simultaneous hold requests for the same seat yields 1 successful hold and 9 conflict rejections.*

### Full End-to-End Test Suite
```bash
npm run test:e2e
```
*Validates the entire lifecycle: authentication, movie search (*Runner* and *Avengers: Doomsday*), seat map query, price calculation, payment idempotency, QR ticket issuance, hold cleanup, and cancellation.*

---

## 🔐 Demo Credentials

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@cinebook.com` | `Admin123!` | `/admin` Executive Management Suite |
| **Customer** | `alex.turner@example.com` | `Password123!` | Ticket Booking & History |

---

## ☁️ Vercel Deployment Instructions

1. **Push to GitHub / GitLab / Bitbucket**.
2. **Import into Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **Add New Project**.
   - Select your CineBook repository.
3. **Connect Neon Serverless PostgreSQL**:
   - In the Vercel Project Dashboard, navigate to the **Storage** tab.
   - Click **Connect Database** > Choose **Neon PostgreSQL** from the Vercel Marketplace.
   - Vercel will automatically populate `DATABASE_URL`, `POSTGRES_URL`, and pooler strings into your environment variables.
4. **Set Environment Variables**:
   - Add `JWT_SECRET`, `CRON_SECRET`, and `STRIPE_SECRET_KEY`.
5. **Configure Vercel Cron**:
   - `vercel.json` schedules `/api/cron/release-expired-holds` every 5 minutes with `CRON_SECRET` protection.
6. **Deploy**:
   - Click **Deploy**. Vercel will build and launch your production cinema application.
