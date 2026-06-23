"use client";

import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, Upload, Save, CheckCircle, ArrowLeft } from "lucide-react";
import { updateRecruit } from "@/app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EditRecruitClient({ recruit, batches = [] }: { recruit: any, batches?: any[] }) {
  const webcamRef = useRef<Webcam>(null);
  const [photo, setPhoto] = useState<string | null>(recruit.photoUrl || null);
  const [useCamera, setUseCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setPhoto(imageSrc);
      setUseCamera(false);
    }
  }, [webcamRef]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    // Only append if it's a NEW photo (data URL)
    if (photo && photo.startsWith("data:image")) {
      formData.append("photoUrl", photo);
    } else if (recruit.photoUrl && photo === recruit.photoUrl) {
      // Retain existing
      formData.append("photoUrl", recruit.photoUrl);
    }

    const result = await updateRecruit(recruit.id, formData);
    
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || "अपडेट अयशस्वी. / Update failed.");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="glass-card" style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center", padding: "4rem 2rem" }}>
        <CheckCircle size={64} color="var(--success)" style={{ margin: "0 auto 1.5rem" }} />
        <h1 className="heading-1" style={{ marginBottom: "0.5rem" }}>Profile Updated!</h1>
        <h2 className="heading-2" style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>माहिती यशस्वीरीत्या अपडेट केली!</h2>
        <p style={{ marginBottom: "2rem" }}>The recruit profile has been successfully modified.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
          <button onClick={() => router.push(`/directory/${recruit.id}`)} className="btn btn-primary" style={{ padding: "0.75rem 2rem" }}>
            Return to Profile / प्रोफाइलवर परत जा
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <Link href={`/directory/${recruit.id}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", textDecoration: "none", marginBottom: "1.5rem" }}>
          <ArrowLeft size={16} /> Back to Dossier / मागे जा
        </Link>
        <h1 className="heading-1" style={{ marginBottom: "0.5rem" }}>Edit Recruit Profile</h1>
        <h2 className="heading-2" style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>प्रशिक्षणार्थी माहिती संपादित करा</h2>
      </div>

      {error && (
        <div className="badge badge-error" style={{ padding: "1rem", marginBottom: "1rem", fontSize: "1rem" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card">
        <h2 className="heading-2" style={{ marginBottom: "0.25rem" }}>Photo Capture</h2>
        <p className="text-muted" style={{ marginBottom: "1.5rem", fontSize: "0.875rem" }}>फोटो काढा किंवा अपलोड करा</p>
        
        <div style={{ display: "flex", gap: "2rem", marginBottom: "2rem", flexWrap: "wrap" }}>
          <div style={{ flex: "1", minWidth: "300px" }}>
            {useCamera ? (
              <div style={{ position: "relative", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width="100%"
                  videoConstraints={{ facingMode: "user" }}
                />
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)" }}
                  onClick={capture}
                >
                  <Camera size={16} /> Capture / फोटो काढा
                </button>
              </div>
            ) : photo ? (
              <div style={{ position: "relative" }}>
                <img src={photo} alt="Recruit" style={{ width: "100%", borderRadius: "var(--radius-md)", border: "2px solid var(--border)" }} />
                <button type="button" className="btn btn-outline" style={{ marginTop: "1rem", width: "100%" }} onClick={() => setPhoto(null)}>
                  Change Photo / फोटो बदला
                </button>
              </div>
            ) : (
              <div style={{ height: "240px", backgroundColor: "var(--background)", border: "2px dashed var(--border)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p className="text-muted">No photo / फोटो नाही</p>
              </div>
            )}
          </div>
          
          <div style={{ flex: "1", minWidth: "300px", display: "flex", flexDirection: "column", gap: "1rem", justifyContent: "center" }}>
            <button type="button" className="btn btn-primary" onClick={() => setUseCamera(true)}>
              <Camera size={18} /> Use Device Camera / कॅमेरा वापरा
            </button>
            <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>— OR —</div>
            <label className="btn btn-outline" style={{ cursor: "pointer", display: "flex" }}>
              <Upload size={18} /> Upload Photo / फोटो अपलोड करा
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        <h2 className="heading-2" style={{ marginBottom: "0.25rem" }}>Personal Information</h2>
        <p className="text-muted" style={{ marginBottom: "1.5rem", fontSize: "0.875rem" }}>वैयक्तिक माहिती</p>
        
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Full Name / पूर्ण नाव *</label>
            <input name="name" type="text" className="form-input" required defaultValue={recruit.name} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Chest Number / छाती क्रमांक *</label>
            <input name="chestNumber" type="text" className="form-input" required defaultValue={recruit.chestNumber} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Age / वय *</label>
            <input name="age" type="number" min="18" max="40" className="form-input" required defaultValue={recruit.age} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Sex / लिंग *</label>
            <select name="sex" className="form-select" required defaultValue={recruit.sex}>
              <option value="">Select / निवडा</option>
              <option value="Male">Male / पुरुष</option>
              <option value="Female">Female / स्त्री</option>
              <option value="Transgender">Transgender / तृतीयपंथी</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Religion / धर्म</label>
            <select name="religion" className="form-select" defaultValue={recruit.religion || ""}>
              <option value="">Select / निवडा</option>
              <option value="Hindu">Hindu / हिंदू</option>
              <option value="Muslim">Muslim / मुस्लिम</option>
              <option value="Buddhist">Buddhist / बौद्ध</option>
              <option value="Christian">Christian / ख्रिश्चन</option>
              <option value="Sikh">Sikh / शीख</option>
              <option value="Jain">Jain / जैन</option>
              <option value="Parsi">Parsi / पारशी</option>
              <option value="Other">Other / इतर</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Caste / जात</label>
            <input name="caste" type="text" className="form-input" defaultValue={recruit.caste || ""} />
          </div>

          <div className="form-group">
            <label className="form-label">Category / प्रवर्ग</label>
            <select name="category" className="form-select" defaultValue={recruit.category || ""}>
              <option value="">Select / निवडा</option>
              <option value="Open">Open</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="VJ/NT">VJ/NT</option>
              <option value="SBC">SBC</option>
              <option value="EWS">EWS</option>
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1", backgroundColor: "rgba(255,255,255,0.05)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
            <label className="form-label" style={{ fontSize: "1.1rem" }}>Training Batch / प्रशिक्षण बॅच</label>
            <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>Assign this recruit to an active training batch.</p>
            <select name="batchId" className="form-select" defaultValue={recruit.batchId || ""} style={{ borderColor: "var(--accent-gold)" }}>
              <option value="">No Batch Assigned / कोणतीही बॅच नाही</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({new Date(b.startDate).toLocaleDateString('en-GB')} - {new Date(b.endDate).toLocaleDateString('en-GB')})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Appointment Category / नियुक्ती प्रवर्ग</label>
            <select name="appointmentCategory" className="form-select" defaultValue={recruit.appointmentCategory || ""}>
              <option value="">Select / निवडा</option>
              <option value="General">General</option>
              <option value="Driver">Driver</option>
              <option value="Bandsman">Bandsman</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Appointment Type / नियुक्ती प्रकार</label>
            <select name="appointmentType" className="form-select" defaultValue={recruit.appointmentType || ""}>
              <option value="">Select / निवडा</option>
              <option value="General">General</option>
              <option value="Police Boy">Police Boy</option>
              <option value="Compassionate">Compassionate</option>
              <option value="Dharangrastha/Purgrastha">Dharangrastha/Purgrastha</option>
              <option value="Sportsman">Sportsman</option>
              <option value="Ex-Serviceman">Ex-Serviceman</option>
              <option value="Homeguard">Homeguard</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Unit / घटक *</label>
            <input name="unit" type="text" className="form-input" required defaultValue={recruit.unit} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Squad Number / स्क्वाड क्रमांक</label>
            <input name="squadNumber" type="text" className="form-input" defaultValue={recruit.squadNumber || ""} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Home District / मूळ जिल्हा *</label>
            <select name="homeDistrict" className="form-select" required defaultValue={recruit.homeDistrict}>
              <option value="">Select District / जिल्हा निवडा</option>
              <option value="Ahmednagar">Ahmednagar / अहमदनगर</option>
              <option value="Akola">Akola / अकोला</option>
              <option value="Amravati">Amravati / अमरावती</option>
              <option value="Chhatrapati Sambhajinagar">Chhatrapati Sambhajinagar / छत्रपती संभाजीनगर</option>
              <option value="Beed">Beed / बीड</option>
              <option value="Bhandara">Bhandara / भंडारा</option>
              <option value="Buldhana">Buldhana / बुलढाणा</option>
              <option value="Chandrapur">Chandrapur / चंद्रपूर</option>
              <option value="Dhule">Dhule / धुळे</option>
              <option value="Gadchiroli">Gadchiroli / गडचिरोली</option>
              <option value="Gondia">Gondia / गोंदिया</option>
              <option value="Hingoli">Hingoli / हिंगोली</option>
              <option value="Jalgaon">Jalgaon / जळगाव</option>
              <option value="Jalna">Jalna / जालना</option>
              <option value="Kolhapur">Kolhapur / कोल्हापूर</option>
              <option value="Latur">Latur / लातूर</option>
              <option value="Mumbai City">Mumbai City / मुंबई शहर</option>
              <option value="Mumbai Suburban">Mumbai Suburban / मुंबई उपनगर</option>
              <option value="Nagpur">Nagpur / नागपूर</option>
              <option value="Nanded">Nanded / नांदेड</option>
              <option value="Nandurbar">Nandurbar / नंदुरबार</option>
              <option value="Nashik">Nashik / नाशिक</option>
              <option value="Dharashiv">Dharashiv / धाराशिव</option>
              <option value="Palghar">Palghar / पालघर</option>
              <option value="Parbhani">Parbhani / परभणी</option>
              <option value="Pune">Pune / पुणे</option>
              <option value="Raigad">Raigad / रायगड</option>
              <option value="Ratnagiri">Ratnagiri / रत्नागिरी</option>
              <option value="Sangli">Sangli / सांगली</option>
              <option value="Satara">Satara / सातारा</option>
              <option value="Sindhudurg">Sindhudurg / सिंधुदुर्ग</option>
              <option value="Solapur">Solapur / सोलापूर</option>
              <option value="Thane">Thane / ठाणे</option>
              <option value="Wardha">Wardha / वर्धा</option>
              <option value="Washim">Washim / वाशिम</option>
              <option value="Yavatmal">Yavatmal / यवतमाळ</option>
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">Address / पत्ता</label>
            <textarea name="address" className="form-textarea" rows={3} placeholder="Full home address..." defaultValue={recruit.address || ""}></textarea>
          </div>
          
          <div className="form-group">
            <label className="form-label">Mobile Number / मोबाईल क्रमांक *</label>
            <input name="mobile" type="tel" className="form-input" required defaultValue={recruit.mobile} />
          </div>

          <div className="form-group">
            <label className="form-label">WhatsApp Number / व्हॉट्सॲप नंबर</label>
            <input name="whatsappNumber" type="tel" className="form-input" defaultValue={recruit.whatsappNumber || ""} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Marital Status / वैवाहिक स्थिती *</label>
            <select name="maritalStatus" className="form-select" required defaultValue={recruit.maritalStatus}>
              <option value="">Select / निवडा</option>
              <option value="Single">Single / अविवाहित</option>
              <option value="Married">Married / विवाहित</option>
              <option value="Divorced">Divorced / घटस्फोटीत</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Education / शिक्षण *</label>
            <input name="education" type="text" className="form-input" required defaultValue={recruit.education} />
          </div>

          <div className="form-group">
            <label className="form-label">Blood Group / रक्तगट</label>
            <select name="bloodGroup" className="form-select" defaultValue={recruit.bloodGroup || ""}>
              <option value="">Unknown / माहिती नाही</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Height (cm) / उंची (सेमी) *</label>
            <input name="height" type="number" step="0.1" className="form-input" required defaultValue={recruit.height} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Weight (kg) / वजन (किलो) *</label>
            <input name="weight" type="number" step="0.1" className="form-input" required defaultValue={recruit.weight} />
          </div>
        </div>

        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-accent" style={{ padding: "1rem 2rem", fontSize: "1.1rem" }} disabled={loading}>
            <Save size={20} /> {loading ? "Saving..." : "Update Profile / माहिती अपडेट करा"}
          </button>
        </div>
      </form>
    </div>
  );
}
