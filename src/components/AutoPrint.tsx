"use client";

import { useEffect } from "react";

export default function AutoPrint() {
  useEffect(() => {
    // Automatically trigger print dialog when this page loads, with a slight delay
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
