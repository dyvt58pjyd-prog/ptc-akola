"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="nav-item"
      style={{
        background: "transparent",
        border: "none",
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        color: "inherit",
        fontFamily: "inherit",
        fontSize: "1rem",
        display: "flex",
        alignItems: "center"
      }}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {theme === "dark" ? (
        <>
          <Sun size={20} />
          <span className="nav-text">Light Mode</span>
        </>
      ) : (
        <>
          <Moon size={20} />
          <span className="nav-text">Dark Mode</span>
        </>
      )}
    </button>
  );
}
