"use client";

import { useState, useEffect } from "react";
import { X, Stethoscope, Calendar, AlertCircle, CheckCircle, Search, Clock } from "lucide-react";
import { registerSickLeave, getAllRecruitsForSickLeave } from "@/app/actions/attendance";

interface RecruitOption {
  id: string;
  name: string;
  chestNumber: string;
  unit: string;
  squadNumber?: string | null;
}

interface RegisterSickLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedRecruitId?: string;
  recruitsList?: RecruitOption[];
}

export default function RegisterSickLeaveModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedRecruitId,
  recruitsList
}: RegisterSickLeaveModalProps) {
  const [recruits, setRecruits] = useState<RecruitOption[]>(recruitsList || []);
  const [loadingRecruits, setLoadingRecruits] = useState(false);
  const [selectedRecruitId, setSelectedRecruitId] = useState(preselectedRecruitId || "");
  const [recruitSearch, setRecruitSearch] = useState("");
  
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [sessionScope, setSessionScope] = useState<"BOTH" | "MORNING" | "AFTERNOON">("BOTH");
  const [reason, setReason] = useState("सर्दी, ताप, कणकण");
  
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (preselectedRecruitId) {
      setSelectedRecruitId(preselectedRecruitId);
    }
  }, [preselectedRecruitId]);

  useEffect(() => {
    if (isOpen && (!recruitsList || recruitsList.length === 0)) {
      setLoadingRecruits(true);
      getAllRecruitsForSickLeave().then(res => {
        if (res.success && res.recruits) {
          setRecruits(res.recruits);
        }
        setLoadingRecruits(false);
      });
    }
  }, [isOpen, recruitsList]);

  if (!isOpen) return null;

  const quickReasonChips = [
    "सर्दी, ताप, कणकण",
    "थंडीताप, अशक्तपणा",
    "कंबर दुखी",
    "घसा दुखी, खोकला",
    "SIQ (Sick in Quarters)",
    "पोलीस रुग्णालय (Hospital)",
    "अंगदुखी / डोकेदुखी",
    "अपघात / दुखापत (Injury)"
  ];

  const filteredRecruits = recruits.filter(r => {
    if (!recruitSearch.trim()) return true;
    const q = recruitSearch.toLowerCase();
    return (
      r.chestNumber.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.unit.toLowerCase().includes(q) ||
      (r.squadNumber && r.squadNumber.toLowerCase().includes(q))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecruitId) {
      setStatusMsg({ type: "error", text: "कृपया प्रशिक्षणार्थी निवडा (Please choose a recruit)." });
      return;
    }

    if (startDate > endDate) {
      setStatusMsg({ type: "error", text: "सुरू तारीख शेवटच्या तारखेनंतर असू शकत नाही (Start date cannot be after end date)." });
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);

    const formData = new FormData();
    formData.append("recruitId", selectedRecruitId);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    formData.append("reason", reason);
    formData.append("sessionScope", sessionScope);

    const res = await registerSickLeave(formData);
    setSubmitting(false);

    if (res.success) {
      setStatusMsg({
        type: "success",
        text: "आजारी रजा यशस्वीरित्या नोंदवली गेली! सदर प्रशिक्षणार्थीच्या अहवालामध्ये नोंद अद्ययावत झाली आहे. (Sick leave recorded successfully!)"
      });
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setStatusMsg(null);
      }, 1200);
    } else {
      setStatusMsg({
        type: "error",
        text: res.error || "आजारी रजा नोंदवताना त्रुटी आली. (Failed to register sick leave.)"
      });
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.82)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: "1rem"
    }}>
      <div 
        className="glass-card" 
        style={{
          width: "100%",
          maxWidth: "580px",
          position: "relative",
          border: "2px solid rgba(239, 68, 68, 0.45)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
          backgroundColor: "#0f172a",
          padding: "2rem"
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.25rem",
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: "0.25rem"
          }}
          title="बंद करा (Close)"
        >
          <X size={22} />
        </button>

        {/* Modal Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div style={{
            backgroundColor: "rgba(239, 68, 68, 0.2)",
            padding: "0.6rem",
            borderRadius: "50%",
            color: "#ef4444"
          }}>
            <Stethoscope size={24} />
          </div>
          <div>
            <h2 className="heading-2" style={{ margin: 0, fontSize: "1.35rem", color: "#fca5a5" }}>
              आजारी रजा नोंदवा / Register Sick Leave
            </h2>
            <p className="text-muted" style={{ margin: 0, fontSize: "0.85rem" }}>
              या तारखेपासून ते या तारखेपर्यंत आजारी रजा नोंदवून अहवालात समाविष्ट करा
            </p>
          </div>
        </div>

        {/* Status Alerts */}
        {statusMsg && (
          <div style={{
            margin: "1rem 0",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontSize: "0.9rem",
            backgroundColor: statusMsg.type === "success" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
            border: `1px solid ${statusMsg.type === "success" ? "#22c55e" : "#ef4444"}`,
            color: statusMsg.type === "success" ? "#86efac" : "#fca5a5"
          }}>
            {statusMsg.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          
          {/* 1. Recruit Selection */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: "700", display: "flex", justifyContent: "space-between" }}>
              <span>प्रशिक्षणार्थी निवडा (Choose Recruit): <span style={{ color: "var(--error)" }}>*</span></span>
              {recruits.length > 0 && <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>एकूण: {recruits.length}</span>}
            </label>

            {loadingRecruits ? (
              <div style={{ padding: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                प्रशिक्षणार्थी यादी लोड होत आहे...
              </div>
            ) : (
              <>
                {recruits.length > 8 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <Search size={16} color="var(--text-muted)" />
                    <input 
                      type="text" 
                      placeholder="चेस्ट नंबर किंवा नावाने शोधा (Quick filter)..." 
                      className="form-input" 
                      value={recruitSearch} 
                      onChange={e => setRecruitSearch(e.target.value)}
                      style={{ padding: "0.35rem 0.65rem", fontSize: "0.85rem" }}
                    />
                  </div>
                )}

                <select 
                  className="form-select"
                  value={selectedRecruitId}
                  onChange={e => setSelectedRecruitId(e.target.value)}
                  required
                  style={{ fontWeight: "600" }}
                >
                  <option value="">-- प्रशिक्षणार्थी निवडा (Select Recruit) --</option>
                  {filteredRecruits.map(r => (
                    <option key={r.id} value={r.id}>
                      #{r.chestNumber} - {r.name} ({r.unit} {r.squadNumber ? `| Squad ${r.squadNumber}` : ""})
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          {/* 2. From Date to To Date */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: "700" }}>
                या तारखेपासून (From Date): <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <input 
                type="date"
                className="form-input"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) {
                    setEndDate(e.target.value);
                  }
                }}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: "700" }}>
                ते या तारखेपर्यंत (To Date): <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <input 
                type="date"
                className="form-input"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={startDate}
                required
              />
            </div>
          </div>

          {/* 3. Session Scope */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: "700" }}>
              रजेची व्याप्ती / सत्र (Sessions Affected):
            </label>
            <select 
              className="form-select"
              value={sessionScope}
              onChange={e => setSessionScope(e.target.value as any)}
            >
              <option value="BOTH">दोन्ही सत्रे / Both Sessions (सकाळ व दुपार)</option>
              <option value="MORNING">फक्त सकाळ सत्र / Morning Session Only</option>
              <option value="AFTERNOON">फक्त दुपार सत्र / Afternoon Session Only</option>
            </select>
          </div>

          {/* 4. Reason */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: "700" }}>
              आजारपण / रजेचे कारण (Illness / Leave Reason): <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <input 
              type="text"
              className="form-input"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="उदा. सर्दी, ताप, खोकला, कंबर दुखी, SIQ"
              required
            />
            {/* Quick Chips */}
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
              {quickReasonChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(chip)}
                  style={{
                    border: "1px solid rgba(255,255,255,0.15)",
                    backgroundColor: reason === chip ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.05)",
                    color: reason === chip ? "#fca5a5" : "var(--text-muted)",
                    padding: "0.2rem 0.55rem",
                    borderRadius: "4px",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={submitting}
            >
              रद्द करा (Cancel)
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{
                backgroundColor: "#ef4444",
                borderColor: "#ef4444",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontWeight: "700"
              }}
            >
              <Stethoscope size={18} />
              <span>{submitting ? "नोंदवत आहे..." : "आजारी रजा नोंदवा / Submit"}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
