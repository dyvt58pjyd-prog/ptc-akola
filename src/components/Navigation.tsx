"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, FileText, UserPlus, ClipboardCheck, Users, ShieldAlert, CalendarOff } from "lucide-react";
import { logout } from "@/app/actions";
import { useTransition } from "react";

export default function Navigation({ role }: { role: string | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
      router.push("/");
    });
  };

  if (!role) return null; // Don't show nav links if not logged in

  return (
    <>
      <nav className="nav-links">
        {role === "ADMIN" && (
          <>
            <Link href="/admin" className="nav-link">
              <LayoutDashboard size={20} />
              <div>
                <div>Admin Dashboard</div>
                <div style={{ fontSize: "0.8em", opacity: 0.7, marginTop: "2px" }}>मुख्य पृष्ठ</div>
              </div>
            </Link>
            <Link href="/admin/batches" className="nav-link">
              <ClipboardCheck size={20} />
              <div>
                <div>Batches</div>
                <div style={{ fontSize: "0.8em", opacity: 0.7, marginTop: "2px" }}>प्रशिक्षण बॅच</div>
              </div>
            </Link>
            <Link href="/directory" className="nav-link">
              <Users size={20} />
              <div>
                <div>Recruit Directory</div>
                <div style={{ fontSize: "0.8em", opacity: 0.7, marginTop: "2px" }}>प्रशिक्षणार्थी यादी</div>
              </div>
            </Link>
            <Link href="/leaves" className="nav-link">
              <CalendarOff size={20} />
              <div>
                <div>Leave Register</div>
                <div style={{ fontSize: "0.8em", opacity: 0.7, marginTop: "2px" }}>रजा नोंदवही</div>
              </div>
            </Link>
            <Link href="/summary" className="nav-link">
              <FileText size={20} />
              <div>
                <div>Summary</div>
                <div style={{ fontSize: "0.8em", opacity: 0.7, marginTop: "2px" }}>सारांश</div>
              </div>
            </Link>
            <Link href="/admin/register" className="nav-link">
              <UserPlus size={20} />
              <div>
                <div>Register Recruit</div>
                <div style={{ fontSize: "0.8em", opacity: 0.7, marginTop: "2px" }}>नवीन नोंदणी</div>
              </div>
            </Link>
            <Link href="/admin/officers" className="nav-link">
              <ShieldAlert size={20} />
              <div>
                <div>Manage Officers</div>
                <div style={{ fontSize: "0.8em", opacity: 0.7, marginTop: "2px" }}>अधिकारी व्यवस्थापन</div>
              </div>
            </Link>
          </>
        )}
        {role === "OFFICER" && (
          <>
            <Link href="/officer" className="nav-link">
              <LayoutDashboard size={20} />
              <div>
                <div>Officer Dashboard</div>
                <div style={{ fontSize: "0.8em", opacity: 0.7, marginTop: "2px" }}>अधिकारी डॅशबोर्ड</div>
              </div>
            </Link>
            <Link href="/directory" className="nav-link">
              <Users size={20} />
              <div>
                <div>Recruit Directory</div>
                <div style={{ fontSize: "0.8em", opacity: 0.7, marginTop: "2px" }}>प्रशिक्षणार्थी यादी</div>
              </div>
            </Link>
            <Link href="/leaves" className="nav-link">
              <CalendarOff size={20} />
              <div>
                <div>Leave Register</div>
                <div style={{ fontSize: "0.8em", opacity: 0.7, marginTop: "2px" }}>रजा नोंदवही</div>
              </div>
            </Link>
            <Link href="/summary" className="nav-link">
              <FileText size={20} />
              <div>
                <div>Summary</div>
                <div style={{ fontSize: "0.8em", opacity: 0.7, marginTop: "2px" }}>सारांश</div>
              </div>
            </Link>
            <Link href="/officer/register" className="nav-link">
              <UserPlus size={20} />
              <div>
                <div>Register Recruit</div>
                <div style={{ fontSize: "0.8em", opacity: 0.7, marginTop: "2px" }}>नवीन नोंदणी</div>
              </div>
            </Link>
            <Link href="/officer/evaluate" className="nav-link">
              <ClipboardCheck size={20} />
              <div>
                <div>Evaluate Recruit</div>
                <div style={{ fontSize: "0.8em", opacity: 0.7, marginTop: "2px" }}>मूल्यमापन नोंद</div>
              </div>
            </Link>
            <Link href="/officer/attendance" className="nav-link">
              <ClipboardCheck size={20} />
              <div>
                <div>Daily Attendance</div>
                <div style={{ fontSize: "0.8em", opacity: 0.7, marginTop: "2px" }}>दैनंदिन उपस्थिती</div>
              </div>
            </Link>
          </>
        )}
      </nav>
      
      <div className="nav-footer">
        <button 
          onClick={handleLogout} 
          className="btn btn-outline" 
          style={{ width: "100%", padding: "0.75rem 1rem", fontSize: "0.875rem", backgroundColor: "rgba(255,255,255,0.05)", color: "white", borderColor: "rgba(255,255,255,0.2)", display: "flex", justifyContent: "center" }}
          disabled={isPending}
        >
          <LogOut size={18} /> {isPending ? "Logging out..." : "Logout / लॉगआउट"}
        </button>
      </div>
    </>
  );
}
