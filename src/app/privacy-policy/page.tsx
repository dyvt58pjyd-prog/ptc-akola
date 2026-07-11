import React from "react";

export const metadata = {
  title: "Privacy Policy | PTC Akola Training Management System",
  description: "Privacy Policy for PTC Akola Training Management mobile and web applications.",
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 1.5rem", color: "#f3f4f6", fontFamily: "sans-serif", lineHeight: "1.6" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1.5rem", borderBottom: "2px solid #374151", paddingBottom: "0.5rem" }}>
        Privacy Policy / गोपनीयता धोरण
      </h1>
      
      <p style={{ fontSize: "0.875rem", color: "#9ca3af", marginBottom: "2rem" }}>
        Last Updated: July 11, 2026
      </p>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#e5e7eb", marginBottom: "0.75rem" }}>
          1. Introduction / परिचय
        </h2>
        <p style={{ marginBottom: "1rem" }}>
          This Privacy Policy describes how the <strong>PTC Akola Training Management App</strong> collects, uses, and protects your information. This application is designed solely for official internal administration use by officers and administrators at the Police Training Centre (PTC), Akola.
        </p>
        <p>
          हे गोपनीयता धोरण स्पष्ट करते की <strong>PTC Akola Training Management App</strong> तुमची माहिती कशी गोळा करते, वापरते आणि त्याचे संरक्षण करते. हे ॲप्लिकेशन केवळ पोलीस प्रशिक्षण केंद्र (PTC), अकोला येथील अधिकारी आणि प्रशासक यांच्या अधिकृत अंतर्गत प्रशासकीय वापरासाठी डिझाइन केले आहे.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#e5e7eb", marginBottom: "0.75rem" }}>
          2. Information Collection / माहिती संकलन
        </h2>
        <p style={{ marginBottom: "1rem" }}>
          The app collects administrative login credentials (username/password), recruit registration details (name, chest number, batch, unit, contact information, photos), daily attendance logs, and physical/academic evaluation marks. All data is collected and entered by authorized training officers.
        </p>
        <p>
          ॲप प्रशासकीय लॉगिन तपशील, प्रशिक्षणार्थींची माहिती (नाव, चेस्ट नंबर, बॅच, युनिट, संपर्क माहिती, फोटो), दैनंदिन उपस्थिती आणि शारीरिक/शैक्षणिक मूल्यमापन गुण गोळा करते. सर्व डेटा केवळ अधिकृत प्रशिक्षण अधिकाऱ्यांद्वारेच प्रविष्ट केला जातो.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#e5e7eb", marginBottom: "0.75rem" }}>
          3. Data Usage & Security / डेटा वापर आणि सुरक्षा
        </h2>
        <p style={{ marginBottom: "1rem" }}>
          The data is used exclusively to track and evaluate the performance of recruits during their training term. All information is uploaded securely to the PTC Akola private servers. We implement strict server security measures and do not share, sell, or distribute any user or trainee information to third parties.
        </p>
        <p>
          या डेटाचा वापर केवळ प्रशिक्षणार्थींच्या कामगिरीचा मागोवा घेण्यासाठी आणि त्यांचे मूल्यमापन करण्यासाठी केला जातो. सर्व माहिती PTC अकोलाच्या सुरक्षित सर्व्हरवर अपलोड केली जाते. आम्ही कोणत्याही वापरकर्त्याची किंवा प्रशिक्षणार्थींची माहिती तृतीय पक्षांसोबत सामायिक करत नाही.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#e5e7eb", marginBottom: "0.75rem" }}>
          4. Access Control / प्रवेश नियंत्रण
        </h2>
        <p style={{ marginBottom: "1rem" }}>
          Access to this application is restricted to authorized personnel who have received credentials directly from the PTC Akola administration. There is no public registration or open user enrollment within the app.
        </p>
        <p>
          या ॲप्लिकेशनचा प्रवेश केवळ अधिकृत कर्मचाऱ्यांसाठी मर्यादित आहे ज्यांना PTC अकोला प्रशासनाकडून थेट लॉगिन तपशील मिळाले आहेत.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#e5e7eb", marginBottom: "0.75rem" }}>
          5. Contact Us / आमच्याशी संपर्क साधा
        </h2>
        <p style={{ marginBottom: "1rem" }}>
          If you have any questions about this Privacy Policy or data handling practices, please contact the IT Administration department at Police Training Centre, Akola.
        </p>
        <p>
          या गोपनीयता धोरणाबाबत काही प्रश्न असल्यास, कृपया पोलीस प्रशिक्षण केंद्र, अकोला येथील आयटी प्रशासन विभागाशी संपर्क साधा.
        </p>
      </section>
    </div>
  );
}
