"use client";

import { useState, useTransition } from "react";
import { UserPlus, Save } from "lucide-react";
import { createOfficer } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function CreateOfficerForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const formElement = e.currentTarget;

    startTransition(async () => {
      const result = await createOfficer(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        formElement.reset();
        router.refresh(); // Refresh to show the new officer in the table below
      }
    });
  };

  return (
    <div className="glass-card" style={{ marginBottom: "2rem" }}>
      <h2 className="heading-2" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <UserPlus size={24} color="var(--primary-navy)" />
        Add New Officer
      </h2>
      
      {error && (
        <div className="badge badge-error" style={{ padding: "1rem", marginBottom: "1rem", fontSize: "1rem" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid-2">
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input name="fullName" type="text" className="form-input" required placeholder="e.g. RSI Anil Bawaskar" />
        </div>
        
        <div className="form-group">
          <label className="form-label">Username *</label>
          <input name="username" type="text" className="form-input" required placeholder="e.g. anil_rsi" />
        </div>
        
        <div className="form-group">
          <label className="form-label">Password *</label>
          <input name="password" type="password" className="form-input" required placeholder="••••••••" />
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Min Chest No. *</label>
            <input name="minChestNumber" type="number" min="1" className="form-input" required placeholder="e.g. 1" />
          </div>
          
          <div className="form-group">
            <label className="form-label">Max Chest No. *</label>
            <input name="maxChestNumber" type="number" min="1" className="form-input" required placeholder="e.g. 300" />
          </div>
        </div>

        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
          <button type="submit" className="btn btn-accent" style={{ padding: "0.75rem 2rem" }} disabled={isPending}>
            <Save size={18} /> {isPending ? "Saving..." : "Create Officer"}
          </button>
        </div>
      </form>
    </div>
  );
}
