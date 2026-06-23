"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, LogIn } from "lucide-react";
import { authenticate } from "@/app/actions";

export default function Home() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await authenticate(null, formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        if (result.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/officer");
        }
      }
    });
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 4rem)" }}>
      <div className="glass-card" style={{ maxWidth: "400px", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <img 
            src="http://www.ptcnanveej-daund.in/wp-content/uploads/2021/07/logo.png" 
            alt="PTC Logo" 
            style={{ width: "100px", height: "auto", margin: "0 auto 1rem", display: "block" }} 
          />
          <h1 className="heading-2" style={{ marginBottom: "0.5rem" }}>System Login</h1>
          <p className="text-muted">
            Enter your credentials to access the Police Training Centre tracking system.
          </p>
        </div>

        {error && (
          <div className="badge badge-error" style={{ padding: "1rem", marginBottom: "1.5rem", fontSize: "0.875rem", display: "block", textAlign: "center" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input 
              id="username"
              name="username" 
              type="text" 
              className="form-input" 
              required 
              placeholder="e.g. admin" 
            />
          </div>

          <div className="form-group" style={{ marginBottom: "2rem" }}>
            <label className="form-label" htmlFor="password">Password</label>
            <input 
              id="password"
              name="password" 
              type="password" 
              className="form-input" 
              required 
              placeholder="••••••••" 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", marginTop: "1rem" }} disabled={isPending}>
            {isPending ? "Logging in..." : "Login to Portal"}
          </button>
        </form>

        <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--border)", textAlign: "center" }}>
          <p className="text-muted" style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
            Are you a new recruit? / तुम्ही नवीन प्रशिक्षणार्थी आहात का?
          </p>
          <Link href="/enroll" className="btn btn-outline" style={{ display: "inline-block", width: "100%" }}>
            Fill Enrollment Form / नोंदणी फॉर्म भरा
          </Link>
        </div>
      </div>
    </div>
  );
}
