import { NextResponse } from "next/server";
import { DataService } from "@/lib/data-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      bookingId,
      paymentIntentId,
      idempotencyKey,
      paymentMethod = "CARD",
    } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const booking = await DataService.getBooking(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const key = idempotencyKey || `pay_${booking.id}_${paymentIntentId || "direct"}`;
    const result = await DataService.confirmBooking({
      bookingId: booking.id,
      paymentProvider: paymentIntentId?.startsWith("pi_mock_") ? "TEST_GATEWAY" : "STRIPE",
      transactionReference: paymentIntentId || `tx_${Date.now()}`,
      idempotencyKey: key,
      amountCents: booking.totalAmountCents,
      paymentMethod,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Payment confirmation failed" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      bookingReference: result.bookingReference,
      tickets: result.tickets,
    });
  } catch (err: any) {
    console.error("Payment confirmation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
