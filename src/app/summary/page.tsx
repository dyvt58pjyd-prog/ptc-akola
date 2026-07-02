import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";

export default async function SummaryPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/");

  let recruits;
  if (user.role === "OFFICER" && user.minChestNumber !== null && user.maxChestNumber !== null) {
    const allRecruits = await prisma.recruit.findMany({
      orderBy: { chestNumber: "asc" }
    });
    recruits = allRecruits.filter(r => {
      const num = parseInt(r.chestNumber.replace(/\D/g, ''));
      return !isNaN(num) && num >= user.minChestNumber! && num <= user.maxChestNumber!;
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
      <h1 className="heading-1" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <FileText size={32} color="var(--accent-gold)" /> Quick Reports / सारांश
      </h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        {user.role === "OFFICER" ? "Click a chest number to view the printable Official Report for your recruits. / प्रशिक्षणार्थीचा अधिकृत अहवाल पाहण्यासाठी छाती क्रमांकावर क्लिक करा." : "Click a chest number to view the printable Official Report for any recruit. / कोणत्याही प्रशिक्षणार्थीचा अधिकृत अहवाल पाहण्यासाठी छाती क्रमांकावर क्लिक करा."}
      </p>

      <div className="glass-card">
        {recruits.length === 0 ? (
          <p className="text-muted" style={{ padding: "2rem 0", textAlign: "center" }}>No recruits found.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "1rem" }}>
            {recruits.map(recruit => (
              <Link 
                href={`/directory/${recruit.id}/report`} 
                target="_blank" 
                key={recruit.id} 
                style={{ 
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "1rem 0.5rem",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "var(--radius-md)",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "1.2rem",
                  textDecoration: "none",
                  transition: "all 0.2s ease"
                }}
                title={recruit.name}
              >
                {recruit.chestNumber}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
