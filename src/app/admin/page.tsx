import { prisma } from "@/lib/prisma";
import { Users, ClipboardList, Target, CalendarOff, Activity } from "lucide-react";
import DashboardCharts from "./DashboardCharts";
import InteractiveRoster from "./InteractiveRoster";
import RecentActivityFeed from "./RecentActivityFeed";

export default async function AdminDashboard() {
  const recruits = await prisma.recruit.findMany({
    orderBy: { chestNumber: "asc" },
    include: {
      evaluations: true,
      attendances: true
    }
  });

  recruits.sort((a, b) => {
    const numA = parseInt(a.chestNumber.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.chestNumber.replace(/\D/g, '')) || 0;
    if (numA !== numB) return numA - numB;
    return a.chestNumber.localeCompare(b.chestNumber);
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
      <h1 className="heading-1">Admin Dashboard / मुख्य पृष्ठ</h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        Overview of all registered recruits and their evaluations. / सर्व नोंदणीकृत प्रशिक्षणार्थी आणि त्यांच्या मूल्यमापनांचा आढावा.
      </p>

      {/* Advanced Metrics Cards */}
      <div className="grid-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "2rem" }}>
        <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.5rem" }}>
          <div style={{ padding: "1rem", backgroundColor: "var(--primary-navy)", borderRadius: "var(--radius-full)", color: "white" }}>
            <Users size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.75rem", fontWeight: "800" }}>{totalRecruits}</h3>
            <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "0" }}>Total Recruits</p>
            <p className="text-muted" style={{ fontSize: "0.75rem", opacity: 0.8 }}>एकूण प्रशिक्षणार्थी</p>
          </div>
        </div>
        
        <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.5rem" }}>
          <div style={{ padding: "1rem", backgroundColor: "rgba(34, 197, 94, 0.2)", borderRadius: "var(--radius-full)", color: "var(--success)" }}>
            <Activity size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--success)" }}>{overallAttendanceRate}%</h3>
            <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "0" }}>Attendance Rate</p>
            <p className="text-muted" style={{ fontSize: "0.75rem", opacity: 0.8 }}>उपस्थिती दर</p>
          </div>
        </div>

        <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.5rem" }}>
          <div style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.2)", borderRadius: "var(--radius-full)", color: "var(--error)" }}>
            <CalendarOff size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--error)" }}>{activeLeavesToday}</h3>
            <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "0" }}>Active Leaves</p>
            <p className="text-muted" style={{ fontSize: "0.75rem", opacity: 0.8 }}>आजच्या रजा</p>
          </div>
        </div>

        <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.5rem" }}>
          <div style={{ padding: "1rem", backgroundColor: "var(--accent-gold)", borderRadius: "var(--radius-full)", color: "#000" }}>
            <Target size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.75rem", fontWeight: "800" }}>{totalEvaluations}</h3>
            <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "0" }}>Evaluations</p>
            <p className="text-muted" style={{ fontSize: "0.75rem", opacity: 0.8 }}>एकूण मूल्यमापने</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
        <div style={{ minWidth: 0 }}>
          <DashboardCharts recruits={recruits} />
        </div>
        <div style={{ minWidth: 0 }}>
          <RecentActivityFeed activities={recentActivities} />
        </div>
      </div>

      <InteractiveRoster recruits={recruits} />
    </div>
  );
}
