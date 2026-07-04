"use client";

import { useEffect, useState } from "react";

export default function AutoPrint({ filename = "report.pdf" }: { filename?: string }) {
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Automatically trigger PDF download when this page loads
    const timer = setTimeout(async () => {
      try {
        setIsDownloading(true);
        // Dynamically import html2pdf
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
          // After download, close the window or go back (Optional, but user can just click back)
        } else {
          window.print();
        }
      } catch (e) {
        console.error("PDF Download failed", e);
        window.print();
      } finally {
        setIsDownloading(false);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [filename]);

  if (isDownloading) {
    return (
      <div className="print-hidden" style={{ position: 'fixed', top: 0, left: 0, width: '100%', padding: '15px', backgroundColor: '#3b82f6', color: 'white', textAlign: 'center', zIndex: 9999, fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        Generating and downloading PDF directly... Please wait.
      </div>
    );
  }

  return null;
}
