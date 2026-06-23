"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Search, UserPlus, Users, CalendarCheck } from "lucide-react";

export default function InteractiveRoster({ recruits }: { recruits: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRecruits = recruits.filter(r => 
    r.chestNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.homeDistrict.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Quick Action Panel */}
      <div className="glass-card" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
        <h3 className="heading-2" style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>Quick Actions</h3>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/admin/enroll" className="btn btn-primary">
            <UserPlus size={18} /> Enroll New Recruit
          </Link>
          <Link href="/officer/attendance" className="btn btn-accent">
            <CalendarCheck size={18} /> Mark Bulk Attendance
          </Link>
          <Link href="/directory" className="btn btn-outline">
            <Users size={18} /> View Full Directory
          </Link>
        </div>
      </div>

      <div className="glass-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <h2 className="heading-2" style={{ margin: 0 }}>Recruit Roster</h2>
          
          <div style={{ position: "relative", width: "300px" }}>
            <Search size={18} className="text-muted" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="text" 
              placeholder="Search Chest No, Name, District..." 
              className="form-input"
              style={{ paddingLeft: "36px", backgroundColor: "rgba(255,255,255,0.05)" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {filteredRecruits.length === 0 ? (
          <p className="text-muted" style={{ padding: "3rem 0", textAlign: "center" }}>
            {recruits.length === 0 ? "No recruits have been registered yet." : "No recruits match your search."}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                  <th style={{ padding: "1rem 0", color: "var(--text-muted)" }}>Chest No.</th>
                  <th style={{ padding: "1rem 0", color: "var(--text-muted)" }}>Name</th>
                  <th style={{ padding: "1rem 0", color: "var(--text-muted)" }}>Unit</th>
                  <th style={{ padding: "1rem 0", color: "var(--text-muted)" }}>Home District</th>
                  <th style={{ padding: "1rem 0", color: "var(--text-muted)" }}>Evaluations</th>
                  <th style={{ padding: "1rem 0", color: "var(--text-muted)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecruits.map(recruit => (
                  <tr key={recruit.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: "1rem 0", fontWeight: "600" }}>{recruit.chestNumber}</td>
                    <td style={{ padding: "1rem 0" }}>{recruit.name}</td>
                    <td style={{ padding: "1rem 0" }}>{recruit.unit}</td>
                    <td style={{ padding: "1rem 0" }}>{recruit.homeDistrict}</td>
                    <td style={{ padding: "1rem 0" }}>
                      <span className="badge badge-navy">{recruit.evaluations?.length || 0} recorded</span>
                    </td>
                    <td style={{ padding: "1rem 0" }}>
                      <Link href={`/directory/${recruit.id}`} className="btn btn-outline" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>
                        <FileText size={14} /> Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
