"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

export async function submitBulkAttendance(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || session.role !== "OFFICER") {
      return { success: false, error: "Unauthorized" };
    }

    const data = Object.fromEntries(formData.entries());
    const recruitIds = formData.getAll("recruitId") as string[];

    if (!recruitIds || recruitIds.length === 0) {
      return { success: false, error: "No recruits selected." };
    }

    const dateString = data.date as string;
    if (!dateString) return { success: false, error: "Date is required." };

    const date = new Date(dateString);
    date.setHours(0,0,0,0);

    const sessionType = data.sessionType as string;
    const status = data.status as string;
    const reason = (data.reason as string) || null;

    await Promise.all(recruitIds.map(async recruitId => {
      // First, get the existing attendance to avoid overwriting the other session
      const existing = await prisma.attendance.findUnique({
        where: { recruitId_date: { recruitId, date } }
      });

      const updateData = sessionType === "MORNING" ? 
        { morningStatus: status, morningReason: reason } : 
        { afternoonStatus: status, afternoonReason: reason };

      const createData = {
        recruitId, date,
        morningStatus: sessionType === "MORNING" ? status : "PENDING",
        morningReason: sessionType === "MORNING" ? reason : null,
        afternoonStatus: sessionType === "AFTERNOON" ? status : "PENDING",
        afternoonReason: sessionType === "AFTERNOON" ? reason : null,
      };

      return prisma.attendance.upsert({
        where: { recruitId_date: { recruitId, date } },
        update: updateData,
        create: createData
      });
    }));

    revalidatePath("/officer/attendance");
    return { success: true };
  } catch (error) {
    console.error("Bulk attendance failed", error);
    return { success: false, error: "Failed to save attendance." };
  }
}

export async function registerLeave(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || session.role !== "OFFICER") {
      return { success: false, error: "Unauthorized" };
    }

    const recruitId = formData.get("recruitId") as string;
    const startDate = new Date(formData.get("startDate") as string);
    const endDate = new Date(formData.get("endDate") as string);
    const reason = formData.get("reason") as string;

    await prisma.leave.create({
      data: {
        recruitId,
        startDate,
        endDate,
        reason
      }
    });

    revalidatePath("/officer/attendance");
    return { success: true };
  } catch (error) {
    console.error("Register leave failed", error);
    return { success: false, error: "Failed to register leave." };
  }
}

export async function markDistrictReturn(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || session.role !== "OFFICER") {
      return { success: false, error: "Unauthorized" };
    }

    const recruitId = formData.get("recruitId") as string;
    const returnDate = new Date(formData.get("returnDate") as string);

    await prisma.recruit.update({
      where: { id: recruitId },
      data: {
        isReturnedToDistrict: true,
        returnedToDistrictDate: returnDate,
      }
    });

    revalidatePath("/officer/attendance");
    revalidatePath("/directory");
    return { success: true };
  } catch (error) {
    console.error("Mark district return failed", error);
    return { success: false, error: "Failed to mark district return." };
  }
}

function parseOptionalDate(val: any): Date | null {
  if (!val || typeof val !== "string" || val.trim() === "") return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export async function submitBulkAttendanceWithLeaves(data: {
  date: string;
  sessionType: string;
  records: {
    recruitId: string;
    status: string; // "PRESENT", "MISSED", "LEAVE"
    reason?: string | null;
    leaveEndDate?: string | null;
  }[];
}) {
  try {
    const session = await getSession();
    if (!session || session.role !== "OFFICER") {
      return { success: false, error: "Unauthorized" };
    }

    const date = new Date(data.date);
    date.setHours(0,0,0,0);

    // Process in chunks of 10 to prevent connection pool starvation
    const chunkSize = 10;
    for (let i = 0; i < data.records.length; i += chunkSize) {
      const chunk = data.records.slice(i, i + chunkSize);
      await Promise.all(chunk.map(async record => {
        const { recruitId, status, reason, leaveEndDate } = record;

        // Status in DB is PRESENT or ABSENT or LEAVE.
        const dbStatus = status;

        const updateData = data.sessionType === "MORNING" ? 
          { morningStatus: dbStatus, morningReason: reason } : 
          { afternoonStatus: dbStatus, afternoonReason: reason };

        const createData = {
          recruitId, date,
          morningStatus: data.sessionType === "MORNING" ? dbStatus : "PENDING",
          morningReason: data.sessionType === "MORNING" ? reason : null,
          afternoonStatus: data.sessionType === "AFTERNOON" ? dbStatus : "PENDING",
          afternoonReason: data.sessionType === "AFTERNOON" ? reason : null,
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

    revalidatePath("/officer/attendance");
    revalidatePath("/leaves");
    return { success: true };
  } catch (error) {
    console.error("Bulk attendance with leaves failed", error);
    return { success: false, error: "Failed to save attendance." };
  }
}

export async function getLiveAttendanceSummary() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return { success: false, error: "User not found" };

    const todayStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const today = new Date(todayStr);
    today.setHours(0,0,0,0);

    const attendances = await prisma.attendance.findMany({
      where: { date: today },
      include: {
        recruit: {
          select: { chestNumber: true }
        }
      }
    });

    let filtered = attendances;
    if (user.role === "OFFICER" && user.minChestNumber !== null && user.maxChestNumber !== null) {
      filtered = attendances.filter(a => {
        const num = parseInt(a.recruit.chestNumber.replace(/\D/g, ''));
        return !isNaN(num) && num >= user.minChestNumber! && num <= user.maxChestNumber!;
      });
    }

    const summary = {
      morning: { present: 0, missed: 0, leave: 0 },
      afternoon: { present: 0, missed: 0, leave: 0 }
    };

    filtered.forEach(a => {
      // morning
      if (a.morningStatus === "PRESENT") summary.morning.present++;
      else if (a.morningStatus === "MISSED") summary.morning.missed++;
      else if (a.morningStatus === "LEAVE") summary.morning.leave++;

      // afternoon
      if (a.afternoonStatus === "PRESENT") summary.afternoon.present++;
      else if (a.afternoonStatus === "MISSED") summary.afternoon.missed++;
      else if (a.afternoonStatus === "LEAVE") summary.afternoon.leave++;
    });

    return { success: true, summary };
  } catch (error) {
    console.error("Failed to fetch live attendance summary", error);
    return { success: false, error: "Failed to load summary." };
  }
}

export async function getAttendanceForDateAndSession(dateString: string, sessionType: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const date = new Date(dateString);
    date.setHours(0,0,0,0);

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

    return { success: true, attendanceMap };
  } catch (error) {
    console.error("Failed to fetch attendance for date/session", error);
    return { success: false, error: "Failed to load saved attendance." };
  }
}
