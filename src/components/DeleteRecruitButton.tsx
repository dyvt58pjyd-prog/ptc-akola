"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteRecruit } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function DeleteRecruitButton({ recruitId, recruitName }: { recruitId: string, recruitName: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm(`Are you sure you want to permanently delete the recruit record for ${recruitName}? This will also delete ALL associated attendance logs, evaluations, and leaves. This action cannot be undone.`);
    
    if (confirmed) {
      setIsDeleting(true);
      const result = await deleteRecruit(recruitId);
      
      if (result.success) {
        // Redirect to directory after successful deletion
        router.push("/directory");
        router.refresh();
      } else {
        alert(result.error || "Failed to delete recruit.");
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
        fontSize: "0.9rem",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem"
      }}
      title="Delete Recruit Profile"
    >
      <Trash2 size={16} />
      {isDeleting ? "Deleting..." : "Delete / वगळा"}
    </button>
  );
}
