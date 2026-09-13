import { NextResponse } from "next/server";
import { DataService } from "@/lib/data-service";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { movieId, cinemaId, auditoriumId, startTime, basePriceCents, format } = body;

    if (!movieId || !cinemaId || !auditoriumId || !startTime || !basePriceCents) {
      return NextResponse.json({ error: "Missing required showtime fields" }, { status: 400 });
    }

    const movie = await DataService.getMovieBySlug(movieId) || (await DataService.getMovies()).find((m) => m.id === movieId);
    const cinema = (await DataService.getCinemas()).find((c) => c.id === cinemaId);

    const start = new Date(startTime);
    const durationMin = movie?.durationMinutes || 120;
    const end = new Date(start.getTime() + durationMin * 60000);

    const created = await DataService.addShowtime({
      movieId: movie?.id || movieId,
      auditoriumId,
      cinemaId,
      cinemaName: cinema?.name || "Cinema",
      cinemaCity: cinema?.city || "City",
      auditoriumName: "Screen 1",
      screenType: "IMAX_3D",
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      basePriceCents: Number(basePriceCents),
      format: format || "2D",
    });

    return NextResponse.json({ success: true, showtime: created });
  } catch (err: any) {
    console.error("Admin add showtime error:", err);
    return NextResponse.json({ error: "Failed to create showtime" }, { status: 500 });
  }
}
