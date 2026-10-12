"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  getDailyAttendanceDetails, 
  getMonthlySickPeriodReport, 
  RecruitSickSummary 
} from "@/app/actions/attendance";
import { 
  Calendar, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  HelpCircle,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Printer,
  CalendarRange,
  Users,
  Clock,
  Activity,
  Layers,
  Sparkles
} from "lucide-react";

interface TraineeRow {
  id: string;
  name: string;
  chestNumber: string;
  unit: string;
  squadNumber: string | null;
  reason?: string | null;
}

interface AttendanceDetails {
  morning: {
    present: TraineeRow[];
    missed: TraineeRow[];
    leave: TraineeRow[];
    pending: TraineeRow[];
  };
  afternoon: {
    present: TraineeRow[];
    missed: TraineeRow[];
    leave: TraineeRow[];
    pending: TraineeRow[];
  };
}

export default function AttendanceViewerClient() {
  // Top view mode: "DAILY" (दैनिक) or "SICK_PERIOD" (आजारी कालावधी)
  const [viewMode, setViewMode] = useState<"DAILY" | "SICK_PERIOD">("SICK_PERIOD");

  // DAILY VIEW STATE
  const [date, setDate] = useState(() => {
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
    return `${year}-${month}-${day}`;
  });

  const [loadingDaily, setLoadingDaily] = useState(false);
  const [dailySearchQuery, setDailySearchQuery] = useState("");
  const [activeTabMorning, setActiveTabMorning] = useState<"PRESENT" | "MISSED" | "LEAVE" | "PENDING">("MISSED");
  const [activeTabAfternoon, setActiveTabAfternoon] = useState<"PRESENT" | "MISSED" | "LEAVE" | "PENDING">("MISSED");
  const [dailyDetails, setDailyDetails] = useState<AttendanceDetails | null>(null);

  // SICK PERIOD MONTHLY VIEW STATE
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // Default to August where active data exists
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("2026-08-01");
  const [customEndDate, setCustomEndDate] = useState("2026-08-31");
  const [sickSearchQuery, setSickSearchQuery] = useState("");
  const [selectedSquad, setSelectedSquad] = useState<string>("ALL");
  const [reasonCategoryFilter, setReasonCategoryFilter] = useState<string>("ALL");
  const [expandedRecruits, setExpandedRecruits] = useState<Record<string, boolean>>({});
  const [loadingSick, setLoadingSick] = useState(false);

  const [sickReportData, setSickReportData] = useState<{
    queryStartDate: string;
    queryEndDate: string;
    formattedQueryStartDate: string;
    formattedQueryEndDate: string;
    availableMonths: { year: number; month: number; label: string; value: string }[];
    summary: {
      totalRecruitsAffected: number;
      totalSickDays: number;
      totalMissedPeriods: number;
    };
    recruits: RecruitSickSummary[];
  } | null>(null);

  // Fetch Daily Attendance
  const fetchDailyAttendance = async () => {
    setLoadingDaily(true);
    const res = await getDailyAttendanceDetails(date);
    if (res.success && res.details) {
      setDailyDetails(res.details);
    }
    setLoadingDaily(false);
  };

  useEffect(() => {
    if (viewMode === "DAILY") {
      fetchDailyAttendance();
    }
  }, [date, viewMode]);

  // Fetch Sick Period Monthly Report
  const fetchSickReport = async () => {
    setLoadingSick(true);
    let params: any = {};
    if (isCustomRange) {
      params = { startDate: customStartDate, endDate: customEndDate };
    } else {
      params = { year: selectedYear, month: selectedMonth };
    }

    const res = await getMonthlySickPeriodReport(params);
    if (res.success && res.report) {
      setSickReportData(res.report);
      // Automatically expand the first 5 recruits for easy preview
      const initialExpanded: Record<string, boolean> = {};
      res.report.recruits.forEach((r, idx) => {
        initialExpanded[r.recruitId] = idx < 5;
      });
      setExpandedRecruits(initialExpanded);
    }
    setLoadingSick(false);
  };

  useEffect(() => {
    if (viewMode === "SICK_PERIOD") {
      fetchSickReport();
    }
  }, [viewMode, selectedYear, selectedMonth, isCustomRange, customStartDate, customEndDate]);

  // Daily filter list
  const filterDailyList = (list: TraineeRow[]) => {
    if (!dailySearchQuery.trim()) return list;
    const query = dailySearchQuery.toLowerCase();
    return list.filter(r => 
      r.name.toLowerCase().includes(query) || 
      r.chestNumber.toLowerCase().includes(query) ||
      r.unit.toLowerCase().includes(query) ||
      (r.squadNumber && r.squadNumber.toLowerCase().includes(query))
    );
  };

  // Distinct squads in sick report
  const availableSquads = useMemo(() => {
    if (!sickReportData) return [];
    const set = new Set<string>();
    sickReportData.recruits.forEach(r => {
      if (r.squadNumber) set.add(r.squadNumber);
    });
    return Array.from(set).sort();
  }, [sickReportData]);

  // Filtered Sick Recruits
  const filteredSickRecruits = useMemo(() => {
    if (!sickReportData) return [];
    return sickReportData.recruits.filter(r => {
      // Squad filter
      if (selectedSquad !== "ALL" && r.squadNumber !== selectedSquad) return false;

      // Search query
      if (sickSearchQuery.trim()) {
        const q = sickSearchQuery.toLowerCase();
        const matchesQuery = 
          r.name.toLowerCase().includes(q) ||
          r.chestNumber.toLowerCase().includes(q) ||
          r.unit.toLowerCase().includes(q) ||
          (r.squadNumber && r.squadNumber.toLowerCase().includes(q)) ||
          r.periods.some(p => p.reasons.some(rs => rs.toLowerCase().includes(q)));
        if (!matchesQuery) return false;
      }

      // Reason filter
      if (reasonCategoryFilter !== "ALL") {
        const allReasons = r.periods.flatMap(p => p.reasons).join(" ").toLowerCase();
        if (reasonCategoryFilter === "FEVER" && !allReasons.includes("ताप") && !allReasons.includes("सर्दी") && !allReasons.includes("fever")) return false;
        if (reasonCategoryFilter === "PAIN" && !allReasons.includes("दुखी") && !allReasons.includes("कंबर") && !allReasons.includes("लचक") && !allReasons.includes("pain")) return false;
        if (reasonCategoryFilter === "WEAKNESS" && !allReasons.includes("अशक्त") && !allReasons.includes("कणकण") && !allReasons.includes("weak")) return false;
      }

      return true;
    });
  }, [sickReportData, selectedSquad, sickSearchQuery, reasonCategoryFilter]);

  const toggleRecruitExpand = (id: string) => {
    setExpandedRecruits(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    if (!sickReportData) return;
    const allExp: Record<string, boolean> = {};
    sickReportData.recruits.forEach(r => { allExp[r.recruitId] = true; });
    setExpandedRecruits(allExp);
  };

  const collapseAll = () => {
    setExpandedRecruits({});
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const marathiMonthNames = [
    "जानेवारी (January)", "फेब्रुवारी (February)", "मार्च (March)", "एप्रिल (April)",
    "मे (May)", "जून (June)", "जुलै (July)", "ऑगस्ट (August)",
    "सप्टेंबर (September)", "ऑक्टोबर (October)", "नोव्हेंबर (November)", "डिसेंबर (December)"
  ];

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "4rem" }}>
      
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .sidebar, .nav-links, .mobile-menu-btn, .no-print {
            display: none !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .glass-card {
            background: white !important;
            border: 1px solid #ccc !important;
            box-shadow: none !important;
            color: black !important;
            page-break-inside: avoid;
            margin-bottom: 20px !important;
          }
          .print-header {
            display: block !important;
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
          }
          .badge {
            border: 1px solid #000 !important;
            color: #000 !important;
            background: transparent !important;
          }
        }
        .print-header {
          display: none;
        }
      `}} />

      {/* Print Header */}
      <div className="print-header">
        <h1 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>पोलीस प्रशिक्षण केंद्र, अकोला / POLICE TRAINING CENTRE, AKOLA</h1>
        <h2 style={{ fontSize: "16px", margin: "5px 0 0 0" }}>मासिक आजारी कालावधी व चुकवलेले Period अहवाल / SICK PERIOD & MISSED PERIODS REPORT</h2>
        <p style={{ fontSize: "13px", margin: "5px 0 0 0", color: "#555" }}>
          कालावधी / Period: {sickReportData?.formattedQueryStartDate} ते {sickReportData?.formattedQueryEndDate}
        </p>
      </div>

      {/* TOP BAR: View Mode Switcher */}
      <div className="no-print" style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "2rem", 
        flexWrap: "wrap", 
        gap: "1.25rem",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        paddingBottom: "1.25rem"
      }}>
        <div>
          <h1 className="heading-1" style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <ClipboardHeaderIcon viewMode={viewMode} />
            {viewMode === "SICK_PERIOD" ? (
              <span>SICK PERIOD / आजारी कालावधी अहवाल</span>
            ) : (
              <span>Daily Attendance Report / दैनिक उपस्थिती अहवाल</span>
            )}
          </h1>
          <p className="text-muted" style={{ margin: 0, fontSize: "0.95rem" }}>
            {viewMode === "SICK_PERIOD" 
              ? "या तारखेपासून ते या तारखेपर्यंत एकूण दिवस, चुकवलेले period एका महिन्यात सर्व datewise तपशीलासह"
              : "दैनंदिन सकाळ व दुपार सत्र उपस्थिती व गैरहजेरीचा तपशील"}
          </p>
        </div>

        {/* View Mode Toggle Pill */}
        <div style={{ 
          display: "inline-flex", 
          backgroundColor: "rgba(0,0,0,0.35)", 
          padding: "4px", 
          borderRadius: "var(--radius-lg)",
          border: "1px solid rgba(255,255,255,0.15)"
        }}>
          <button
            type="button"
            onClick={() => setViewMode("SICK_PERIOD")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.6rem 1.25rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              fontWeight: "700",
              fontSize: "0.95rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
              backgroundColor: viewMode === "SICK_PERIOD" ? "var(--error)" : "transparent",
              color: viewMode === "SICK_PERIOD" ? "#ffffff" : "var(--text-muted)",
              boxShadow: viewMode === "SICK_PERIOD" ? "0 4px 12px rgba(239,68,68,0.35)" : "none"
            }}
          >
            <Stethoscope size={18} />
            <span>आजारी कालावधी / SICK PERIOD</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("DAILY")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.6rem 1.25rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              fontWeight: "700",
              fontSize: "0.95rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
              backgroundColor: viewMode === "DAILY" ? "var(--primary-navy-light)" : "transparent",
              color: viewMode === "DAILY" ? "#ffffff" : "var(--text-muted)",
              boxShadow: viewMode === "DAILY" ? "0 4px 12px rgba(59,130,246,0.35)" : "none"
            }}
          >
            <Calendar size={18} />
            <span>दैनिक उपस्थिती / Daily Report</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          MODE 1: SICK PERIOD & MISSED PERIODS (मासिक अहवाल)
          ======================================================== */}
      {viewMode === "SICK_PERIOD" && (
        <div>
          {/* Controls Card: Month selector, Custom Range, Actions */}
          <div className="glass-card no-print" style={{ padding: "1.75rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
              
              {/* Month Picker / Range Switcher */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                {!isCustomRange ? (
                  <>
                    <button 
                      onClick={handlePrevMonth}
                      className="btn btn-outline"
                      style={{ padding: "0.5rem 0.75rem" }}
                      title="मागील महिना (Previous Month)"
                    >
                      <ChevronLeft size={18} /> मागील
                    </button>

                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <select 
                        className="form-select" 
                        value={selectedMonth} 
                        onChange={e => setSelectedMonth(Number(e.target.value))}
                        style={{ minWidth: "180px", fontWeight: "600" }}
                      >
                        {marathiMonthNames.map((name, i) => (
                          <option key={i + 1} value={i + 1}>{name}</option>
                        ))}
                      </select>

                      <select 
                        className="form-select" 
                        value={selectedYear} 
                        onChange={e => setSelectedYear(Number(e.target.value))}
                        style={{ width: "100px", fontWeight: "600" }}
                      >
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                        <option value={2027}>2027</option>
                      </select>
                    </div>

                    <button 
                      onClick={handleNextMonth}
                      className="btn btn-outline"
                      style={{ padding: "0.5rem 0.75rem" }}
                      title="पुढील महिना (Next Month)"
                    >
                      पुढील <ChevronRight size={18} />
                    </button>
                  </>
                ) : (
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <label className="form-label" style={{ margin: 0, fontSize: "0.85rem" }}>या तारखेपासून (From):</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={customStartDate} 
                        onChange={e => setCustomStartDate(e.target.value)} 
                        style={{ width: "auto" }}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <label className="form-label" style={{ margin: 0, fontSize: "0.85rem" }}>ते या तारखेपर्यंत (To):</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={customEndDate} 
                        onChange={e => setCustomEndDate(e.target.value)} 
                        style={{ width: "auto" }}
                      />
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => setIsCustomRange(!isCustomRange)}
                  className="btn btn-outline"
                  style={{ 
                    fontSize: "0.85rem", 
                    padding: "0.5rem 1rem",
                    borderColor: isCustomRange ? "var(--accent-gold)" : "rgba(255,255,255,0.2)",
                    color: isCustomRange ? "var(--accent-gold)" : "var(--text-muted)"
                  }}
                >
                  <CalendarRange size={16} />
                  {isCustomRange ? "मासिक निवडीवर जा / Switch to Month" : "तारीख कालावधी निवडा / Custom Date Range"}
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <button 
                  onClick={() => window.print()}
                  className="btn btn-primary"
                  style={{ display: "flex", gap: "0.5rem", alignItems: "center", backgroundColor: "var(--primary-navy)", borderColor: "var(--accent-gold)" }}
                >
                  <Printer size={18} />
                  <span>प्रिंट अहवाल / Print Report</span>
                </button>
              </div>
            </div>

            {/* Quick Month Shortcuts (from data available in DB) */}
            {sickReportData && sickReportData.availableMonths.length > 0 && (
              <div style={{ 
                marginTop: "1.25rem", 
                paddingTop: "1rem", 
                borderTop: "1px dashed rgba(255,255,255,0.1)", 
                display: "flex", 
                alignItems: "center", 
                gap: "0.75rem", 
                flexWrap: "wrap" 
              }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <Sparkles size={14} color="var(--accent-gold)" /> उपलब्ध महिने (Months with data):
                </span>
                {sickReportData.availableMonths.map(m => {
                  const isActive = !isCustomRange && selectedYear === m.year && selectedMonth === m.month;
                  return (
                    <button
                      key={m.value}
                      onClick={() => {
                        setIsCustomRange(false);
                        setSelectedYear(m.year);
                        setSelectedMonth(m.month);
                      }}
                      style={{
                        padding: "0.25rem 0.75rem",
                        fontSize: "0.8rem",
                        borderRadius: "var(--radius-sm)",
                        border: isActive ? "1px solid var(--accent-gold)" : "1px solid rgba(255,255,255,0.15)",
                        backgroundColor: isActive ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.05)",
                        color: isActive ? "var(--accent-gold)" : "var(--text-muted)",
                        cursor: "pointer",
                        fontWeight: isActive ? "700" : "500",
                        transition: "all 0.15s"
                      }}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* KPI Summary Cards */}
          {sickReportData && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
              
              {/* Card 1: Total Sick Recruits */}
              <div className="glass-card" style={{ padding: "1.5rem", borderLeft: "4px solid #ef4444" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>
                      एकूण आजारी प्रशिक्षणार्थी
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                      Total Sick Recruits in Month
                    </div>
                    <div style={{ fontSize: "2.25rem", fontWeight: "800", color: "#fca5a5" }}>
                      {sickReportData.summary.totalRecruitsAffected}
                    </div>
                  </div>
                  <div style={{ backgroundColor: "rgba(239,68,68,0.15)", padding: "0.75rem", borderRadius: "50%", color: "#ef4444" }}>
                    <Users size={24} />
                  </div>
                </div>
              </div>

              {/* Card 2: Total Sick Days */}
              <div className="glass-card" style={{ padding: "1.5rem", borderLeft: "4px solid var(--accent-gold)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>
                      एकूण आजारी कालावधी दिवस
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                      Total Cumulative Sick Days
                    </div>
                    <div style={{ fontSize: "2.25rem", fontWeight: "800", color: "var(--accent-gold)" }}>
                      {sickReportData.summary.totalSickDays} <span style={{ fontSize: "1.1rem", fontWeight: "normal", color: "var(--text-muted)" }}>दिवस</span>
                    </div>
                  </div>
                  <div style={{ backgroundColor: "rgba(251,191,36,0.15)", padding: "0.75rem", borderRadius: "50%", color: "var(--accent-gold)" }}>
                    <Calendar size={24} />
                  </div>
                </div>
              </div>

              {/* Card 3: Total Missed Periods */}
              <div className="glass-card" style={{ padding: "1.5rem", borderLeft: "4px solid #3b82f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>
                      एकूण चुकवलेले Period
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                      Total Missed Periods / Sessions
                    </div>
                    <div style={{ fontSize: "2.25rem", fontWeight: "800", color: "#93c5fd" }}>
                      {sickReportData.summary.totalMissedPeriods} <span style={{ fontSize: "1.1rem", fontWeight: "normal", color: "var(--text-muted)" }}>Period</span>
                    </div>
                  </div>
                  <div style={{ backgroundColor: "rgba(59,130,246,0.15)", padding: "0.75rem", borderRadius: "50%", color: "#3b82f6" }}>
                    <Clock size={24} />
                  </div>
                </div>
              </div>

              {/* Card 4: Date Range Scope */}
              <div className="glass-card" style={{ padding: "1.5rem", borderLeft: "4px solid #10b981" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>
                      कालावधी व्याप्ती
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                      Active Report Scope
                    </div>
                    <div style={{ fontSize: "1.25rem", fontWeight: "700", color: "#6ee7b7", lineHeight: "1.3" }}>
                      {sickReportData.formattedQueryStartDate} <br />
                      <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>ते / to</span> {sickReportData.formattedQueryEndDate}
                    </div>
                  </div>
                  <div style={{ backgroundColor: "rgba(16,185,129,0.15)", padding: "0.75rem", borderRadius: "50%", color: "#10b981" }}>
                    <Activity size={24} />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Filter Bar */}
          <div className="glass-card no-print" style={{ padding: "1.25rem 1.5rem", marginBottom: "1.75rem" }}>
            <div style={{ display: "flex", gap: "1.25rem", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
              
              {/* Search box */}
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flex: 1, minWidth: "260px" }}>
                <Search size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <input 
                  type="text" 
                  placeholder="छाती क्रमांक, नाव, आजारपण कारणाने शोधा (Search chest, name, illness)..." 
                  className="form-input" 
                  value={sickSearchQuery}
                  onChange={e => setSickSearchQuery(e.target.value)}
                  style={{ border: "none", background: "transparent", padding: "0.25rem 0", margin: 0, width: "100%" }}
                />
              </div>

              {/* Squad Filter */}
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <label className="form-label" style={{ margin: 0, fontSize: "0.85rem" }}>तुकडी (Squad):</label>
                <select 
                  className="form-select"
                  value={selectedSquad}
                  onChange={e => setSelectedSquad(e.target.value)}
                  style={{ width: "auto", padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                >
                  <option value="ALL">सर्व तुकड्या (All)</option>
                  {availableSquads.map(sq => (
                    <option key={sq} value={sq}>Squad {sq}</option>
                  ))}
                </select>
              </div>

              {/* Reason Category Filter */}
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <label className="form-label" style={{ margin: 0, fontSize: "0.85rem" }}>कारण प्रकार (Reason):</label>
                <select 
                  className="form-select"
                  value={reasonCategoryFilter}
                  onChange={e => setReasonCategoryFilter(e.target.value)}
                  style={{ width: "auto", padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                >
                  <option value="ALL">सर्व आजारपण (All)</option>
                  <option value="FEVER">ताप / सर्दी / खोकला</option>
                  <option value="PAIN">कंबर / अंग / जॉईंट दुखी</option>
                  <option value="WEAKNESS">अशक्तपणा / कणकण</option>
                </select>
              </div>

              {/* Expand / Collapse Buttons */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button 
                  onClick={expandAll}
                  className="btn btn-outline"
                  style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem" }}
                >
                  सर्व उघडा (Expand All)
                </button>
                <button 
                  onClick={collapseAll}
                  className="btn btn-outline"
                  style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem" }}
                >
                  सर्व बंद (Collapse)
                </button>
              </div>

            </div>
          </div>

          {/* RECRUITS LIST */}
          {loadingSick ? (
            <div className="glass-card" style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)", fontSize: "1.2rem" }}>
              आजारी कालावधी व उपस्थिती माहिती लोड होत आहे (Fetching sick records)...
            </div>
          ) : filteredSickRecruits.length === 0 ? (
            <div className="glass-card" style={{ padding: "4rem", textAlign: "center" }}>
              <Stethoscope size={48} style={{ color: "var(--text-muted)", margin: "0 auto 1rem" }} />
              <h3 style={{ fontSize: "1.25rem", color: "white", marginBottom: "0.5rem" }}>
                कोणतीही आजारी नोंद आढळली नाही / No Sick Records Found
              </h3>
              <p className="text-muted" style={{ maxWidth: "500px", margin: "0 auto" }}>
                निवडलेल्या कालावधीमध्ये ({sickReportData?.formattedQueryStartDate} ते {sickReportData?.formattedQueryEndDate}) कोणत्याही प्रशिक्षणार्थीचा आजारी कालावधी नोंदवलेला नाही.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              {filteredSickRecruits.map((recruit, rIdx) => {
                const isExpanded = !!expandedRecruits[recruit.recruitId];
                return (
                  <div 
                    key={recruit.recruitId}
                    className="glass-card"
                    style={{ 
                      padding: 0, 
                      overflow: "hidden",
                      border: "1px solid rgba(239,68,68,0.25)",
                      backgroundColor: "rgba(15, 23, 42, 0.65)"
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ 
                      padding: "1.25rem 1.75rem",
                      backgroundColor: "rgba(0,0,0,0.35)",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "1rem"
                    }}>
                      
                      {/* Left: Recruit Info */}
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                        <span className="badge badge-gold" style={{ fontSize: "1.1rem", padding: "0.4rem 1rem", letterSpacing: "1px" }}>
                          #{recruit.chestNumber}
                        </span>
                        <div>
                          <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "white" }}>
                            {recruit.name}
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                            घटक (Unit): <strong>{recruit.unit}</strong> {recruit.squadNumber ? `| तुकडी (Squad): ${recruit.squadNumber}` : ""}
                          </div>
                        </div>
                      </div>

                      {/* Right: Key Period Badges & Toggle */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                        
                        {/* Period Span Highlights */}
                        {recruit.periods.map((p, pIdx) => (
                          <div 
                            key={p.periodId}
                            style={{ 
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              padding: "0.4rem 0.85rem",
                              borderRadius: "var(--radius-md)",
                              backgroundColor: "rgba(239,68,68,0.15)",
                              border: "1px solid rgba(239,68,68,0.35)",
                              color: "#fca5a5",
                              fontSize: "0.85rem"
                            }}
                          >
                            <Stethoscope size={15} />
                            <span>
                              <strong>कालावधी {recruit.periods.length > 1 ? `#${pIdx + 1}` : ""}:</strong> {p.formattedStartDate} ते {p.formattedEndDate}
                            </span>
                            <span style={{ 
                              backgroundColor: "rgba(239,68,68,0.3)", 
                              padding: "0.15rem 0.5rem", 
                              borderRadius: "4px",
                              fontWeight: "700",
                              color: "white"
                            }}>
                              {p.totalDays} दिवस ({p.totalMissedPeriods} Period)
                            </span>
                          </div>
                        ))}

                        {/* Overall Totals */}
                        <div style={{ 
                          padding: "0.4rem 0.85rem", 
                          backgroundColor: "rgba(251,191,36,0.12)",
                          border: "1px solid rgba(251,191,36,0.3)",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.85rem",
                          color: "var(--accent-gold)",
                          fontWeight: "700"
                        }}>
                          एकूण: {recruit.totalSickDaysInMonth} दिवस | {recruit.totalMissedPeriodsInMonth} Period चुकले
                        </div>

                        {/* Expand/Collapse Toggle Button */}
                        <button
                          type="button"
                          onClick={() => toggleRecruitExpand(recruit.recruitId)}
                          className="no-print"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            padding: "0.4rem 0.75rem",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            backgroundColor: "rgba(255,255,255,0.05)",
                            color: "white",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            transition: "all 0.15s"
                          }}
                        >
                          {isExpanded ? (
                            <><span>तपशील लपवा</span> <ChevronUp size={16} /></>
                          ) : (
                            <><span>Datewise तपशील पहा</span> <ChevronDown size={16} /></>
                          )}
                        </button>

                      </div>
                    </div>

                    {/* Reasons summary strip */}
                    <div style={{ 
                      padding: "0.75rem 1.75rem", 
                      backgroundColor: "rgba(255,255,255,0.02)",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      flexWrap: "wrap",
                      fontSize: "0.85rem"
                    }}>
                      <span style={{ color: "var(--text-muted)", fontWeight: "600" }}>
                        आजारपण कारणे (Illness Reasons):
                      </span>
                      {Array.from(new Set(recruit.periods.flatMap(p => p.reasons))).map((rs, i) => (
                        <span 
                          key={i}
                          style={{ 
                            backgroundColor: "rgba(239,68,68,0.1)", 
                            color: "#fecaca", 
                            padding: "0.2rem 0.6rem", 
                            borderRadius: "4px",
                            border: "1px solid rgba(239,68,68,0.2)"
                          }}
                        >
                          "{rs}"
                        </span>
                      ))}
                    </div>

                    {/* Datewise Detailed Table (सर्व सोबत datewise) */}
                    {isExpanded && (
                      <div style={{ padding: "1.5rem 1.75rem", overflowX: "auto" }}>
                        <div style={{ 
                          marginBottom: "0.75rem", 
                          fontSize: "0.9rem", 
                          fontWeight: "700", 
                          color: "var(--accent-gold)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem"
                        }}>
                          <Clock size={16} /> सर्व दिवसनिहाय उपस्थिती नोंद (All Datewise Logs):
                        </div>

                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                          <thead>
                            <tr style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
                              <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", borderBottom: "1px solid rgba(255,255,255,0.1)", width: "60px" }}>अ.क्र.</th>
                              <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", borderBottom: "1px solid rgba(255,255,255,0.1)", width: "130px" }}>दिनांक (Date)</th>
                              <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", borderBottom: "1px solid rgba(255,255,255,0.1)", width: "120px" }}>वार (Day)</th>
                              <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>सकाळ सत्र (Morning Period)</th>
                              <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>दुपार सत्र (Afternoon Period)</th>
                              <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "center", width: "140px" }}>चुकलेले Period</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recruit.allDatewiseRecords.map((dRec, dIdx) => {
                              const isMorningMissed = dRec.morningStatus === "MISSED" || dRec.morningStatus === "LEAVE";
                              const isAfternoonMissed = dRec.afternoonStatus === "MISSED" || dRec.afternoonStatus === "LEAVE";

                              return (
                                <tr 
                                  key={dIdx}
                                  style={{ 
                                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                                    backgroundColor: dIdx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent"
                                  }}
                                >
                                  <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>
                                    {dIdx + 1}
                                  </td>
                                  <td style={{ padding: "0.75rem 1rem", fontWeight: "600", color: "white" }}>
                                    {dRec.formattedDate}
                                  </td>
                                  <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>
                                    {dRec.dayName}
                                  </td>
                                  <td style={{ padding: "0.75rem 1rem" }}>
                                    {isMorningMissed ? (
                                      <div style={{ display: "inline-flex", flexDirection: "column", gap: "0.2rem" }}>
                                        <span className="badge badge-error" style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}>
                                          चुकले / Missed
                                        </span>
                                        {dRec.morningReason && (
                                          <span style={{ fontSize: "0.8rem", color: "#fca5a5", fontStyle: "italic" }}>
                                            कारण: {dRec.morningReason}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="badge badge-success" style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}>
                                        हजर / Present
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ padding: "0.75rem 1rem" }}>
                                    {isAfternoonMissed ? (
                                      <div style={{ display: "inline-flex", flexDirection: "column", gap: "0.2rem" }}>
                                        <span className="badge badge-error" style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}>
                                          चुकले / Missed
                                        </span>
                                        {dRec.afternoonReason && (
                                          <span style={{ fontSize: "0.8rem", color: "#fca5a5", fontStyle: "italic" }}>
                                            कारण: {dRec.afternoonReason}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="badge badge-success" style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}>
                                        हजर / Present
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                                    <span style={{ 
                                      display: "inline-block",
                                      fontWeight: "800", 
                                      fontSize: "0.95rem",
                                      color: dRec.missedPeriodsOnDate > 0 ? "#ef4444" : "#22c55e",
                                      backgroundColor: dRec.missedPeriodsOnDate > 0 ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                                      padding: "0.2rem 0.75rem",
                                      borderRadius: "12px"
                                    }}>
                                      {dRec.missedPeriodsOnDate} Period
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{ backgroundColor: "rgba(0,0,0,0.5)", fontWeight: "700" }}>
                              <td colSpan={3} style={{ padding: "0.75rem 1rem", color: "var(--accent-gold)" }}>
                                एकूण सारांश (Total Summary)
                              </td>
                              <td colSpan={2} style={{ padding: "0.75rem 1rem", color: "white" }}>
                                {recruit.periods.length} आजारी कालावधी (Sick Periods)
                              </td>
                              <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#fca5a5", fontSize: "1rem" }}>
                                {recruit.totalMissedPeriodsInMonth} Periods
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}


      {/* ========================================================
          MODE 2: DAILY ATTENDANCE (दैनिक उपस्थिती अहवाल)
          ======================================================== */}
      {viewMode === "DAILY" && (
        <div>
          {/* Date Picker Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
            <p className="text-muted" style={{ margin: 0 }}>
              निवडलेल्या एका दिवसाचे सकाळ व दुपार सत्रानुसार उपस्थित व गैरहजर प्रशिक्षणार्थी पहा.
            </p>

            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Select Date / तारीख:</label>
              <input 
                type="date" 
                className="form-input" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                style={{ width: "auto" }} 
              />
            </div>
          </div>

          {/* Search Box */}
          <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "2rem", display: "flex", gap: "1rem", alignItems: "center" }}>
            <Search size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input 
              type="text" 
              placeholder="छाती क्रमांक, नाव, घटक किंवा तुकडीने शोधा (Search chest, name, squad)..." 
              className="form-input" 
              value={dailySearchQuery}
              onChange={e => setDailySearchQuery(e.target.value)}
              style={{ border: "none", background: "transparent", padding: 0, margin: 0 }}
            />
          </div>

          {loadingDaily ? (
            <div className="glass-card" style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)", fontSize: "1.2rem" }}>
              उपस्थिती माहिती लोड होत आहे (Fetching daily records)...
            </div>
          ) : dailyDetails ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: "2rem" }}>
              
              {/* Morning Session Card */}
              <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <h2 className="heading-2" style={{ borderBottom: "2px solid rgba(255,255,255,0.05)", paddingBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Morning Session / सकाळ सत्र</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "normal" }}>
                    Total: {dailyDetails.morning.present.length + dailyDetails.morning.missed.length + dailyDetails.morning.leave.length} recorded
                  </span>
                </h2>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button 
                    onClick={() => setActiveTabMorning("PRESENT")}
                    className={`btn ${activeTabMorning === "PRESENT" ? "btn-primary" : "btn-outline"}`}
                    style={{ flex: 1, minWidth: "120px", display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}
                  >
                    <CheckCircle size={16} /> Present ({dailyDetails.morning.present.length})
                  </button>
                  <button 
                    onClick={() => setActiveTabMorning("MISSED")}
                    className={`btn ${activeTabMorning === "MISSED" ? "btn-primary" : "btn-outline"}`}
                    style={{ 
                      flex: 1, 
                      minWidth: "120px", 
                      display: "flex", 
                      gap: "0.5rem", 
                      alignItems: "center", 
                      justifyContent: "center",
                      borderColor: activeTabMorning !== "MISSED" ? "rgba(239, 68, 68, 0.4)" : undefined,
                      color: activeTabMorning !== "MISSED" ? "#ef4444" : undefined
                    }}
                  >
                    <XCircle size={16} /> Missed ({dailyDetails.morning.missed.length})
                  </button>
                  <button 
                    onClick={() => setActiveTabMorning("LEAVE")}
                    className={`btn ${activeTabMorning === "LEAVE" ? "btn-primary" : "btn-outline"}`}
                    style={{ 
                      flex: 1, 
                      minWidth: "120px", 
                      display: "flex", 
                      gap: "0.5rem", 
                      alignItems: "center", 
                      justifyContent: "center",
                      borderColor: activeTabMorning !== "LEAVE" ? "rgba(234, 179, 8, 0.4)" : undefined,
                      color: activeTabMorning !== "LEAVE" ? "#eab308" : undefined
                    }}
                  >
                    <AlertTriangle size={16} /> Leave ({dailyDetails.morning.leave.length})
                  </button>
                  <button 
                    onClick={() => setActiveTabMorning("PENDING")}
                    className={`btn ${activeTabMorning === "PENDING" ? "btn-primary" : "btn-outline"}`}
                    style={{ flex: 1, minWidth: "120px", display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}
                  >
                    <HelpCircle size={16} /> Pending ({dailyDetails.morning.pending.length})
                  </button>
                </div>

                {/* List */}
                <div style={{ flex: 1, maxHeight: "500px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", paddingRight: "0.5rem" }}>
                  {filterDailyList(
                    activeTabMorning === "PRESENT" ? dailyDetails.morning.present :
                    activeTabMorning === "MISSED" ? dailyDetails.morning.missed :
                    activeTabMorning === "LEAVE" ? dailyDetails.morning.leave :
                    dailyDetails.morning.pending
                  ).length === 0 ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                      कोणतीही माहिती उपलब्ध नाही (No records found).
                    </div>
                  ) : (
                    filterDailyList(
                      activeTabMorning === "PRESENT" ? dailyDetails.morning.present :
                      activeTabMorning === "MISSED" ? dailyDetails.morning.missed :
                      activeTabMorning === "LEAVE" ? dailyDetails.morning.leave :
                      dailyDetails.morning.pending
                    ).map(r => (
                      <div key={r.id} style={{ padding: "1rem", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                          <span style={{ fontWeight: "700", color: "var(--accent-gold)" }}>#{r.chestNumber}</span>
                          <span className="badge badge-outline" style={{ fontSize: "0.75rem" }}>{r.unit} {r.squadNumber ? `| Squad ${r.squadNumber}` : ''}</span>
                        </div>
                        <div style={{ fontWeight: "600", color: "white" }}>{r.name}</div>
                        
                        {r.reason && (
                          <div style={{ 
                            marginTop: "0.5rem", 
                            padding: "0.5rem 0.75rem", 
                            backgroundColor: activeTabMorning === "MISSED" ? "rgba(239,68,68,0.1)" : "rgba(234,179,8,0.1)", 
                            color: activeTabMorning === "MISSED" ? "#fca5a5" : "#fef08a",
                            fontSize: "0.8rem", 
                            borderRadius: "4px",
                            borderLeft: `3px solid ${activeTabMorning === "MISSED" ? "#ef4444" : "#eab308"}`
                          }}>
                            <strong>Reason / कारण:</strong> {r.reason}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Afternoon Session Card */}
              <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <h2 className="heading-2" style={{ borderBottom: "2px solid rgba(255,255,255,0.05)", paddingBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Afternoon Session / दुपार सत्र</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "normal" }}>
                    Total: {dailyDetails.afternoon.present.length + dailyDetails.afternoon.missed.length + dailyDetails.afternoon.leave.length} recorded
                  </span>
                </h2>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button 
                    onClick={() => setActiveTabAfternoon("PRESENT")}
                    className={`btn ${activeTabAfternoon === "PRESENT" ? "btn-primary" : "btn-outline"}`}
                    style={{ flex: 1, minWidth: "120px", display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}
                  >
                    <CheckCircle size={16} /> Present ({dailyDetails.afternoon.present.length})
                  </button>
                  <button 
                    onClick={() => setActiveTabAfternoon("MISSED")}
                    className={`btn ${activeTabAfternoon === "MISSED" ? "btn-primary" : "btn-outline"}`}
                    style={{ 
                      flex: 1, 
                      minWidth: "120px", 
                      display: "flex", 
                      gap: "0.5rem", 
                      alignItems: "center", 
                      justifyContent: "center",
                      borderColor: activeTabAfternoon !== "MISSED" ? "rgba(239, 68, 68, 0.4)" : undefined,
                      color: activeTabAfternoon !== "MISSED" ? "#ef4444" : undefined
                    }}
                  >
                    <XCircle size={16} /> Missed ({dailyDetails.afternoon.missed.length})
                  </button>
                  <button 
                    onClick={() => setActiveTabAfternoon("LEAVE")}
                    className={`btn ${activeTabAfternoon === "LEAVE" ? "btn-primary" : "btn-outline"}`}
                    style={{ 
                      flex: 1, 
                      minWidth: "120px", 
                      display: "flex", 
                      gap: "0.5rem", 
                      alignItems: "center", 
                      justifyContent: "center",
                      borderColor: activeTabAfternoon !== "LEAVE" ? "rgba(234, 179, 8, 0.4)" : undefined,
                      color: activeTabAfternoon !== "LEAVE" ? "#eab308" : undefined
                    }}
                  >
                    <AlertTriangle size={16} /> Leave ({dailyDetails.afternoon.leave.length})
                  </button>
                  <button 
                    onClick={() => setActiveTabAfternoon("PENDING")}
                    className={`btn ${activeTabAfternoon === "PENDING" ? "btn-primary" : "btn-outline"}`}
                    style={{ flex: 1, minWidth: "120px", display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}
                  >
                    <HelpCircle size={16} /> Pending ({dailyDetails.afternoon.pending.length})
                  </button>
                </div>

                {/* List */}
                <div style={{ flex: 1, maxHeight: "500px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", paddingRight: "0.5rem" }}>
                  {filterDailyList(
                    activeTabAfternoon === "PRESENT" ? dailyDetails.afternoon.present :
                    activeTabAfternoon === "MISSED" ? dailyDetails.afternoon.missed :
                    activeTabAfternoon === "LEAVE" ? dailyDetails.afternoon.leave :
                    dailyDetails.afternoon.pending
                  ).length === 0 ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                      कोणतीही माहिती उपलब्ध नाही (No records found).
                    </div>
                  ) : (
                    filterDailyList(
                      activeTabAfternoon === "PRESENT" ? dailyDetails.afternoon.present :
                      activeTabAfternoon === "MISSED" ? dailyDetails.afternoon.missed :
                      activeTabAfternoon === "LEAVE" ? dailyDetails.afternoon.leave :
                      dailyDetails.afternoon.pending
                    ).map(r => (
                      <div key={r.id} style={{ padding: "1rem", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                          <span style={{ fontWeight: "700", color: "var(--accent-gold)" }}>#{r.chestNumber}</span>
                          <span className="badge badge-outline" style={{ fontSize: "0.75rem" }}>{r.unit} {r.squadNumber ? `| Squad ${r.squadNumber}` : ''}</span>
                        </div>
                        <div style={{ fontWeight: "600", color: "white" }}>{r.name}</div>
                        
                        {r.reason && (
                          <div style={{ 
                            marginTop: "0.5rem", 
                            padding: "0.5rem 0.75rem", 
                            backgroundColor: activeTabAfternoon === "MISSED" ? "rgba(239,68,68,0.1)" : "rgba(234,179,8,0.1)", 
                            color: activeTabAfternoon === "MISSED" ? "#fca5a5" : "#fef08a",
                            fontSize: "0.8rem", 
                            borderRadius: "4px",
                            borderLeft: `3px solid ${activeTabAfternoon === "MISSED" ? "#ef4444" : "#eab308"}`
                          }}>
                            <strong>Reason / कारण:</strong> {r.reason}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              निवडलेल्या तारखेसाठी कोणतीही माहिती उपलब्ध नाही.
            </div>
          )}
        </div>
      )}

    </div>
  );
}

function ClipboardHeaderIcon({ viewMode }: { viewMode: "DAILY" | "SICK_PERIOD" }) {
  if (viewMode === "SICK_PERIOD") {
    return <Stethoscope size={32} color="#ef4444" />;
  }
  return <Calendar size={32} color="var(--accent-gold)" />;
}
