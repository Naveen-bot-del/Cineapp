import { NextResponse } from "next/server";
import { DataService } from "@/lib/data-service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");
    const id = searchParams.get("id");

    const queryKey = reference || id;
    if (!queryKey) {
      return NextResponse.json({ error: "reference or id is required" }, { status: 400 });
    }

    const booking = await DataService.getBooking(queryKey);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, booking });
  } catch (err: any) {
    console.error("Fetch booking error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
