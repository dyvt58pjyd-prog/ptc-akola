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

    await Promise.all(data.records.map(async record => {
      const { recruitId, status, reason, leaveEndDate } = record;

      // Status in DB is PRESENT or ABSENT or LEAVE. Wait, let's keep the exact status string.
      // In prisma, Attendance morningStatus/afternoonStatus has no strict enum check but comments say PRESENT/ABSENT.
      // Let's store "PRESENT", "MISSED", "LEAVE".
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
        await prisma.leave.create({
          data: {
            recruitId,
            startDate: date,
            endDate: leaveEndDate ? new Date(leaveEndDate) : date,
            reason: reason || "On Leave"
          }
        });
      }
    }));

    revalidatePath("/officer/attendance");
    revalidatePath("/leaves");
    return { success: true };
  } catch (error) {
    console.error("Bulk attendance with leaves failed", error);
    return { success: false, error: "Failed to save attendance." };
  }
}
