"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createSession, deleteSession, getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

function toUpperCaseHelper(str: string | undefined | null): string | null {
  if (!str) return null;
  return str.toUpperCase();
}

function parseOptionalDate(val: any): Date | null {
  if (!val || typeof val !== "string" || val.trim() === "") return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export async function registerRecruit(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  
  try {
    // Strip leading zeros and trim chest number, e.g. "01" -> "1"
    const rawChest = String(data.chestNumber || "").trim();
    const chestNumber = rawChest.replace(/^0+(?=\d)/, '');
    if (!chestNumber) {
      return { success: false, error: "Chest number is required. / छाती क्रमांक अनिवार्य आहे." };
    }
    if (!data.photoUrl) {
      return { success: false, error: "Passport Photo is required. / फोटो अनिवार्य आहे." };
    }

    const batchId = data.batchId && String(data.batchId).trim() !== "" ? String(data.batchId).trim() : null;

    const recruitData = {
      name: toUpperCaseHelper(String(data.name || "").trim()) as string,
      age: parseInt(data.age as string) || 0,
      chestNumber: chestNumber,
      unit: toUpperCaseHelper(String(data.unit || "").trim()) as string,
      squadNumber: data.squadNumber ? toUpperCaseHelper(String(data.squadNumber).replace(/\D/g, '').replace(/^0+(?=\d)/, '')) : null,
      homeDistrict: String(data.homeDistrict || "").trim(),
      mobile: String(data.mobile || "").trim(),
      whatsappNumber: data.whatsappNumber ? String(data.whatsappNumber).trim() : null,
      maritalStatus: String(data.maritalStatus || "").trim(),
      education: toUpperCaseHelper(String(data.education || "").trim()) as string,
      height: parseFloat(data.height as string) || 0,
      weight: parseFloat(data.weight as string) || 0,
      bloodGroup: data.bloodGroup ? String(data.bloodGroup).trim() : null,
      sex: String(data.sex || "").trim(),
      religion: data.religion ? String(data.religion).trim() : null,
      caste: toUpperCaseHelper(String(data.caste || "").trim()),
      category: data.category ? String(data.category).trim() : null,
      address: toUpperCaseHelper(String(data.address || "").trim()),
      taluka: toUpperCaseHelper(String(data.taluka || "").trim()),
      pincode: data.pincode ? String(data.pincode).trim() : null,
      appointmentCategory: data.appointmentCategory ? String(data.appointmentCategory).trim() : null,
      appointmentType: data.appointmentType ? String(data.appointmentType).trim() : null,
      batchId: batchId,
      photoUrl: data.photoUrl as string,
      nearestPoliceStation: data.nearestPoliceStation ? toUpperCaseHelper(String(data.nearestPoliceStation).trim()) : null,
      dateOfEntry: parseOptionalDate(data.dateOfEntry),
    };

    // Upsert logic: search by chestNumber (and batchId if provided)
    const existingRecruit = await prisma.recruit.findFirst({
      where: batchId ? { chestNumber, batchId } : { chestNumber }
    });

    let recruit;
    if (existingRecruit) {
      recruit = await prisma.recruit.update({
        where: { id: existingRecruit.id },
        data: recruitData
      });
    } else {
      recruit = await prisma.recruit.create({
        data: recruitData
      });
    }
    
    // Targeted cache revalidation
    revalidatePath("/directory");
    revalidatePath("/admin");
    revalidatePath("/officer");
    revalidatePath("/officer/attendance");
    revalidatePath("/officer/evaluate");
    revalidatePath("/attendance-viewer");
    revalidatePath("/summary");
    revalidatePath("/admin/batches");
    if (recruit.id) {
      revalidatePath(`/directory/${recruit.id}`);
      revalidatePath(`/directory/${recruit.id}/report`);
      revalidatePath(`/directory/${recruit.id}/edit`);
    }
    return { success: true, recruitId: recruit.id };
  } catch (error: any) {
    console.error("Failed to register recruit:", error);
    const msg = error?.message || "";
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      return { success: false, error: "या बॅचमध्ये हा छाती क्रमांक आधीच नोंदवला गेला आहे. / This chest number is already registered in this batch." };
    }
    return { success: false, error: `नोंदणी अयशस्वी: ${msg || "सर्व्हर त्रुटी"} / Registration failed.` };
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

    // Process all selected recruits in chunks of 10 to prevent connection pool starvation
    const chunkSize = 10;
    for (let i = 0; i < recruitIds.length; i += chunkSize) {
      const chunk = recruitIds.slice(i, i + chunkSize);
      await Promise.all(chunk.map(recruitId => 
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
            evaluationDate: parseOptionalDate(data.evaluationDate),
            instructorStartDate: parseOptionalDate(data.instructorStartDate),
            instructorEndDate: parseOptionalDate(data.instructorEndDate),
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
            evaluationDate: parseOptionalDate(data.evaluationDate),
            instructorStartDate: parseOptionalDate(data.instructorStartDate),
            instructorEndDate: parseOptionalDate(data.instructorEndDate),
          }
        })
      ));
    }

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

    revalidatePath("/directory");
    revalidatePath("/admin");
    revalidatePath("/officer");
    revalidatePath("/summary");
    revalidatePath("/attendance-viewer");
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

    const rawChest = String(data.chestNumber || "").trim();
    const chestNumber = rawChest.replace(/^0+(?=\d)/, '');
    const batchId = data.batchId && String(data.batchId).trim() !== "" ? String(data.batchId).trim() : null;

    const recruit = await prisma.recruit.update({
      where: { id: recruitId },
      data: {
        name: toUpperCaseHelper(String(data.name || "").trim()) as string,
        age: parseInt(data.age as string) || 0,
        chestNumber: chestNumber,
        unit: toUpperCaseHelper(String(data.unit || "").trim()) as string,
        squadNumber: data.squadNumber ? toUpperCaseHelper(String(data.squadNumber).replace(/\D/g, '').replace(/^0+(?=\d)/, '')) : null,
        homeDistrict: String(data.homeDistrict || "").trim(),
        mobile: String(data.mobile || "").trim(),
        whatsappNumber: data.whatsappNumber ? String(data.whatsappNumber).trim() : null,
        maritalStatus: String(data.maritalStatus || "").trim(),
        education: toUpperCaseHelper(String(data.education || "").trim()) as string,
        height: parseFloat(data.height as string) || 0,
        weight: parseFloat(data.weight as string) || 0,
        bloodGroup: data.bloodGroup ? String(data.bloodGroup).trim() : null,
        sex: String(data.sex || "").trim(),
        religion: data.religion ? String(data.religion).trim() : null,
        caste: toUpperCaseHelper(String(data.caste || "").trim()),
        category: data.category ? String(data.category).trim() : null,
        address: toUpperCaseHelper(String(data.address || "").trim()),
        taluka: toUpperCaseHelper(String(data.taluka || "").trim()),
        pincode: data.pincode ? String(data.pincode).trim() : null,
        appointmentCategory: data.appointmentCategory ? String(data.appointmentCategory).trim() : null,
        appointmentType: data.appointmentType ? String(data.appointmentType).trim() : null,
        batchId: batchId,
        photoUrl: data.photoUrl ? (data.photoUrl as string) : undefined, // only update if provided
        nearestPoliceStation: data.nearestPoliceStation ? toUpperCaseHelper(String(data.nearestPoliceStation).trim()) : null,
        dateOfEntry: parseOptionalDate(data.dateOfEntry),
      }
    });
    
    revalidatePath("/directory");
    revalidatePath("/admin");
    revalidatePath("/officer");
    revalidatePath(`/directory/${recruit.id}`);
    revalidatePath(`/directory/${recruit.id}/report`);
    revalidatePath(`/directory/${recruit.id}/edit`);
    return { success: true, recruitId: recruit.id };
  } catch (error: any) {
    console.error("Failed to update recruit:", error);
    const msg = error?.message || "";
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      return { success: false, error: "हा छाती क्रमांक या बॅचमध्ये आधीच अस्तित्वात आहे. / This chest number already exists in this batch." };
    }
    return { success: false, error: `अपडेट अयशस्वी: ${msg || "त्रुटी आली"} / Failed to update recruit.` };
  }
}

export async function createBatch(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "OFFICER")) {
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
    revalidatePath("/officer/batches");
    return { success: true };
  } catch (error) {
    console.error("Failed to create batch:", error);
    return { success: false, error: "Failed to create batch. Name must be unique." };
  }
}

export async function toggleBatchStatus(batchId: string, isActive: boolean) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "OFFICER")) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.batch.update({
      where: { id: batchId },
      data: { isActive: !isActive }
    });
    revalidatePath("/admin/batches");
    revalidatePath("/officer/batches");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle batch status:", error);
    return { success: false, error: "Failed to update batch." };
  }
}

export async function deleteBatch(batchId: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "OFFICER")) {
      return { success: false, error: "Unauthorized" };
    }

    // First unassign all recruits from this batch so we don't delete the recruits or violate foreign keys
    await prisma.recruit.updateMany({
      where: { batchId: batchId },
      data: { batchId: null }
    });

    await prisma.batch.delete({
      where: { id: batchId }
    });

    revalidatePath("/admin/batches");
    revalidatePath("/officer/batches");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete batch:", error);
    return { success: false, error: "Failed to delete batch." };
  }
}
