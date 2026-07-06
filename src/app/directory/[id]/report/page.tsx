import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AutoPrint from "@/components/AutoPrint";
import ManualPrintButton from "@/components/ManualPrintButton";
import { getSession } from "@/lib/auth";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recruit = await prisma.recruit.findUnique({ where: { id }, select: { name: true, chestNumber: true } });
  if (!recruit) return { title: "Report Not Found" };
  
  // Clean up name for filename usage
  const safeName = recruit.name.replace(/\s+/g, '_');
  return {
    title: `${safeName}_${recruit.chestNumber}`
  };
}

export default async function RecruitReport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  
  let generatedByName = 'System';
  if (session) {
    generatedByName = session.username;
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { fullName: true } });
    if (user && user.fullName) {
      generatedByName = user.fullName;
    }
  }

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

  const attendancePercentage = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 100;
  const printDate = new Date().toLocaleString('en-GB');

  // Helper for bilingual data values
  const bilingualMap: Record<string, string> = {
    "Male": "Male / पुरुष",
    "Female": "Female / महिला",
    "Other": "Other / इतर",
    "Single": "Single / अविवाहित",
    "Married": "Married / विवाहित",
    "Divorced": "Divorced / घटस्फोटीत",
    "Widowed": "Widowed / विधवा/विधुर",
    "Direct": "Direct / थेट",
    "Promoted": "Promoted / पदोन्नती",
    "Compassionate": "Compassionate / अनुकंपा",
    "Excellent": "Excellent / उत्कृष्ट",
    "Good": "Good / चांगले",
    "Average": "Average / सामान्य",
    "Poor": "Poor / खराब",
    "Yes": "Yes / होय",
    "No": "No / नाही"
  };

  const b = (val: string | null | undefined) => {
    if (!val) return "N/A / लागू नाही";
    return bilingualMap[val] || val;
  };

  const safeName = recruit.name.replace(/\s+/g, '_');
  const pdfFilename = `${safeName}_${recruit.chestNumber}.pdf`;

  return (
    <div className="report-wrapper">
      <AutoPrint filename={pdfFilename} />
      <ManualPrintButton filename={pdfFilename} />

      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --border-color: #000000;
          --text-muted: #333333;
          --text-main: #000000;
        }

        /* OVERRIDE APP LAYOUT FOR FULLSCREEN REPORT */
        .sidebar { display: none !important; }
        .main-content { 
          margin-left: 0 !important; 
          width: 100% !important; 
          padding: 0 !important; 
        }
        .app-container { 
          display: block !important; 
        }
        
        .report-wrapper {
          background-color: #f3f4f6;
          color: black;
          min-height: 100vh;
          padding: 20px;
        }

        .a4-page {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          padding: 20mm;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          font-family: 'Arial', sans-serif;
          color: var(--text-main);
          line-height: 1.4;
          border: 4px double #000;
        }

        @media print {
          html, body { 
            background-color: white !important; 
            color: black !important;
            height: auto !important;
            min-height: auto !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-hidden { display: none !important; }
          .report-wrapper { padding: 0 !important; background: white !important; min-height: auto !important; }
          .a4-page { box-shadow: none !important; margin: 0 auto !important; padding: 10mm !important; border: 4px double #000 !important; min-height: 290mm; }
          
          /* Prevent awkward breaks */
          .data-grid { page-break-inside: avoid; break-inside: avoid; }
          .section-title { page-break-after: avoid; break-after: avoid; page-break-inside: avoid; break-inside: avoid; }
          .clean-table { page-break-inside: auto; }
          .clean-table tr { page-break-inside: avoid; break-inside: avoid; }
        }

        .header-flex {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          border-bottom: 3px double var(--border-color);
          padding-bottom: 20px;
        }

        .header-center {
          flex: 1;
          text-align: center;
          padding: 0 20px;
        }

        .header-title {
          font-size: 22px;
          font-weight: bold;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .header-subtitle {
          font-size: 16px;
          color: var(--text-main);
          font-weight: bold;
          text-decoration: underline;
        }

        .photo-box {
          width: 120px;
          height: 150px;
          border: 2px solid var(--text-main);
          background-color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: var(--text-muted);
          text-align: center;
          padding: 2px;
        }

        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #fff;
          background-color: #000;
          padding: 6px 12px;
          margin: 20px 0 0 0;
          text-transform: uppercase;
          border: 1px solid #000;
        }

        .data-grid {
          display: grid;
          gap: 0;
          margin-bottom: 20px;
          border-top: none;
          border-left: 1px solid var(--border-color);
          border-right: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
        }

        .grid-2 { grid-template-columns: 1fr 1fr; }
        .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        .grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }

        .data-item {
          background-color: transparent;
          border: 1px solid var(--border-color);
          border-radius: 0;
          padding: 8px 12px;
          margin: -1px 0 0 -1px;
        }

        .data-label {
          font-size: 11px;
          color: var(--text-muted);
          margin-bottom: 4px;
          text-transform: uppercase;
          font-weight: bold;
        }

        .data-value {
          font-size: 13px;
          font-weight: bold;
          color: var(--text-main);
          word-break: break-word;
          overflow-wrap: break-word;
          white-space: pre-wrap;
        }

        .clean-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid var(--border-color);
          margin-top: 0;
          margin-bottom: 20px;
        }

        .clean-table th, .clean-table td {
          padding: 8px 12px;
          border: 1px solid var(--border-color);
          text-align: left;
          font-size: 12px;
        }

        .clean-table th {
          background-color: #f0f0f0;
          font-weight: bold;
          color: var(--text-main);
          text-transform: uppercase;
          font-size: 11px;
        }
        .clean-table th:last-child, .clean-table td:last-child { border-right: none; }

        .footer {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid var(--border-color);
          margin-top: 50px;
          padding-top: 15px;
          font-size: 11px;
          color: var(--text-muted);
        }
      `}} />

      <div className="a4-page" id="report-content">
        
        {/* 1. Clean Flex Header */}
        <div className="header-flex">
          <img src="/logo.png" alt="Logo" style={{ width: "90px" }} />
          
          <div className="header-center">
            <div className="header-title" style={{ fontSize: "24px" }}>पोलीस प्रशिक्षण केंद्र, अकोला <br/> POLICE TRAINING CENTRE, AKOLA</div>
            <div className="header-subtitle">प्रशिक्षणार्थी माहिती पत्रक / RECRUIT DETAILED REPORT</div>
          </div>

          <div className="photo-box">
            {recruit.photoUrl ? (
              <img src={recruit.photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              "PASSPORT PHOTO"
            )}
          </div>
        </div>

        {/* 2. Basic Information */}
        <div className="section-title">वैयक्तिक माहिती / PERSONAL INFORMATION</div>
        <div className="data-grid grid-2">
          <div className="data-item">
            <div className="data-label">छाती क्र. आणि पथक / CHEST NO & SQUAD</div>
            <div className="data-value">#{recruit.chestNumber} {recruit.squadNumber ? `(Squad: ${recruit.squadNumber})` : ""}</div>
          </div>
          <div className="data-item">
            <div className="data-label">पूर्ण नाव / FULL NAME</div>
            <div className="data-value">{recruit.name}</div>
          </div>
          <div className="data-item">
            <div className="data-label">वय / AGE</div>
            <div className="data-value">{recruit.age} वर्षे / Years</div>
          </div>
          <div className="data-item">
            <div className="data-label">लिंग / SEX</div>
            <div className="data-value">{b(recruit.sex)}</div>
          </div>
          <div className="data-item">
            <div className="data-label">रक्तगट / BLOOD GROUP</div>
            <div className="data-value">{recruit.bloodGroup || "N/A / लागू नाही"}</div>
          </div>
          <div className="data-item">
            <div className="data-label">मोबाईल क्रमांक / MOBILE NUMBER</div>
            <div className="data-value">{recruit.mobile}</div>
          </div>
          <div className="data-item">
            <div className="data-label">व्हॉट्सॲप क्र. / WHATSAPP NUMBER</div>
            <div className="data-value">{recruit.whatsappNumber || "N/A / लागू नाही"}</div>
          </div>
          <div className="data-item">
            <div className="data-label">वैवाहिक स्थिती / MARITAL STATUS</div>
            <div className="data-value">{b(recruit.maritalStatus)}</div>
          </div>
          <div className="data-item">
            <div className="data-label">शिक्षण / EDUCATION</div>
            <div className="data-value">{recruit.education || "N/A / लागू नाही"}</div>
          </div>
          <div className="data-item">
            <div className="data-label">धर्म / RELIGION</div>
            <div className="data-value">{recruit.religion || "N/A / लागू नाही"}</div>
          </div>
          <div className="data-item">
            <div className="data-label">जात / CASTE</div>
            <div className="data-value">{recruit.caste || "N/A / लागू नाही"}</div>
          </div>
          <div className="data-item">
            <div className="data-label">प्रवर्ग / CATEGORY</div>
            <div className="data-value">{recruit.category || "N/A / लागू नाही"}</div>
          </div>
        </div>

        <div className="section-title">कार्यालयीन माहिती / OFFICIAL DETAILS</div>
        <div className="data-grid grid-2">
          <div className="data-item">
            <div className="data-label">घटक / UNIT</div>
            <div className="data-value">{recruit.unit}</div>
          </div>
          <div className="data-item">
            <div className="data-label">प्रशिक्षण बॅच / TRAINING BATCH</div>
            <div className="data-value">
              {recruit.batch ? `${recruit.batch.name}\n(${new Date(recruit.batch.startDate).toLocaleDateString('en-GB')} - ${new Date(recruit.batch.endDate).toLocaleDateString('en-GB')})` : "Unassigned / नियुक्त नाही"}
            </div>
          </div>
          <div className="data-item" style={{ gridColumn: "span 2" }}>
            <div className="data-label">स्क्वाड क्रमांक / SQUAD NUMBER</div>
            <div className="data-value">{recruit.squadNumber || "N/A / लागू नाही"}</div>
          </div>
          <div className="data-item">
            <div className="data-label">नियुक्ती प्रवर्ग / APPT. CATEGORY</div>
            <div className="data-value">{recruit.appointmentCategory || "N/A / लागू नाही"}</div>
          </div>
          <div className="data-item">
            <div className="data-label">नियुक्ती प्रकार / APPT. TYPE</div>
            <div className="data-value">{b(recruit.appointmentType)}</div>
          </div>
          <div className="data-item">
            <div className="data-label">PTC मध्ये प्रवेश दिनांक / DATE OF ENTRY</div>
            <div className="data-value">{recruit.dateOfEntry ? new Date(recruit.dateOfEntry).toLocaleDateString('en-GB') : "N/A / लागू नाही"}</div>
          </div>
          <div className="data-item">
            <div className="data-label">घटकास परत केले? / RETURNED TO DISTRICT?</div>
            <div className="data-value">{recruit.isReturnedToDistrict ? "Yes / होय" : "No / नाही"}</div>
          </div>
          {recruit.isReturnedToDistrict && (
            <div className="data-item">
              <div className="data-label">परत केल्याचा दिनांक / RETURNED DATE</div>
              <div className="data-value">{recruit.returnedToDistrictDate ? new Date(recruit.returnedToDistrictDate).toLocaleDateString('en-GB') : "N/A / लागू नाही"}</div>
            </div>
          )}
        </div>

        {/* 3. Address & Contact */}
        <div className="section-title">पत्ता आणि संपर्क / ADDRESS DETAILS</div>
        <div className="data-grid grid-3">
          <div className="data-item" style={{ gridColumn: "span 3" }}>
            <div className="data-label">पूर्ण पत्ता / ADDRESS</div>
            <div className="data-value">{recruit.address || recruit.homeDistrict}</div>
          </div>
          <div className="data-item">
            <div className="data-label">मूळ जिल्हा / HOME DISTRICT</div>
            <div className="data-value">{recruit.homeDistrict}</div>
          </div>
          <div className="data-item">
            <div className="data-label">तालुका / TALUKA</div>
            <div className="data-value">{recruit.taluka || "-"}</div>
          </div>
          <div className="data-item">
            <div className="data-label">पिनकोड / PINCODE</div>
            <div className="data-value">{recruit.pincode || "-"}</div>
          </div>
          <div className="data-item" style={{ gridColumn: "span 3" }}>
            <div className="data-label">जवळचे पोलीस स्टेशन / NEAREST POLICE STATION</div>
            <div className="data-value">{recruit.nearestPoliceStation || "N/A / लागू नाही"}</div>
          </div>
        </div>

        {/* 4. Physical & Medical */}
        <div className="section-title">शारीरिक मापदंड व वैद्यकीय इतिहास / PHYSICAL & MEDICAL</div>
        <div className="data-grid grid-3">
          <div className="data-item">
            <div className="data-label">उंची / HEIGHT</div>
            <div className="data-value">{recruit.height} cm</div>
          </div>
          <div className="data-item">
            <div className="data-label">वजन / WEIGHT</div>
            <div className="data-value">{recruit.weight} kg</div>
          </div>
          <div className="data-item">
            <div className="data-label">जुना आजार / OLD DISEASE</div>
            <div className="data-value">No / नाही</div>
          </div>
        </div>

        {/* 5. Training Evaluation */}
        <div className="section-title">प्रशिक्षण मूल्यमापन अहवाल / TRAINING EVALUATION</div>
        {recruit.evaluations.length === 0 ? (
          <div className="data-item">No evaluations recorded yet.</div>
        ) : (
          recruit.evaluations.map((ev) => (
            <div key={ev.id} style={{ marginBottom: "30px", pageBreakInside: "avoid" }}>
              <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "15px", color: "var(--text-main)", borderBottom: "2px solid var(--text-main)", display: "inline-block", paddingBottom: "5px" }}>
                Week {ev.week.replace("-W", "-")} {ev.instructorName && `| Instructor: ${ev.instructorName}${ev.instructorStartDate && ev.instructorEndDate ? ` (${new Date(ev.instructorStartDate).toLocaleDateString('en-GB')} to ${new Date(ev.instructorEndDate).toLocaleDateString('en-GB')})` : ''} `}| Evaluator: {(ev as any).officer?.fullName || "Officer"}
              </div>
              <div className="data-grid grid-2">
                <div className="data-item">
                  <div className="data-label">शारीरिक प्रशिक्षण / PHYSICAL TRAINING</div>
                  <div className="data-value">{b(ev.physicalTraining)}</div>
                </div>
                <div className="data-item">
                  <div className="data-label">शस्त्र कवायत / WEAPON DRILL</div>
                  <div className="data-value">{b(ev.weaponDrill)}</div>
                </div>
                <div className="data-item">
                  <div className="data-label">क्षेत्र कला / FIELD CRAFTS</div>
                  <div className="data-value">{b(ev.fieldCrafts)}</div>
                </div>
                <div className="data-item">
                  <div className="data-label">कवायत / DRILLS</div>
                  <div className="data-value">{b(ev.drills)}</div>
                </div>
                <div className="data-item">
                  <div className="data-label">शस्त्र रणनीती / WEAPON TACTICS</div>
                  <div className="data-value">{b(ev.weaponTactics)}</div>
                </div>
                <div className="data-item" style={{ gridColumn: "span 2", backgroundColor: "white", borderLeft: "4px solid var(--text-main)" }}>
                  <div className="data-label">एकूण अभिप्राय / OVERALL REMARKS</div>
                  <div className="data-value" style={{ fontStyle: "italic" }}>{ev.overallRemarks}</div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* 6. Attendance */}
        <div className="section-title">मासिक हजेरी विश्लेषण / ATTENDANCE ANALYTICS</div>
        <div className="data-grid grid-4">
          <div className="data-item" style={{ textAlign: "center" }}>
            <div className="data-value" style={{ fontSize: "20px" }}>{totalSessions}</div>
            <div className="data-label" style={{ margin: "5px 0 0 0" }}>एकूण सत्रे / Sessions</div>
          </div>
          <div className="data-item" style={{ textAlign: "center" }}>
            <div className="data-value" style={{ fontSize: "20px", color: "#059669" }}>{presentSessions}</div>
            <div className="data-label" style={{ margin: "5px 0 0 0" }}>हजर / Present</div>
          </div>
          <div className="data-item" style={{ textAlign: "center" }}>
            <div className="data-value" style={{ fontSize: "20px", color: "#dc2626" }}>{missedSessions}</div>
            <div className="data-label" style={{ margin: "5px 0 0 0" }}>चुकले / Missed</div>
          </div>
          <div className="data-item" style={{ textAlign: "center" }}>
            <div className="data-value" style={{ fontSize: "20px" }}>{attendancePercentage}%</div>
            <div className="data-label" style={{ margin: "5px 0 0 0" }}>प्रमाण / Rate</div>
          </div>
        </div>

        <div style={{ marginTop: "25px", marginBottom: "10px", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>
          चुकलेल्या सत्रांचे कारण / REASON(S) OF MISSED SESSIONS:
        </div>
        <table className="clean-table">
          <thead>
            <tr>
              <th>दिनांक / Date</th>
              <th>सत्र / Session</th>
              <th>गैरहजेरीचे कारण / Reason</th>
            </tr>
          </thead>
          <tbody>
            {recruit.attendances.filter(a => a.morningStatus === "MISSED" || a.morningStatus === "ABSENT" || a.afternoonStatus === "MISSED" || a.afternoonStatus === "ABSENT").length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", fontStyle: "italic", color: "var(--text-muted)" }}>No absences recorded.</td>
              </tr>
            ) : (
              recruit.attendances.map(a => {
                const rows = [];
                const dateStr = new Date(a.date).toLocaleDateString('en-GB');
                if (a.morningStatus === "MISSED" || a.morningStatus === "ABSENT") {
                  rows.push(
                    <tr key={`${a.id}-m`}>
                      <td style={{ width: "20%" }}>{dateStr}</td>
                      <td style={{ width: "20%" }}>Morning / सकाळ</td>
                      <td>{a.morningReason || "Not specified"}</td>
                    </tr>
                  );
                }
                if (a.afternoonStatus === "MISSED" || a.afternoonStatus === "ABSENT") {
                  rows.push(
                    <tr key={`${a.id}-a`}>
                      <td style={{ width: "20%" }}>{dateStr}</td>
                      <td style={{ width: "20%" }}>Afternoon / दुपार</td>
                      <td>{a.afternoonReason || "Not specified"}</td>
                    </tr>
                  );
                }
                return rows;
              })
            )}
          </tbody>
        </table>

        {/* 7. Footer */}
        <div className="footer">
          <div>
            िरपोटर् वेळ / Report Generated: {printDate} <br />
            तयार कर्ता / Generated By: {session ? `${generatedByName} (${session.role})` : 'System'}
          </div>
          <div style={{ textAlign: "right" }}>महाराष्ट्र पोलीस प्रशिक्षण केंद्र <br/> PTC Akola</div>
        </div>

      </div>
    </div>
  );
}
