import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { auth, db } from "./firebase-config";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

// Layout
import MainLayout from "./route layout/MainLayout";

// Pages
import RegisterPage from "./pages/RegisterPage";
import AdminPage from "./pages/AdminPage";
import DonorLoginPage from "./pages/DonorLoginPage";
import AboutPage from "./pages/AboutPage";
import HomePage from "./pages/HomePage";
import ScrollToTop from "./components/ScrollToTop";
import SuccessOverlay from "./components/SuccessOverlay";

const App = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [userId, setUserId] = useState(null);
  const [isAdminUid, setIsAdminUid] = useState(false);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setIsAdminUid(false);
        signInAnonymously(auth).catch(console.error);
      }
      setIsDbReady(true);
    });
    return () => unsubscribeAuth();
  }, []);

  // When userId changes, check if they're in the admins collection or match the .env superadmin
  useEffect(() => {
    if (!userId) {
      setIsAdminUid(false);
      return;
    }

    // Check if user is in the superadmin list defined in .env
    const superAdminUids = (import.meta.env.VITE_ADMIN_UID || "").split(",");
    if (superAdminUids.includes(userId)) {
      setIsAdminUid(true);
      return;
    }

    // Otherwise, check the dynamic admins collection in Firestore
    const adminDocRef = doc(db, "admins", userId);
    const unsubscribeAdmin = onSnapshot(adminDocRef, (snap) => {
      setIsAdminUid(snap.exists());
    });
    return () => unsubscribeAdmin();
  }, [userId]);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/register"
            element={
              <RegisterPage
                userId={userId}
                isDbReady={isDbReady}
                message={message}
                showMessage={showMessage}
                triggerSuccess={() => setShowOverlay(true)}
              />
            }
          />
          <Route
            path="/admin"
            element={
              <AdminPage
                showMessage={showMessage}
                message={message}
                userId={userId}
                isAdminUid={isAdminUid}
                triggerSuccess={() => setShowOverlay(true)}
              />
            }
          />
          <Route
            path="/donor-login"
            element={
              <DonorLoginPage
                userId={userId}
                isDbReady={isDbReady}
                message={message}
                showMessage={showMessage}
                triggerSuccess={() => setShowOverlay(true)}
              />
            }
          />
          <Route path="/about" element={<AboutPage />} />
        </Route>
      </Routes>
      {showOverlay && (
        <SuccessOverlay onClose={() => setShowOverlay(false)} />
      )}
    </BrowserRouter>
  );
};

export default App;
