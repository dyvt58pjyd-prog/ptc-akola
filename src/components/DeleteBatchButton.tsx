"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteBatch } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function DeleteBatchButton({ batchId, batchName }: { batchId: string, batchName: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm(`Are you sure you want to delete the batch "${batchName}"? All recruits in this batch will be unassigned. This action cannot be undone.`);
    
    if (confirmed) {
      setIsDeleting(true);
      const result = await deleteBatch(batchId);
      
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to delete batch.");
        setIsDeleting(false);
      }
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="btn btn-outline"
      style={{ 
        borderColor: "var(--error)", 
        color: "var(--error)", 
        padding: "0.5rem 1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem"
      }}
      title="Delete Batch"
    >
      <Trash2 size={16} />
      {isDeleting ? "..." : ""}
    </button>
  );
}
