import { prisma } from "@/lib/prisma";
import EditOfficerForm from "@/components/EditOfficerForm";
import { UserCog, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditOfficerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const officer = await prisma.user.findUnique({
    where: { id }
  });

  if (!officer || officer.role !== "OFFICER") {
    notFound();
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <Link href="/admin/officers" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", textDecoration: "none", fontSize: "0.875rem" }}>
          <ArrowLeft size={16} /> Back to Officers List
        </Link>
      </div>

      <h1 className="heading-1" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <UserCog size={32} color="var(--primary-navy)" />
        Edit Officer Details
      </h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        Update information or reset password for {officer.fullName || officer.username}.
      </p>

      <EditOfficerForm officer={officer} />
    </div>
  );
}
