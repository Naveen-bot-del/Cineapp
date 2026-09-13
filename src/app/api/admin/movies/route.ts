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
    const {
      title,
      slug,
      description,
      posterUrl,
      backdropUrl,
      durationMinutes,
      rating,
      language,
      director,
      cast,
      status,
      genres,
    } = body;

    if (!title || !slug || !description || !posterUrl || !backdropUrl || !durationMinutes) {
      return NextResponse.json({ error: "Missing required movie fields" }, { status: 400 });
    }

    const created = await DataService.addMovie({
      title,
      slug: slug.toLowerCase().replace(/\s+/g, "-"),
      description,
      posterUrl,
      backdropUrl,
      durationMinutes: Number(durationMinutes),
      rating: rating || "PG-13",
      language: language || "English",
      director: director || "",
      cast: cast || "",
      releaseDate: new Date().toISOString(),
      status: status || "NOW_SHOWING",
      featured: 0,
      genres: Array.isArray(genres) ? genres : ["Action"],
    });

    return NextResponse.json({ success: true, movie: created });
  } catch (err: any) {
    console.error("Admin add movie error:", err);
    return NextResponse.json({ error: "Failed to create movie" }, { status: 500 });
  }
}
