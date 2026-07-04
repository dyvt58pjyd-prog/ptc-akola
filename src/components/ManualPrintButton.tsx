"use client";

import { useState } from "react";

export default function ManualPrintButton({ filename = "report.pdf" }: { filename?: string }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('report-content');
      
      if (element) {
        const opt: any = {
          margin:       10,
          filename:     filename,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        await html2pdf().set(opt).from(element).save();
      } else {
        window.print();
      }
    } catch (e) {
      console.error("PDF Download failed", e);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="print-hidden" style={{ textAlign: "center", marginBottom: "20px" }}>
      <button 
        onClick={handleDownload} 
        disabled={isDownloading}
        style={{ 
          padding: "10px 20px", 
          backgroundColor: isDownloading ? "#9ca3af" : "#1e3a8a", 
          color: "white", 
          border: "none", 
          borderRadius: "6px", 
          cursor: isDownloading ? "not-allowed" : "pointer", 
          fontWeight: "bold",
          transition: "background-color 0.2s"
        }}
      >
        {isDownloading ? "Downloading PDF..." : "Download PDF Report"}
      </button>
    </div>
  );
}
