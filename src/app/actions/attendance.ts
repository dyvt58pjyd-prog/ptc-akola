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

    const date = new Date(dateString + "T00:00:00.000Z");

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

    const date = new Date(data.date + "T00:00:00.000Z");

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

    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const parts = formatter.formatToParts(new Date());
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    const year = parts.find(p => p.type === 'year')?.value;
    const today = new Date(`${year}-${month}-${day}T00:00:00.000Z`);

    const attendances = await prisma.attendance.findMany({
      where: { date: today },
      include: {
        recruit: {
          select: { name: true, chestNumber: true }
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

    const activeRecruits = await prisma.recruit.findMany({
      where: { isReturnedToDistrict: false },
      select: { chestNumber: true }
    });

    let jurisdictionRecruitsCount = activeRecruits.length;
    if (user.role === "OFFICER" && user.minChestNumber !== null && user.maxChestNumber !== null) {
      jurisdictionRecruitsCount = activeRecruits.filter(r => {
        const num = parseInt(r.chestNumber.replace(/\D/g, ''));
        return !isNaN(num) && num >= user.minChestNumber! && num <= user.maxChestNumber!;
      }).length;
    }

    interface TraineeDetail {
      chestNumber: string;
      name: string;
      reason: string;
    }

    const summary = {
      morning: { 
        present: jurisdictionRecruitsCount, 
        missed: 0, 
        leave: 0,
        missedList: [] as TraineeDetail[],
        leaveList: [] as TraineeDetail[]
      },
      afternoon: { 
        present: jurisdictionRecruitsCount, 
        missed: 0, 
        leave: 0,
        missedList: [] as TraineeDetail[],
        leaveList: [] as TraineeDetail[]
      }
    };

    filtered.forEach(a => {
      // morning
      if (a.morningStatus === "MISSED") {
        summary.morning.present = Math.max(0, summary.morning.present - 1);
        summary.morning.missed++;
        summary.morning.missedList.push({
          chestNumber: a.recruit.chestNumber,
          name: a.recruit.name,
          reason: a.morningReason || "Not specified"
        });
      } else if (a.morningStatus === "LEAVE") {
        summary.morning.present = Math.max(0, summary.morning.present - 1);
        summary.morning.leave++;
        summary.morning.leaveList.push({
          chestNumber: a.recruit.chestNumber,
          name: a.recruit.name,
          reason: a.morningReason || "On Leave"
        });
      }

      // afternoon
      if (a.afternoonStatus === "MISSED") {
        summary.afternoon.present = Math.max(0, summary.afternoon.present - 1);
        summary.afternoon.missed++;
        summary.afternoon.missedList.push({
          chestNumber: a.recruit.chestNumber,
          name: a.recruit.name,
          reason: a.afternoonReason || "Not specified"
        });
      } else if (a.afternoonStatus === "LEAVE") {
        summary.afternoon.present = Math.max(0, summary.afternoon.present - 1);
        summary.afternoon.leave++;
        summary.afternoon.leaveList.push({
          chestNumber: a.recruit.chestNumber,
          name: a.recruit.name,
          reason: a.afternoonReason || "On Leave"
        });
      }
    });

    const sortList = (list: TraineeDetail[]) => {
      list.sort((a, b) => {
        const numA = parseInt(a.chestNumber.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.chestNumber.replace(/\D/g, '')) || 0;
        return numA - numB;
      });
    };
    sortList(summary.morning.missedList);
    sortList(summary.morning.leaveList);
    sortList(summary.afternoon.missedList);
    sortList(summary.afternoon.leaveList);

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

    const startOfDay = new Date(dateString + "T00:00:00.000Z");
    const endOfDay = new Date(dateString + "T23:59:59.999Z");

    // 1. Fetch attendance records for this date
    const records = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        recruit: {
          select: { id: true, name: true, chestNumber: true, unit: true, squadNumber: true }
        }
      }
    });

    // 2. Fetch active leaves covering this date
    const activeLeaves = await prisma.leave.findMany({
      where: {
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay }
      },
      include: {
        recruit: {
          select: { id: true, name: true, chestNumber: true, unit: true, squadNumber: true }
        }
      }
    });

    const attendanceMap: Record<string, { status: string, reason: string }> = {};
    const sickLeaveRecruitsMap = new Map<string, {
      recruitId: string;
      name: string;
      chestNumber: string;
      unit: string;
      squadNumber: string | null;
      reason: string;
      startDate?: string;
      endDate?: string;
    }>();

    // Add active leaves (from official leaves register / sick period entries)
    activeLeaves.forEach(lv => {
      sickLeaveRecruitsMap.set(lv.recruitId, {
        recruitId: lv.recruitId,
        name: lv.recruit.name,
        chestNumber: lv.recruit.chestNumber,
        unit: lv.recruit.unit,
        squadNumber: lv.recruit.squadNumber,
        reason: lv.reason || "आजारी रजा / Sick Leave",
        startDate: lv.startDate.toISOString().split("T")[0],
        endDate: lv.endDate.toISOString().split("T")[0],
      });
    });

    // Process attendance records
    records.forEach(r => {
      const status = sessionType === "MORNING" ? r.morningStatus : r.afternoonStatus;
      const reason = sessionType === "MORNING" ? r.morningReason : r.afternoonReason;
      
      if (status && status !== "PENDING") {
        attendanceMap[r.recruitId] = {
          status,
          reason: reason || ""
        };
      }

      // If status is officially marked as LEAVE, ensure they are in sickLeaveRecruitsMap
      if (status === "LEAVE") {
        if (!sickLeaveRecruitsMap.has(r.recruitId)) {
          sickLeaveRecruitsMap.set(r.recruitId, {
            recruitId: r.recruitId,
            name: r.recruit.name,
            chestNumber: r.recruit.chestNumber,
            unit: r.recruit.unit,
            squadNumber: r.recruit.squadNumber,
            reason: reason || "आजारी रजा / Sick Leave",
          });
        }
      }
    });

    const sickLeaveRecruits = Array.from(sickLeaveRecruitsMap.values());

    return { success: true, attendanceMap, sickLeaveRecruits };
  } catch (error) {
    console.error("Failed to fetch attendance for date/session", error);
    return { success: false, error: "Failed to load saved attendance." };
  }
}

export async function getDailyAttendanceDetails(dateString: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return { success: false, error: "User not found" };

    const date = new Date(dateString + "T00:00:00.000Z");

    const allRecruits = await prisma.recruit.findMany({
      select: {
        id: true,
        name: true,
        chestNumber: true,
        unit: true,
        squadNumber: true,
      },
      orderBy: { chestNumber: "asc" }
    });

    let recruits = allRecruits;
    if (user.role === "OFFICER" && user.minChestNumber !== null && user.maxChestNumber !== null) {
      recruits = allRecruits.filter(r => {
        const num = parseInt(r.chestNumber.replace(/\D/g, ''));
        return !isNaN(num) && num >= user.minChestNumber! && num <= user.maxChestNumber!;
      });
    }

    recruits.sort((a, b) => {
      const numA = parseInt(a.chestNumber.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.chestNumber.replace(/\D/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.chestNumber.localeCompare(b.chestNumber);
    });

    const attendances = await prisma.attendance.findMany({
      where: {
        date,
        recruitId: { in: recruits.map(r => r.id) }
      }
    });

    const attendanceMap = new Map(attendances.map(a => [a.recruitId, a]));

    interface TraineeRow {
      id: string;
      name: string;
      chestNumber: string;
      unit: string;
      squadNumber: string | null;
      reason?: string | null;
    }

    const details = {
      morning: {
        present: [] as TraineeRow[],
        missed: [] as TraineeRow[],
        leave: [] as TraineeRow[],
        pending: [] as TraineeRow[]
      },
      afternoon: {
        present: [] as TraineeRow[],
        missed: [] as TraineeRow[],
        leave: [] as TraineeRow[],
        pending: [] as TraineeRow[]
      }
    };

    recruits.forEach(r => {
      const att = attendanceMap.get(r.id);

      // Morning session categorizing
      const morningStatus = (att && att.morningStatus !== "PENDING") ? att.morningStatus : "PRESENT";
      const morningReason = att ? att.morningReason : null;
      const mRow: TraineeRow = {
        id: r.id,
        name: r.name,
        chestNumber: r.chestNumber,
        unit: r.unit,
        squadNumber: r.squadNumber,
        reason: morningReason
      };

      if (morningStatus === "PRESENT") details.morning.present.push(mRow);
      else if (morningStatus === "MISSED") details.morning.missed.push(mRow);
      else if (morningStatus === "LEAVE") details.morning.leave.push(mRow);
      else details.morning.pending.push(mRow);

      // Afternoon session categorizing
      const afternoonStatus = (att && att.afternoonStatus !== "PENDING") ? att.afternoonStatus : "PRESENT";
      const afternoonReason = att ? att.afternoonReason : null;
      const aRow: TraineeRow = {
        id: r.id,
        name: r.name,
        chestNumber: r.chestNumber,
        unit: r.unit,
        squadNumber: r.squadNumber,
        reason: afternoonReason
      };

      if (afternoonStatus === "PRESENT") details.afternoon.present.push(aRow);
      else if (afternoonStatus === "MISSED") details.afternoon.missed.push(aRow);
      else if (afternoonStatus === "LEAVE") details.afternoon.leave.push(aRow);
      else details.afternoon.pending.push(aRow);
    });

    return { success: true, details };
  } catch (error) {
    console.error("Failed to fetch daily attendance details", error);
    return { success: false, error: "Failed to load attendance report." };
  }
}

export interface SickPeriodRecord {
  periodId: string;
  startDate: string;
  endDate: string;
  formattedStartDate: string;
  formattedEndDate: string;
  totalDays: number;
  totalMissedPeriods: number;
  missedMorningCount: number;
  missedAfternoonCount: number;
  reasons: string[];
  datewiseRecords: {
    date: string;
    formattedDate: string;
    dayName: string;
    morningStatus: string;
    morningReason: string | null;
    afternoonStatus: string;
    afternoonReason: string | null;
    missedPeriodsOnDate: number;
  }[];
}

export interface RecruitSickSummary {
  recruitId: string;
  name: string;
  chestNumber: string;
  unit: string;
  squadNumber: string | null;
  totalSickDaysInMonth: number;
  totalMissedPeriodsInMonth: number;
  periods: SickPeriodRecord[];
  allDatewiseRecords: {
    date: string;
    formattedDate: string;
    dayName: string;
    morningStatus: string;
    morningReason: string | null;
    afternoonStatus: string;
    afternoonReason: string | null;
    missedPeriodsOnDate: number;
  }[];
}

export async function getMonthlySickPeriodReport(params?: {
  year?: number;
  month?: number; // 1 - 12
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  recruitId?: string;
}) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return { success: false, error: "User not found" };

    // Determine query date range
    let queryStartDate: Date;
    let queryEndDate: Date;

    if (params?.startDate && params?.endDate) {
      queryStartDate = new Date(params.startDate + "T00:00:00.000Z");
      queryEndDate = new Date(params.endDate + "T23:59:59.999Z");
    } else {
      let targetYear = params?.year;
      let targetMonth = params?.month;

      if (!targetYear || !targetMonth) {
        // Find latest date with attendance in DB or default to current date
        const latestAtt = await prisma.attendance.findFirst({
          orderBy: { date: "desc" },
          select: { date: true }
        });
        const refDate = latestAtt ? new Date(latestAtt.date) : new Date();
        targetYear = refDate.getUTCFullYear();
        targetMonth = refDate.getUTCMonth() + 1;
      }

      queryStartDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
      queryEndDate = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));
    }

    // Get available months with data for dropdown
    const distinctDates = await prisma.attendance.findMany({
      select: { date: true },
      distinct: ['date'],
      orderBy: { date: 'desc' }
    });

    const monthSet = new Set<string>();
    const availableMonths: { year: number; month: number; label: string; value: string }[] = [];
    const marathiMonthNames = [
      "जानेवारी (January)", "फेब्रुवारी (February)", "मार्च (March)", "एप्रिल (April)",
      "मे (May)", "जून (June)", "जुलै (July)", "ऑगस्ट (August)",
      "सप्टेंबर (September)", "ऑक्टोबर (October)", "नोव्हेंबर (November)", "डिसेंबर (December)"
    ];

    distinctDates.forEach(d => {
      const dateObj = new Date(d.date);
      const y = dateObj.getUTCFullYear();
      const m = dateObj.getUTCMonth() + 1;
      const key = `${y}-${m.toString().padStart(2, '0')}`;
      if (!monthSet.has(key)) {
        monthSet.add(key);
        availableMonths.push({
          year: y,
          month: m,
          label: `${marathiMonthNames[m - 1]} ${y}`,
          value: key
        });
      }
    });

    // Fetch recruit list with jurisdiction filtering
    const allRecruits = await prisma.recruit.findMany({
      select: {
        id: true,
        name: true,
        chestNumber: true,
        unit: true,
        squadNumber: true,
      },
      orderBy: { chestNumber: "asc" }
    });

    let recruits = allRecruits;
    if (user.role === "OFFICER" && user.minChestNumber !== null && user.maxChestNumber !== null) {
      recruits = allRecruits.filter(r => {
        const num = parseInt(r.chestNumber.replace(/\D/g, ''));
        return !isNaN(num) && num >= user.minChestNumber! && num <= user.maxChestNumber!;
      });
    }

    if (params?.recruitId) {
      recruits = recruits.filter(r => r.id === params.recruitId);
    }

    const recruitIds = recruits.map(r => r.id);
    const recruitMap = new Map(recruits.map(r => [r.id, r]));

    // Fetch attendances in range
    const attendances = await prisma.attendance.findMany({
      where: {
        recruitId: { in: recruitIds },
        date: { gte: queryStartDate, lte: queryEndDate },
        OR: [
          { morningStatus: "MISSED" },
          { afternoonStatus: "MISSED" },
          { morningStatus: "LEAVE" },
          { afternoonStatus: "LEAVE" },
        ]
      },
      orderBy: { date: "asc" }
    });

    // Group attendances by recruit
    const attendancesByRecruit = new Map<string, typeof attendances>();
    attendances.forEach(a => {
      if (!attendancesByRecruit.has(a.recruitId)) {
        attendancesByRecruit.set(a.recruitId, []);
      }
      attendancesByRecruit.get(a.recruitId)!.push(a);
    });

    const marathiDays = ["रविवार", "सोमवार", "मंगळवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];

    const recruitSummaries: RecruitSickSummary[] = [];
    let totalSickRecruits = 0;
    let totalSickDaysOverall = 0;
    let totalMissedPeriodsOverall = 0;

    for (const [rId, attList] of attendancesByRecruit.entries()) {
      const recruit = recruitMap.get(rId);
      if (!recruit) continue;

      attList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Group contiguous/near-contiguous dates into periods (allowing 1 day gap for weekend/single rest day)
      const periods: SickPeriodRecord[] = [];
      let currentPeriod: {
        startDate: Date;
        endDate: Date;
        records: typeof attList;
      } | null = null;

      for (const rec of attList) {
        const recDate = new Date(rec.date);
        recDate.setUTCHours(0, 0, 0, 0);

        if (!currentPeriod) {
          currentPeriod = {
            startDate: recDate,
            endDate: recDate,
            records: [rec]
          };
        } else {
          const prevDate = new Date(currentPeriod.endDate);
          const diffDays = Math.round((recDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          // If 1 day after or 2 days after (e.g. over Sunday)
          if (diffDays <= 2) {
            currentPeriod.endDate = recDate;
            currentPeriod.records.push(rec);
          } else {
            // Push previous and start new period
            const pStart = currentPeriod.startDate;
            const pEnd = currentPeriod.endDate;
            const days = Math.round((pEnd.getTime() - pStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            
            let mMissed = 0;
            let aMissed = 0;
            const reasonsSet = new Set<string>();

            const datewiseRecords = currentPeriod.records.map(r => {
              const d = new Date(r.date);
              let missedOnDate = 0;
              if (r.morningStatus === "MISSED" || r.morningStatus === "LEAVE") {
                mMissed++;
                missedOnDate++;
                if (r.morningReason) reasonsSet.add(r.morningReason.trim());
              }
              if (r.afternoonStatus === "MISSED" || r.afternoonStatus === "LEAVE") {
                aMissed++;
                missedOnDate++;
                if (r.afternoonReason) reasonsSet.add(r.afternoonReason.trim());
              }

              const pad = (n: number) => n.toString().padStart(2, '0');
              const formattedDate = `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;

              return {
                date: d.toISOString().split("T")[0],
                formattedDate,
                dayName: marathiDays[d.getUTCDay()],
                morningStatus: r.morningStatus,
                morningReason: r.morningReason,
                afternoonStatus: r.afternoonStatus,
                afternoonReason: r.afternoonReason,
                missedPeriodsOnDate: missedOnDate
              };
            });

            const pad = (n: number) => n.toString().padStart(2, '0');
            periods.push({
              periodId: `${recruit.id}-${pStart.toISOString().split("T")[0]}`,
              startDate: pStart.toISOString().split("T")[0],
              endDate: pEnd.toISOString().split("T")[0],
              formattedStartDate: `${pad(pStart.getUTCDate())}/${pad(pStart.getUTCMonth() + 1)}/${pStart.getUTCFullYear()}`,
              formattedEndDate: `${pad(pEnd.getUTCDate())}/${pad(pEnd.getUTCMonth() + 1)}/${pEnd.getUTCFullYear()}`,
              totalDays: days,
              totalMissedPeriods: mMissed + aMissed,
              missedMorningCount: mMissed,
              missedAfternoonCount: aMissed,
              reasons: Array.from(reasonsSet),
              datewiseRecords
            });

            currentPeriod = {
              startDate: recDate,
              endDate: recDate,
              records: [rec]
            };
          }
        }
      }

      if (currentPeriod) {
        const pStart = currentPeriod.startDate;
        const pEnd = currentPeriod.endDate;
        const days = Math.round((pEnd.getTime() - pStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        let mMissed = 0;
        let aMissed = 0;
        const reasonsSet = new Set<string>();

        const datewiseRecords = currentPeriod.records.map(r => {
          const d = new Date(r.date);
          let missedOnDate = 0;
          if (r.morningStatus === "MISSED" || r.morningStatus === "LEAVE") {
            mMissed++;
            missedOnDate++;
            if (r.morningReason) reasonsSet.add(r.morningReason.trim());
          }
          if (r.afternoonStatus === "MISSED" || r.afternoonStatus === "LEAVE") {
            aMissed++;
            missedOnDate++;
            if (r.afternoonReason) reasonsSet.add(r.afternoonReason.trim());
          }

          const pad = (n: number) => n.toString().padStart(2, '0');
          const formattedDate = `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;

          return {
            date: d.toISOString().split("T")[0],
            formattedDate,
            dayName: marathiDays[d.getUTCDay()],
            morningStatus: r.morningStatus,
            morningReason: r.morningReason,
            afternoonStatus: r.afternoonStatus,
            afternoonReason: r.afternoonReason,
            missedPeriodsOnDate: missedOnDate
          };
        });

        const pad = (n: number) => n.toString().padStart(2, '0');
        periods.push({
          periodId: `${recruit.id}-${pStart.toISOString().split("T")[0]}`,
          startDate: pStart.toISOString().split("T")[0],
          endDate: pEnd.toISOString().split("T")[0],
          formattedStartDate: `${pad(pStart.getUTCDate())}/${pad(pStart.getUTCMonth() + 1)}/${pStart.getUTCFullYear()}`,
          formattedEndDate: `${pad(pEnd.getUTCDate())}/${pad(pEnd.getUTCMonth() + 1)}/${pEnd.getUTCFullYear()}`,
          totalDays: days,
          totalMissedPeriods: mMissed + aMissed,
          missedMorningCount: mMissed,
          missedAfternoonCount: aMissed,
          reasons: Array.from(reasonsSet),
          datewiseRecords
        });
      }

      // Collect all datewise records for this recruit in month
      const allDatewiseRecords = periods.flatMap(p => p.datewiseRecords);
      const totalRecruitDays = periods.reduce((acc, p) => acc + p.totalDays, 0);
      const totalRecruitMissed = periods.reduce((acc, p) => acc + p.totalMissedPeriods, 0);

      totalSickRecruits++;
      totalSickDaysOverall += totalRecruitDays;
      totalMissedPeriodsOverall += totalRecruitMissed;

      recruitSummaries.push({
        recruitId: recruit.id,
        name: recruit.name,
        chestNumber: recruit.chestNumber,
        unit: recruit.unit,
        squadNumber: recruit.squadNumber,
        totalSickDaysInMonth: totalRecruitDays,
        totalMissedPeriodsInMonth: totalRecruitMissed,
        periods,
        allDatewiseRecords
      });
    }

    // Sort recruits numerically by chest number
    recruitSummaries.sort((a, b) => {
      const numA = parseInt(a.chestNumber.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.chestNumber.replace(/\D/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.chestNumber.localeCompare(b.chestNumber);
    });

    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      success: true,
      report: {
        queryStartDate: queryStartDate.toISOString().split("T")[0],
        queryEndDate: queryEndDate.toISOString().split("T")[0],
        formattedQueryStartDate: `${pad(queryStartDate.getUTCDate())}/${pad(queryStartDate.getUTCMonth() + 1)}/${queryStartDate.getUTCFullYear()}`,
        formattedQueryEndDate: `${pad(queryEndDate.getUTCDate())}/${pad(queryEndDate.getUTCMonth() + 1)}/${queryEndDate.getUTCFullYear()}`,
        availableMonths,
        summary: {
          totalRecruitsAffected: totalSickRecruits,
          totalSickDays: totalSickDaysOverall,
          totalMissedPeriods: totalMissedPeriodsOverall
        },
        recruits: recruitSummaries
      }
    };
  } catch (error) {
    console.error("Failed to fetch monthly sick period report", error);
    return { success: false, error: "Failed to load sick period report." };
  }
}

export async function registerSickPeriod(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "OFFICER" && session.role !== "ADMIN")) {
      return { success: false, error: "Unauthorized" };
    }

    const recruitId = formData.get("recruitId") as string;
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;
    const reason = (formData.get("reason") as string)?.trim() || "आजारी / Sick";
    const sessionScope = (formData.get("sessionScope") as string) || "BOTH";

    if (!recruitId || !startDateStr || !endDateStr) {
      return { success: false, error: "Recruit, start date and end date are required." };
    }

    const start = new Date(startDateStr + "T00:00:00.000Z");
    const end = new Date(endDateStr + "T00:00:00.000Z");

    if (start > end) {
      return { success: false, error: "Start date cannot be after end date." };
    }

    // Also register into Leave table for record tracking
    await prisma.leave.create({
      data: {
        recruitId,
        startDate: start,
        endDate: end,
        reason: `आजारी रजा / Sick Period: ${reason}`
      }
    });

    const current = new Date(start);
    while (current <= end) {
      const dateToSave = new Date(current);

      const updateData: any = {};
      const createData: any = {
        recruitId,
        date: dateToSave,
        morningStatus: "PRESENT",
        morningReason: null,
        afternoonStatus: "PRESENT",
        afternoonReason: null,
      };

      if (sessionScope === "BOTH" || sessionScope === "MORNING") {
        updateData.morningStatus = "MISSED";
        updateData.morningReason = reason;
        createData.morningStatus = "MISSED";
        createData.morningReason = reason;
      }
      if (sessionScope === "BOTH" || sessionScope === "AFTERNOON") {
        updateData.afternoonStatus = "MISSED";
        updateData.afternoonReason = reason;
        createData.afternoonStatus = "MISSED";
        createData.afternoonReason = reason;
      }

      await prisma.attendance.upsert({
        where: { recruitId_date: { recruitId, date: dateToSave } },
        update: updateData,
        create: createData,
      });

      current.setUTCDate(current.getUTCDate() + 1);
    }

    revalidatePath("/officer/attendance");
    revalidatePath("/attendance-viewer");
    revalidatePath("/directory");
    revalidatePath(`/directory/${recruitId}`);
    revalidatePath(`/directory/${recruitId}/report`);
    return { success: true };
  } catch (error) {
    console.error("Register sick period failed", error);
    return { success: false, error: "Failed to register sick period." };
  }
}

export async function registerSickLeave(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "OFFICER" && session.role !== "ADMIN")) {
      return { success: false, error: "Unauthorized" };
    }

    const recruitId = formData.get("recruitId") as string;
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;
    const reason = (formData.get("reason") as string)?.trim() || "आजारी रजा / Sick Leave";
    const sessionScope = (formData.get("sessionScope") as string) || "BOTH";

    if (!recruitId || !startDateStr || !endDateStr) {
      return { success: false, error: "प्रशिक्षणार्थी, सुरू तारीख व शेवट तारीख आवश्यक आहेत (Recruit, start date and end date are required)." };
    }

    const start = new Date(startDateStr + "T00:00:00.000Z");
    const end = new Date(endDateStr + "T00:00:00.000Z");

    if (start > end) {
      return { success: false, error: "सुरू तारीख शेवटच्या तारखेनंतर असू शकत नाही (Start date cannot be after end date)." };
    }

    // 1. Create official leave entry in Leave table
    await prisma.leave.create({
      data: {
        recruitId,
        startDate: start,
        endDate: end,
        reason: `आजारी रजा / Sick Leave: ${reason}`
      }
    });

    // 2. Upsert each date into Attendance records so it impacts daily session & monthly sick report
    const current = new Date(start);
    while (current <= end) {
      const dateToSave = new Date(current);

      const updateData: any = {};
      const createData: any = {
        recruitId,
        date: dateToSave,
        morningStatus: "PRESENT",
        morningReason: null,
        afternoonStatus: "PRESENT",
        afternoonReason: null,
      };

      if (sessionScope === "BOTH" || sessionScope === "MORNING") {
        updateData.morningStatus = "LEAVE";
        updateData.morningReason = reason;
        createData.morningStatus = "LEAVE";
        createData.morningReason = reason;
      }
      if (sessionScope === "BOTH" || sessionScope === "AFTERNOON") {
        updateData.afternoonStatus = "LEAVE";
        updateData.afternoonReason = reason;
        createData.afternoonStatus = "LEAVE";
        createData.afternoonReason = reason;
      }

      await prisma.attendance.upsert({
        where: { recruitId_date: { recruitId, date: dateToSave } },
        update: updateData,
        create: createData,
      });

      current.setUTCDate(current.getUTCDate() + 1);
    }

    revalidatePath("/officer/attendance");
    revalidatePath("/attendance-viewer");
    revalidatePath("/directory");
    revalidatePath(`/directory/${recruitId}`);
    revalidatePath(`/directory/${recruitId}/report`);
    return { success: true };
  } catch (error) {
    console.error("Register sick leave failed", error);
    return { success: false, error: "Failed to register sick leave." };
  }
}

export async function getAllRecruitsForSickLeave() {
  try {
    const recruits = await prisma.recruit.findMany({
      select: {
        id: true,
        name: true,
        chestNumber: true,
        unit: true,
        squadNumber: true,
      },
      orderBy: { chestNumber: "asc" }
    });

    recruits.sort((a, b) => {
      const numA = parseInt(a.chestNumber.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.chestNumber.replace(/\D/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.chestNumber.localeCompare(b.chestNumber);
    });

    return { success: true, recruits };
  } catch (error) {
    console.error("Failed to fetch recruits for sick leave", error);
    return { success: false, recruits: [] };
  }
}

