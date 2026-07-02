"use client";

import { useState, useRef } from "react";
import { Download, Upload, FileJson, FileSpreadsheet, AlertTriangle, CheckCircle } from "lucide-react";

export default function BackupManager() {
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJson = async () => {
    setIsExportingJson(true);
    setStatusMessage({ type: 'info', text: 'Generating database backup...' });
    
    try {
      const response = await fetch('/api/backup/export-json');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      // Get filename from header if possible
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `ptc_akola_backup_${new Date().toISOString().split('T')[0]}.json`;
      if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
        filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      setStatusMessage({ type: 'success', text: 'Database backup downloaded successfully.' });
    } catch (error) {
      console.error(error);
      setStatusMessage({ type: 'error', text: 'Failed to export backup.' });
    } finally {
      setIsExportingJson(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    setStatusMessage({ type: 'info', text: 'Generating Excel report with photos...' });
    
    try {
      const response = await fetch('/api/backup/export-excel');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `ptc_akola_recruits_${new Date().toISOString().split('T')[0]}.xlsx`;
      if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
        filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      setStatusMessage({ type: 'success', text: 'Excel report downloaded successfully.' });
    } catch (error) {
      console.error(error);
      setStatusMessage({ type: 'error', text: 'Failed to generate Excel report.' });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("Are you sure you want to restore this backup? Existing data will be updated and missing data will be added safely (Upsert).")) {
      e.target.value = ''; // Reset input
      return;
    }

    setIsRestoring(true);
    setStatusMessage({ type: 'info', text: 'Restoring data. Please do not close the window...' });

    try {
      const fileText = await file.text();
      const backupData = JSON.parse(fileText);

      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backupData),
      });

      const result = await response.json();

      if (response.ok) {
        setStatusMessage({ type: 'success', text: 'Backup restored successfully! Please refresh the page.' });
      } else {
        throw new Error(result.error || 'Restore failed');
      }
    } catch (error: any) {
      console.error(error);
      setStatusMessage({ type: 'error', text: error.message || 'Failed to restore backup file. Make sure it is a valid backup.' });
    } finally {
      setIsRestoring(false);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="glass-card" style={{ padding: "2rem", marginBottom: "2rem", backgroundColor: "rgba(15, 23, 42, 0.6)" }}>
      <h2 className="heading-2" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        Data Management & Backups
      </h2>
      
      {statusMessage && (
        <div style={{ 
          padding: "1rem", 
          marginBottom: "1.5rem", 
          borderRadius: "var(--radius-md)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          backgroundColor: statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 
                           statusMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 
                           'rgba(59, 130, 246, 0.1)',
          color: statusMessage.type === 'error' ? 'var(--error)' : 
                 statusMessage.type === 'success' ? 'var(--success)' : 
                 'var(--accent-blue)',
          border: `1px solid ${statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 
                             statusMessage.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 
                             'rgba(59, 130, 246, 0.2)'}`
        }}>
          {statusMessage.type === 'error' ? <AlertTriangle size={20} /> : 
           statusMessage.type === 'success' ? <CheckCircle size={20} /> : 
           <div className="spinner" style={{ width: "20px", height: "20px", borderWidth: "2px" }}></div>}
          <span style={{ fontWeight: 500 }}>{statusMessage.text}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        
        {/* Export JSON */}
        <div style={{ padding: "1.5rem", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ padding: "0.75rem", backgroundColor: "rgba(59, 130, 246, 0.1)", color: "var(--accent-blue)", borderRadius: "var(--radius-md)" }}>
              <FileJson size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.25rem" }}>System Backup (.json)</h3>
              <p className="text-muted" style={{ fontSize: "0.85rem", margin: 0 }}>Raw database export for restoring</p>
            </div>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleExportJson} 
            disabled={isExportingJson}
            style={{ width: "100%", display: "flex", justifyContent: "center", gap: "0.5rem" }}
          >
            {isExportingJson ? "Generating..." : <><Download size={18} /> Download Backup</>}
          </button>
        </div>

        {/* Export Excel */}
        <div style={{ padding: "1.5rem", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ padding: "0.75rem", backgroundColor: "rgba(34, 197, 94, 0.1)", color: "var(--success)", borderRadius: "var(--radius-md)" }}>
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.25rem" }}>Recruits Report (.xlsx)</h3>
              <p className="text-muted" style={{ fontSize: "0.85rem", margin: 0 }}>Formatted Excel sheet with photos</p>
            </div>
          </div>
          <button 
            className="btn btn-outline" 
            onClick={handleExportExcel} 
            disabled={isExportingExcel}
            style={{ width: "100%", display: "flex", justifyContent: "center", gap: "0.5rem", borderColor: "var(--success)", color: "var(--success)" }}
          >
            {isExportingExcel ? "Generating..." : <><Download size={18} /> Download Excel Report</>}
          </button>
        </div>

        {/* Import Backup */}
        <div style={{ padding: "1.5rem", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ padding: "0.75rem", backgroundColor: "rgba(234, 179, 8, 0.1)", color: "var(--accent-gold)", borderRadius: "var(--radius-md)" }}>
              <Upload size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.25rem" }}>Restore / Import Data</h3>
              <p className="text-muted" style={{ fontSize: "0.85rem", margin: 0 }}>Safely merge a backup.json file</p>
            </div>
          </div>
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            style={{ display: "none" }} 
            onChange={handleImport}
          />
          <button 
            className="btn btn-outline" 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isRestoring}
            style={{ width: "100%", display: "flex", justifyContent: "center", gap: "0.5rem", borderColor: "var(--accent-gold)", color: "var(--accent-gold)" }}
          >
            {isRestoring ? "Restoring..." : <><Upload size={18} /> Upload Backup File</>}
          </button>
        </div>

      </div>
    </div>
  );
}
