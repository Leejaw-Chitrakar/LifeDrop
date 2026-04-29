import React, { useCallback, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db, appId } from "../firebase-config";
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
      if (!userId) {
        showMessage("Please wait for session initialization.", "error");
        return;
      }

      const email = normalizeEmail(loginForm.email);
      const dob = normalizeDob(loginForm.dob);

      if (!email || !dob) {
        showMessage("Please enter your email and select a valid date of birth.", "error");
        return;
      }

      setLoading(true);
      try {
        // Security: we only read documents owned by the current auth session (userId),
        // then we verify that the provided email/date of birth match.
        const q = query(collection(db, donorsCollectionPath), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);

        const candidates = querySnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const found = candidates.find(
          (d) =>
            normalizeEmail(d.email) === email &&
            normalizeDob(d.dob) === dob
        );

        if (!found) {
          setDonor(null);
          showMessage("No saved donor profile found for that email and date of birth.", "error");
          return;
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
    [donorsCollectionPath, loginForm.dob, loginForm.email, normalizeDob, normalizeEmail, showMessage, userId]
  );

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
                  type="date"
                  id="donorLoginDob"
                  value={loginForm.dob}
                  onChange={(e) => setLoginForm((p) => ({ ...p, dob: e.target.value }))}
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Loading..." : "Login"}
              </button>
            </form>
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

