import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import AdminPanel from "../components/AdminPanel";
import { auth } from "../firebase-config";
import { signInWithEmailAndPassword } from "firebase/auth";

const AdminPage = ({ showMessage, message, userId, isAdminUid, triggerSuccess }) => {
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
  }, { scope: container, dependencies: [isAdminUid] });

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

  if (!isAdminUid) {
    return (
      <main className="admin-container" ref={container}>
        <div className="admin-card text-center" style={{ maxWidth: '400px', margin: '40px auto', padding: '48px 32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
          <h2>Admin Login</h2>
          <p style={{ color: 'var(--text-soft)', marginTop: '8px', marginBottom: '32px', fontSize: '14px' }}>
            Enter your credentials to access the dashboard.
          </p>
          
          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
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

          <div style={{ marginTop: '24px' }}>
             <Link to="/" className="btn-secondary" style={{ width: '100%' }}>
               Back to Home
             </Link>
          </div>
          
          {userId && (
            <p style={{ fontSize: '10px', color: 'var(--text-soft)', marginTop: '40px' }}>
              Session UID: {userId}
            </p>
          )}
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
