import { NextResponse } from "next/server";
import { DataService } from "@/lib/data-service";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { showtimeId, seatIds } = body;

    if (!showtimeId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json({ error: "Showtime ID and at least one seat ID are required" }, { status: 400 });
    }

    if (seatIds.length > 10) {
      return NextResponse.json({ error: "Maximum 10 seats per reservation allowed" }, { status: 400 });
    }

    const user = await getCurrentUser();
    const userId = user?.id || `guest_${crypto.randomUUID()}`;

    const result = await DataService.holdSeats({
      showtimeId,
      seatIds,
      userId,
      holdDurationMinutes: 10,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to hold seats" }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      bookingId: result.bookingId,
      bookingReference: result.bookingReference,
      holdToken: result.holdToken,
      expiresAt: result.expiresAt,
      pricing: result.pricing,
    });
  } catch (err: any) {
    console.error("Hold seats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
