import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import EditRecruitClient from "./EditRecruitClient";

export default async function EditRecruitPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "OFFICER")) {
    redirect("/");
  }

  const recruit = await prisma.recruit.findUnique({
    where: { id: params.id }
  });

  if (!recruit) {
    redirect("/directory");
  }

  const batches = await prisma.batch.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div style={{ paddingBottom: "2rem" }}>
      <EditRecruitClient recruit={recruit} batches={batches} />
    </div>
  );
}
