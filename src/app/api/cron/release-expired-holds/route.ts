import { NextResponse } from "next/server";
import { DataService } from "@/lib/data-service";

export async function GET(req: Request) {
  return handleCleanup(req);
}

export async function POST(req: Request) {
  return handleCleanup(req);
}

async function handleCleanup(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "cinebook_cron_secret_auth_token_99812738";

    // Validate CRON_SECRET if running in production or passed via bearer token
    if (authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await DataService.releaseExpiredHolds();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      releasedSeats: result.releasedSeats,
      expiredBookings: result.expiredBookings,
      message: `Released ${result.releasedSeats} expired seat holds and updated ${result.expiredBookings} bookings.`,
    });
  } catch (err: any) {
    console.error("Cron release error:", err);
    return NextResponse.json({ error: "Cleanup execution failed" }, { status: 500 });
  }
}
