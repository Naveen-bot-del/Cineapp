import { db, getDbPool } from "./index";
import { showtimeSeats, seats, showtimes, bookings, bookingItems, payments, tickets, auditLogs, movies, auditoriums, cinemas } from "./schema";
import { eq, and, inArray, sql, lt } from "drizzle-orm";
import { generateBookingReference, generateTicketNumber, calculateFees } from "../lib/utils";
import { generateTicketQRCode } from "../lib/qrcode";

export interface HoldSeatsInput {
  showtimeId: string;
  seatIds: string[];
  userId: string;
  holdDurationMinutes?: number;
}

export interface HoldSeatsResult {
  success: boolean;
  bookingId?: string;
  bookingReference?: string;
  holdToken?: string;
  expiresAt?: Date;
  pricing?: {
    subtotalCents: number;
    taxCents: number;
    serviceFeeCents: number;
    totalAmountCents: number;
    seatBreakdown: Array<{
      seatId: string;
      label: string;
      type: string;
      priceCents: number;
    }>;
  };
  error?: string;
}

/**
 * Atomic Concurrency-Safe Seat Hold Transaction
 * 1. Begins DB transaction
 * 2. Locks showtime_seat rows (FOR UPDATE)
 * 3. Validates availability
 * 4. Places temporary 10-minute hold
 * 5. Computes server-side price
 * 6. Creates pending booking
 * 7. Commits transaction
 */
export async function holdSeatsTransaction(input: HoldSeatsInput): Promise<HoldSeatsResult> {
  const { showtimeId, seatIds, userId, holdDurationMinutes = 10 } = input;

  if (!seatIds.length) {
    return { success: false, error: "No seats selected" };
  }

  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;");

    // 1. Fetch showtime and auditorium base price
    const showtimeRes = await client.query(
      `SELECT s.id, s.base_price_cents, s.start_time, m.title as movie_title, a.name as auditorium_name, c.name as cinema_name
       FROM showtimes s
       JOIN movies m ON m.id = s.movie_id
       JOIN auditoriums a ON a.id = s.auditorium_id
       JOIN cinemas c ON c.id = a.cinema_id
       WHERE s.id = $1`,
      [showtimeId]
    );

    if (showtimeRes.rows.length === 0) {
      await client.query("ROLLBACK;");
      return { success: false, error: "Showtime not found" };
    }

    const showtime = showtimeRes.rows[0];

    // 2. Lock requested showtime_seats with row-level lock (FOR UPDATE)
    const seatsRes = await client.query(
      `SELECT ss.id as showtime_seat_id, ss.seat_id, ss.status, ss.held_until, ss.hold_token,
              st.row_label, st.seat_number, st.seat_type, st.price_multiplier
       FROM showtime_seats ss
       JOIN seats st ON st.id = ss.seat_id
       WHERE ss.showtime_id = $1 AND ss.seat_id = ANY($2::uuid[])
       FOR UPDATE`,
      [showtimeId, seatIds]
    );

    if (seatsRes.rows.length !== seatIds.length) {
      await client.query("ROLLBACK;");
      return { success: false, error: "One or more selected seats do not exist" };
    }

    const now = new Date();

    // 3. Confirm every requested seat is available (or has an expired hold)
    for (const seatRow of seatsRes.rows) {
      const isAvailable =
        seatRow.status === "AVAILABLE" ||
        (seatRow.status === "HELD" && seatRow.held_until && new Date(seatRow.held_until) < now);

      if (!isAvailable) {
        await client.query("ROLLBACK;");
        return {
          success: false,
          error: `Seat ${seatRow.row_label}-${seatRow.seat_number} is no longer available`,
        };
      }
    }

    // 4. Create hold session token and expiration
    const holdToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + holdDurationMinutes * 60 * 1000);

    // Update showtime_seats to HELD
    await client.query(
      `UPDATE showtime_seats
       SET status = 'HELD', held_until = $1, hold_token = $2, updated_at = NOW(), version = version + 1
       WHERE showtime_id = $3 AND seat_id = ANY($4::uuid[])`,
      [expiresAt, holdToken, showtimeId, seatIds]
    );

    // 5. Calculate price on server
    const basePriceCents = Number(showtime.base_price_cents);
    let seatSubtotal = 0;
    const seatBreakdown = seatsRes.rows.map((r: any) => {
      const multiplier = Number(r.price_multiplier || 100) / 100;
      const priceCents = Math.round(basePriceCents * multiplier);
      seatSubtotal += priceCents;
      return {
        seatId: r.seat_id,
        showtimeSeatId: r.showtime_seat_id,
        label: `${r.row_label}-${r.seat_number}`,
        type: r.seat_type,
        priceCents,
      };
    });

    const feeBreakdown = calculateFees(seatIds.length, seatSubtotal);
    const bookingReference = generateBookingReference();
    const bookingId = crypto.randomUUID();

    // 6. Create Pending Booking
    await client.query(
      `INSERT INTO bookings (id, booking_reference, user_id, showtime_id, status, subtotal_cents, tax_cents, service_fee_cents, total_amount_cents, hold_token, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
      [
        bookingId,
        bookingReference,
        userId,
        showtimeId,
        feeBreakdown.subtotalCents,
        feeBreakdown.taxCents,
        feeBreakdown.serviceFeeCents,
        feeBreakdown.totalAmountCents,
        holdToken,
        expiresAt,
      ]
    );

    // Link booking items
    for (const item of seatBreakdown) {
      await client.query(
        `INSERT INTO booking_items (id, booking_id, showtime_seat_id, seat_id, price_cents, seat_label, seat_type, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [crypto.randomUUID(), bookingId, item.showtimeSeatId, item.seatId, item.priceCents, item.label, item.type]
      );

      // Link booking_id to showtime_seats
      await client.query(
        `UPDATE showtime_seats SET booking_id = $1 WHERE id = $2`,
        [bookingId, item.showtimeSeatId]
      );
    }

    // 7. Audit log
    await client.query(
      `INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata, created_at)
       VALUES ($1, $2, 'SEAT_HOLD_CREATED', 'BOOKING', $3, $4, NOW())`,
      [crypto.randomUUID(), userId, bookingId, JSON.stringify({ seatIds, totalAmountCents: feeBreakdown.totalAmountCents })]
    );

    await client.query("COMMIT;");

    return {
      success: true,
      bookingId,
      bookingReference,
      holdToken,
      expiresAt,
      pricing: {
        ...feeBreakdown,
        seatBreakdown,
      },
    };
  } catch (err: any) {
    await client.query("ROLLBACK;");
    console.error("Hold Seats Transaction error:", err);
    return { success: false, error: err.message || "Failed to hold seats" };
  } finally {
    client.release();
  }
}

/**
 * Confirm Booking & Payment (Step 8 & 9)
 * - Validates payment idempotency key
 * - Updates booking to CONFIRMED
 * - Updates seats to BOOKED
 * - Generates digital tickets with QR codes
 */
export async function confirmBookingTransaction(params: {
  bookingId: string;
  paymentProvider: string;
  transactionReference: string;
  idempotencyKey: string;
  amountCents: number;
  paymentMethod?: string;
  rawPayload?: any;
}) {
  const { bookingId, paymentProvider, transactionReference, idempotencyKey, amountCents, paymentMethod = "CARD", rawPayload } = params;

  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;");

    // 1. Check if idempotency key was already processed
    const existingPayment = await client.query(
      `SELECT id, status, booking_id FROM payments WHERE idempotency_key = $1`,
      [idempotencyKey]
    );

    if (existingPayment.rows.length > 0) {
      await client.query("COMMIT;");
      return {
        success: true,
        alreadyProcessed: true,
        paymentId: existingPayment.rows[0].id,
      };
    }

    // 2. Fetch booking with details
    const bookingRes = await client.query(
      `SELECT b.*, s.start_time, m.title as movie_title, a.name as auditorium_name, c.name as cinema_name
       FROM bookings b
       JOIN showtimes s ON s.id = b.showtime_id
       JOIN movies m ON m.id = s.movie_id
       JOIN auditoriums a ON a.id = s.auditorium_id
       JOIN cinemas c ON c.id = a.cinema_id
       WHERE b.id = $1 FOR UPDATE`,
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      await client.query("ROLLBACK;");
      return { success: false, error: "Booking not found" };
    }

    const booking = bookingRes.rows[0];

    if (booking.status === "CONFIRMED") {
      await client.query("COMMIT;");
      return { success: true, alreadyConfirmed: true };
    }

    if (booking.status === "CANCELLED" || booking.status === "EXPIRED") {
      await client.query("ROLLBACK;");
      return { success: false, error: `Booking is already ${booking.status.toLowerCase()}` };
    }

    // Check expiration if not yet confirmed
    if (new Date() > new Date(booking.expires_at)) {
      await client.query("ROLLBACK;");
      return { success: false, error: "Booking hold has expired. Please select your seats again." };
    }

    // 3. Create Payment record
    const paymentId = crypto.randomUUID();
    await client.query(
      `INSERT INTO payments (id, booking_id, provider, transaction_reference, idempotency_key, amount_cents, currency, status, payment_method, raw_payload, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'usd', 'COMPLETED', $7, $8, NOW(), NOW())`,
      [paymentId, bookingId, paymentProvider, transactionReference, idempotencyKey, amountCents, paymentMethod, JSON.stringify(rawPayload || {})]
    );

    // 4. Update Booking status to CONFIRMED
    await client.query(
      `UPDATE bookings SET status = 'CONFIRMED', updated_at = NOW() WHERE id = $1`,
      [bookingId]
    );

    // 5. Update Showtime Seats to BOOKED
    await client.query(
      `UPDATE showtime_seats
       SET status = 'BOOKED', held_until = NULL, updated_at = NOW()
       WHERE booking_id = $1`,
      [bookingId]
    );

    // 6. Generate Tickets
    const itemsRes = await client.query(
      `SELECT bi.id, bi.seat_label, bi.seat_type, bi.price_cents
       FROM booking_items bi
       WHERE bi.booking_id = $1`,
      [bookingId]
    );

    const createdTickets = [];
    for (let i = 0; i < itemsRes.rows.length; i++) {
      const item = itemsRes.rows[i];
      const ticketNumber = generateTicketNumber(booking.booking_reference, i);
      const qrCodeData = await generateTicketQRCode({
        ticketNumber,
        bookingRef: booking.booking_reference,
        movieTitle: booking.movie_title,
        cinemaName: booking.cinema_name,
        auditoriumName: booking.auditorium_name,
        showtime: booking.start_time.toISOString(),
        seatLabel: item.seat_label,
      });

      const ticketId = crypto.randomUUID();
      await client.query(
        `INSERT INTO tickets (id, booking_id, ticket_number, qr_code_data, seat_label, status, created_at)
         VALUES ($1, $2, $3, $4, $5, 'VALID', NOW())`,
        [ticketId, bookingId, ticketNumber, qrCodeData, item.seat_label]
      );
      createdTickets.push({ ticketId, ticketNumber, seatLabel: item.seat_label });
    }

    // 7. Audit log
    await client.query(
      `INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata, created_at)
       VALUES ($1, $2, 'BOOKING_CONFIRMED', 'BOOKING', $3, $4, NOW())`,
      [crypto.randomUUID(), booking.user_id, bookingId, JSON.stringify({ paymentId, reference: booking.booking_reference, ticketsCount: createdTickets.length })]
    );

    await client.query("COMMIT;");

    return {
      success: true,
      bookingReference: booking.booking_reference,
      tickets: createdTickets,
    };
  } catch (err: any) {
    await client.query("ROLLBACK;");
    console.error("Confirm Booking Transaction error:", err);
    return { success: false, error: err.message || "Failed to confirm booking" };
  } finally {
    client.release();
  }
}

/**
 * Idempotent Expired Seat Release Cron Handler
 * Releases any HELD seat where held_until < NOW() and marks PENDING bookings as EXPIRED
 */
export async function releaseExpiredSeatHolds(): Promise<{ releasedSeats: number; expiredBookings: number }> {
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN TRANSACTION;");

    // 1. Release expired HELD seats
    const seatRes = await client.query(
      `UPDATE showtime_seats
       SET status = 'AVAILABLE', held_until = NULL, hold_token = NULL, booking_id = NULL, updated_at = NOW(), version = version + 1
       WHERE status = 'HELD' AND held_until < NOW()`
    );

    // 2. Mark pending bookings past expiration as EXPIRED
    const bookingRes = await client.query(
      `UPDATE bookings
       SET status = 'EXPIRED', updated_at = NOW()
       WHERE status = 'PENDING' AND expires_at < NOW()`
    );

    await client.query("COMMIT;");

    return {
      releasedSeats: seatRes.rowCount || 0,
      expiredBookings: bookingRes.rowCount || 0,
    };
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("Release Expired Holds Error:", err);
    return { releasedSeats: 0, expiredBookings: 0 };
  } finally {
    client.release();
  }
}
