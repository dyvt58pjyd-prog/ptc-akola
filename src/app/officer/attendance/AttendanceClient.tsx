"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { 
  submitBulkAttendanceWithLeaves, 
  registerLeave, 
  markDistrictReturn, 
  getAttendanceForDateAndSession 
} from "@/app/actions/attendance";
import RegisterSickLeaveModal from "@/components/RegisterSickLeaveModal";
import { 
  Save, 
  CalendarRange, 
  X, 
  Target, 
  Check, 
  AlertCircle, 
  Stethoscope, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  UserCheck, 
  UserX, 
  ExternalLink,
  ShieldAlert,
  Info,
  Calendar
} from "lucide-react";

export default function AttendanceClient({ recruits }: { recruits: any[] }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showSickPeriodModal, setShowSickPeriodModal] = useState(false);
  const [showDistrictReturnModal, setShowDistrictReturnModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [originallySavedIds, setOriginallySavedIds] = useState<Set<string>>(new Set());

  const [sessionType, setSessionType] = useState("MORNING");
  const [sickLeaveRecruits, setSickLeaveRecruits] = useState<any[]>([]);
  const [showSickListExpanded, setShowSickListExpanded] = useState(true);

  // Map of recruitId -> { status, reason, leaveEndDate }
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, {
    status: "PRESENT" | "MISSED" | "LEAVE";
    reason: string;
    leaveEndDate: string;
  }>>(() => {
    const initial: Record<string, any> = {};
    recruits.forEach(r => {
      initial[r.id] = {
        status: "PRESENT",
        reason: "",
        leaveEndDate: new Date().toISOString().split("T")[0]
      };
    });
    return initial;
  });

  const loadSavedAttendance = useCallback(async () => {
    setLoadingRecords(true);
    const res = await getAttendanceForDateAndSession(date, sessionType);
    if (res.success) {
      if (res.sickLeaveRecruits) {
        setSickLeaveRecruits(res.sickLeaveRecruits);
      } else {
        setSickLeaveRecruits([]);
      }
      if (res.attendanceMap) {
        const savedIds = new Set<string>();
        const updated = { ...attendanceRecords };
        recruits.forEach(r => {
          const saved = res.attendanceMap[r.id];
          if (saved) {
            savedIds.add(r.id);
            updated[r.id] = {
              status: saved.status as "PRESENT" | "MISSED" | "LEAVE",
              reason: saved.reason,
              leaveEndDate: date
            };
          } else {
            updated[r.id] = {
              status: "PRESENT",
              reason: "",
              leaveEndDate: date
            };
          }
        });
        setOriginallySavedIds(savedIds);
        setAttendanceRecords(updated);
      }
    }
    setLoadingRecords(false);
  }, [date, sessionType, recruits]);

  useEffect(() => {
    loadSavedAttendance();
  }, [loadSavedAttendance]);

  // Map of recruitId -> sickLeaveInfo for recruits currently on sick leave / leave covering this date
  const sickLeaveRecruitsMap = useMemo(() => {
    const map = new Map<string, any>();
    sickLeaveRecruits.forEach(s => map.set(s.recruitId, s));
    return map;
  }, [sickLeaveRecruits]);

  // Separate recruits into active roster (for daily roll call) and on-sick-leave (excluded from roll call)
  const { activeRecruits, onSickLeaveRecruits } = useMemo(() => {
    const active: any[] = [];
    const onSick: any[] = [];

    recruits.forEach(r => {
      if (sickLeaveRecruitsMap.has(r.id)) {
        onSick.push({
          ...r,
          sickInfo: sickLeaveRecruitsMap.get(r.id)
        });
      } else {
        active.push(r);
      }
    });

    return { activeRecruits: active, onSickLeaveRecruits: onSick };
  }, [recruits, sickLeaveRecruitsMap]);

  // Attendance metrics summary
  const metrics = useMemo(() => {
    let present = 0;
    let missed = 0;
    let leave = 0;

    activeRecruits.forEach(r => {
      const rec = attendanceRecords[r.id];
      if (!rec || rec.status === "PRESENT") present++;
      else if (rec.status === "MISSED") missed++;
      else if (rec.status === "LEAVE") leave++;
    });

    return {
      total: recruits.length,
      active: activeRecruits.length,
      sickCount: onSickLeaveRecruits.length,
      present,
      missed,
      leave
    };
  }, [recruits, activeRecruits, onSickLeaveRecruits, attendanceRecords]);

  const updateStatus = (recruitId: string, status: "PRESENT" | "MISSED" | "LEAVE") => {
    setAttendanceRecords(prev => ({
      ...prev,
      [recruitId]: {
        ...prev[recruitId],
        status
      }
    }));
  };

  const updateReason = (recruitId: string, reason: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [recruitId]: {
        ...prev[recruitId],
        reason
      }
    }));
  };

  const updateLeaveEndDate = (recruitId: string, leaveEndDate: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [recruitId]: {
        ...prev[recruitId],
        leaveEndDate
      }
    }));
  };

  const handleBulkSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    // CRITICAL: Only submit attendance records for active recruits in roll call!
    // Recruits on sick leave are safely excluded to prevent overwriting their registered sick leave records.
    const payload = {
      date,
      sessionType,
      records: activeRecruits
        .map(r => {
          const record = attendanceRecords[r.id] || { status: "PRESENT", reason: "", leaveEndDate: "" };
          return {
            recruitId: r.id,
            status: record.status,
            reason: record.status !== "PRESENT" ? record.reason : null,
            leaveEndDate: record.status === "LEAVE" ? record.leaveEndDate : null
          };
        })
        .filter(rec => rec.status !== "PRESENT" || originallySavedIds.has(rec.recruitId))
    };

    const result = await submitBulkAttendanceWithLeaves(payload);
    if (result.success) {
      setStatusMsg({ 
        type: "success", 
        text: "Attendance saved successfully! / उपस्थिती यशस्वीरीत्या जतन केली! (आजारी रजेवरील प्रशिक्षणार्थी सुरक्षित राहिले आहेत)" 
      });
      // Update originallySavedIds with the active recruits currently saved
      const newSavedIds = new Set<string>();
      activeRecruits.forEach(r => {
        const record = attendanceRecords[r.id];
        if (record && record.status !== "PRESENT") {
          newSavedIds.add(r.id);
        }
      });
      setOriginallySavedIds(newSavedIds);
    } else {
      setStatusMsg({ type: "error", text: result.error || "Failed to save. / जतन करण्यात अयशस्वी." });
    }
    setLoading(false);
  };

  const handleLeaveSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await registerLeave(formData);
    if (result.success) {
      setShowLeaveModal(false);
      setStatusMsg({ type: "success", text: "Leave registered successfully! / रजा यशस्वीरीत्या नोंदवली!" });
      loadSavedAttendance();
    } else {
      setStatusMsg({ type: "error", text: result.error || "Failed to register leave. / रजा नोंदणी अयशस्वी." });
    }
    setLoading(false);
  };

  const handleDistrictReturnSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await markDistrictReturn(formData);
    if (result.success) {
      setShowDistrictReturnModal(false);
      setStatusMsg({ type: "success", text: "Recruit returned to district successfully! / जिल्ह्यात परत पाठवले!" });
    } else {
      setStatusMsg({ type: "error", text: result.error || "Failed to mark return. / जतन करण्यात अयशस्वी." });
    }
    setLoading(false);
  };

  return (
    <>
      {/* Top Filter & Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <label className="form-label" style={{ marginBottom: 0, fontWeight: "600" }}>Select Date / तारीख:</label>
            <input 
              type="date" 
              className="form-input" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              style={{ width: "auto", fontWeight: "600" }} 
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <label className="form-label" style={{ marginBottom: 0, fontWeight: "600" }}>Session / सत्र:</label>
            <select 
              className="form-select" 
              value={sessionType} 
              onChange={e => setSessionType(e.target.value)} 
              style={{ width: "auto", fontWeight: "600" }}
            >
              <option value="MORNING">Morning / सकाळ सत्र</option>
              <option value="AFTERNOON">Afternoon / दुपार सत्र</option>
            </select>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <button 
            type="button"
            onClick={() => setShowSickPeriodModal(true)} 
            className="btn btn-outline" 
            style={{ 
              borderColor: "#ef4444", 
              color: "#f87171", 
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              fontWeight: "600"
            }}
          >
            <Stethoscope size={18} /> Register Sick Leave / आजारी रजा नोंदवा
          </button>
          <button 
            type="button"
            onClick={() => setShowLeaveModal(true)} 
            className="btn btn-outline" 
            style={{ borderColor: "var(--accent-gold)", color: "var(--accent-gold)" }}
          >
            <CalendarRange size={18} /> Register Leave / रजा नोंदवा
          </button>
          <Link 
            href="/attendance-viewer" 
            className="btn btn-outline" 
            style={{ borderColor: "#3b82f6", color: "#60a5fa" }}
          >
            <FileText size={18} /> Sick Report / आजारी कालावधी अहवाल
          </Link>
          <button 
            type="button"
            onClick={() => setShowDistrictReturnModal(true)} 
            className="btn btn-outline" 
            style={{ borderColor: "var(--error)", color: "var(--error)" }}
          >
            <Target size={18} /> Mark District Return
          </button>
        </div>
      </div>

      {/* Status Notification Message */}
      {statusMsg && (
        <div 
          className={`badge ${statusMsg.type === 'success' ? 'badge-success' : 'badge-error'}`} 
          style={{ padding: "1rem", marginBottom: "1.5rem", fontSize: "1rem", width: "100%", borderRadius: "var(--radius-md)" }}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Summary KPI Strip */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
        gap: "1rem", 
        marginBottom: "1.5rem" 
      }}>
        <div className="glass-card" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", backgroundColor: "rgba(30, 41, 59, 0.6)" }}>
          <div style={{ padding: "0.6rem", borderRadius: "8px", backgroundColor: "rgba(59, 130, 246, 0.2)", color: "#60a5fa" }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>हजेरी पट (Roll Call)</div>
            <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "white" }}>{metrics.active} <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>/ {metrics.total}</span></div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", backgroundColor: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
          <div style={{ padding: "0.6rem", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.25)", color: "#f87171" }}>
            <Stethoscope size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#fca5a5", textTransform: "uppercase", fontWeight: "600" }}>आजारी रजेवर (Sick Leave)</div>
            <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#ef4444" }}>{metrics.sickCount} <span style={{ fontSize: "0.8rem", color: "#fca5a5" }}>वगळलेले (Excluded)</span></div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", backgroundColor: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)" }}>
          <div style={{ padding: "0.6rem", borderRadius: "8px", backgroundColor: "rgba(34, 197, 94, 0.2)", color: "#4ade80" }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#86efac", textTransform: "uppercase" }}>हजर (Present)</div>
            <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#22c55e" }}>{metrics.present}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", backgroundColor: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.15)" }}>
          <div style={{ padding: "0.6rem", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#f87171" }}>
            <UserX size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#fca5a5", textTransform: "uppercase" }}>चुकवलेले (Missed)</div>
            <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#ef4444" }}>{metrics.missed}</div>
          </div>
        </div>
      </div>

      {/* SICK LEAVE RECRUITS CARD - EXCLUDED FROM DAILY ATTENDANCE */}
      {onSickLeaveRecruits.length > 0 && (
        <div 
          className="glass-card" 
          style={{ 
            marginBottom: "2rem", 
            border: "2px solid rgba(239, 68, 68, 0.5)", 
            backgroundColor: "rgba(239, 68, 68, 0.06)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden"
          }}
        >
          {/* Header */}
          <div 
            style={{ 
              padding: "1.25rem 1.5rem", 
              backgroundColor: "rgba(239, 68, 68, 0.15)", 
              borderBottom: "1px solid rgba(239, 68, 68, 0.3)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ 
                width: "40px", 
                height: "40px", 
                borderRadius: "50%", 
                backgroundColor: "#ef4444", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                color: "white",
                boxShadow: "0 0 12px rgba(239, 68, 68, 0.4)"
              }}>
                <Stethoscope size={22} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#fca5a5", margin: 0 }}>
                    आजारी रजेवर असलेले प्रशिक्षणार्थी (On Sick Leave)
                  </h3>
                  <span style={{ 
                    backgroundColor: "#ef4444", 
                    color: "white", 
                    fontSize: "0.8rem", 
                    padding: "0.2rem 0.6rem", 
                    borderRadius: "999px",
                    fontWeight: "bold"
                  }}>
                    {onSickLeaveRecruits.length} प्रशिक्षणार्थी
                  </span>
                </div>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "#fecaca" }}>
                  ⚠️ सदर प्रशिक्षणार्थी आजारी रजेवर असल्याने दैनिक हजेरी पटामधून आपोआप वगळण्यात आले आहेत, जेणेकरून हजेरी घेताना कोणताही गोंधळ होणार नाही.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setShowSickPeriodModal(true)}
                className="btn btn-outline"
                style={{
                  fontSize: "0.85rem",
                  padding: "0.4rem 0.8rem",
                  borderColor: "rgba(239, 68, 68, 0.6)",
                  color: "#fca5a5",
                  backgroundColor: "rgba(239, 68, 68, 0.2)"
                }}
              >
                + नवीन आजारी रजा नोंदवा
              </button>
              <button
                type="button"
                onClick={() => setShowSickListExpanded(!showSickListExpanded)}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#fca5a5",
                  padding: "0.4rem 0.75rem",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.85rem"
                }}
              >
                {showSickListExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                {showSickListExpanded ? "लपवा (Hide)" : "यादी पहा (Show)"}
              </button>
            </div>
          </div>

          {/* List of Sick Leave Trainees */}
          {showSickListExpanded && (
            <div style={{ padding: "1.25rem" }}>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
                gap: "1rem" 
              }}>
                {onSickLeaveRecruits.map(r => {
                  const info = r.sickInfo || {};
                  return (
                    <div 
                      key={r.id} 
                      style={{ 
                        border: "1px solid rgba(239, 68, 68, 0.35)", 
                        borderRadius: "var(--radius-md)", 
                        padding: "1rem", 
                        backgroundColor: "rgba(0, 0, 0, 0.35)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.6rem"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ 
                            fontWeight: "bold", 
                            color: "var(--accent-gold)", 
                            fontSize: "1.05rem",
                            backgroundColor: "rgba(217, 119, 6, 0.15)",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "4px",
                            border: "1px solid rgba(217, 119, 6, 0.3)"
                          }}>
                            #{r.chestNumber}
                          </span>
                          <div>
                            <div style={{ fontWeight: "600", color: "white", fontSize: "1rem" }}>{r.name}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              {r.unit} {r.squadNumber ? `• तुकडी: ${r.squadNumber}` : ""}
                            </div>
                          </div>
                        </div>

                        <span style={{ 
                          backgroundColor: "rgba(239, 68, 68, 0.2)", 
                          color: "#fca5a5", 
                          fontSize: "0.75rem", 
                          padding: "0.2rem 0.5rem", 
                          borderRadius: "4px",
                          fontWeight: "600",
                          border: "1px solid rgba(239, 68, 68, 0.4)",
                          whiteSpace: "nowrap"
                        }}>
                          आजारी रजा / Sick
                        </span>
                      </div>

                      <div style={{ 
                        backgroundColor: "rgba(239, 68, 68, 0.1)", 
                        padding: "0.5rem 0.75rem", 
                        borderRadius: "4px",
                        fontSize: "0.85rem",
                        color: "#fee2e2",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ color: "#fca5a5", fontWeight: "600" }}>आजारपण:</span>
                          <span style={{ fontWeight: "500" }}>{info.reason || "आजारी रजा / Sick Leave"}</span>
                        </div>
                        {info.startDate && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#cbd5e1" }}>
                            <Calendar size={13} style={{ color: "#fca5a5" }} />
                            <span>कालावधी: <strong>{info.startDate}</strong> ते <strong>{info.endDate || info.startDate}</strong></span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "0.4rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                          सदर हजेरीतून वगळण्यात आले आहे
                        </span>
                        <Link 
                          href={`/directory/${r.id}/report`}
                          target="_blank"
                          style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "0.3rem", 
                            fontSize: "0.8rem", 
                            color: "#60a5fa", 
                            textDecoration: "none" 
                          }}
                        >
                          अहवाल पहा <ExternalLink size={13} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DAILY ATTENDANCE ROSTER - ACTIVE TRAINEES ONLY */}
      <form onSubmit={handleBulkSubmit} className="glass-card" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 className="heading-2" style={{ margin: 0 }}>
              Daily Attendance Roll Call / दैनिक हजेरी पट
            </h3>
            <p style={{ margin: "0.25rem 0 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              आजारी रजेवरील प्रशिक्षणार्थी वगळून उपस्थित असणारे प्रशिक्षणार्थी ({activeRecruits.length} प्रशिक्षणार्थी)
            </p>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ padding: "0.75rem 2rem", fontSize: "1.05rem" }} 
            disabled={loading || loadingRecords || activeRecruits.length === 0}
          >
            <Save size={18} /> {loading ? "Saving..." : "Save Daily Attendance / उपस्थिती जतन करा"}
          </button>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
          {loadingRecords ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)", fontSize: "1.1rem" }}>
              Loading attendance for selected date & session / उपस्थिती लोड होत आहे...
            </div>
          ) : activeRecruits.map(r => {
            const record = attendanceRecords[r.id] || { status: "PRESENT", reason: "", leaveEndDate: "" };
            return (
              <div 
                key={r.id} 
                style={{ 
                  border: "1px solid var(--border)", 
                  borderRadius: "var(--radius-md)", 
                  padding: "1rem",
                  backgroundColor: "rgba(0,0,0,0.15)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", width: "55px", color: "var(--accent-gold)", fontSize: "1.1rem" }}>
                      #{r.chestNumber}
                    </span>
                    <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "white" }}>
                      {r.name}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      ({r.unit}) {r.squadNumber ? `• Sq ${r.squadNumber}` : ""}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    {/* Present Button (Green Tick) */}
                    <button
                      type="button"
                      onClick={() => updateStatus(r.id, "PRESENT")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "44px",
                        height: "44px",
                        borderRadius: "var(--radius-md)",
                        border: "2px solid #22c55e",
                        backgroundColor: record.status === "PRESENT" ? "#22c55e" : "transparent",
                        color: record.status === "PRESENT" ? "white" : "#22c55e",
                        transition: "all 0.2s",
                        cursor: "pointer"
                      }}
                      title="Present / हजर"
                    >
                      <Check size={24} />
                    </button>

                    {/* Missed Button (Red Cross) */}
                    <button
                      type="button"
                      onClick={() => updateStatus(r.id, "MISSED")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "44px",
                        height: "44px",
                        borderRadius: "var(--radius-md)",
                        border: "2px solid #ef4444",
                        backgroundColor: record.status === "MISSED" ? "#ef4444" : "transparent",
                        color: record.status === "MISSED" ? "white" : "#ef4444",
                        transition: "all 0.2s",
                        cursor: "pointer"
                      }}
                      title="Missed / चुकले"
                    >
                      <X size={24} />
                    </button>

                    {/* On Leave Button (Yellow Alert) */}
                    <button
                      type="button"
                      onClick={() => updateStatus(r.id, "LEAVE")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "44px",
                        height: "44px",
                        borderRadius: "var(--radius-md)",
                        border: "2px solid #eab308",
                        backgroundColor: record.status === "LEAVE" ? "#eab308" : "transparent",
                        color: record.status === "LEAVE" ? "white" : "#eab308",
                        transition: "all 0.2s",
                        cursor: "pointer"
                      }}
                      title="On Leave / रजेवर"
                    >
                      <AlertCircle size={24} />
                    </button>
                  </div>
                </div>

                {/* Missed Reason Input */}
                {record.status === "MISSED" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: "1px dashed rgba(255,255,255,0.05)", paddingTop: "0.75rem" }}>
                    <div>
                      <label className="form-label" style={{ fontSize: "0.875rem" }}>
                        Reason for Missed / अनुपस्थितीचे कारण
                      </label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={record.reason} 
                        onChange={e => updateReason(r.id, e.target.value)} 
                        placeholder="उदा. सर्दी, ताप, कणकण किंवा Duty, SIQ"
                        required
                      />
                    </div>
                    {/* Quick Illness Suggestion Chips */}
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>जलद कारण (Quick select):</span>
                      {[
                        "सर्दी, ताप, कणकण",
                        "थंडीताप, अशक्तपणा",
                        "खोकला, ताप",
                        "कंबर दुखी",
                        "घसा दुखी",
                        "दवाखाना / SIQ",
                        "Duty / शासकीय काम"
                      ].map(chip => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => updateReason(r.id, chip)}
                          style={{
                            padding: "0.15rem 0.5rem",
                            fontSize: "0.75rem",
                            borderRadius: "4px",
                            border: "1px solid rgba(255,255,255,0.15)",
                            backgroundColor: record.reason === chip ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.05)",
                            color: record.reason === chip ? "#fca5a5" : "var(--text-muted)",
                            cursor: "pointer"
                          }}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Leave Inputs */}
                {record.status === "LEAVE" && (
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", borderTop: "1px dashed rgba(255,255,255,0.05)", paddingTop: "0.75rem" }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <label className="form-label" style={{ fontSize: "0.875rem" }}>Leave Reason / रजेचे कारण</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={record.reason} 
                        onChange={e => updateReason(r.id, e.target.value)} 
                        placeholder="e.g., Medical Leave, Home Visit"
                        required
                      />
                    </div>
                    <div style={{ width: "200px" }}>
                      <label className="form-label" style={{ fontSize: "0.875rem" }}>Leave End Date / रजेची अंतिम तारीख</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={record.leaveEndDate} 
                        onChange={e => updateLeaveEndDate(r.id, e.target.value)} 
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {!loadingRecords && activeRecruits.length === 0 && (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              {recruits.length === 0 ? (
                "No recruits found in your jurisdiction."
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                  <Stethoscope size={36} style={{ color: "#ef4444" }} />
                  <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "white" }}>
                    तुमच्या कार्यक्षेत्रातील सर्व प्रशिक्षणार्थी आजारी रजेवर आहेत.
                  </div>
                  <div style={{ fontSize: "0.9rem" }}>
                    (All {recruits.length} recruits under your jurisdiction are currently recorded on sick leave for this date.)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ padding: "1rem 2.5rem", fontSize: "1.1rem" }} 
            disabled={loading || loadingRecords || activeRecruits.length === 0}
          >
            <Save size={20} /> {loading ? "Saving..." : "Save Daily Attendance / उपस्थिती जतन करा"}
          </button>
        </div>
      </form>

      {/* SICK LEAVE MODAL - REUSABLE COMPONENT */}
      <RegisterSickLeaveModal
        isOpen={showSickPeriodModal}
        onClose={() => setShowSickPeriodModal(false)}
        onSuccess={loadSavedAttendance}
        recruitsList={recruits}
      />

      {/* Leave Modal */}
      {showLeaveModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: "500px", position: "relative" }}>
            <button onClick={() => setShowLeaveModal(false)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "white", cursor: "pointer" }}>
              <X size={24} />
            </button>
            <h2 className="heading-2">Register Leave / रजा नोंदवा</h2>
            <form onSubmit={handleLeaveSubmit}>
              <div className="form-group">
                <label className="form-label">Recruit / प्रशिक्षणार्थी</label>
                <select name="recruitId" className="form-select" required>
                  <option value="">-- Select --</option>
                  {recruits.map(r => <option key={r.id} value={r.id}>#{r.chestNumber} - {r.name}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">From Date / पासून (तारीख)</label>
                  <input type="date" name="startDate" className="form-input" required defaultValue={date} />
                </div>
                <div className="form-group">
                  <label className="form-label">To Date / पर्यंत (तारीख)</label>
                  <input type="date" name="endDate" className="form-input" required defaultValue={date} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reason / कारण</label>
                <input type="text" name="reason" className="form-input" required placeholder="Medical, Home Visit, etc." />
              </div>
              <button type="submit" className="btn btn-accent" style={{ width: "100%" }} disabled={loading}>
                {loading ? "Registering..." : "Register Leave / रजा नोंदवा"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* District Return Modal */}
      {showDistrictReturnModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: "500px", position: "relative", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
            <button onClick={() => setShowDistrictReturnModal(false)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "white", cursor: "pointer" }}>
              <X size={24} />
            </button>
            <h2 className="heading-2" style={{ color: "#fca5a5", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Target size={24} /> Mark District Return
            </h2>
            <p className="text-muted" style={{ marginBottom: "1.5rem" }}>WARNING: This will permanently mark the recruit as returned to their home district and flag their dossier.</p>
            <form onSubmit={handleDistrictReturnSubmit}>
              <div className="form-group">
                <label className="form-label">Recruit / प्रशिक्षणार्थी</label>
                <select name="recruitId" className="form-select" required style={{ borderColor: "rgba(239, 68, 68, 0.5)" }}>
                  <option value="">-- Select --</option>
                  {recruits.map(r => <option key={r.id} value={r.id}>#{r.chestNumber} - {r.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date of Return / परत पाठवल्याची तारीख</label>
                <input type="date" name="returnDate" className="form-input" required defaultValue={new Date().toISOString().split("T")[0]} style={{ borderColor: "rgba(239, 68, 68, 0.5)" }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", backgroundColor: "var(--error)", borderColor: "var(--error)" }} disabled={loading}>
                {loading ? "Processing..." : "Confirm Return / निश्चित करा"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
