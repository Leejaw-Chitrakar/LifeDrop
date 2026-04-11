import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { auth } from "./firebase-config";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";

// Layout
import MainLayout from "./route layout/MainLayout";

// Pages
import RegisterPage from "./pages/RegisterPage";
import AdminPage from "./pages/AdminPage";
import AboutPage from "./pages/AboutPage";
import HomePage from "./pages/HomePage";
import ScrollToTop from "./components/ScrollToTop";
import SuccessOverlay from "./components/SuccessOverlay";

const AUTHORIZED_ADMIN_UID = "2pnop0wEWogayBAjcNQNmfMTxEH3";

const App = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            setUserId(user.uid);
          } else {
            signInAnonymously(auth).catch(console.error);
          }
          setIsDbReady(true);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error("Auth initialization failed:", error);
        setIsDbReady(true);
      }
    };
    initAuth();
  }, []);

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
                isAdminUid={userId === AUTHORIZED_ADMIN_UID}
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
