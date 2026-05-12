import React, { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { auth, db, appId } from "../firebase-config";
import DonorForm from "../components/DonorForm";

const DonorLoginPage = ({ userId, isDbReady, message, showMessage, triggerSuccess }) => {
  const [loginForm, setLoginForm] = useState({ email: "", dob: "" });
  const [loading, setLoading] = useState(false);
  const [donor, setDonor] = useState(null);

  const donorsCollectionPath = useMemo(
    () => `artifacts/${appId}/public/data/donors`,
    []
  );

  const normalizeEmail = (value) => (value || "").toString().trim().toLowerCase();
  const normalizeDob = (value) => {
    const v = (value || "").toString().trim();
    if (!v || v === "Null") return null;

    // Accept either DD/MM/YYYY or YYYY-MM-DD (or DD-MM-YYYY).
    // Returns canonical `YYYY-MM-DD` for consistent matching.
    const build = (year, month1to12, day1to31) => {
      const y = Number(year);
      const m = Number(month1to12);
      const d = Number(day1to31);
      if (!y || !m || !d) return null;
      if (m < 1 || m > 12) return null;
      if (d < 1 || d > 31) return null;

      const dt = new Date(y, m - 1, d);
      // Validate rollover (e.g. 31/02/2025 should be invalid).
      if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;

      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    };

    const slashMatch = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const [, d, m, y] = slashMatch;
      return build(y, m, d);
    }

    const dashMatchYmd = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (dashMatchYmd) {
      const [, y, m, d] = dashMatchYmd;
      return build(y, m, d);
    }

    const dashMatchDmy = v.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dashMatchDmy) {
      const [, d, m, y] = dashMatchDmy;
      return build(y, m, d);
    }

    return null;
  };

  const reloadDonorById = useCallback(async (donorId) => {
    const snap = await getDoc(doc(db, donorsCollectionPath, donorId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  }, [donorsCollectionPath]);

  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      
      let currentUserId = userId;
      if (!currentUserId) {
        try {
          const userCredential = await signInAnonymously(auth);
          currentUserId = userCredential.user.uid;
        } catch (authError) {
          console.error("Anonymous auth failed:", authError);
          showMessage("Authentication failed. Please try again.", "error");
          return;
        }
      }

      const email = normalizeEmail(loginForm.email);
      const dob = normalizeDob(loginForm.dob);

      if (!email || !dob) {
        showMessage("Please enter your email and select a valid date of birth.", "error");
        return;
      }

      setLoading(true);
      try {
        // Optimized: Query only for the matching donor instead of fetching all
        const q = query(
          collection(db, donorsCollectionPath),
          where("email", "==", email),
          where("dob", "==", dob)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setDonor(null);
          showMessage("No saved donor profile found for that email and date of birth.", "error");
          return;
        }

        // Take the first match
        const found = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        };

        // Update the record's userId to the current session so the user 'owns' it on this device too
        if (found.userId !== currentUserId) {
          try {
            await updateDoc(doc(db, donorsCollectionPath, found.id), {
              userId: currentUserId
            });
          } catch (updateErr) {
            console.warn("Could not update ownership, but profile loaded:", updateErr);
          }
        }

        setDonor(found);
        showMessage("Profile loaded. You can now update your details.", "success");
      } catch (error) {
        console.error("Donor login error:", error);
        showMessage("Failed to load donor profile. Please try again.", "error");
      } finally {
        setLoading(false);
      }
    },
    [donorsCollectionPath, loginForm.dob, loginForm.email, normalizeDob, normalizeEmail, showMessage]
  );

  const handleDateInputChange = (value) => {
    let cleaned = value.replace(/[^0-9]/g, "");
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
    }
    if (cleaned.length > 4) {
      formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4) + "/" + cleaned.slice(4, 8);
    }
    setLoginForm(p => ({ ...p, dob: formatted }));
  };

  if (!isDbReady) {
    return (
      <main className="register-page">
        <div className="loading-state">Initialising database...</div>
      </main>
    );
  }

  return (
    <main className="register-page" style={{ padding: "40px 20px" }}>
      {message.text && (
        <div className={`status-message ${message.type}`} style={{ marginBottom: "24px" }}>
          {message.text}
        </div>
      )}

      {!donor ? (
        <section style={{ maxWidth: 560, margin: "0 auto" }}>
          <div className="form-card">
            <h2 style={{ marginTop: 0 }}>Donor Profile Login</h2>
            <p style={{ color: "var(--text-soft)", marginTop: 8, marginBottom: 20 }}>
              Enter your email and date of birth to access and update your saved information.
            </p>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="input-group">
                <label htmlFor="donorLoginEmail">Email Address</label>
                <input
                  type="email"
                  id="donorLoginEmail"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="donorLoginDob">Date of Birth</label>
                <input
                  type="text"
                  id="donorLoginDob"
                  value={loginForm.dob}
                  onChange={(e) => handleDateInputChange(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  maxLength="10"
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Loading..." : "Login"}
              </button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}>
              <p style={{ color: 'var(--text-soft)' }}>
                Don't have a profile yet?{" "}
                <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>
                  Register as a Donor
                </Link>
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0 }}>Your Donor Profile</h2>
              <p style={{ color: "var(--text-soft)", marginTop: 6 }}>
                Logged in as the current session user. Update your details below.
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => setDonor(null)}
              >
                Change Login
              </button>
            </div>
          </div>

          <DonorForm
            userId={userId}
            isAdminMode={false}
            initialData={donor}
            showMessage={showMessage}
            triggerSuccess={triggerSuccess}
            onComplete={async () => {
              try {
                const reloaded = await reloadDonorById(donor.id);
                if (reloaded) setDonor(reloaded);
              } catch {
                // Ignore reload issues; the form already shows success.
              }
            }}
          />
        </section>
      )}
    </main>
  );
};

export default DonorLoginPage;

