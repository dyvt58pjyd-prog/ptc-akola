import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { User, MapPin, Target, Calendar, Phone, Droplet, Activity, Printer, Award, Shield, FileText, Edit } from "lucide-react";
import DeleteEvaluationButton from "@/components/DeleteEvaluationButton";
import DeleteRecruitButton from "@/components/DeleteRecruitButton";

export default async function RecruitProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const recruit = await prisma.recruit.findUnique({
    where: { id },
    include: {
      batch: true,
      attendances: { orderBy: { date: "desc" } },
      evaluations: { 
        orderBy: [
          { year: "desc" },
          { week: "desc" }
        ],
        include: { officer: true }
      }
    }
  });

  if (!recruit) {
    notFound();
  }

  // Calculate Attendance Stats
  let totalSessions = 0;
  let presentSessions = 0;
  let missedSessions = 0;
  let leaveSessions = 0;
  
  recruit.attendances.forEach(a => {
    if (a.morningStatus !== "PENDING") {
      totalSessions++;
      if (a.morningStatus === "PRESENT") presentSessions++;
      else if (a.morningStatus === "MISSED" || a.morningStatus === "ABSENT") missedSessions++;
      else if (a.morningStatus === "LEAVE") leaveSessions++;
    }

    if (a.afternoonStatus !== "PENDING") {
      totalSessions++;
      if (a.afternoonStatus === "PRESENT") presentSessions++;
      else if (a.afternoonStatus === "MISSED" || a.afternoonStatus === "ABSENT") missedSessions++;
      else if (a.afternoonStatus === "LEAVE") leaveSessions++;
    }
  });

  const attendancePercentage = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;
  const isPassing = attendancePercentage >= 75;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "4rem" }}>
      
      {/* 1. Page Header & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="heading-1" style={{ marginBottom: "0.25rem" }}>Recruit Dossier / प्रशिक्षणार्थी माहिती</h1>
          <p className="text-muted" style={{ fontSize: "1.1rem" }}>Digital record and performance tracking / डिजिटल माहिती आणि कामगिरीचा मागोवा</p>
        </div>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <Link href={`/directory/${id}/edit`} className="btn btn-outline" style={{ padding: "0.8rem 1.5rem", fontSize: "1.05rem" }}>
            <Edit size={20} /> Edit Profile / संपादित करा
          </Link>
          <DeleteRecruitButton recruitId={id} recruitName={recruit.name} />
          <Link href={`/directory/${id}/report`} target="_blank" className="btn btn-primary" style={{ padding: "0.8rem 1.5rem", fontSize: "1.05rem" }}>
            <Printer size={20} />
            Generate Official Report / अधिकृत अहवाल
          </Link>
        </div>
      </div>

      {recruit.isReturnedToDistrict && (
        <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "#fca5a5", padding: "1.5rem", borderRadius: "var(--radius-lg)", marginBottom: "2.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ backgroundColor: "rgba(239, 68, 68, 0.2)", padding: "0.75rem", borderRadius: "50%", color: "var(--error)" }}>
            <Target size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>RETURNED TO DISTRICT / जिल्ह्यात परत पाठवले</h3>
            <p style={{ margin: "0.25rem 0 0 0", opacity: 0.9 }}>This recruit has been marked as returned to their home district on <strong>{recruit.returnedToDistrictDate ? new Date(recruit.returnedToDistrictDate).toLocaleDateString('en-GB') : "Unknown Date"}</strong> and is no longer active in training.</p>
          </div>
        </div>
      )}

      {/* 2. Primary Identity Card (Hero Section) */}
      <div className="glass-card" style={{ marginBottom: "2.5rem", padding: "3rem", display: "flex", flexWrap: "wrap", gap: "3rem", alignItems: "center", position: "relative", overflow: "hidden" }}>
        {/* Subtle background glow */}
        <div style={{ position: "absolute", top: "-50%", right: "-10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
        
        <div style={{ 
          width: "200px", height: "200px", borderRadius: "var(--radius-lg)", 
          backgroundColor: "var(--primary-navy)", color: "var(--text-muted)",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", flexShrink: 0, border: "4px solid rgba(255,255,255,0.1)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)"
        }}>
          {recruit.photoUrl ? (
            <img src={recruit.photoUrl} alt={recruit.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <User size={80} strokeWidth={1} />
          )}
        </div>
        
        <div style={{ flex: 1, minWidth: "300px", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "2rem" }}>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "2.5rem", fontWeight: "800", color: "white", lineHeight: "1.1", marginBottom: "0.5rem" }}>{recruit.name}</h2>
                <div style={{ fontSize: "1.1rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <MapPin size={18} /> {recruit.homeDistrict}, Maharashtra
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <span className="badge badge-gold" style={{ fontSize: "1.1rem", padding: "0.5rem 1.25rem" }}>Chest: #{recruit.chestNumber}</span>
                <span className="badge badge-navy" style={{ fontSize: "1.1rem", padding: "0.5rem 1.25rem" }}>Unit: {recruit.unit}</span>
                {recruit.squadNumber && <span className="badge badge-navy" style={{ fontSize: "1.1rem", padding: "0.5rem 1.25rem", backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white" }}>Squad: {recruit.squadNumber}</span>}
              </div>
            </div>

            <div style={{ textAlign: "right", backgroundColor: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: "3.5rem", fontWeight: "800", color: isPassing ? "var(--success)" : "var(--error)", lineHeight: "1", textShadow: "0 0 20px rgba(0,0,0,0.5)" }}>
                {attendancePercentage}%
              </div>
              <div style={{ fontSize: "1rem", color: "var(--text-muted)", marginTop: "0.5rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>
                Total Attendance / एकूण उपस्थिती
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* 3. Detailed Specs Grid */}
      <div className="grid-3" style={{ marginBottom: "2.5rem" }}>
        
        {/* Bio Card */}
        <div className="glass-card" style={{ padding: "2rem" }}>
          <h3 className="heading-2" style={{ fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem" }}>
            <User size={20} color="var(--accent-blue)" /> Biographical Data / वैयक्तिक माहिती
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Training Batch / प्रशिक्षण बॅच</span> <strong style={{ color: "var(--accent-gold)" }}>{recruit.batch ? `${recruit.batch.name} (${new Date(recruit.batch.startDate).toLocaleDateString('en-GB')} - ${new Date(recruit.batch.endDate).toLocaleDateString('en-GB')})` : "Unassigned"}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Date of Entry / प्रवेशाची तारीख</span> <strong style={{ color: "white" }}>{recruit.dateOfEntry ? new Date(recruit.dateOfEntry).toLocaleDateString('en-GB') : "-"}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Age / वय</span> <strong style={{ color: "white" }}>{recruit.age} Years</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Sex / लिंग</span> <strong style={{ color: "white" }}>{recruit.sex}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Contact / संपर्क</span> <strong style={{ color: "white" }}>📞 {recruit.mobile} {recruit.whatsappNumber ? `| 💬 ${recruit.whatsappNumber}` : ""}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Marital Status / वैवाहिक स्थिती</span> <strong style={{ color: "white" }}>{recruit.maritalStatus}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Religion/Caste / धर्म/जात</span> <strong style={{ color: "white" }}>{recruit.religion || "-"} / {recruit.caste || "-"}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Category / प्रवर्ग</span> <strong style={{ color: "white" }}>{recruit.category || "-"}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Appt. Category / नियुक्ती प्रवर्ग</span> <strong style={{ color: "white" }}>{recruit.appointmentCategory || "-"}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Appt. Type / नियुक्ती प्रकार</span> <strong style={{ color: "white" }}>{recruit.appointmentType || "-"}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}><span className="text-muted">Address / पत्ता</span> <strong style={{ color: "white", textAlign: "right", maxWidth: "250px" }}>{recruit.address || "-"}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Taluka / तालुका</span> <strong style={{ color: "white" }}>{recruit.taluka || "-"}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span className="text-muted">Pincode / पिन कोड</span> <strong style={{ color: "white" }}>{recruit.pincode || "-"}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}><span className="text-muted">Nearest Police Station / जवळचे पोलीस स्टेशन</span> <strong style={{ color: "white", textAlign: "right", maxWidth: "250px" }}>{recruit.nearestPoliceStation || "-"}</strong></div>
          </div>
        </div>

        {/* Physical Metrics Card */}
        <div className="glass-card" style={{ padding: "2rem" }}>
          <h3 className="heading-2" style={{ fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem" }}>
            <Activity size={20} color="var(--accent-gold)" /> Physical Metrics / शारीरिक माहिती
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="text-muted">Height / उंची</span> 
              <strong style={{ color: "white", fontSize: "1.25rem" }}>{recruit.height} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>cm</span></strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="text-muted">Weight / वजन</span> 
              <strong style={{ color: "white", fontSize: "1.25rem" }}>{recruit.weight} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>kg</span></strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="text-muted">Blood Group / रक्तगट</span> 
              <div style={{ backgroundColor: "rgba(248, 113, 113, 0.15)", color: "#fca5a5", padding: "0.25rem 1rem", borderRadius: "4px", fontWeight: "bold" }}>
                {recruit.bloodGroup || "Unknown"}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
              <span className="text-muted">Education / शिक्षण</span> 
              <strong style={{ color: "white" }}>{recruit.education || "-"}</strong>
            </div>
          </div>
        </div>

        {/* Attendance Breakdown Card */}
        <div className="glass-card" style={{ padding: "2rem", backgroundColor: isPassing ? "rgba(52, 211, 153, 0.03)" : "rgba(248, 113, 113, 0.03)" }}>
          <h3 className="heading-2" style={{ fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem" }}>
            <Calendar size={20} color={isPassing ? "var(--success)" : "var(--error)"} /> Session Breakdown / उपस्थिती तपशील
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ backgroundColor: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div className="text-muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "0.25rem" }}>Total / एकूण</div>
              <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "white" }}>{totalSessions}</div>
            </div>
            <div style={{ backgroundColor: "rgba(52, 211, 153, 0.1)", padding: "1rem", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div className="text-muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "0.25rem" }}>Present / हजर</div>
              <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--success)" }}>{presentSessions}</div>
            </div>
            <div style={{ backgroundColor: "rgba(248, 113, 113, 0.1)", padding: "1rem", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div className="text-muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "0.25rem" }}>Missed / चुकले</div>
              <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--error)" }}>{missedSessions}</div>
            </div>
            <div style={{ backgroundColor: "rgba(251, 191, 36, 0.1)", padding: "1rem", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div className="text-muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "0.25rem" }}>Leave / रजा</div>
              <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--accent-gold)" }}>{leaveSessions}</div>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Main Content Split (Evaluations & Log) */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2.5rem" }}>
        
        {/* Left Column: Evaluations */}
        <div>
          <h2 className="heading-2" style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <Shield size={24} color="var(--primary-navy-light)" fill="var(--accent-blue)" /> Weekly Field Evaluations / आठवडा निहाय मूल्यमापन
          </h2>
          
          {recruit.evaluations.length === 0 ? (
            <div className="glass-card" style={{ textAlign: "center", padding: "4rem 2rem", opacity: 0.7 }}>
              <FileText size={48} style={{ margin: "0 auto 1rem", color: "var(--text-muted)" }} />
              <h3 style={{ fontSize: "1.2rem", color: "white", marginBottom: "0.5rem" }}>No Evaluations Yet / अद्याप मूल्यमापन नाही</h3>
              <p className="text-muted">Field officers have not submitted any performance evaluations for this recruit.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {recruit.evaluations.map(ev => (
                <div key={ev.id} className="glass-card" style={{ padding: "0", overflow: "hidden" }}>
                  {/* Eval Header */}
                  <div style={{ backgroundColor: "rgba(0,0,0,0.3)", padding: "1.25rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "1.25rem", fontWeight: "800", color: "white" }}>{ev.week.replace("-W", " - WEEK ")}</span>
                      {ev.instructorName && (
                        <span className="badge badge-gold" style={{ backgroundColor: "rgba(251, 191, 36, 0.1)" }}>
                          Instructor: {ev.instructorName}
                        </span>
                      )}
                      <span className="badge badge-navy">Logged by {(ev as any).officer?.fullName || "Officer"}</span>
                    </div>
                    <DeleteEvaluationButton evaluationId={ev.id} />
                  </div>
                  
                  {/* Eval Body */}
                  <div style={{ padding: "2rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
                      <div>
                        <div className="text-muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.5rem" }}>Physical Training</div>
                        <div style={{ color: "white", backgroundColor: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "6px", fontSize: "0.95rem", lineHeight: "1.6" }}>{ev.physicalTraining}</div>
                      </div>
                      <div>
                        <div className="text-muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.5rem" }}>Drills</div>
                        <div style={{ color: "white", backgroundColor: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "6px", fontSize: "0.95rem", lineHeight: "1.6" }}>{ev.drills}</div>
                      </div>
                      <div>
                        <div className="text-muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.5rem" }}>Weapon Drill</div>
                        <div style={{ color: "white", backgroundColor: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "6px", fontSize: "0.95rem", lineHeight: "1.6" }}>{ev.weaponDrill}</div>
                      </div>
                      <div>
                        <div className="text-muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.5rem" }}>Weapon Tactics</div>
                        <div style={{ color: "white", backgroundColor: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "6px", fontSize: "0.95rem", lineHeight: "1.6" }}>{ev.weaponTactics}</div>
                      </div>
                      <div style={{ gridColumn: "span 2" }}>
                        <div className="text-muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.5rem" }}>Field Crafts</div>
                        <div style={{ color: "white", backgroundColor: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "6px", fontSize: "0.95rem", lineHeight: "1.6" }}>{ev.fieldCrafts}</div>
                      </div>
                    </div>

                    {/* Overall Remarks */}
                    <div style={{ backgroundColor: "rgba(251, 191, 36, 0.05)", borderLeft: "4px solid var(--accent-gold)", padding: "1.5rem", borderRadius: "0 6px 6px 0" }}>
                      <div style={{ color: "var(--accent-gold)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.5rem", fontWeight: "700" }}>Commanding Officer Remarks / अधिकाऱ्याचा अभिप्राय</div>
                      <p style={{ color: "white", fontStyle: "italic", fontSize: "1.05rem", lineHeight: "1.6" }}>"{ev.overallRemarks}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Attendance Log */}
        <div>
          <div className="glass-card" style={{ position: "sticky", top: "2rem", padding: "0", overflow: "hidden" }}>
            <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(0,0,0,0.2)" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "white", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Calendar size={20} color="var(--accent-blue)" /> Recent Attendance Log / अलीकडील उपस्थिती नोंद
              </h2>
            </div>
            
            <div style={{ padding: "1.5rem" }}>
              {recruit.attendances.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-muted)" }}>No records found.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {recruit.attendances.slice(0, 8).map(att => (
                    <div key={att.id} style={{ padding: "1rem", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ color: "white", fontWeight: "600", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        {new Date(att.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span className="text-muted">Morning / सकाळ</span>
                          <span className={`badge ${att.morningStatus === "PRESENT" ? "badge-success" : att.morningStatus === "ABSENT" ? "badge-error" : "badge-gold"}`}>
                            {att.morningStatus}
                          </span>
                        </div>
                        {att.morningReason && <div style={{ fontSize: "0.8rem", color: "var(--error)", paddingLeft: "0.5rem", borderLeft: "2px solid var(--error)", marginTop: "0.25rem" }}>{att.morningReason}</div>}
                        
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                          <span className="text-muted">Afternoon / दुपार</span>
                          <span className={`badge ${att.afternoonStatus === "PRESENT" ? "badge-success" : att.afternoonStatus === "ABSENT" ? "badge-error" : "badge-gold"}`}>
                            {att.afternoonStatus}
                          </span>
                        </div>
                        {att.afternoonReason && <div style={{ fontSize: "0.8rem", color: "var(--error)", paddingLeft: "0.5rem", borderLeft: "2px solid var(--error)", marginTop: "0.25rem" }}>{att.afternoonReason}</div>}
                      </div>
                    </div>
                  ))}
                  
                  {recruit.attendances.length > 8 && (
                    <div className="text-muted" style={{ textAlign: "center", fontSize: "0.85rem", marginTop: "1rem" }}>
                      Showing most recent 8 records
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
