import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, Target } from "lucide-react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SquadsDashboard() {
  const session = await getSession();
  if (!session) redirect("/");

  const officerUser = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!officerUser || (officerUser.role !== "OFFICER" && officerUser.role !== "ADMIN")) redirect("/");

  const allRecruits = await prisma.recruit.findMany({
    select: { id: true, name: true, chestNumber: true, squadNumber: true },
    orderBy: { chestNumber: "asc" }
  });

  let recruits = allRecruits;
  if (officerUser.minChestNumber && officerUser.maxChestNumber) {
    recruits = allRecruits.filter(r => {
      const num = parseInt(r.chestNumber.replace(/\D/g, ''));
      return !isNaN(num) && num >= officerUser.minChestNumber! && num <= officerUser.maxChestNumber!;
    });
  }

  // Group by squad number
  const squadMap = new Map<string, typeof recruits>();
  
  recruits.forEach(r => {
    const squadKey = r.squadNumber || "Unassigned";
    if (!squadMap.has(squadKey)) {
      squadMap.set(squadKey, []);
    }
    squadMap.get(squadKey)!.push(r);
  });

  // Sort squad keys
  const squadKeys = Array.from(squadMap.keys()).sort((a, b) => {
    if (a === "Unassigned") return 1;
    if (b === "Unassigned") return -1;
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    if (numA !== numB) return numA - numB;
    return a.localeCompare(b);
  });

  return (
    <div>
      <h1 className="heading-1">Squads / तुकड्या</h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        View all squads in your jurisdiction and perform bulk evaluations. / तुमच्या अधिकार क्षेत्रातील सर्व तुकड्या पहा आणि त्यांचे मूल्यमापन करा.
      </p>

      <div className="grid-3">
        {squadKeys.map(squadKey => {
          const members = squadMap.get(squadKey)!;
          return (
            <div key={squadKey} className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: "700", color: "white" }}>
                    {squadKey === "Unassigned" ? "Unassigned" : `Squad ${squadKey}`}
                  </h3>
                  <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: 0 }}>
                    {squadKey === "Unassigned" ? "प्रशिक्षणार्थी तुकडीत समाविष्ट नाहीत" : `तुकडी क्रमांक ${squadKey}`}
                  </p>
                </div>
                <div className="icon-bg-neutral" style={{ padding: "0.75rem", borderRadius: "50%" }}>
                  <Users size={20} />
                </div>
              </div>

              <div style={{ padding: "1rem 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--accent-gold)" }}>
                  {members.length}
                </div>
                <div className="text-muted" style={{ fontSize: "0.875rem" }}>Enrolled Members / नोंदणीकृत सदस्य</div>
              </div>

              {squadKey !== "Unassigned" && (
                <Link 
                  href={`/officer/evaluate?squad=${encodeURIComponent(squadKey)}`} 
                  className="btn btn-primary" 
                  style={{ marginTop: "auto", display: "flex", justifyContent: "center", width: "100%" }}
                >
                  <Target size={18} /> Evaluate Squad
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
