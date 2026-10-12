"use client";

import { useState } from "react";
import { Stethoscope } from "lucide-react";
import RegisterSickLeaveModal from "./RegisterSickLeaveModal";

interface RegisterSickLeaveButtonProps {
  recruit: {
    id: string;
    name: string;
    chestNumber: string;
    unit: string;
    squadNumber?: string | null;
  };
}

export default function RegisterSickLeaveButton({ recruit }: RegisterSickLeaveButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          border: "1px solid rgba(239, 68, 68, 0.4)",
          color: "#fca5a5",
          padding: "0.45rem 0.9rem",
          borderRadius: "var(--radius-md)",
          fontSize: "0.85rem",
          fontWeight: "700",
          cursor: "pointer",
          transition: "all 0.15s"
        }}
      >
        <Stethoscope size={16} />
        <span>+ आजारी रजा नोंदवा / Add Sick Leave</span>
      </button>

      <RegisterSickLeaveModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        preselectedRecruitId={recruit.id}
        recruitsList={[recruit]}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </>
  );
}
