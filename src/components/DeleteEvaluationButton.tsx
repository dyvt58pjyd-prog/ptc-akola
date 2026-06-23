"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteEvaluation } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function DeleteEvaluationButton({ evaluationId }: { evaluationId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this evaluation? This action cannot be undone.")) {
      setIsDeleting(true);
      const result = await deleteEvaluation(evaluationId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to delete evaluation.");
        setIsDeleting(false);
      }
    }
  };

  return (
    <button 
      onClick={handleDelete} 
      disabled={isDeleting}
      style={{ 
        background: "transparent", 
        border: "none", 
        color: "var(--error)", 
        cursor: isDeleting ? "wait" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.5rem",
        borderRadius: "var(--radius-md)",
        opacity: isDeleting ? 0.5 : 0.8,
        transition: "all 0.2s ease"
      }}
      title="Delete Evaluation"
      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)"; e.currentTarget.style.opacity = "1"; }}
      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.opacity = "0.8"; }}
    >
      <Trash2 size={18} />
    </button>
  );
}
