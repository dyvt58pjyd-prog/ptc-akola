import { prisma } from "@/lib/prisma";
import { CalendarOff, FileText, Search } from "lucide-react";
import Link from "next/link";

export default async function LeaveRegister() {
  const leaves = await prisma.leave.findMany({
    include: {
      recruit: true
    },
    orderBy: {
      startDate: 'desc'
    }
  });

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
        <div>
          <h1 className="heading-1" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <CalendarOff size={32} color="var(--accent-gold)" /> Leave Register / रजा नोंदवही
          </h1>
          <p className="text-muted">Official log of all approved recruit absences and leaves / मंजूर केलेल्या रजा आणि अनुपस्थितीची अधिकृत नोंद</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        {leaves.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center", opacity: 0.7 }}>
            <FileText size={48} style={{ margin: "0 auto 1rem", color: "var(--text-muted)" }} />
            <h3 style={{ fontSize: "1.2rem", color: "white", marginBottom: "0.5rem" }}>No Leaves Recorded / कोणतीही रजा नोंदवलेली नाही</h3>
            <p className="text-muted">The leave register is currently empty. / रजा नोंदवही सध्या रिकामी आहे.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
                <tr>
                  <th style={{ padding: "1.25rem 1.5rem", color: "var(--text-muted)", fontWeight: "600", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Recruit Details / प्रशिक्षणार्थी माहिती</th>
                  <th style={{ padding: "1.25rem 1.5rem", color: "var(--text-muted)", fontWeight: "600", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Chest Number / छाती क्रमांक</th>
                  <th style={{ padding: "1.25rem 1.5rem", color: "var(--text-muted)", fontWeight: "600", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Leave Period / रजेचा कालावधी</th>
                  <th style={{ padding: "1.25rem 1.5rem", color: "var(--text-muted)", fontWeight: "600", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Reason for Leave / रजेचे कारण</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background-color 0.2s" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                    <td style={{ padding: "1.25rem 1.5rem", verticalAlign: "top" }}>
                      <Link href={`/directory/${leave.recruitId}`} style={{ display: "flex", alignItems: "center", gap: "1rem", color: "white", textDecoration: "none" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "var(--primary-navy)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
                          {leave.recruit.photoUrl ? <img src={leave.recruit.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <FileText size={20} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: "700", marginBottom: "0.25rem" }}>{leave.recruit.name}</div>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Unit / तुकडी: {leave.recruit.unit}</div>
                        </div>
                      </Link>
                    </td>
                    <td style={{ padding: "1.25rem 1.5rem", verticalAlign: "top" }}>
                      <span className="badge badge-gold" style={{ fontSize: "1rem", padding: "0.4rem 1rem", letterSpacing: "1px" }}>#{leave.recruit.chestNumber}</span>
                    </td>
                    <td style={{ padding: "1.25rem 1.5rem", verticalAlign: "top" }}>
                      <div style={{ color: "white", fontWeight: "600" }}>{new Date(leave.startDate).toLocaleDateString('en-GB')}</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>to / ते {new Date(leave.endDate).toLocaleDateString('en-GB')}</div>
                    </td>
                    <td style={{ padding: "1.25rem 1.5rem", verticalAlign: "top" }}>
                      <div style={{ color: "white", backgroundColor: "rgba(255,255,255,0.05)", padding: "0.75rem 1rem", borderRadius: "6px", fontSize: "0.95rem", fontStyle: "italic", lineHeight: "1.5" }}>
                        "{leave.reason}"
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
