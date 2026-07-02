import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  
  // Only ADMIN can export full database
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all records from all tables
    const users = await prisma.user.findMany();
    const batches = await prisma.batch.findMany();
    const recruits = await prisma.recruit.findMany();
    const attendances = await prisma.attendance.findMany();
    const evaluations = await prisma.evaluation.findMany();
    const leaves = await prisma.leave.findMany();

    const exportData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      data: {
        users,
        batches,
        recruits,
        attendances,
        evaluations,
        leaves
      }
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="ptc_akola_backup_${new Date().toISOString().split('T')[0]}.json"`,
        "Content-Type": "application/json",
      }
    });
  } catch (error) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
