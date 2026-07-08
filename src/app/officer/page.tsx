import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { UserPlus, ClipboardCheck, Users, Target, CalendarOff, Activity } from "lucide-react";
import DashboardCharts from "../admin/DashboardCharts";
import InteractiveRoster from "../admin/InteractiveRoster";
import RecentActivityFeed from "../admin/RecentActivityFeed";
import BackupManager from "@/components/BackupManager";
import { getSession } from "@/lib/auth";

export default async function OfficerDashboard() {
  const session = await getSession();
  const officerUser = session ? await prisma.user.findUnique({ where: { id: session.userId } }) : null;

  const allRecruits = await prisma.recruit.findMany({
    select: { id: true, name: true, chestNumber: true, homeDistrict: true, unit: true },
    orderBy: { chestNumber: "asc" }
  });

  let recruits = allRecruits;
  if (officerUser && officerUser.minChestNumber && officerUser.maxChestNumber) {
    recruits = allRecruits.filter(r => {
      const num = parseInt(r.chestNumber.replace(/\D/g, ''));
      return !isNaN(num) && num >= officerUser.minChestNumber! && num <= officerUser.maxChestNumber!;
    });
  }

  recruits.sort((a, b) => {
    const numA = parseInt(a.chestNumber.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.chestNumber.replace(/\D/g, '')) || 0;
    if (numA !== numB) return numA - numB;
    return a.chestNumber.localeCompare(b.chestNumber);
  });

  const recruitIds = recruits.map(r => r.id);

  // Calculate metrics
  const totalRecruits = recruits.length;
  const totalEvaluations = await prisma.evaluation.count({ where: { recruitId: { in: recruitIds } } });
  
  const presentMorning = await prisma.attendance.count({ where: { recruitId: { in: recruitIds }, morningStatus: "PRESENT" } });
  const presentAfternoon = await prisma.attendance.count({ where: { recruitId: { in: recruitIds }, afternoonStatus: "PRESENT" } });
  const presentSessions = presentMorning + presentAfternoon;
  
  const totalMorning = await prisma.attendance.count({ where: { recruitId: { in: recruitIds }, morningStatus: { not: "PENDING" } } });
  const totalAfternoon = await prisma.attendance.count({ where: { recruitId: { in: recruitIds }, afternoonStatus: { not: "PENDING" } } });
  const totalSessions = totalMorning + totalAfternoon;

  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayEnd = new Date();
  todayEnd.setHours(23,59,59,999);
  
  const activeLeavesToday = await prisma.attendance.count({
    where: {
      recruitId: { in: recruitIds },
      date: { gte: todayStart, lte: todayEnd },
      OR: [ { morningStatus: "LEAVE" }, { afternoonStatus: "LEAVE" } ]
    }
  });

  const overallAttendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

  // Compute unit data
  const unitCounts: Record<string, number> = {};
  recruits.forEach(r => {
    unitCounts[r.unit] = (unitCounts[r.unit] || 0) + 1;
  });
  const unitData = Object.keys(unitCounts).map(d => ({ name: d, count: unitCounts[d] }));

  const attendanceData = [
    { name: 'Present', value: presentSessions },
    { name: 'Absent', value: totalSessions - presentSessions }
  ];

  // Fetch recent activity
  const recentAttendances = await prisma.attendance.findMany({
    where: { recruitId: { in: recruitIds } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { recruit: { select: { name: true, chestNumber: true } } }
  });
  const recentEvaluations = await prisma.evaluation.findMany({
    where: { recruitId: { in: recruitIds } },
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

  // Calculate missing enrollments
  const missingChestNumbers: number[] = [];
  if (officerUser && officerUser.minChestNumber && officerUser.maxChestNumber) {
    const min = officerUser.minChestNumber;
    const max = officerUser.maxChestNumber;
    
    // Get a set of enrolled numbers (handling numeric chest numbers)
    const enrolledNumbers = new Set(
      recruits.map(r => parseInt(r.chestNumber.replace(/\D/g, ''))).filter(n => !isNaN(n))
    );

    for (let i = min; i <= max; i++) {
      if (!enrolledNumbers.has(i)) {
        missingChestNumbers.push(i);
      }
    }
  }

  return (
    <div>
      <h1 className="heading-1">Officer Dashboard / अधिकारी डॅशबोर्ड</h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        Manage recruit registration, conduct training evaluations, and monitor academy analytics. / प्रशिक्षणार्थी नोंदणी व्यवस्थापित करा, प्रशिक्षण मूल्यमापन करा आणि अकादमीच्या आकडेवारीवर लक्ष ठेवा.
      </p>

      {/* Quick Actions */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2rem"
      }}>
        <Link href="/officer/register" style={{ textDecoration: "none" }}>
          <div className="glass-card action-card" style={{ display: "flex", alignItems: "center", gap: "1.5rem", padding: "1.5rem", transition: "all 0.3s ease", height: "100%" }}>
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: "60px", height: "60px", backgroundColor: "rgba(234, 179, 8, 0.1)", color: "var(--accent-gold)", borderRadius: "var(--radius-full)" }}>
              <UserPlus size={32} />
            </div>
            <div>
              <h2 className="heading-2" style={{ marginBottom: "0.25rem", color: "white", fontSize: "1.1rem" }}>Register Recruit / नवीन नोंदणी</h2>
              <p className="text-muted" style={{ margin: 0, fontSize: "0.85rem" }}>Enroll a new recruit into the system / नवीन नोंदणी करा</p>
            </div>
          </div>
        </Link>

        <Link href="/officer/attendance" style={{ textDecoration: "none" }}>
          <div className="glass-card action-card" style={{ display: "flex", alignItems: "center", gap: "1.5rem", padding: "1.5rem", transition: "all 0.3s ease", height: "100%" }}>
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: "60px", height: "60px", backgroundColor: "rgba(34, 197, 94, 0.1)", color: "#22c55e", borderRadius: "var(--radius-full)" }}>
              <ClipboardCheck size={32} />
            </div>
            <div>
              <h2 className="heading-2" style={{ marginBottom: "0.25rem", color: "white", fontSize: "1.1rem" }}>Daily Attendance / दैनिक उपस्थिती</h2>
              <p className="text-muted" style={{ margin: 0, fontSize: "0.85rem" }}>Record morning and afternoon attendance / उपस्थितीची नोंदणी करा</p>
            </div>
          </div>
        </Link>

        <Link href="/officer/evaluate" style={{ textDecoration: "none" }}>
          <div className="glass-card action-card" style={{ display: "flex", alignItems: "center", gap: "1.5rem", padding: "1.5rem", transition: "all 0.3s ease", height: "100%" }}>
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: "60px", height: "60px", backgroundColor: "rgba(59, 130, 246, 0.1)", color: "var(--accent-blue)", borderRadius: "var(--radius-full)" }}>
              <Target size={32} />
            </div>
            <div>
              <h2 className="heading-2" style={{ marginBottom: "0.25rem", color: "white", fontSize: "1.1rem" }}>Weekly Evaluation / साप्ताहिक मूल्यमापन</h2>
              <p className="text-muted" style={{ margin: 0, fontSize: "0.85rem" }}>Record weekly training scores / मूल्यमापनाची नोंद करा</p>
            </div>
          </div>
        </Link>

        <Link href="/officer/squads" style={{ textDecoration: "none" }}>
          <div className="glass-card action-card" style={{ display: "flex", alignItems: "center", gap: "1.5rem", padding: "1.5rem", transition: "all 0.3s ease", height: "100%" }}>
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: "60px", height: "60px", backgroundColor: "rgba(236, 72, 153, 0.1)", color: "#ec4899", borderRadius: "var(--radius-full)" }}>
              <Users size={32} />
            </div>
            <div>
              <h2 className="heading-2" style={{ marginBottom: "0.25rem", color: "white", fontSize: "1.1rem" }}>Squads / तुकड्या</h2>
              <p className="text-muted" style={{ margin: 0, fontSize: "0.85rem" }}>Manage squads and bulk evaluations / तुकड्या व्यवस्थापन</p>
            </div>
          </div>
        </Link>

        <Link href="/officer/batches" style={{ textDecoration: "none" }}>
          <div className="glass-card action-card" style={{ display: "flex", alignItems: "center", gap: "1.5rem", padding: "1.5rem", transition: "all 0.3s ease", height: "100%" }}>
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: "60px", height: "60px", backgroundColor: "rgba(251, 191, 36, 0.1)", color: "var(--accent-gold)", borderRadius: "var(--radius-full)" }}>
              <ClipboardCheck size={32} />
            </div>
            <div>
              <h2 className="heading-2" style={{ marginBottom: "0.25rem", color: "white", fontSize: "1.1rem" }}>Manage Batches / बॅच व्यवस्थापन</h2>
              <p className="text-muted" style={{ margin: 0, fontSize: "0.85rem" }}>Create and edit training batches / बॅच व्यवस्थापित करा</p>
            </div>
          </div>
        </Link>
      </div>

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

      {/* Analytics and Activity Feed */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
        <div style={{ marginBottom: "2rem" }}>
        <DashboardCharts unitData={unitData} attendanceData={attendanceData} />
      </div>
        <div style={{ minWidth: 0 }}>
          <RecentActivityFeed activities={recentActivities} />
        </div>
      </div>
      {/* Missing Enrollments Section */}
      {missingChestNumbers.length > 0 && (
        <div className="glass-card" style={{ padding: "2rem", marginBottom: "2rem", backgroundColor: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          <h2 className="heading-2" style={{ marginBottom: "1rem", color: "var(--error)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Target size={24} /> Missing Enrollments / प्रलंबित नोंदणी
          </h2>
          <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
            The following chest numbers from your allotted range ({officerUser?.minChestNumber} - {officerUser?.maxChestNumber}) have not been enrolled yet:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {missingChestNumbers.map(num => (
              <span key={num} style={{
                display: "inline-block",
                padding: "0.4rem 0.8rem",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                color: "var(--error)",
                borderRadius: "var(--radius-md)",
                fontWeight: "bold",
                fontSize: "0.9rem"
              }}>
                {num}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Export Section */}
      <BackupManager role="OFFICER" />

      {/* Roster */}
      <InteractiveRoster recruits={recruits} />
    </div>
  );
}
