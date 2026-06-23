"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { updateOfficer } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function EditOfficerForm({ officer }: { officer: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateOfficer(officer.id, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        router.refresh();
        router.push("/admin/officers");
      }
    });
  };

  return (
    <div className="glass-card" style={{ marginBottom: "2rem" }}>
      {error && (
        <div className="badge badge-error" style={{ padding: "1rem", marginBottom: "1rem", fontSize: "1rem" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="badge" style={{ backgroundColor: "var(--success)", color: "white", padding: "1rem", marginBottom: "1rem", fontSize: "1rem" }}>
          Officer updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid-2">
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input name="fullName" type="text" className="form-input" required defaultValue={officer.fullName || ""} />
        </div>
        
        <div className="form-group">
          <label className="form-label">Username *</label>
          <input name="username" type="text" className="form-input" required defaultValue={officer.username} />
        </div>
        
        <div className="form-group">
          <label className="form-label">Password (Optional)</label>
          <input name="password" type="password" className="form-input" placeholder="Leave blank to keep current password" />
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Min Chest No. *</label>
            <input name="minChestNumber" type="number" min="1" className="form-input" required defaultValue={officer.minChestNumber || ""} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Max Chest No. *</label>
            <input name="maxChestNumber" type="number" min="1" className="form-input" required defaultValue={officer.maxChestNumber || ""} />
          </div>
        </div>

        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
          <button type="submit" className="btn btn-accent" style={{ padding: "0.75rem 2rem" }} disabled={isPending}>
            <Save size={18} /> {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
