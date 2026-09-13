import { NextResponse } from "next/server";
import { DataService } from "@/lib/data-service";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { bookingReference } = await req.json();

    if (!bookingReference) {
      return NextResponse.json({ error: "Booking reference is required" }, { status: 400 });
    }

    const user = await getCurrentUser();
    const result = await DataService.cancelBooking(bookingReference, user?.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to cancel booking" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      refundAmountCents: result.refundAmountCents,
      message: "Booking has been successfully cancelled and refund initiated.",
    });
  } catch (err: any) {
    console.error("Cancel booking error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
