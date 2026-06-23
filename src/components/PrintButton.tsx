"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="btn btn-primary print-hidden"
      style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
    >
      <Printer size={18} /> Export / Print to PDF
    </button>
  );
}
