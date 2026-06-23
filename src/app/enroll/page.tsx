import BilingualRegisterForm from "@/components/BilingualRegisterForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PublicEnrollment() {
  const batches = await prisma.batch.findMany({ 
    where: { isActive: true }, 
    orderBy: { createdAt: "desc" } 
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 4rem)" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "1.5rem" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", textDecoration: "none", fontSize: "0.875rem" }}>
          <ArrowLeft size={16} /> Back to Login / लॉगिनवर परत जा
        </Link>
      </div>
      <BilingualRegisterForm batches={batches} />
    </div>
  );
}
