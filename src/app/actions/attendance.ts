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
