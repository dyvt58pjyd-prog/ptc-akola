"use client";

export default function ManualPrintButton() {
  return (
    <div className="print-hidden" style={{ textAlign: "center", marginBottom: "20px" }}>
      <button 
        onClick={() => window.print()} 
        style={{ padding: "10px 20px", backgroundColor: "#1e3a8a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
      >
        Click Here to Print Report
      </button>
    </div>
  );
}
