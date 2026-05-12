import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import AdminPanel from "../components/AdminPanel";
import { auth } from "../firebase-config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

const AdminPage = ({ showMessage, message, userId, isAdminUid, isAnonymous, triggerSuccess }) => {
  const [mode, setMode] = useState("login"); // only "login" now
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const container = useRef();

  useGSAP(() => {
    if (!isAdminUid) {
      gsap.from(".admin-card", {
        scale: 0.95,
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: "power2.out"
      });
    }
  }, { scope: container, dependencies: [isAdminUid, mode] });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      showMessage("Logged in successfully!", "success");
    } catch (error) {
      console.error("Login failed:", error);
      showMessage("Login failed. Check your credentials.", "error");
    }
  };

  // Removed handleAdminRegister as we only want one admin defined in .env

  if (!isAdminUid) {
    return (
      <main className="admin-container" ref={container}>
        <div className="admin-card text-center" style={{ maxWidth: '400px', margin: '40px auto', padding: '48px 32px' }}>
          {userId && !isAnonymous && mode === "login" ? (
            <>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <h2>Access Pending</h2>
              <p style={{ color: 'var(--text-soft)', marginTop: '8px', marginBottom: '32px', fontSize: '14px' }}>
                You are logged in, but your account hasn't been granted administrative access yet. 
                Please contact a super administrator with your UID.
              </p>
              <div style={{ marginBottom: '24px' }}>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(userId);
                    showMessage("UID copied to clipboard!", "success");
                  }} 
                  className="btn-secondary" 
                  style={{ width: '100%', fontSize: '13px', background: 'var(--bg-soft)', border: '1px dashed var(--border)' }}
                >
                  📋 Copy my UID for Admin
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button onClick={() => auth.signOut()} className="btn-secondary" style={{ width: '100%' }}>
                  Sign Out
                </button>
                <Link to="/" className="btn-secondary" style={{ width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Back to Home
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2>Admin Login</h2>
              <p style={{ color: 'var(--text-soft)', marginTop: '8px', marginBottom: '32px', fontSize: '14px' }}>
                Enter your credentials to access the dashboard.
              </p>
              
              <form onSubmit={mode === "login" ? handleAdminLogin : handleAdminRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                <div className="input-group">
                  <label htmlFor="adminEmail">Email Address</label>
                  <input
                    type="email"
                    id="adminEmail"
                    name="email"
                    value={loginForm.email}
                    onChange={handleInputChange}
                    placeholder="admin@lifedrop.com"
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="adminPassword">Password</label>
                  <div className="password-input-wrapper" style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="adminPassword"
                      name="password"
                      value={loginForm.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      required
                      style={{ width: '100%', paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '18px',
                        color: 'var(--text-soft)',
                        padding: '4px'
                      }}
                    >
                      {showPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>
                
                <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
                  Sign In
                </button>
              </form>

              <div style={{ marginTop: '24px', fontSize: '14px' }}>
                <p>
                  Looking to register as a donor?{" "}
                  <Link 
                    to="/register"
                    style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </>
          )}

          <div style={{ marginTop: '24px' }}>
             <Link to="/" className="btn-secondary" style={{ width: '100%' }}>
               Back to Home
             </Link>
          </div>
          
          {/* Session UID display removed for privacy */}
        </div>
      </main>
    );
  }

  return (
    <div className="admin-page-wrapper" ref={container}>
      {message.text && (
        <div className={`status-message ${message.type}`} style={{ maxWidth: '1200px', margin: '20px auto' }}>
          {message.text}
        </div>
      )}
      <AdminPanel showMessage={showMessage} triggerSuccess={triggerSuccess} />
    </div>
  );
};

export default AdminPage;
