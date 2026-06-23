"use client";

import { useState } from "react";
import { submitBulkAttendance, registerLeave, markDistrictReturn } from "@/app/actions/attendance";
import { Save, CalendarRange, X, Target } from "lucide-react";

export default function AttendanceClient({ recruits }: { recruits: any[] }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDistrictReturnModal, setShowDistrictReturnModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  // Multi-select state
  const [selectedRecruits, setSelectedRecruits] = useState<Set<string>>(new Set());
  
  // Status payload state
  const [sessionType, setSessionType] = useState("MORNING");
  const [status, setStatus] = useState("PRESENT");
  const [reason, setReason] = useState("");

  const handleSelectAll = () => {
    if (selectedRecruits.size === recruits.length) {
      setSelectedRecruits(new Set());
    } else {
      setSelectedRecruits(new Set(recruits.map(r => r.id)));
    }
  };

  const toggleRecruit = (id: string) => {
    const newSet = new Set(selectedRecruits);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRecruits(newSet);
  };

  const handleBulkSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedRecruits.size === 0) {
      setStatusMsg({ type: "error", text: "Please select at least one recruit. / कृपया किमान एक प्रशिक्षणार्थी निवडा." });
      return;
    }
    
    setLoading(true);
    setStatusMsg(null);
    
    const formData = new FormData();
    formData.append("date", date);
    formData.append("sessionType", sessionType);
    formData.append("status", status);
    formData.append("reason", reason);
    
    selectedRecruits.forEach(id => {
      formData.append("recruitId", id);
    });

    const result = await submitBulkAttendance(formData);
    if (result.success) {
      setStatusMsg({ type: "success", text: "Attendance saved successfully! / उपस्थिती यशस्वीरीत्या जतन केली!" });
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Select Date / तारीख निवडा:</label>
          <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} style={{ width: "auto" }} />
        </div>
        
        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={() => setShowLeaveModal(true)} className="btn btn-outline" style={{ borderColor: "var(--accent-gold)", color: "var(--accent-gold)" }}>
            <CalendarRange size={20} /> Register Leave / रजा नोंदवा
          </button>
          <button onClick={() => setShowDistrictReturnModal(true)} className="btn btn-outline" style={{ borderColor: "var(--error)", color: "var(--error)" }}>
            <Target size={20} /> Mark District Return / जिल्ह्यात परत पाठवा
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`badge ${statusMsg.type === 'success' ? 'badge-success' : 'badge-error'}`} style={{ padding: "1rem", marginBottom: "2rem", fontSize: "1rem", width: "100%" }}>
          {statusMsg.text}
        </div>
      )}

      <form onSubmit={handleBulkSubmit} className="glass-card" style={{ padding: "2rem" }}>
        
        <div className="form-group" style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <label className="form-label" style={{ margin: 0 }}>Select Recruits / प्रशिक्षणार्थी निवडा *</label>
            <button type="button" onClick={handleSelectAll} className="btn btn-outline" style={{ padding: "0.25rem 0.75rem", fontSize: "0.875rem" }}>
              {selectedRecruits.size === recruits.length ? "Deselect All" : "Select All"}
            </button>
          </div>
          
          <div style={{ 
            border: "1px solid var(--border)", 
            borderRadius: "var(--radius-md)", 
            maxHeight: "300px", 
            overflowY: "auto",
            backgroundColor: "rgba(0,0,0,0.2)"
          }}>
            {recruits.map(r => (
              <label key={r.id} style={{ 
                display: "flex", 
                alignItems: "center", 
                padding: "1rem", 
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                cursor: "pointer",
                backgroundColor: selectedRecruits.has(r.id) ? "rgba(var(--accent-blue-rgb), 0.1)" : "transparent",
                transition: "all 0.2s"
              }}>
                <input 
                  type="checkbox" 
                  checked={selectedRecruits.has(r.id)}
                  onChange={() => toggleRecruit(r.id)}
                  style={{ marginRight: "1rem", transform: "scale(1.2)", accentColor: "var(--accent-blue)" }}
                />
                <div style={{ display: "flex", gap: "1rem", flex: 1 }}>
                  <span style={{ fontWeight: "bold", width: "50px", color: "var(--accent-gold)" }}>#{r.chestNumber}</span>
                  <span>{r.name}</span>
                  <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: "0.875rem" }}>{r.unit}</span>
                </div>
              </label>
            ))}
            {recruits.length === 0 && (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                No recruits found in your assigned range.
              </div>
            )}
          </div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
            {selectedRecruits.size} recruit(s) selected
          </div>
        </div>

        <hr style={{ border: "0", borderTop: "1px solid var(--border)", margin: "2rem 0" }} />

        <h3 className="heading-2" style={{ marginBottom: "1.5rem" }}>Set Attendance Status</h3>
        
        <div className="grid-3" style={{ alignItems: "start" }}>
          
          <div className="form-group" style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <label className="form-label" style={{ color: "var(--accent-gold)" }}>Session Type / सत्र</label>
            <select className="form-select" value={sessionType} onChange={e => setSessionType(e.target.value)}>
              <option value="MORNING">Morning / सकाळ</option>
              <option value="AFTERNOON">Afternoon / दुपार</option>
            </select>
          </div>

          <div className="form-group" style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border)", gridColumn: "span 2" }}>
            <label className="form-label">Status / उपस्थिती</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value)} style={{ marginBottom: "1rem" }}>
              <option value="PRESENT">Present / हजर</option>
              <option value="MISSED">Missed / चुकले</option>
              <option value="LEAVE">On Leave / रजेवर</option>
            </select>
            {status === "MISSED" && (
              <>
                <label className="form-label">Reason / कारण</label>
                <input type="text" className="form-input" placeholder="Reason for missing..." value={reason} onChange={e => setReason(e.target.value)} />
              </>
            )}
          </div>

        </div>

        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-primary" style={{ padding: "1rem 2.5rem", fontSize: "1.1rem" }} disabled={loading}>
            <Save size={20} /> {loading ? "Saving..." : "Save Session Attendance / उपस्थिती जतन करा"}
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
