"use client";

import { useEffect, useState } from "react";
import { getDailyAttendanceDetails } from "@/app/actions/attendance";
import { Calendar, Search, CheckCircle, XCircle, AlertTriangle, HelpCircle } from "lucide-react";

interface TraineeRow {
  id: string;
  name: string;
  chestNumber: string;
  unit: string;
  squadNumber: string | null;
  reason?: string | null;
}

interface AttendanceDetails {
  morning: {
    present: TraineeRow[];
    missed: TraineeRow[];
    leave: TraineeRow[];
    pending: TraineeRow[];
  };
  afternoon: {
    present: TraineeRow[];
    missed: TraineeRow[];
    leave: TraineeRow[];
    pending: TraineeRow[];
  };
}

export default function AttendanceViewerClient() {
  const [date, setDate] = useState(() => {
    // Default to today in Asia/Kolkata timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const parts = formatter.formatToParts(new Date());
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    const year = parts.find(p => p.type === 'year')?.value;
    return `${year}-${month}-${day}`;
  });

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTabMorning, setActiveTabMorning] = useState<"PRESENT" | "MISSED" | "LEAVE" | "PENDING">("PRESENT");
  const [activeTabAfternoon, setActiveTabAfternoon] = useState<"PRESENT" | "MISSED" | "LEAVE" | "PENDING">("PRESENT");

  const [details, setDetails] = useState<AttendanceDetails | null>(null);

  const fetchAttendanceDetails = async () => {
    setLoading(true);
    const res = await getDailyAttendanceDetails(date);
    if (res.success && res.details) {
      setDetails(res.details);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAttendanceDetails();
  }, [date]);

  const filterList = (list: TraineeRow[]) => {
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(r => 
      r.name.toLowerCase().includes(query) || 
      r.chestNumber.toLowerCase().includes(query) ||
      r.unit.toLowerCase().includes(query) ||
      (r.squadNumber && r.squadNumber.toLowerCase().includes(query))
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="heading-1" style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <Calendar size={32} color="var(--accent-gold)" /> Daily Attendance Report / दैनिक उपस्थिती अहवाल
          </h1>
          <p className="text-muted" style={{ margin: 0 }}>View detailed daily morning and afternoon session attendance logs / दैनिक उपस्थिती अहवाल पहा.</p>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Select Date / तारीख:</label>
          <input 
            type="date" 
            className="form-input" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            style={{ width: "auto" }} 
          />
        </div>
      </div>

      {/* Search and Quick Filters */}
      <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "2rem", display: "flex", gap: "1rem", alignItems: "center" }}>
        <Search size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <input 
          type="text" 
          placeholder="Search by chest number, name, unit or squad / छाती क्रमांक, नाव, तुकडी किंवा पथकाने शोधा..." 
          className="form-input" 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ border: "none", background: "transparent", padding: 0, margin: 0 }}
        />
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)", fontSize: "1.2rem" }}>
          Fetching attendance records / उपस्थिती माहिती लोड होत आहे...
        </div>
      ) : details ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: "2rem" }}>
          
          {/* Morning Session Card */}
          <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h2 className="heading-2" style={{ borderBottom: "2px solid rgba(255,255,255,0.05)", paddingBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Morning Session / सकाळ सत्र</span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "normal" }}>
                Total: {details.morning.present.length + details.morning.missed.length + details.morning.leave.length} recorded
              </span>
            </h2>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button 
                onClick={() => setActiveTabMorning("PRESENT")}
                className={`btn ${activeTabMorning === "PRESENT" ? "btn-primary" : "btn-outline"}`}
                style={{ flex: 1, minWidth: "120px", display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}
              >
                <CheckCircle size={16} /> Present ({details.morning.present.length})
              </button>
              <button 
                onClick={() => setActiveTabMorning("MISSED")}
                className={`btn ${activeTabMorning === "MISSED" ? "btn-primary" : "btn-outline"}`}
                style={{ 
                  flex: 1, 
                  minWidth: "120px", 
                  display: "flex", 
                  gap: "0.5rem", 
                  alignItems: "center", 
                  justifyContent: "center",
                  borderColor: activeTabMorning !== "MISSED" ? "rgba(239, 68, 68, 0.4)" : undefined,
                  color: activeTabMorning !== "MISSED" ? "#ef4444" : undefined
                }}
              >
                <XCircle size={16} /> Missed ({details.morning.missed.length})
              </button>
              <button 
                onClick={() => setActiveTabMorning("LEAVE")}
                className={`btn ${activeTabMorning === "LEAVE" ? "btn-primary" : "btn-outline"}`}
                style={{ 
                  flex: 1, 
                  minWidth: "120px", 
                  display: "flex", 
                  gap: "0.5rem", 
                  alignItems: "center", 
                  justifyContent: "center",
                  borderColor: activeTabMorning !== "LEAVE" ? "rgba(234, 179, 8, 0.4)" : undefined,
                  color: activeTabMorning !== "LEAVE" ? "#eab308" : undefined
                }}
              >
                <AlertTriangle size={16} /> Leave ({details.morning.leave.length})
              </button>
              <button 
                onClick={() => setActiveTabMorning("PENDING")}
                className={`btn ${activeTabMorning === "PENDING" ? "btn-primary" : "btn-outline"}`}
                style={{ flex: 1, minWidth: "120px", display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}
              >
                <HelpCircle size={16} /> Pending ({details.morning.pending.length})
              </button>
            </div>

            {/* List */}
            <div style={{ flex: 1, maxHeight: "500px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", paddingRight: "0.5rem" }}>
              {filterList(
                activeTabMorning === "PRESENT" ? details.morning.present :
                activeTabMorning === "MISSED" ? details.morning.missed :
                activeTabMorning === "LEAVE" ? details.morning.leave :
                details.morning.pending
              ).length === 0 ? (
                <div style={{ padding: "3rem", textDecoration: "none", textAlign: "center", color: "var(--text-muted)" }}>
                  No members found in this status. / कोणतीही माहिती उपलब्ध नाही.
                </div>
              ) : (
                filterList(
                  activeTabMorning === "PRESENT" ? details.morning.present :
                  activeTabMorning === "MISSED" ? details.morning.missed :
                  activeTabMorning === "LEAVE" ? details.morning.leave :
                  details.morning.pending
                ).map(r => (
                  <div key={r.id} style={{ padding: "1rem", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                      <span style={{ fontWeight: "700", color: "var(--accent-gold)" }}>#{r.chestNumber}</span>
                      <span className="badge badge-outline" style={{ fontSize: "0.75rem" }}>{r.unit} {r.squadNumber ? `| Squad ${r.squadNumber}` : ''}</span>
                    </div>
                    <div style={{ fontWeight: "600", color: "white" }}>{r.name}</div>
                    
                    {r.reason && (
                      <div style={{ 
                        marginTop: "0.5rem", 
                        padding: "0.5rem 0.75rem", 
                        backgroundColor: activeTabMorning === "MISSED" ? "rgba(239,68,68,0.1)" : "rgba(234,179,8,0.1)", 
                        color: activeTabMorning === "MISSED" ? "#fca5a5" : "#fef08a",
                        fontSize: "0.8rem", 
                        borderRadius: "4px",
                        borderLeft: `3px solid ${activeTabMorning === "MISSED" ? "#ef4444" : "#eab308"}`
                      }}>
                        <strong>Reason / कारण:</strong> {r.reason}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Afternoon Session Card */}
          <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h2 className="heading-2" style={{ borderBottom: "2px solid rgba(255,255,255,0.05)", paddingBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Afternoon Session / दुपार सत्र</span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "normal" }}>
                Total: {details.afternoon.present.length + details.afternoon.missed.length + details.afternoon.leave.length} recorded
              </span>
            </h2>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button 
                onClick={() => setActiveTabAfternoon("PRESENT")}
                className={`btn ${activeTabAfternoon === "PRESENT" ? "btn-primary" : "btn-outline"}`}
                style={{ flex: 1, minWidth: "120px", display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}
              >
                <CheckCircle size={16} /> Present ({details.afternoon.present.length})
              </button>
              <button 
                onClick={() => setActiveTabAfternoon("MISSED")}
                className={`btn ${activeTabAfternoon === "MISSED" ? "btn-primary" : "btn-outline"}`}
                style={{ 
                  flex: 1, 
                  minWidth: "120px", 
                  display: "flex", 
                  gap: "0.5rem", 
                  alignItems: "center", 
                  justifyContent: "center",
                  borderColor: activeTabAfternoon !== "MISSED" ? "rgba(239, 68, 68, 0.4)" : undefined,
                  color: activeTabAfternoon !== "MISSED" ? "#ef4444" : undefined
                }}
              >
                <XCircle size={16} /> Missed ({details.afternoon.missed.length})
              </button>
              <button 
                onClick={() => setActiveTabAfternoon("LEAVE")}
                className={`btn ${activeTabAfternoon === "LEAVE" ? "btn-primary" : "btn-outline"}`}
                style={{ 
                  flex: 1, 
                  minWidth: "120px", 
                  display: "flex", 
                  gap: "0.5rem", 
                  alignItems: "center", 
                  justifyContent: "center",
                  borderColor: activeTabAfternoon !== "LEAVE" ? "rgba(234, 179, 8, 0.4)" : undefined,
                  color: activeTabAfternoon !== "LEAVE" ? "#eab308" : undefined
                }}
              >
                <AlertTriangle size={16} /> Leave ({details.afternoon.leave.length})
              </button>
              <button 
                onClick={() => setActiveTabAfternoon("PENDING")}
                className={`btn ${activeTabAfternoon === "PENDING" ? "btn-primary" : "btn-outline"}`}
                style={{ flex: 1, minWidth: "120px", display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}
              >
                <HelpCircle size={16} /> Pending ({details.afternoon.pending.length})
              </button>
            </div>

            {/* List */}
            <div style={{ flex: 1, maxHeight: "500px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", paddingRight: "0.5rem" }}>
              {filterList(
                activeTabAfternoon === "PRESENT" ? details.afternoon.present :
                activeTabAfternoon === "MISSED" ? details.afternoon.missed :
                activeTabAfternoon === "LEAVE" ? details.afternoon.leave :
                details.afternoon.pending
              ).length === 0 ? (
                <div style={{ padding: "3rem", textDecoration: "none", textAlign: "center", color: "var(--text-muted)" }}>
                  No members found in this status. / कोणतीही माहिती उपलब्ध नाही.
                </div>
              ) : (
                filterList(
                  activeTabAfternoon === "PRESENT" ? details.afternoon.present :
                  activeTabAfternoon === "MISSED" ? details.afternoon.missed :
                  activeTabAfternoon === "LEAVE" ? details.afternoon.leave :
                  details.afternoon.pending
                ).map(r => (
                  <div key={r.id} style={{ padding: "1rem", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                      <span style={{ fontWeight: "700", color: "var(--accent-gold)" }}>#{r.chestNumber}</span>
                      <span className="badge badge-outline" style={{ fontSize: "0.75rem" }}>{r.unit} {r.squadNumber ? `| Squad ${r.squadNumber}` : ''}</span>
                    </div>
                    <div style={{ fontWeight: "600", color: "white" }}>{r.name}</div>
                    
                    {r.reason && (
                      <div style={{ 
                        marginTop: "0.5rem", 
                        padding: "0.5rem 0.75rem", 
                        backgroundColor: activeTabAfternoon === "MISSED" ? "rgba(239,68,68,0.1)" : "rgba(234,179,8,0.1)", 
                        color: activeTabAfternoon === "MISSED" ? "#fca5a5" : "#fef08a",
                        fontSize: "0.8rem", 
                        borderRadius: "4px",
                        borderLeft: `3px solid ${activeTabAfternoon === "MISSED" ? "#ef4444" : "#eab308"}`
                      }}>
                        <strong>Reason / कारण:</strong> {r.reason}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="glass-card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
          No data available for the selected date. / निवडलेल्या तारखेसाठी कोणतीही माहिती उपलब्ध नाही.
        </div>
      )}
    </div>
  );
}
