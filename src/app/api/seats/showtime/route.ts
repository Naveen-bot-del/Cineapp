import { NextResponse } from "next/server";
import { DataService } from "@/lib/data-service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const showtimeId = searchParams.get("showtimeId");

    if (!showtimeId) {
      return NextResponse.json({ error: "showtimeId is required" }, { status: 400 });
    }

    const data = await DataService.getShowtimeWithSeats(showtimeId);
    if (!data) {
      return NextResponse.json({ error: "Showtime not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Fetch showtime seats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
