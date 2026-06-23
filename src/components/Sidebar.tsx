"use client";

import { useState } from "react";
import Link from "next/link";
import Navigation from "./Navigation";
import ThemeToggle from "./ThemeToggle";
import { Menu, X } from "lucide-react";

export default function Sidebar({ role }: { role: string | null }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!role) return null;

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Overlay for mobile */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <Link href="/" className="sidebar-brand" onClick={() => setIsOpen(false)}>
          <img
            src="/logo.png"
            alt="Maharashtra Police Training Directorate Logo"
            className="sidebar-logo"
            style={{ borderRadius: "50%" }}
          />
          <span>PTC Akola</span>
        </Link>
        <div style={{ padding: "0 1rem", marginBottom: "1rem", marginTop: "-1rem" }}>
          <ThemeToggle />
        </div>
        <div onClick={() => setIsOpen(false)} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <Navigation role={role} />
        </div>
      </aside>
    </>
  );
}
