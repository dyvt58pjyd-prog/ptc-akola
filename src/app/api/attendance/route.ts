import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/auth";

// Helper to parse optional date safely
function parseOptionalDate(val: any): Date | null {
  if (!val || typeof val !== "string" || val.trim() === "") return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const session = await decrypt(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateString = searchParams.get("date");
    const sessionType = searchParams.get("sessionType"); // "MORNING" or "AFTERNOON"

    if (!dateString || !sessionType) {
      return NextResponse.json({ error: "Date and sessionType are required params." }, { status: 400 });
    }

    const date = new Date(dateString + "T00:00:00.000Z");

    const records = await prisma.attendance.findMany({
      where: { date }
    });

    const attendanceMap: Record<string, { status: string, reason: string }> = {};
    records.forEach(r => {
      const status = sessionType === "MORNING" ? r.morningStatus : r.afternoonStatus;
      const reason = sessionType === "MORNING" ? r.morningReason : r.afternoonReason;
      
      if (status && status !== "PENDING") {
        attendanceMap[r.recruitId] = {
          status,
          reason: reason || ""
        };
      }
    });

    return NextResponse.json({ success: true, attendanceMap });
  } catch (error) {
    console.error("API GET attendance failed:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const session = await decrypt(token);
    if (!session || session.role !== "OFFICER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { date: dateString, sessionType, records } = data;

    if (!dateString || !sessionType || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: "Date, sessionType, and records array are required." }, { status: 400 });
    }

    const date = new Date(dateString + "T00:00:00.000Z");

    // Process in chunks of 10 to prevent Neon connection pool starvation
    const chunkSize = 10;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      await Promise.all(chunk.map(async (record: any) => {
        const { recruitId, status, reason, leaveEndDate } = record;

        const dbStatus = status; // "PRESENT", "MISSED", "LEAVE"

        const updateData = sessionType === "MORNING" ? 
          { morningStatus: dbStatus, morningReason: reason } : 
          { afternoonStatus: dbStatus, afternoonReason: reason };

        const createData = {
          recruitId, date,
          morningStatus: sessionType === "MORNING" ? dbStatus : "PENDING",
          morningReason: sessionType === "MORNING" ? reason : null,
          afternoonStatus: sessionType === "AFTERNOON" ? dbStatus : "PENDING",
          afternoonReason: sessionType === "AFTERNOON" ? reason : null,
        };

        await prisma.attendance.upsert({
          where: { recruitId_date: { recruitId, date } },
          update: updateData,
          create: createData
        });

        // If status is LEAVE, also register in Leave table
        if (status === "LEAVE") {
          const parsedEndDate = parseOptionalDate(leaveEndDate);
          await prisma.leave.create({
            data: {
              recruitId,
              startDate: date,
              endDate: parsedEndDate || date,
              reason: reason || "On Leave"
            }
          });
        }
      }));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API POST attendance failed:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
