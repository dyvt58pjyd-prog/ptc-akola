import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { UserPlus, ClipboardCheck, Users, Target, CalendarOff, Activity } from "lucide-react";
import DashboardCharts from "../admin/DashboardCharts";
import InteractiveRoster from "../admin/InteractiveRoster";
import RecentActivityFeed from "../admin/RecentActivityFeed";

export default async function OfficerDashboard() {
  const recruits = await prisma.recruit.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      evaluations: true,
      attendances: true
    }
  });

  // Calculate top metrics
  const totalRecruits = recruits.length;
  
  let totalEvaluations = 0;
  let totalSessions = 0;
  let presentSessions = 0;
  let activeLeavesToday = 0;
  
  // Create an activity feed array
  const activities: any[] = [];
  
  const todayStr = new Date().toISOString().split('T')[0];

  recruits.forEach(r => {
    totalEvaluations += r.evaluations.length;
    
    // Process attendances for metrics & activity feed
    r.attendances.forEach(a => {
      // Metrics
      totalSessions += 2; // morning + afternoon
      if (a.morningStatus === "PRESENT") presentSessions++;
      if (a.afternoonStatus === "PRESENT") presentSessions++;
      
      const attDateStr = new Date(a.date).toISOString().split('T')[0];
      if (attDateStr === todayStr && (a.morningStatus === "LEAVE" || a.afternoonStatus === "LEAVE")) {
        activeLeavesToday++;
      }
      
      // Activity
      activities.push({
        type: "ATTENDANCE",
        date: new Date(a.date),
        dateLabel: new Date(a.date).toLocaleDateString('en-GB'),
        recruitName: r.name,
        chestNumber: r.chestNumber
      });
    });
    
    // Process evaluations for activity feed
    r.evaluations.forEach(e => {
      activities.push({
        type: "EVALUATION",
        date: new Date(e.createdAt || new Date()), // fallback to now if missing
        dateLabel: `Week ${e.week}`,
        recruitName: r.name,
        chestNumber: r.chestNumber
      });
    });
  });

  // Sort activities by date desc
  activities.sort((a, b) => b.date.getTime() - a.date.getTime());
  const recentActivities = activities.slice(0, 5);

  const overallAttendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

  return (
    <div>
      <h1 className="heading-1">Officer Dashboard / अधिकारी डॅशबोर्ड</h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        Manage recruit registration, conduct training evaluations, and monitor academy analytics. / प्रशिक्षणार्थी नोंदणी व्यवस्थापित करा, प्रशिक्षण मूल्यमापन करा आणि अकादमीच्या आकडेवारीवर लक्ष ठेवा.
      </p>

      {/* Quick Actions */}
      <div className="grid-2" style={{ marginBottom: "2rem" }}>
        <Link href="/officer/register" style={{ textDecoration: "none" }}>
          <div className="glass-card action-card" style={{ display: "flex", alignItems: "center", gap: "1.5rem", padding: "1.5rem", transition: "all 0.3s ease" }}>
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: "60px", height: "60px", backgroundColor: "rgba(234, 179, 8, 0.1)", color: "var(--accent-gold)", borderRadius: "var(--radius-full)" }}>
              <UserPlus size={32} />
            </div>
            <div>
              <h2 className="heading-2" style={{ marginBottom: "0.25rem", color: "white" }}>Register Recruit / नवीन नोंदणी</h2>
              <p className="text-muted" style={{ margin: 0, fontSize: "0.9rem" }}>Enroll a new recruit into the system / प्रणालीमध्ये नवीन प्रशिक्षणार्थीची नोंदणी करा</p>
            </div>
          </div>
        </Link>

        <Link href="/officer/evaluate" style={{ textDecoration: "none" }}>
          <div className="glass-card action-card" style={{ display: "flex", alignItems: "center", gap: "1.5rem", padding: "1.5rem", transition: "all 0.3s ease" }}>
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: "60px", height: "60px", backgroundColor: "rgba(59, 130, 246, 0.1)", color: "var(--accent-blue)", borderRadius: "var(--radius-full)" }}>
              <ClipboardCheck size={32} />
            </div>
            <div>
              <h2 className="heading-2" style={{ marginBottom: "0.25rem", color: "white" }}>Evaluate / उपस्थिती</h2>
              <p className="text-muted" style={{ margin: 0, fontSize: "0.9rem" }}>Record daily attendance or evaluations / दैनंदिन उपस्थिती किंवा मूल्यमापनाची नोंद करा</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Advanced Metrics Cards */}
      <div className="grid-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "2rem" }}>
        <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.5rem" }}>
          <div style={{ padding: "1rem", backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-full)", color: "white" }}>
            <Users size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.75rem", fontWeight: "800", color: "white" }}>{totalRecruits}</h3>
            <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "0" }}>Total Recruits</p>
            <p className="text-muted" style={{ fontSize: "0.75rem", opacity: 0.8 }}>एकूण प्रशिक्षणार्थी</p>
          </div>
        </div>
        
        <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.5rem" }}>
          <div style={{ padding: "1rem", backgroundColor: "rgba(34, 197, 94, 0.1)", borderRadius: "var(--radius-full)", color: "var(--success)" }}>
            <Activity size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--success)" }}>{overallAttendanceRate}%</h3>
            <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "0" }}>Attendance Rate</p>
            <p className="text-muted" style={{ fontSize: "0.75rem", opacity: 0.8 }}>उपस्थिती दर</p>
          </div>
        </div>

        <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.5rem" }}>
          <div style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-full)", color: "var(--error)" }}>
            <CalendarOff size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--error)" }}>{activeLeavesToday}</h3>
            <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "0" }}>Active Leaves</p>
            <p className="text-muted" style={{ fontSize: "0.75rem", opacity: 0.8 }}>आजच्या रजा</p>
          </div>
        </div>

        <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.5rem" }}>
          <div style={{ padding: "1rem", backgroundColor: "rgba(251, 191, 36, 0.1)", borderRadius: "var(--radius-full)", color: "var(--accent-gold)" }}>
            <Target size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.75rem", fontWeight: "800", color: "white" }}>{totalEvaluations}</h3>
            <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "0" }}>Evaluations</p>
            <p className="text-muted" style={{ fontSize: "0.75rem", opacity: 0.8 }}>एकूण मूल्यमापने</p>
          </div>
        </div>
      </div>

      {/* Analytics and Activity Feed */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
        <div style={{ minWidth: 0 }}>
          <DashboardCharts recruits={recruits} />
        </div>
        <div style={{ minWidth: 0 }}>
          <RecentActivityFeed activities={recentActivities} />
        </div>
      </div>

      {/* Roster */}
      <InteractiveRoster recruits={recruits} />
    </div>
  );
}
