"use client";

import { useEffect, useState } from "react";
import { Shield } from "lucide-react";

export default function SplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Check if splash has already been shown in this session
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    
    if (hasSeenSplash) {
      setShowSplash(false);
      return;
    }

    // Set timeout to start fade out at 2.5 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2500);

    // Set timeout to completely remove splash after 3 seconds
    const removeTimer = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem("hasSeenSplash", "true");
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!showSplash) return null;

  return (
    <div 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "var(--background)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.5s ease-out",
        backgroundImage: "radial-gradient(at 50% 50%, rgba(15, 30, 60, 0.8) 0px, transparent 50%)",
      }}
    >
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center",
          animation: "scaleUp 1s cubic-bezier(0.4, 0, 0.2, 1) forwards"
        }}
      >
        <img
          src="/logo.png"
          alt="Maharashtra Police Training Directorate Logo"
          style={{ 
            width: "150px", 
            height: "150px", 
            objectFit: "contain",
            borderRadius: "50%",
            boxShadow: "0 0 40px rgba(59, 130, 246, 0.3)",
            marginBottom: "2rem"
          }}
          onError={(e) => {
            // Fallback to icon if logo.png doesn't load
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        {/* Fallback icon just in case logo.png fails */}
        <div className="fallback-shield" style={{ display: "none" }}>
          <Shield size={80} color="var(--accent-gold)" />
        </div>
        
        <h1 className="heading-1" style={{ fontSize: "2rem", marginBottom: "0.5rem", textAlign: "center" }}>
          PTC Akola
        </h1>
        <p className="text-muted" style={{ fontSize: "1.1rem", letterSpacing: "2px", textTransform: "uppercase" }}>
          Recruit Training System
        </p>

        {/* Loading spinner */}
        <div style={{ marginTop: "3rem" }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "3px solid var(--border)",
            borderTopColor: "var(--accent-gold)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }} />
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scaleUp {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        img[style*="display: none"] + .fallback-shield {
          display: block !important;
        }
      `}} />
    </div>
  );
}
