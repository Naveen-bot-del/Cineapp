/**
 * CineBook Concurrency & Race Condition Test Suite (Agent 3 - QA Agent)
 * 
 * Verifies that when multiple users attempt to hold the exact same seat simultaneously,
 * the transactional database locking ensures EXACTLY ONE user wins and all others are rejected.
 */

import { cineStore, DataService } from "../src/lib/data-service";

async function runConcurrencyTest() {
  console.log("🚀 [QA Agent] Starting Concurrent Seat Reservation Conflict Test...");

  const showtimeId = cineStore.showtimes[0].id;
  const showtimeSeats = cineStore.showtimeSeatsMap.get(showtimeId);

  if (!showtimeSeats || showtimeSeats.length === 0) {
    throw new Error("No seats available for testing");
  }

  // Pick target contested seat: e.g. Row D, Seat 5
  const contestedSeat = showtimeSeats[15] || showtimeSeats[0];
  console.log(`🎯 Contested Seat: ${contestedSeat.rowLabel}${contestedSeat.seatNumber} (ID: ${contestedSeat.id}) on Showtime ${showtimeId}`);

  // Ensure seat is marked AVAILABLE before race
  contestedSeat.status = "AVAILABLE";
  contestedSeat.heldUntil = undefined;

  const NUM_CONCURRENT_USERS = 10;
  console.log(`⚡ Launching ${NUM_CONCURRENT_USERS} simultaneous seat hold requests...`);

  // Simulate 10 simultaneous requests from distinct users
  const attempts = Array.from({ length: NUM_CONCURRENT_USERS }).map((_, index) => {
    const userId = `qa-user-concurrent-${index + 1}`;
    return DataService.holdSeats({
      showtimeId,
      seatIds: [contestedSeat.id],
      userId,
      holdDurationMinutes: 10,
    });
  });

  const results = await Promise.all(attempts);

  const successfulHolds = results.filter((r) => r.success);
  const failedHolds = results.filter((r) => !r.success);

  console.log(`\n📊 [Test Results]:`);
  console.log(`- Total Requests Sent: ${NUM_CONCURRENT_USERS}`);
  console.log(`- Successful Reservations: ${successfulHolds.length}`);
  console.log(`- Rejected Conflicts: ${failedHolds.length}`);

  if (successfulHolds.length === 1 && failedHolds.length === NUM_CONCURRENT_USERS - 1) {
    console.log("\n✅ [PASSED] Concurrency Test Succeeded! Exactly 1 user secured the hold.");
    console.log(`- Winner Booking Reference: ${successfulHolds[0].bookingReference}`);
    console.log(`- Rejection reason sample: "${failedHolds[0].error}"`);
  } else {
    console.error("\n❌ [FAILED] Concurrency violation detected!");
    console.error(`Expected 1 success but got ${successfulHolds.length}`);
    process.exit(1);
  }
}

runConcurrencyTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
