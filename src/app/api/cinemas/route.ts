import { NextResponse } from "next/server";
import { DataService } from "@/lib/data-service";

export async function GET() {
  try {
    const cinemas = await DataService.getCinemas();
    return NextResponse.json({ success: true, cinemas });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch cinemas" }, { status: 500 });
  }
}
