"use client";

import { Clock, CheckCircle, Target } from "lucide-react";
import Link from "next/link";

export default function RecentActivityFeed({ activities }: { activities: any[] }) {
  return (
    <div className="glass-card" style={{ height: "100%" }}>
      <h3 className="heading-2" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", marginBottom: "1.5rem" }}>
        <Clock size={20} color="var(--accent-blue)" />
        Recent Activity
      </h3>
      
      {activities.length === 0 ? (
        <p className="text-muted" style={{ textAlign: "center", padding: "2rem 0" }}>No recent activity.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {activities.map((act, index) => (
            <div key={index} style={{ display: "flex", gap: "1rem", paddingBottom: "1rem", borderBottom: index < activities.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ marginTop: "4px" }}>
                {act.type === "EVALUATION" ? (
                  <div style={{ padding: "8px", backgroundColor: "rgba(251, 191, 36, 0.1)", borderRadius: "50%" }}>
                    <Target size={16} color="var(--accent-gold)" />
                  </div>
                ) : (
                  <div style={{ padding: "8px", backgroundColor: "rgba(34, 197, 94, 0.1)", borderRadius: "50%" }}>
                    <CheckCircle size={16} color="var(--success)" />
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: "0.9rem" }}>
                  {act.type === "EVALUATION" ? (
                    <span>New evaluation recorded for <strong>{act.recruitName}</strong> ({act.chestNumber})</span>
                  ) : (
                    <span>Attendance marked for <strong>{act.recruitName}</strong> ({act.chestNumber})</span>
                  )}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  {act.dateLabel}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
        <Link href="/directory" className="text-muted" style={{ fontSize: "0.875rem", textDecoration: "underline" }}>
          View all in Directory
        </Link>
      </div>
    </div>
  );
}
