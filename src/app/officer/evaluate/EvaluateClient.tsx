"use client";

import { useState } from "react";
import { Save, CheckCircle } from "lucide-react";
import { submitEvaluation } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function EvaluateClient({ recruits }: { recruits: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedRecruits, setSelectedRecruits] = useState<Set<string>>(new Set());

  const handleSelectAll = () => {
    if (selectedRecruits.size === recruits.length) {
      setSelectedRecruits(new Set()); // Deselect all
    } else {
      setSelectedRecruits(new Set(recruits.map(r => r.id))); // Select all
    }
  };

  const toggleRecruit = (id: string) => {
    const newSet = new Set(selectedRecruits);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRecruits(newSet);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedRecruits.size === 0) {
      setError("Please select at least one recruit. / कृपया किमान एक प्रशिक्षणार्थी निवडा.");
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await submitEvaluation(formData);
    
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || "Failed to submit evaluation.");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="glass-card" style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center", padding: "4rem 2rem" }}>
        <CheckCircle size={64} color="var(--success)" style={{ margin: "0 auto 1.5rem" }} />
        <h1 className="heading-1" style={{ marginBottom: "0.5rem" }}>Evaluation Submitted!</h1>
        <h2 className="heading-2" style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>मूल्यमापन यशस्वीरीत्या जतन केले!</h2>
        <p style={{ marginBottom: "2rem" }}>The training evaluation has been securely recorded.</p>
        <button onClick={() => setSuccess(false)} className="btn btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "1.1rem" }}>
          Submit Another / आणखी एक नोंदवा
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card">
      {error && (
        <div className="badge badge-error" style={{ padding: "1rem", marginBottom: "1rem", fontSize: "1rem" }}>
          {error}
        </div>
      )}

      <div className="form-group">
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
                name="recruitId" 
                value={r.id} 
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

      <h2 className="heading-2" style={{ marginBottom: "1.5rem" }}>Training Evaluation / प्रशिक्षण मूल्यमापन</h2>
      <p className="text-muted" style={{ marginBottom: "1rem" }}>Rate the recruit on various parameters for the specific week. / विशिष्ट आठवड्यासाठी विविध निकषांवर प्रशिक्षणार्थीचे मूल्यमापन करा.</p>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Evaluation Week / मूल्यमापन आठवडा *</label>
          <input name="week" type="week" className="form-input" required />
        </div>

        <div className="form-group">
          <label className="form-label">Instructor Name / प्रशिक्षकाचे नाव</label>
          <input type="text" name="instructorName" className="form-input" placeholder="Name of evaluating instructor..." />
        </div>

        <div className="form-group">
          <label className="form-label">Physical Training / शारीरिक प्रशिक्षण *</label>
          <input type="text" name="physicalTraining" className="form-input" required placeholder="Enter remarks/score..." />
        </div>

        <div className="form-group">
          <label className="form-label">Drills / कवायत *</label>
          <input type="text" name="drills" className="form-input" required placeholder="Enter remarks/score..." />
        </div>

        <div className="form-group">
          <label className="form-label">Weapon Drill / शस्त्र कवायत *</label>
          <input type="text" name="weaponDrill" className="form-input" required placeholder="Enter remarks/score..." />
        </div>

        <div className="form-group">
          <label className="form-label">Weapon Tactics / शस्त्र रणनीती *</label>
          <input type="text" name="weaponTactics" className="form-input" required placeholder="Enter remarks/score..." />
        </div>

        <div className="form-group">
          <label className="form-label">Field Crafts / क्षेत्र कला *</label>
          <input type="text" name="fieldCrafts" className="form-input" required placeholder="Enter remarks/score..." />
        </div>
      </div>

      <div className="form-group" style={{ marginTop: "1rem" }}>
        <label className="form-label">Overall Remarks / एकूण अभिप्राय *</label>
        <textarea name="overallRemarks" className="form-textarea" rows={4} required placeholder="Detailed remarks about the recruit's performance..."></textarea>
      </div>

      <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" className="btn btn-primary" style={{ padding: "1rem 2rem", fontSize: "1.1rem" }} disabled={loading}>
          <Save size={20} /> {loading ? "Submitting..." : "Submit Evaluation / मूल्यमापन जतन करा"}
        </button>
      </div>
    </form>
  );
}
