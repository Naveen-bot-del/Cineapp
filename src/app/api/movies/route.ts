import { NextResponse } from "next/server";
import { DataService } from "@/lib/data-service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const genre = searchParams.get("genre") || undefined;
    const language = searchParams.get("language") || undefined;
    const search = searchParams.get("search") || undefined;

    const movies = await DataService.getMovies({ status, genre, language, search });
    return NextResponse.json({ success: true, movies });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch movies" }, { status: 500 });
  }
}
