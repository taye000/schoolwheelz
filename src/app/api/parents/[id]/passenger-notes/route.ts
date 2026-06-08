export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import { getAuthUser } from "@/utils/authApp";

/**
 * GET /api/parents/[id]/passenger-notes
 * Returns aggregated driver notes + ratings for each of a parent's children,
 * drawn from their last 20 completed bookings.
 * Accessible to authenticated drivers (viewing a request) and the parent themselves.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  if (
    user.userType !== "driver" &&
    user.userType !== "parent" &&
    user.userType !== "admin"
  ) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 403 },
    );
  }

  // Parents can only fetch their own notes
  if (user.userType === "parent" && user.id !== params.id) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 },
    );
  }

  try {
    const completedBookings = await Booking.find(
      { parent: params.id, status: "completed" },
      { children: 1, tripDate: 1 },
    )
      .sort({ tripDate: -1 })
      .limit(20)
      .lean();

    // Aggregate per child name: collect all notes + ratings from different trips
    const map = new Map<string, { notes: string[]; ratings: number[] }>();

    for (const booking of completedBookings) {
      for (const child of (booking as any).children ?? []) {
        if (!child.driverNote && !child.driverRating) continue;
        const key = (child.name as string).trim().toLowerCase();
        if (!map.has(key)) map.set(key, { notes: [], ratings: [] });
        const entry = map.get(key)!;
        if (child.driverNote) entry.notes.push(child.driverNote as string);
        if (child.driverRating)
          entry.ratings.push(child.driverRating as number);
      }
    }

    // Shape the output: one entry per unique child name
    const passengerNotes = Array.from(map.entries()).map(([, v]) => {
      const avg =
        v.ratings.length > 0
          ? Math.round(
              (v.ratings.reduce((a, b) => a + b, 0) / v.ratings.length) * 10,
            ) / 10
          : null;
      return {
        avgRating: avg,
        ratingCount: v.ratings.length,
        recentNote: v.notes[0] ?? null, // most recent note (already sorted by date)
        noteCount: v.notes.length,
      };
    });

    // Re-attach canonical child name for the response
    const result: {
      childName: string;
      avgRating: number | null;
      ratingCount: number;
      recentNote: string | null;
      noteCount: number;
    }[] = [];

    for (const booking of completedBookings) {
      for (const child of (booking as any).children ?? []) {
        const key = (child.name as string).trim().toLowerCase();
        if (!map.has(key)) continue;
        const found = result.find(
          (r) => r.childName.trim().toLowerCase() === key,
        );
        if (!found) {
          const entry = map.get(key)!;
          const avg =
            entry.ratings.length > 0
              ? Math.round(
                  (entry.ratings.reduce((a, b) => a + b, 0) /
                    entry.ratings.length) *
                    10,
                ) / 10
              : null;
          result.push({
            childName: child.name,
            avgRating: avg,
            ratingCount: entry.ratings.length,
            recentNote: entry.notes[0] ?? null,
            noteCount: entry.notes.length,
          });
        }
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
