"use client";

import { useEffect, useState } from "react";
import { getLiveAttendanceSummary } from "@/app/actions/attendance";
import { usePathname } from "next/navigation";
import { Activity, Award, Calendar } from "lucide-react";

export default function LiveAttendanceWidget() {
  const pathname = usePathname();
  const [data, setData] = useState<{
    morning: { present: number; missed: number; leave: number };
    afternoon: { present: number; missed: number; leave: number };
  } | null>(null);

  const fetchSummary = async () => {
    const res = await getLiveAttendanceSummary();
    if (res.success && res.summary) {
      setData(res.summary);
    }
  };

  useEffect(() => {
    fetchSummary();
    // Poll every 10 seconds to keep it truly live
    const interval = setInterval(fetchSummary, 10000);
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
      gap: "0.75rem",
      fontSize: "0.85rem"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "bold", color: "var(--accent-gold)" }}>
        <Activity size={16} />
        <span>Live Today / आजची उपस्थिती</span>
      </div>

      {/* Morning Session */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <div style={{ fontWeight: "600", color: "white", fontSize: "0.8rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px" }}>
          Morning Session / सकाळ सत्र
        </div>
        {totalMorning === 0 ? (
          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>No attendance recorded / नोंद नाही</span>
        ) : (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
        )}
      </div>
    </div>
  );
}
