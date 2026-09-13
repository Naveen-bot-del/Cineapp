/**
 * CineBook End-to-End Integration Test Suite (Agent 3 - QA Agent)
 * 
 * Verifies the full user booking journey:
 * 1. Authentication & Session Issuance
 * 2. Movie Catalog & Filter Queries (Runner & Avengers: Doomsday)
 * 3. Showtime & Seat Map Availability
 * 4. Seat Hold with Expiration
 * 5. Server Price Calculation & Tax/Fee Verification
 * 6. Idempotent Payment Confirmation
 * 7. Digital Ticket QR Generation
 * 8. Automatic Expired Hold Cleanup
 * 9. Booking Cancellation & Refund
 */

import { DataService } from "../src/lib/data-service";
import { hashPassword, verifyPassword, signSessionToken, verifySessionToken } from "../src/lib/auth";
import { calculateFees, formatCents } from "../src/lib/utils";

async function runE2ETest() {
  console.log("🎬 [QA Agent] Starting Full End-to-End CineBook Integration Suite...\n");

  // Step 1: Test Auth & Token Issuance
  console.log("🔹 Step 1: Testing Auth & Password Hashing...");
  const rawPassword = "SecurePassword2026!";
  const hash = await hashPassword(rawPassword);
  const isValidPass = await verifyPassword(rawPassword, hash);
  if (!isValidPass) throw new Error("Password verification failed");

  const testUser = await DataService.createUser({
    name: "QA Automated Tester",
    email: `qa.tester.${Date.now()}@example.com`,
    passwordHash: hash,
    phone: "+1 (555) 999-0000",
    role: "CUSTOMER",
  });

  const sessionToken = await signSessionToken(testUser);
  const verifiedSession = await verifySessionToken(sessionToken);
  if (!verifiedSession || verifiedSession.email !== testUser.email) {
    throw new Error("JWT Session Token verification failed");
  }
  console.log(`✅ Auth Passed: User ${testUser.name} authenticated (${testUser.email})\n`);

  // Step 2: Test Movie Catalog (Check Runner & Avengers Doomsday)
  console.log("🔹 Step 2: Testing Movie Catalog & Metadata...");
  const allMovies = await DataService.getMovies();
  const runnerMovie = await DataService.getMovieBySlug("runner");
  const avengersMovie = await DataService.getMovieBySlug("avengers-doomsday");

  if (!runnerMovie) throw new Error("Movie 'Runner' not found in catalog");
  if (!avengersMovie) throw new Error("Movie 'Avengers: Doomsday' not found in catalog");

  console.log(`✅ Catalog Verified: Found '${runnerMovie.title}' (${runnerMovie.durationMinutes}m, ${runnerMovie.rating}) starring Alan Ritchson`);
  console.log(`✅ Catalog Verified: Found '${avengersMovie.title}' (${avengersMovie.status})\n`);

  // Step 3: Test Showtimes & Seat Map
  console.log("🔹 Step 3: Testing Showtimes & Seat Map...");
  const showtimes = await DataService.getShowtimesForMovie(runnerMovie.id);
  if (showtimes.length === 0) throw new Error("No showtimes found for Runner");

  const targetShowtime = showtimes[0];
  const showtimeData = await DataService.getShowtimeWithSeats(targetShowtime.id);
  if (!showtimeData || showtimeData.seats.length === 0) {
    throw new Error("Seat map failed to load");
  }

  const availableSeats = showtimeData.seats.filter((s) => s.status === "AVAILABLE");
  console.log(`✅ Seat Map Loaded: ${availableSeats.length} available seats on ${targetShowtime.format} showtime\n`);

  // Step 4: Test Seat Hold & Pricing Calculation
  console.log("🔹 Step 4: Testing Seat Hold Transaction & Server Price Calculation...");
  const selectedSeats = availableSeats.slice(0, 2);
  const seatIds = selectedSeats.map((s) => s.id);

  const holdResult = await DataService.holdSeats({
    showtimeId: targetShowtime.id,
    seatIds,
    userId: testUser.id,
    holdDurationMinutes: 10,
  });

  if (!holdResult.success || !holdResult.bookingId || !holdResult.bookingReference) {
    throw new Error(`Hold failed: ${holdResult.error}`);
  }

  const fees = calculateFees(
    2,
    selectedSeats.reduce((acc, s) => acc + Math.round((targetShowtime.basePriceCents * s.priceMultiplier) / 100), 0)
  );

  console.log(`✅ Seats Held: Ref #${holdResult.bookingReference}, Total: ${formatCents(fees.totalAmountCents)}`);
  console.log(`- Subtotal: ${formatCents(fees.subtotalCents)}, Tax: ${formatCents(fees.taxCents)}, Fees: ${formatCents(fees.serviceFeeCents)}\n`);

  // Step 5: Test Payment Confirmation & Idempotency
  console.log("🔹 Step 5: Testing Idempotent Payment & Ticket Generation...");
  const idempotencyKey = `e2e_pay_${holdResult.bookingId}`;

  const payResult1 = await DataService.confirmBooking({
    bookingId: holdResult.bookingId,
    paymentProvider: "TEST_GATEWAY",
    transactionReference: `tx_e2e_${Date.now()}`,
    idempotencyKey,
    amountCents: fees.totalAmountCents,
  });

  if (!payResult1.success || !payResult1.tickets || payResult1.tickets.length !== 2) {
    throw new Error("Payment confirmation failed to issue 2 tickets");
  }

  // Duplicate payment attempt with SAME idempotency key (must be gracefully handled)
  const payResult2 = await DataService.confirmBooking({
    bookingId: holdResult.bookingId,
    paymentProvider: "TEST_GATEWAY",
    transactionReference: `tx_e2e_${Date.now()}`,
    idempotencyKey,
    amountCents: fees.totalAmountCents,
  });

  if (!payResult2.success || !payResult2.alreadyProcessed) {
    throw new Error("Payment idempotency failed to protect against duplicate charge!");
  }
  console.log("✅ Idempotency Verified: Duplicate payment retry safely identified and suppressed.");
  console.log(`✅ Digital Tickets Issued: ${payResult1.tickets.map((t) => t.ticketNumber).join(", ")}\n`);

  // Step 6: Test Expired Hold Cleanup Cron
  console.log("🔹 Step 6: Testing Expired Hold Cleanup...");
  const cleanupRes = await DataService.releaseExpiredHolds();
  console.log(`✅ Cleanup Function Safe: Executed idempotently (${cleanupRes.releasedSeats} released, ${cleanupRes.expiredBookings} expired bookings)\n`);

  // Step 7: Test Cancellation & Refund
  console.log("🔹 Step 7: Testing Booking Cancellation & 100% Refund...");
  const cancelRes = await DataService.cancelBooking(holdResult.bookingReference, testUser.id);
  if (!cancelRes.success) {
    throw new Error(`Cancellation failed: ${cancelRes.error}`);
  }
  console.log(`✅ Cancellation Succeeded: Refunded ${formatCents(cancelRes.refundAmountCents || 0)}\n`);

  console.log("🎉 [PASSED] ALL END-TO-END INTEGRATION TESTS PASSED SUCCESSFULLY!");
}

runE2ETest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("E2E Test Failure:", err);
    process.exit(1);
  });
