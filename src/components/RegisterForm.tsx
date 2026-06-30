"use client";

import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, Upload, Save } from "lucide-react";
import { registerRecruit } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function RegisterForm({ redirectUrl }: { redirectUrl: string }) {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (photo) {
      formData.append("photoUrl", photo);
    }

    const result = await registerRecruit(formData);
    
    if (result.success) {
      router.push(redirectUrl);
    } else {
      setError(result.error || "Failed to register recruit.");
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <img 
          src="http://www.ptcnanveej-daund.in/wp-content/uploads/2021/07/logo.png" 
          alt="PTC Logo" 
          style={{ width: "120px", height: "auto", margin: "0 auto 1rem", display: "block" }} 
        />
        <h1 className="heading-1" style={{ marginBottom: "0.5rem" }}>Police Training Centre, Akola / पोलीस प्रशिक्षण केंद्र, अकोला</h1>
        <h2 className="heading-2" style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>नवीन प्रशिक्षणार्थी नोंदणी / New Recruit Registration</h2>
        <p className="text-muted">
          Fill in the details to enroll a new recruit. Fields marked with * are required. / कृपया माहिती अचूक भरा. * चिन्हांकित फील्ड्स आवश्यक आहेत.
        </p>
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
                  Retake / पुन्हा काढा
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
            <input name="name" type="text" className="form-input" required placeholder="e.g. Rahul Sharma" />
          </div>
          
          <div className="form-group">
            <label className="form-label">Chest Number / छाती क्रमांक *</label>
            <input name="chestNumber" type="text" className="form-input" required placeholder="e.g. PTC-1001" />
          </div>
          
          <div className="form-group">
            <label className="form-label">Age / वय *</label>
            <input name="age" type="number" className="form-input" required placeholder="e.g. 24" />
          </div>
          
          <div className="form-group">
            <label className="form-label">Sex / लिंग *</label>
            <select name="sex" className="form-select" required>
              <option value="">Select / निवडा</option>
              <option value="Male">Male / पुरुष</option>
              <option value="Female">Female / स्त्री</option>
              <option value="Transgender">Transgender / तृतीयपंथी</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Religion / धर्म</label>
            <select name="religion" className="form-select">
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
            <input name="caste" type="text" className="form-input" placeholder="e.g. Maratha..." />
          </div>

          <div className="form-group">
            <label className="form-label">Category / प्रवर्ग</label>
            <select name="category" className="form-select">
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
          
          <div className="form-group">
            <label className="form-label">Unit / घटक *</label>
            <input name="unit" type="text" className="form-input" required placeholder="e.g. Alpha Company" />
          </div>
          
          <div className="form-group">
            <label className="form-label">Home District / मूळ जिल्हा *</label>
            <input name="homeDistrict" type="text" className="form-input" required placeholder="e.g. Pune" />
          </div>
          
          <div className="form-group">
            <label className="form-label">Mobile Number / मोबाईल क्रमांक *</label>
            <input name="mobile" type="tel" className="form-input" required placeholder="e.g. 9876543210" />
          </div>
          
          <div className="form-group">
            <label className="form-label">Marital Status / वैवाहिक स्थिती *</label>
            <select name="maritalStatus" className="form-select" required>
              <option value="">Select / निवडा</option>
              <option value="Single">Single / अविवाहित</option>
              <option value="Married">Married / विवाहित</option>
              <option value="Divorced">Divorced / घटस्फोटीत</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Education / शिक्षण *</label>
            <input name="education" type="text" className="form-input" required placeholder="e.g. B.A. / 12th Pass" />
          </div>

          <div className="form-group">
            <label className="form-label">Blood Group / रक्तगट</label>
            <select name="bloodGroup" className="form-select">
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
            <input name="height" type="number" step="0.1" className="form-input" required placeholder="e.g. 175.5" />
          </div>
          
          <div className="form-group">
            <label className="form-label">Weight (kg) / वजन (किलो) *</label>
            <input name="weight" type="number" step="0.1" className="form-input" required placeholder="e.g. 72.0" />
          </div>
        </div>

        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-accent" style={{ padding: "1rem 2rem", fontSize: "1.1rem" }} disabled={loading}>
            <Save size={20} /> {loading ? "Saving..." : "Save Recruit Profile / नोंदणी पूर्ण करा"}
          </button>
        </div>
      </form>
    </div>
  );
}
