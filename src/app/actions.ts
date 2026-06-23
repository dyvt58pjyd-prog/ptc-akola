"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createSession, deleteSession, getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

function toUpperCaseHelper(str: string | undefined | null): string | null {
  if (!str) return null;
  return str.toUpperCase();
}

export async function registerRecruit(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  
  try {
    const recruit = await prisma.recruit.create({
      data: {
        name: toUpperCaseHelper(data.name as string) as string,
        age: parseInt(data.age as string),
        chestNumber: data.chestNumber as string,
        unit: toUpperCaseHelper(data.unit as string) as string,
        squadNumber: toUpperCaseHelper(data.squadNumber as string),
        homeDistrict: data.homeDistrict as string,
        mobile: data.mobile as string,
        whatsappNumber: data.whatsappNumber ? (data.whatsappNumber as string) : null,
        maritalStatus: data.maritalStatus as string,
        education: toUpperCaseHelper(data.education as string) as string,
        height: parseFloat(data.height as string),
        weight: parseFloat(data.weight as string),
        bloodGroup: data.bloodGroup ? (data.bloodGroup as string) : null,
        sex: data.sex as string,
        religion: data.religion ? (data.religion as string) : null,
        caste: toUpperCaseHelper(data.caste as string),
        category: data.category ? (data.category as string) : null,
        address: toUpperCaseHelper(data.address as string),
        taluka: toUpperCaseHelper(data.taluka as string),
        pincode: data.pincode as string,
        appointmentCategory: data.appointmentCategory ? (data.appointmentCategory as string) : null,
        appointmentType: data.appointmentType ? (data.appointmentType as string) : null,
        batchId: data.batchId ? (data.batchId as string) : null,
        photoUrl: data.photoUrl ? (data.photoUrl as string) : null,
      }
    });
    
    revalidatePath("/admin");
    return { success: true, recruitId: recruit.id };
  } catch (error) {
    console.error("Failed to register recruit:", error);
    return { success: false, error: "Failed to register recruit. This chest number may already be taken in this batch." };
  }
}

export async function submitEvaluation(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const recruitIds = formData.getAll("recruitId") as string[];

  if (!recruitIds || recruitIds.length === 0) {
    return { success: false, error: "No recruits selected." };
  }

  try {
    const session = await getSession();
    if (!session || session.role !== "OFFICER") {
      return { success: false, error: "Unauthorized. You must be logged in as an officer." };
    }

    const officer = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!officer) return { success: false, error: "Officer not found." };

    const weekValue = formData.get("week") as string; // Expected: "2026-W25"
    const year = weekValue ? parseInt(weekValue.split("-")[0]) : new Date().getFullYear();

    // Verify all recruits belong to this officer's range
    const recruits = await prisma.recruit.findMany({
      where: { id: { in: recruitIds } }
    });

    if (recruits.length !== recruitIds.length) {
      return { success: false, error: "One or more recruits not found." };
    }

    if (officer.minChestNumber !== null && officer.maxChestNumber !== null) {
      for (const recruit of recruits) {
        const chestNoInt = parseInt(recruit.chestNumber.replace(/\D/g, ''));
        if (isNaN(chestNoInt) || chestNoInt < officer.minChestNumber || chestNoInt > officer.maxChestNumber) {
          return { success: false, error: `Unauthorized. Recruit ${recruit.name} (Chest: ${recruit.chestNumber}) is outside your assigned range (${officer.minChestNumber} - ${officer.maxChestNumber}).` };
        }
      }
    }

    // Process all selected recruits
    await Promise.all(recruitIds.map(recruitId => 
      prisma.evaluation.upsert({
        where: {
          recruitId_week_year: {
            recruitId,
            week: weekValue,
            year: year,
          }
        },
        update: {
          physicalTraining: data.physicalTraining as string,
          drills: data.drills as string,
          weaponDrill: data.weaponDrill as string,
          weaponTactics: data.weaponTactics as string,
          fieldCrafts: data.fieldCrafts as string,
          overallRemarks: data.overallRemarks as string,
          instructorName: data.instructorName ? (data.instructorName as string) : null,
        },
        create: {
          recruitId,
          officerId: officer.id,
          week: weekValue,
          year: year,
          physicalTraining: data.physicalTraining as string,
          drills: data.drills as string,
          weaponDrill: data.weaponDrill as string,
          weaponTactics: data.weaponTactics as string,
          fieldCrafts: data.fieldCrafts as string,
          overallRemarks: data.overallRemarks as string,
          instructorName: data.instructorName ? (data.instructorName as string) : null,
        }
      })
    ));

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to submit evaluation:", error);
    return { success: false, error: "Failed to submit evaluation." };
  }
}

export async function authenticate(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const username = data.username as string;
  const password = data.password as string;

  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return { error: "Invalid username or password." };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return { error: "Invalid username or password." };
    }

    // Create the session
    await createSession({
      userId: user.id,
      username: user.username,
      role: user.role
    });

    return { success: true, role: user.role };
  } catch (error) {
    console.error("Authentication error:", error);
    console.error("Authentication error:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred." };
  }
}

export async function logout() {
  await deleteSession();
}

export async function createOfficer(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  
  try {
    const hashedPassword = await bcrypt.hash(data.password as string, 10);
    
    await prisma.user.create({
      data: {
        username: data.username as string,
        password: hashedPassword,
        fullName: data.fullName as string,
        role: "OFFICER",
        minChestNumber: parseInt(data.minChestNumber as string),
        maxChestNumber: parseInt(data.maxChestNumber as string),
      }
    });
    
    revalidatePath("/admin/officers");
    return { success: true };
  } catch (error) {
    console.error("Failed to create officer:", error);
    return { error: "Failed to create officer. Username might already exist." };
  }
}

export async function updateOfficer(officerId: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  
  try {
    const updateData: any = {
      username: data.username as string,
      fullName: data.fullName as string,
      minChestNumber: parseInt(data.minChestNumber as string),
      maxChestNumber: parseInt(data.maxChestNumber as string),
    };

    // If password is provided, hash it and include in update
    if (data.password && (data.password as string).trim() !== "") {
      updateData.password = await bcrypt.hash(data.password as string, 10);
    }

    await prisma.user.update({
      where: { id: officerId },
      data: updateData
    });
    
    revalidatePath("/admin/officers");
    return { success: true };
  } catch (error) {
    console.error("Failed to update officer:", error);
    return { error: "Failed to update officer. Username might already exist." };
  }
}

export async function deleteEvaluation(evaluationId: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "OFFICER" && session.role !== "ADMIN")) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.evaluation.delete({
      where: { id: evaluationId }
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete evaluation:", error);
    return { success: false, error: "Failed to delete evaluation." };
  }
}

export async function deleteRecruit(recruitId: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "OFFICER" && session.role !== "ADMIN")) {
      return { success: false, error: "Unauthorized" };
    }

    // Use a transaction to delete dependencies first
    await prisma.$transaction([
      prisma.attendance.deleteMany({ where: { recruitId } }),
      prisma.evaluation.deleteMany({ where: { recruitId } }),
      prisma.leave.deleteMany({ where: { recruitId } }),
      prisma.recruit.delete({ where: { id: recruitId } }),
    ]);

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete recruit:", error);
    return { success: false, error: "Failed to delete recruit." };
  }
}

export async function updateRecruit(recruitId: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  
  try {
    const session = await getSession();
    if (!session || (session.role !== "OFFICER" && session.role !== "ADMIN")) {
      return { success: false, error: "Unauthorized" };
    }

    const recruit = await prisma.recruit.update({
      where: { id: recruitId },
      data: {
        name: toUpperCaseHelper(data.name as string) as string,
        age: parseInt(data.age as string),
        chestNumber: data.chestNumber as string,
        unit: toUpperCaseHelper(data.unit as string) as string,
        squadNumber: toUpperCaseHelper(data.squadNumber as string),
        homeDistrict: data.homeDistrict as string,
        mobile: data.mobile as string,
        whatsappNumber: data.whatsappNumber ? (data.whatsappNumber as string) : null,
        maritalStatus: data.maritalStatus as string,
        education: toUpperCaseHelper(data.education as string) as string,
        height: parseFloat(data.height as string),
        weight: parseFloat(data.weight as string),
        bloodGroup: data.bloodGroup ? (data.bloodGroup as string) : null,
        sex: data.sex as string,
        religion: data.religion ? (data.religion as string) : null,
        caste: toUpperCaseHelper(data.caste as string),
        category: data.category ? (data.category as string) : null,
        address: toUpperCaseHelper(data.address as string),
        taluka: toUpperCaseHelper(data.taluka as string),
        pincode: data.pincode as string,
        appointmentCategory: data.appointmentCategory ? (data.appointmentCategory as string) : null,
        appointmentType: data.appointmentType ? (data.appointmentType as string) : null,
        batchId: data.batchId ? (data.batchId as string) : null,
        photoUrl: data.photoUrl ? (data.photoUrl as string) : undefined, // only update if provided
      }
    });
    
    revalidatePath("/", "layout");
    return { success: true, recruitId: recruit.id };
  } catch (error) {
    console.error("Failed to update recruit:", error);
    return { success: false, error: "Failed to update recruit. Check if chest number already exists in this batch." };
  }
}

export async function createBatch(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.batch.create({
      data: {
        name: toUpperCaseHelper(data.name as string) as string,
        startDate: new Date(data.startDate as string),
        endDate: new Date(data.endDate as string),
        isActive: true,
      }
    });
    
    revalidatePath("/admin/batches");
    return { success: true };
  } catch (error) {
    console.error("Failed to create batch:", error);
    return { success: false, error: "Failed to create batch. Name must be unique." };
  }
}

export async function toggleBatchStatus(batchId: string, isActive: boolean) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.batch.update({
      where: { id: batchId },
      data: { isActive: !isActive }
    });
    
    revalidatePath("/admin/batches");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle batch status:", error);
    return { success: false, error: "Failed to update batch." };
  }
}
