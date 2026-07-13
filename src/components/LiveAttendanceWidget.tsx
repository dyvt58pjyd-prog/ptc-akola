"use client";

import { useEffect, useState } from "react";
import { getLiveAttendanceSummary } from "@/app/actions/attendance";
import { usePathname } from "next/navigation";
import { Activity, Award, Calendar, RefreshCw } from "lucide-react";

export default function LiveAttendanceWidget() {
  const pathname = usePathname();
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<{
    morning: { 
      present: number; 
      missed: number; 
      leave: number;
      missedList?: { chestNumber: string; name: string; reason: string }[];
      leaveList?: { chestNumber: string; name: string; reason: string }[];
    };
    afternoon: { 
      present: number; 
      missed: number; 
      leave: number;
      missedList?: { chestNumber: string; name: string; reason: string }[];
      leaveList?: { chestNumber: string; name: string; reason: string }[];
    };
  } | null>(null);

  const fetchSummary = async () => {
    setRefreshing(true);
    const res = await getLiveAttendanceSummary();
    if (res.success && res.summary) {
      setData(res.summary);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchSummary();
    // Poll every 5 minutes (300000ms) to reduce bandwidth significantly
    const interval = setInterval(fetchSummary, 300000);
    return () => clearInterval(interval);
  }, [pathname]);

  if (!data) return null;

  const totalMorning = data.morning.present + data.morning.missed + data.morning.leave;
  const totalAfternoon = data.afternoon.present + data.afternoon.missed + data.afternoon.leave;

  return (
    <div style={{
      padding: "1rem",
      margin: "1rem",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border)",
      backgroundColor: "rgba(255, 255, 255, 0.02)",
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      fontSize: "0.85rem"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: "bold", color: "var(--accent-gold)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Activity size={16} />
          <span>Live Today / आजची उपस्थिती</span>
        </div>
        <button 
          onClick={fetchSummary}
          disabled={refreshing}
          style={{
            background: "none",
            border: "none",
            color: "var(--accent-gold)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: "2px",
            opacity: refreshing ? 0.5 : 1
          }}
          title="Refresh attendance / रिफ्रेश करा"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>

      {/* Morning Session */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <div style={{ fontWeight: "600", color: "white", fontSize: "0.8rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px" }}>
          Morning Session / सकाळ सत्र
        </div>
        {totalMorning === 0 ? (
          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>No attendance recorded / नोंद नाही</span>
        ) : (
          <div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
              <span style={{ color: "#22c55e", backgroundColor: "rgba(34, 197, 94, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                P: <strong>{data.morning.present}</strong>
              </span>
              <span style={{ color: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                M: <strong>{data.morning.missed}</strong>
              </span>
              <span style={{ color: "#eab308", backgroundColor: "rgba(234, 179, 8, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                L: <strong>{data.morning.leave}</strong>
              </span>
            </div>

            {data.morning.missedList && data.morning.missedList.length > 0 && (
              <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#ef4444" }}>Missed / अनुपस्थित:</div>
                {data.morning.missedList.map((m, idx) => (
                  <div key={idx} style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.9)", paddingLeft: "0.5rem", borderLeft: "2px solid #ef4444", lineHeight: "1.2" }}>
                    #{m.chestNumber} {m.name} <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", display: "block", marginTop: "1px" }}>({m.reason})</span>
                  </div>
                ))}
              </div>
            )}

            {data.morning.leaveList && data.morning.leaveList.length > 0 && (
              <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#eab308" }}>On Leave / रजा:</div>
                {data.morning.leaveList.map((l, idx) => (
                  <div key={idx} style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.9)", paddingLeft: "0.5rem", borderLeft: "2px solid #eab308", lineHeight: "1.2" }}>
                    #{l.chestNumber} {l.name} <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", display: "block", marginTop: "1px" }}>({l.reason})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Afternoon Session */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <div style={{ fontWeight: "600", color: "white", fontSize: "0.8rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px" }}>
          Afternoon Session / दुपार सत्र
        </div>
        {totalAfternoon === 0 ? (
          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>No attendance recorded / नोंद नाही</span>
        ) : (
          <div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
              <span style={{ color: "#22c55e", backgroundColor: "rgba(34, 197, 94, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                P: <strong>{data.afternoon.present}</strong>
              </span>
              <span style={{ color: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                M: <strong>{data.afternoon.missed}</strong>
              </span>
              <span style={{ color: "#eab308", backgroundColor: "rgba(234, 179, 8, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                L: <strong>{data.afternoon.leave}</strong>
              </span>
            </div>

            {data.afternoon.missedList && data.afternoon.missedList.length > 0 && (
              <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#ef4444" }}>Missed / अनुपस्थित:</div>
                {data.afternoon.missedList.map((m, idx) => (
                  <div key={idx} style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.9)", paddingLeft: "0.5rem", borderLeft: "2px solid #ef4444", lineHeight: "1.2" }}>
                    #{m.chestNumber} {m.name} <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", display: "block", marginTop: "1px" }}>({m.reason})</span>
                  </div>
                ))}
              </div>
            )}

            {data.afternoon.leaveList && data.afternoon.leaveList.length > 0 && (
              <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#eab308" }}>On Leave / रजा:</div>
                {data.afternoon.leaveList.map((l, idx) => (
                  <div key={idx} style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.9)", paddingLeft: "0.5rem", borderLeft: "2px solid #eab308", lineHeight: "1.2" }}>
                    #{l.chestNumber} {l.name} <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", display: "block", marginTop: "1px" }}>({l.reason})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
