import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AttendanceClient from "./AttendanceClient";

export default async function AttendancePage() {
  const session = await getSession();
  if (!session || session.role !== "OFFICER") {
    redirect("/");
  }

  const officer = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!officer) redirect("/");

  // Fetch recruits under jurisdiction
  let recruits;
  if (officer.minChestNumber !== null && officer.maxChestNumber !== null) {
    const allRecruits = await prisma.recruit.findMany({
      orderBy: { chestNumber: "asc" }
    });
    recruits = allRecruits.filter(r => {
      const num = parseInt(r.chestNumber.replace(/\\D/g, ''));
      return !isNaN(num) && num >= officer.minChestNumber! && num <= officer.maxChestNumber!;
    });
  } else {
    recruits = await prisma.recruit.findMany({ orderBy: { chestNumber: "asc" } });
  }

  recruits.sort((a, b) => {
    const numA = parseInt(a.chestNumber.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.chestNumber.replace(/\D/g, '')) || 0;
    if (numA !== numB) return numA - numB;
    return a.chestNumber.localeCompare(b.chestNumber);
  });

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <h1 className="heading-1">Daily Attendance / दैनंदिन उपस्थिती</h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        Mark attendance for your assigned recruits. / तुमच्या अधिकारक्षेत्रातील प्रशिक्षणार्थींची उपस्थिती नोंदवा.
      </p>
      
      <AttendanceClient recruits={recruits} />
    </div>
  );
}
