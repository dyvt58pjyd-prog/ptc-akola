import { prisma } from "@/lib/prisma";
import CreateOfficerForm from "@/components/CreateOfficerForm";
import { ShieldAlert, ArrowRight } from "lucide-react";

export default async function ManageOfficers() {
  const officers = await prisma.user.findMany({
    where: { role: "OFFICER" },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <h1 className="heading-1">Manage Officers</h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        Create officer accounts and assign them their jurisdiction (Chest Number ranges).
      </p>

      <CreateOfficerForm />

      <div className="glass-card">
        <h2 className="heading-2" style={{ marginBottom: "1.5rem" }}>Active Officers</h2>
        
        {officers.length === 0 ? (
          <p className="text-muted" style={{ padding: "2rem 0", textAlign: "center" }}>No officers found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                  <th style={{ padding: "1rem 0", color: "var(--text-muted)" }}>Full Name</th>
                  <th style={{ padding: "1rem 0", color: "var(--text-muted)" }}>Username</th>
                  <th style={{ padding: "1rem 0", color: "var(--text-muted)" }}>Assigned Range</th>
                  <th style={{ padding: "1rem 0", color: "var(--text-muted)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {officers.map(officer => (
                  <tr key={officer.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "1rem 0", fontWeight: "600" }}>{officer.fullName || "—"}</td>
                    <td style={{ padding: "1rem 0" }}>
                      <span style={{ fontFamily: "monospace", backgroundColor: "rgba(255,255,255,0.05)", padding: "0.25rem 0.5rem", borderRadius: "4px" }}>
                        {officer.username}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 0" }}>
                      {officer.minChestNumber && officer.maxChestNumber ? (
                        <span className="badge badge-navy" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          {officer.minChestNumber} <ArrowRight size={12} /> {officer.maxChestNumber}
                        </span>
                      ) : (
                        <span className="text-muted">No Range Assigned</span>
                      )}
                    </td>
                    <td style={{ padding: "1rem 0" }}>
                      <span style={{ color: "var(--accent-gold)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.875rem" }}>
                        <ShieldAlert size={14} /> Active
                      </span>
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
