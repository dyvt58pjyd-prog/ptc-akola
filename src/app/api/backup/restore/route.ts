import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const maxDuration = 60; // Set longer timeout for large imports

export async function POST(req: Request) {
  const session = await getSession();
  
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const backupData = await req.json();

    if (!backupData || !backupData.data) {
      return NextResponse.json({ error: "Invalid backup file format" }, { status: 400 });
    }

    const { users, batches, recruits, attendances, evaluations, leaves } = backupData.data;

    // Use a transaction to ensure data integrity
    await prisma.$transaction(async (tx) => {
      // 1. Upsert Users (excluding password changes if they exist, but here we just restore exact records)
      if (users && users.length > 0) {
        for (const user of users) {
          await tx.user.upsert({
            where: { id: user.id },
            update: user,
            create: user,
          });
        }
      }

      // 2. Upsert Batches
      if (batches && batches.length > 0) {
        for (const batch of batches) {
          await tx.batch.upsert({
            where: { id: batch.id },
            update: batch,
            create: batch,
          });
        }
      }

      // 3. Upsert Recruits
      if (recruits && recruits.length > 0) {
        for (const recruit of recruits) {
          await tx.recruit.upsert({
            where: { id: recruit.id },
            update: recruit,
            create: recruit,
          });
        }
      }

      // 4. Upsert Attendances
      if (attendances && attendances.length > 0) {
        for (const attendance of attendances) {
          await tx.attendance.upsert({
            where: { id: attendance.id },
            update: attendance,
            create: attendance,
          });
        }
      }

      // 5. Upsert Evaluations
      if (evaluations && evaluations.length > 0) {
        for (const evalData of evaluations) {
          await tx.evaluation.upsert({
            where: { id: evalData.id },
            update: evalData,
            create: evalData,
          });
        }
      }

      // 6. Upsert Leaves
      if (leaves && leaves.length > 0) {
        for (const leave of leaves) {
          await tx.leave.upsert({
            where: { id: leave.id },
            update: leave,
            create: leave,
          });
        }
      }
    }, {
      timeout: 30000 // 30 second timeout for large transactions
    });

    return NextResponse.json({ success: true, message: "Backup successfully restored and merged" });
  } catch (error) {
    console.error("Import Error:", error);
    return NextResponse.json({ error: "Failed to restore backup" }, { status: 500 });
  }
}
