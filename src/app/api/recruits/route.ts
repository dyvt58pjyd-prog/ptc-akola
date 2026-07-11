import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/auth";

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

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const allRecruits = await prisma.recruit.findMany({
      select: {
        id: true,
        name: true,
        chestNumber: true,
        unit: true,
        squadNumber: true,
        photoUrl: true
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

    return NextResponse.json({ success: true, recruits });
  } catch (error) {
    console.error("API recruits list fetch failed:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
