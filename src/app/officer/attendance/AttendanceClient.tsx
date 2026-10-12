"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { submitBulkAttendanceWithLeaves, registerLeave, markDistrictReturn, getAttendanceForDateAndSession, registerSickPeriod } from "@/app/actions/attendance";
import { Save, CalendarRange, X, Target, Check, AlertCircle, Stethoscope, FileText } from "lucide-react";

export default function AttendanceClient({ recruits }: { recruits: any[] }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showSickPeriodModal, setShowSickPeriodModal] = useState(false);
  const [showDistrictReturnModal, setShowDistrictReturnModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [originallySavedIds, setOriginallySavedIds] = useState<Set<string>>(new Set());

  const [sessionType, setSessionType] = useState("MORNING");

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

  useEffect(() => {
    const loadSavedAttendance = async () => {
      setLoadingRecords(true);
      const res = await getAttendanceForDateAndSession(date, sessionType);
      if (res.success && res.attendanceMap) {
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
      setLoadingRecords(false);
    };
    loadSavedAttendance();
  }, [date, sessionType]);

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

    const payload = {
      date,
      sessionType,
      records: recruits
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
      setStatusMsg({ type: "success", text: "Attendance saved successfully! / उपस्थिती यशस्वीरीत्या जतन केली!" });
      // Update originallySavedIds with the ones currently not present (since they are now in the DB)
      const newSavedIds = new Set<string>();
      recruits.forEach(r => {
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
    } else {
      setStatusMsg({ type: "error", text: result.error || "Failed to register leave. / रजा नोंदणी अयशस्वी." });
    }
    setLoading(false);
  };

  const handleSickPeriodSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await registerSickPeriod(formData);
    if (result.success) {
      setShowSickPeriodModal(false);
      setStatusMsg({ type: "success", text: "Sick period registered successfully! / आजारी कालावधी यशस्वीरीत्या नोंदवला गेला!" });
      // Reload attendance for current date & session
      const res = await getAttendanceForDateAndSession(date, sessionType);
      if (res.success && res.attendanceMap) {
        setAttendanceRecords(prev => {
          const updated = { ...prev };
          recruits.forEach(r => {
            const saved = res.attendanceMap[r.id];
            if (saved) {
              updated[r.id] = {
                status: saved.status as "PRESENT" | "MISSED" | "LEAVE",
                reason: saved.reason,
                leaveEndDate: date
              };
            }
          });
          return updated;
        });
      }
    } else {
      setStatusMsg({ type: "error", text: result.error || "Failed to register sick period. / आजारी कालावधी नोंदणी अयशस्वी." });
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Select Date / तारीख:</label>
            <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} style={{ width: "auto" }} />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Session / सत्र:</label>
            <select className="form-select" value={sessionType} onChange={e => setSessionType(e.target.value)} style={{ width: "auto" }}>
              <option value="MORNING">Morning / सकाळ</option>
              <option value="AFTERNOON">Afternoon / दुपार</option>
            </select>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => setShowSickPeriodModal(true)} className="btn btn-outline" style={{ borderColor: "#ef4444", color: "#f87171" }}>
            <Stethoscope size={18} /> Register Sick Period / आजारी कालावधी नोंदवा
          </button>
          <button onClick={() => setShowLeaveModal(true)} className="btn btn-outline" style={{ borderColor: "var(--accent-gold)", color: "var(--accent-gold)" }}>
            <CalendarRange size={18} /> Register Leave / रजा नोंदवा
          </button>
          <Link href="/attendance-viewer" className="btn btn-outline" style={{ borderColor: "#3b82f6", color: "#60a5fa" }}>
            <FileText size={18} /> Sick Report / आजारी कालावधी अहवाल
          </Link>
          <button onClick={() => setShowDistrictReturnModal(true)} className="btn btn-outline" style={{ borderColor: "var(--error)", color: "var(--error)" }}>
            <Target size={18} /> Mark District Return
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`badge ${statusMsg.type === 'success' ? 'badge-success' : 'badge-error'}`} style={{ padding: "1rem", marginBottom: "2rem", fontSize: "1rem", width: "100%" }}>
          {statusMsg.text}
        </div>
      )}

      <form onSubmit={handleBulkSubmit} className="glass-card" style={{ padding: "2rem" }}>
        <h3 className="heading-2" style={{ marginBottom: "1.5rem" }}>Daily Attendance Roster / दैनिक उपस्थिती यादी</h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
          {loadingRecords ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)", fontSize: "1.1rem" }}>
              Loading saved attendance / जतन केलेली उपस्थिती लोड होत आहे...
            </div>
          ) : recruits.map(r => {
            const record = attendanceRecords[r.id] || { status: "PRESENT", reason: "", leaveEndDate: "" };
            return (
              <div key={r.id} style={{ 
                border: "1px solid var(--border)", 
                borderRadius: "var(--radius-md)", 
                padding: "1rem",
                backgroundColor: "rgba(0,0,0,0.15)",
                display: "flex",
                flexDirection: "column",
                gap: "1rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", width: "50px", color: "var(--accent-gold)", fontSize: "1.1rem" }}>#{r.chestNumber}</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "white" }}>{r.name}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>({r.unit})</span>
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
                      title="Present"
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
                      title="Missed"
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
                      title="On Leave"
                    >
                      <AlertCircle size={24} />
                    </button>
                  </div>
                </div>

                {/* Conditional Inputs */}
                {record.status === "MISSED" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: "1px dashed rgba(255,255,255,0.05)", paddingTop: "0.75rem" }}>
                    <div>
                      <label className="form-label" style={{ fontSize: "0.875rem" }}>Reason for Missed / अनुपस्थिती/आजाराचे कारण</label>
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
          })
          }

          {!loadingRecords && recruits.length === 0 && (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              No recruits found in your range.
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-primary" style={{ padding: "1rem 2.5rem", fontSize: "1.1rem" }} disabled={loading}>
            <Save size={20} /> {loading ? "Saving..." : "Save Daily Attendance / उपस्थिती जतन करा"}
          </button>
        </div>
      </form>

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
                  {recruits.map(r => <option key={r.id} value={r.id}>{r.chestNumber} - {r.name}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">From Date / पासून (तारीख)</label>
                  <input type="date" name="startDate" className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">To Date / पर्यंत (तारीख)</label>
                  <input type="date" name="endDate" className="form-input" required />
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

      {/* Sick Period Modal */}
      {showSickPeriodModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: "520px", position: "relative", border: "1px solid rgba(239,68,68,0.4)" }}>
            <button onClick={() => setShowSickPeriodModal(false)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "white", cursor: "pointer" }}>
              <X size={24} />
            </button>
            <h2 className="heading-2" style={{ color: "#fca5a5", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Stethoscope size={24} /> Register Sick Period / आजारी कालावधी नोंदवा
            </h2>
            <p className="text-muted" style={{ marginBottom: "1.25rem", fontSize: "0.85rem" }}>
              प्रशिक्षणार्थी आजारी असल्यास या तारखेपासून ते या तारखेपर्यंतचा आजारी कालावधी नोंदवा.
            </p>
            <form onSubmit={handleSickPeriodSubmit}>
              <div className="form-group">
                <label className="form-label">Recruit / प्रशिक्षणार्थी</label>
                <select name="recruitId" className="form-select" required>
                  <option value="">-- निवडा (Select Recruit) --</option>
                  {recruits.map(r => <option key={r.id} value={r.id}>#{r.chestNumber} - {r.name} ({r.unit})</option>)}
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">या तारखेपासून (From Date)</label>
                  <input type="date" name="startDate" className="form-input" required defaultValue={date} />
                </div>
                <div className="form-group">
                  <label className="form-label">ते या तारखेपर्यंत (To Date)</label>
                  <input type="date" name="endDate" className="form-input" required defaultValue={date} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">चुकणारे सत्र (Sessions Affected)</label>
                <select name="sessionScope" className="form-select" defaultValue="BOTH">
                  <option value="BOTH">दोन्ही सत्रे / Both (सकाळ व दुपार)</option>
                  <option value="MORNING">फक्त सकाळ सत्र / Morning Only</option>
                  <option value="AFTERNOON">फक्त दुपार सत्र / Afternoon Only</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">आजारपण / कारण (Illness Reason)</label>
                <input 
                  type="text" 
                  name="reason" 
                  id="sickReasonInput"
                  className="form-input" 
                  required 
                  placeholder="उदा. सर्दी, ताप, खोकला, कंबर दुखी, SIQ" 
                  defaultValue="सर्दी, ताप, कणकण"
                />
                <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
                  {[
                    "सर्दी, ताप, कणकण",
                    "थंडीताप, अशक्तपणा",
                    "खोकला, ताप",
                    "कंबर दुखी",
                    "घसा दुखी",
                    "दवाखाना / SIQ"
                  ].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        const inp = document.getElementById("sickReasonInput") as HTMLInputElement;
                        if (inp) inp.value = s;
                      }}
                      style={{
                        padding: "0.15rem 0.45rem",
                        fontSize: "0.75rem",
                        borderRadius: "3px",
                        border: "1px solid rgba(255,255,255,0.15)",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        color: "var(--text-muted)",
                        cursor: "pointer"
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", backgroundColor: "var(--error)", borderColor: "var(--error)" }} disabled={loading}>
                <Stethoscope size={18} /> {loading ? "नोंदवत आहे..." : "आजारी कालावधी नोंदवा / Save Sick Period"}
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
                  {recruits.map(r => <option key={r.id} value={r.id}>{r.chestNumber} - {r.name}</option>)}
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
