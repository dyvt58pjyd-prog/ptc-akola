import { prisma } from "@/lib/prisma";
import { Users, ClipboardList, Target, CalendarOff, Activity } from "lucide-react";
import DashboardCharts from "./DashboardCharts";
import InteractiveRoster from "./InteractiveRoster";
import RecentActivityFeed from "./RecentActivityFeed";
import BackupManager from "@/components/BackupManager";

export default async function AdminDashboard() {
  // Fetch recruits for roster
  const recruits = await prisma.recruit.findMany({
    select: { id: true, name: true, chestNumber: true, homeDistrict: true, unit: true },
    orderBy: { chestNumber: "asc" }
  });

  recruits.sort((a, b) => {
    const numA = parseInt(a.chestNumber.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.chestNumber.replace(/\D/g, '')) || 0;
    if (numA !== numB) return numA - numB;
    return a.chestNumber.localeCompare(b.chestNumber);
  });

  // Calculate metrics
  const totalRecruits = recruits.length;
  const totalEvaluations = await prisma.evaluation.count();
  
  const presentMorning = await prisma.attendance.count({ where: { morningStatus: "PRESENT" } });
  const presentAfternoon = await prisma.attendance.count({ where: { afternoonStatus: "PRESENT" } });
  const presentSessions = presentMorning + presentAfternoon;
  
  const totalMorning = await prisma.attendance.count({ where: { morningStatus: { not: "PENDING" } } });
  const totalAfternoon = await prisma.attendance.count({ where: { afternoonStatus: { not: "PENDING" } } });
  const totalSessions = totalMorning + totalAfternoon;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter.formatToParts(new Date());
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const year = parts.find(p => p.type === 'year')?.value;
  const todayStart = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  const todayEnd = new Date(`${year}-${month}-${day}T23:59:59.999Z`);
  
  const activeLeavesToday = await prisma.attendance.count({
    where: {
      date: { gte: todayStart, lte: todayEnd },
      OR: [ { morningStatus: "LEAVE" }, { afternoonStatus: "LEAVE" } ]
    }
  });

  const overallAttendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

  // Compute unit data
  const unitGroups = await prisma.recruit.groupBy({
    by: ['unit'],
    _count: { _all: true }
  });
  const unitData = unitGroups.map(g => ({ name: g.unit, count: g._count._all }));
  const attendanceData = [
    { name: 'Present', value: presentSessions },
    { name: 'Absent', value: totalSessions - presentSessions }
  ];

  // Fetch recent activity
  const recentAttendances = await prisma.attendance.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { recruit: { select: { name: true, chestNumber: true } } }
  });
  const recentEvaluations = await prisma.evaluation.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { recruit: { select: { name: true, chestNumber: true } } }
  });

  const activities = [
    ...recentAttendances.map(a => ({
      type: "ATTENDANCE",
      date: a.createdAt,
      dateLabel: new Date(a.date).toLocaleDateString('en-GB'),
      recruitName: a.recruit.name,
      chestNumber: a.recruit.chestNumber
    })),
    ...recentEvaluations.map(e => ({
      type: "EVALUATION",
      date: e.createdAt,
      dateLabel: `Week ${e.week}`,
      recruitName: e.recruit.name,
      chestNumber: e.recruit.chestNumber
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
  
  const recentActivities = activities;

  return (
    <div>
      <h1 className="heading-1">Admin Dashboard / मुख्य पृष्ठ</h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        Overview of all registered recruits and their evaluations. / सर्व नोंदणीकृत प्रशिक्षणार्थी आणि त्यांच्या मूल्यमापनांचा आढावा.
      </p>

      {/* Advanced Metrics Cards */}
      <div className="grid-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "2rem" }}>
        <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.5rem" }}>
          <div className="icon-bg-neutral" style={{ padding: "1rem", borderRadius: "var(--radius-full)" }}>
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

      {/* Backup and Data Management */}
      <BackupManager />

      {/* Analytics and Activity Feed */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <DashboardCharts unitData={unitData} attendanceData={attendanceData} />
        </div>
        <div style={{ minWidth: 0 }}>
          <RecentActivityFeed activities={recentActivities} />
        </div>
      </div>

      <InteractiveRoster recruits={recruits} />
    </div>
  );
}
