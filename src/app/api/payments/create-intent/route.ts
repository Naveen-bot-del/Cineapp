import { NextResponse } from "next/server";
import { DataService } from "@/lib/data-service";
import { createOrMockPaymentIntent } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const { bookingId, customerEmail } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const booking = await DataService.getBooking(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json({ error: `Booking is already ${booking.status.toLowerCase()}` }, { status: 400 });
    }

    if (new Date() > new Date(booking.expiresAt)) {
      return NextResponse.json({ error: "Seat hold has expired" }, { status: 410 });
    }

    const idempotencyKey = `intent_${booking.id}_${booking.bookingReference}`;
    const intent = await createOrMockPaymentIntent({
      amountCents: booking.totalAmountCents,
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      customerEmail: customerEmail || "guest@cinebook.com",
      idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      clientSecret: intent.clientSecret,
      paymentIntentId: intent.paymentIntentId,
      amountCents: booking.totalAmountCents,
      booking,
      isMock: intent.isMock,
    });
  } catch (err: any) {
    console.error("Create payment intent error:", err);
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 });
  }
}
