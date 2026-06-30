import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Calendar, Save, CheckCircle, XCircle } from "lucide-react";
import { createBatch, toggleBatchStatus } from "@/app/actions";
import DeleteBatchButton from "@/components/DeleteBatchButton";

export default async function BatchesAdminPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "OFFICER")) {
    redirect("/");
  }

  const batches = await prisma.batch.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { recruits: true } } }
  });

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 className="heading-1">Training Batches</h1>
          <h2 className="heading-2" style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
            प्रशिक्षण बॅच व्यवस्थापन
          </h2>
        </div>
      </div>

      <div className="grid-3" style={{ alignItems: "start" }}>
        
        {/* Create Form */}
        <div className="glass-card">
          <h3 className="heading-2" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Calendar size={20} color="var(--accent-gold)" /> Create New Batch
          </h3>
          <form action={async (formData) => {
            "use server";
            await createBatch(formData);
          }}>
            <div className="form-group">
              <label className="form-label">Batch Name / बॅचचे नाव *</label>
              <input type="text" name="name" className="form-input" required placeholder="e.g. Batch 142" />
            </div>
            <div className="form-group">
              <label className="form-label">Start Date / प्रारंभ तारीख *</label>
              <input type="date" name="startDate" className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">End Date / समाप्ती तारीख *</label>
              <input type="date" name="endDate" className="form-input" required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }}>
              <Save size={18} /> Save Batch / जतन करा
            </button>
          </form>
        </div>

        {/* Existing Batches List */}
        <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3 className="heading-2">Existing Batches</h3>
          {batches.length === 0 ? (
            <div className="glass-card" style={{ textAlign: "center", padding: "3rem" }}>
              <p className="text-muted">No batches found. Create one to get started.</p>
            </div>
          ) : (
            batches.map(batch => (
              <div key={batch.id} className="glass-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem" }}>
                <div>
                  <h4 style={{ fontSize: "1.25rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    {batch.name}
                    {batch.isActive ? (
                      <span className="badge badge-success" style={{ fontSize: "0.75rem" }}>Active</span>
                    ) : (
                      <span className="badge badge-error" style={{ fontSize: "0.75rem" }}>Completed</span>
                    )}
                  </h4>
                  <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                    {batch.startDate.toLocaleDateString('en-GB')} - {batch.endDate.toLocaleDateString('en-GB')}
                  </div>
                  <div style={{ fontSize: "0.875rem", marginTop: "0.5rem", color: "var(--accent-blue)" }}>
                    Recruits: {batch._count.recruits}
                  </div>
                </div>
                
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <form action={async () => {
                    "use server";
                    await toggleBatchStatus(batch.id, batch.isActive);
                  }}>
                    <button type="submit" className={`btn ${batch.isActive ? "btn-outline" : "btn-primary"}`} style={{ padding: "0.5rem 1rem" }}>
                      {batch.isActive ? (
                        <><XCircle size={16} /> Mark Completed</>
                      ) : (
                        <><CheckCircle size={16} /> Mark Active</>
                      )}
                    </button>
                  </form>
                  <DeleteBatchButton batchId={batch.id} batchName={batch.name} />
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
