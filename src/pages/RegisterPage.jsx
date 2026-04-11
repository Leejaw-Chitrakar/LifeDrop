import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import DonorForm from "../components/DonorForm";

const RegisterPage = ({ userId, isDbReady, message, showMessage, triggerSuccess }) => {
  const container = useRef();

  useGSAP(() => {
    gsap.from(".form-container", {
      y: 30,
      opacity: 0,
      duration: 1,
      ease: "power2.out",
    });
  }, { scope: container });

  return (
    <div ref={container} className="register-page">
      <section className="registration-hero" style={{ padding: '80px 20px 40px', textAlign: 'center' }}>
        <span className="badge">Donor Portal</span>
        <h1>Register as a <span className="highlight">Donor</span></h1>
        <p style={{ maxWidth: '600px', margin: '16px auto', color: 'var(--text-soft)' }}>
          Please complete the form below. Your information is kept strictly confidential and used only for donation coordination.
        </p>
      </section>

      <main className="form-container" style={{ paddingTop: '0' }}>
        {message.text && (
          <div className={`status-message ${message.type}`} style={{ marginBottom: '24px' }}>
            {message.text}
          </div>
        )}
        
        {!isDbReady ? (
          <div className="loading-state">Initialising database...</div>
        ) : (
          <DonorForm userId={userId} showMessage={showMessage} triggerSuccess={triggerSuccess} />
        )}
      </main>
    </div>
  );
};

export default RegisterPage;
