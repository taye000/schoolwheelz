export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Driver from "@/models/DriversRegistration";
import Parent from "@/models/ParentsRegistration";
import Booking from "@/models/Booking";
import School from "@/models/School";
import { getAuthUser } from "@/utils/authApp";

function requireAdmin(req: NextRequest) {
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;
  if (user.userType !== "admin") {
    return NextResponse.json(
      { success: false, error: "Forbidden." },
      { status: 403 },
    );
  }
  return user;
}

/**
 * GET /api/admin?view=stats|drivers|parents|validation-queue|active-drivers|bookings|cars|children
 */
export async function GET(req: NextRequest) {
  const authResult = requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  await dbConnect();

  const view = new URL(req.url).searchParams.get("view") ?? "stats";

  try {
    switch (view) {
      case "stats": {
        const [
          totalDrivers,
          validatedDrivers,
          activeDrivers,
          totalParents,
          totalBookings,
        ] = await Promise.all([
          Driver.countDocuments(),
          Driver.countDocuments({ isValidated: true }),
          Driver.countDocuments({ isProfileActive: true }),
          Parent.countDocuments(),
          Booking.countDocuments(),
        ]);

        const parents = await Parent.find({}, "children").lean();
        const totalChildren = parents.reduce(
          (sum: number, p: any) => sum + (p.children?.length ?? 0),
          0,
        );

        return NextResponse.json({
          success: true,
          data: {
            totalDrivers,
            validatedDrivers,
            activeDrivers,
            totalParents,
            totalChildren,
            totalBookings,
          },
        });
      }

      case "drivers": {
        const drivers = await Driver.find({}).select("-password").lean();
        return NextResponse.json({ success: true, data: drivers });
      }

      case "validation-queue": {
        const drivers = await Driver.find({ isValidated: false })
          .select("-password")
          .lean();
        return NextResponse.json({ success: true, data: drivers });
      }

      case "active-drivers": {
        const drivers = await Driver.find({ isProfileActive: true })
          .select("-password")
          .lean();
        return NextResponse.json({ success: true, data: drivers });
      }

      case "parents": {
        const parents = await Parent.find({}).select("-password").lean();
        return NextResponse.json({ success: true, data: parents });
      }

      case "children": {
        const parents = await Parent.find({}, "fullName children").lean();
        const children = (parents as any[]).flatMap((p) =>
          (p.children ?? []).map((c: any) => ({
            ...c,
            parentName: p.fullName,
            parentId: p._id,
          })),
        );
        return NextResponse.json({ success: true, data: children });
      }

      case "bookings": {
        const bookings = await Booking.find({ isDeleted: false })
          .populate("driver", "fullName phoneNumber -password")
          .populate("parent", "fullName phoneNumber -password")
          .lean();
        return NextResponse.json({ success: true, data: bookings });
      }

      case "cars": {
        const drivers = await Driver.find(
          { "cars.0": { $exists: true } },
          "fullName cars",
        ).lean();
        const cars = (drivers as any[]).flatMap((d) =>
          d.cars.map((c: any) => ({
            ...c,
            driverName: d.fullName,
            driverId: d._id,
          })),
        );
        return NextResponse.json({ success: true, data: cars });
      }

      case "schools": {
        const statusFilter = new URL(req.url).searchParams.get("status");
        const q = new URL(req.url).searchParams.get("q");
        const filter: Record<string, unknown> = {};
        if (statusFilter && statusFilter !== "all")
          filter.status = statusFilter;
        if (q) filter.name = { $regex: q, $options: "i" };
        const schools = await School.find(filter)
          .populate("requestedBy", "fullName email")
          .sort({ createdAt: -1 })
          .lean();
        return NextResponse.json({ success: true, data: schools });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Unknown view." },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch data." },
      { status: 500 },
    );
  }
}
