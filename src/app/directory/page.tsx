import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";

export default async function DirectoryPage() {
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
      const num = parseInt(r.chestNumber.replace(/\\D/g, ''));
      return !isNaN(num) && num >= user.minChestNumber! && num <= user.maxChestNumber!;
    });
  } else {
    recruits = await prisma.recruit.findMany({ orderBy: { chestNumber: "asc" } });
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <h1 className="heading-1">Recruit Directory / प्रशिक्षणार्थी यादी</h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        {user.role === "OFFICER" ? "Showing recruits within your assigned jurisdiction. / आपल्या अधिकारक्षेत्रातील प्रशिक्षणार्थी दाखवत आहे." : "Showing all registered recruits in the system. / प्रणालीतील सर्व नोंदणीकृत प्रशिक्षणार्थी दाखवत आहे."}
      </p>

      <div className="glass-card">
        {recruits.length === 0 ? (
          <p className="text-muted" style={{ padding: "2rem 0", textAlign: "center" }}>No recruits found.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {recruits.map(recruit => (
              <Link href={`/directory/${recruit.id}`} key={recruit.id} style={{ display: "block" }} className="directory-card">
                <div style={{ 
                  padding: "1.5rem", 
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "white" }}>{recruit.name}</h3>
                    <span className="badge badge-gold" style={{ fontSize: "1rem" }}>{recruit.chestNumber}</span>
                  </div>
                  
                  <div className="text-muted" style={{ fontSize: "0.875rem" }}>
                    <strong>Unit / तुकडी:</strong> {recruit.unit}
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.875rem" }}>
                    <strong>From / जिल्हा:</strong> {recruit.homeDistrict}
                  </div>
                  
                  <div style={{ marginTop: "1rem", color: "var(--accent-blue)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.25rem", fontWeight: "600" }}>
                    <Search size={16} /> View Profile Record / प्रोफाइल पहा
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
