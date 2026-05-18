import React, { useState } from "react";
import { auth, db, appId } from "../firebase-config";
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import NepaliDate from "nepali-date-converter";

const DonorForm = ({ userId, showMessage, triggerSuccess, isAdminMode = false, initialData = null, onComplete }) => {
  const isEditing = Boolean(initialData && initialData.id);
  const generateDonorId = () => {
    const rand4 = () => {
      if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        const arr = new Uint16Array(1);
        crypto.getRandomValues(arr);
        return String(arr[0] % 9000 + 1000);
      }
      return String(Math.floor(1000 + Math.random() * 9000));
    };
    return `LD-${rand4()}-${rand4()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === "Null") return "Null";
    try {
      if (dateString.includes("/")) return dateString; // Already formatted
      const [y, m, d] = dateString.split("-");
      if (!y || !m || !d) return dateString;
      return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
    } catch {
      return dateString;
    }
  };

  const parseDDMMYYYYToDate = (value) => {
    if (!value || typeof value !== "string") return null;
    const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const d = Number(m[1]);
    const mo = Number(m[2]);
    const y = Number(m[3]);
    if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const dt = new Date(y, mo - 1, d);
    // Reject impossible dates like 31/02/2025
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return dt;
  };

  const [formData, setFormData] = useState(() => {
    const base = {
      fullName: "",
      dob: "",
      gender: "",
      bloodGroup: "",
      contactNumber: "",
      email: "",
      address: "",
      recentIllness: "",
      recentTattoo: "",
      weight: "",
      recentDonation: "",
      medication: "",
      travelHistory: "",
      chronicConditions: "",
      dentalWork: "",
      healthyToday: "",
      alcoholConsumption: "",
      goodSleep: "",
      pregnancyStatus: "",
      eligibilityCheck: true,
      lastDonatedDate: "",
      donationCount: "",
      donorId: generateDonorId(),
    };

    if (!initialData) return base;

    const merged = { ...base, ...initialData };
    if (merged.dob) merged.dob = formatDate(merged.dob);
    if (merged.lastDonatedDate) merged.lastDonatedDate = formatDate(merged.lastDonatedDate);
    if (!merged.donorId) merged.donorId = generateDonorId();
    return merged;
  });

  const [dateModes, setDateModes] = useState({
    dob: "AD",
    lastDonatedDate: "AD"
  });

  const [bsValues, setBsValues] = useState({
    dob: { y: 2050, m: 1, d: 1 },
    lastDonatedDate: { y: 2080, m: 1, d: 1 }
  });

  const handleBsChange = (field, type, value) => {
    const updated = { ...bsValues[field], [type]: parseInt(value) };
    setBsValues(prev => ({ ...prev, [field]: updated }));
    
    try {
      const nepaliDate = new NepaliDate(updated.y, updated.m - 1, updated.d);
      const gregorianDate = nepaliDate.toJsDate();
      const y = gregorianDate.getFullYear();
      const m = String(gregorianDate.getMonth() + 1).padStart(2, '0');
      const d = String(gregorianDate.getDate()).padStart(2, '0');
      const formattedDate = `${d}/${m}/${y}`;
      
      setFormData(prev => ({ ...prev, [field]: formattedDate }));
    } catch {
      console.warn("Invalid Nepali Date");
    }
  };

  const toggleDateMode = (field) => {
    const newMode = dateModes[field] === "AD" ? "BS" : "AD";
    setDateModes(prev => ({ ...prev, [field]: newMode }));
    
    // If switching to BS, initialize BS values from current AD date if available
    if (newMode === "BS" && formData[field]) {
      const gDate =
        formData[field].includes("/")
          ? parseDDMMYYYYToDate(formData[field])
          : new Date(formData[field]);
      if (!gDate || Number.isNaN(gDate.getTime())) return;
      const nDate = new NepaliDate(gDate);
      setBsValues(prev => ({
        ...prev,
        [field]: { y: nDate.getYear(), m: nDate.getMonth() + 1, d: nDate.getDate() }
      }));
    }
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "gender" && value !== "female") {
        newData.pregnancyStatus = "";
      }

      return newData;
    });
  };

  const handleDateInputChange = (field, value) => {
    // Only allow numbers and slashes
    let cleaned = value.replace(/[^0-9]/g, "");
    
    // Auto-insert slashes
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
    }
    if (cleaned.length > 4) {
      formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4) + "/" + cleaned.slice(4, 8);
    }

    // Still store YYYY-MM-DD in the main state for standard compatibility
    // but we'll show the formatted version in the input
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  // Convert DD/MM/YYYY to YYYY-MM-DD for backend
  const prepareDataForSubmission = (data) => {
    const finalData = { ...data };
    const dateFields = ["dob", "lastDonatedDate"];
    
    dateFields.forEach(field => {
      if (finalData[field] && finalData[field].includes("/")) {
        const [d, m, y] = finalData[field].split("/");
        if (d && m && y) {
          finalData[field] = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
      }
    });
    return finalData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const submissionData = prepareDataForSubmission(formData);

    if (submissionData.weight) {
      const weight = parseFloat(submissionData.weight);
      if (submissionData.gender === 'female' && weight <= 45) {
        showMessage("Weight must be above 45kg for females.", "error");
        return;
      }
      if (submissionData.gender === 'male' && weight <= 50) {
        showMessage("Weight must be above 50kg for males.", "error");
        return;
      }
    }

    if (submissionData.dob) {
      const dobDate = new Date(submissionData.dob);
      if (!isNaN(dobDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - dobDate.getFullYear();
        const m = today.getMonth() - dobDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
          age--;
        }
        if (age < 18) {
          showMessage("You must be at least 18 years old to donate.", "error");
          return;
        }
      }
    }

    if (submissionData.lastDonatedDate) {
      const lastDonated = new Date(submissionData.lastDonatedDate);
      if (!isNaN(lastDonated.getTime())) {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        if (lastDonated > threeMonthsAgo) {
          showMessage("You must wait at least 3 months since your last donation.", "error");
          return;
        }
      }
    }

    try {
      if (!isEditing) {
        const donorsRef = collection(db, `artifacts/${appId}/public/data/donors`);
        
        if (submissionData.contactNumber) {
          const qContact = query(donorsRef, where("contactNumber", "==", submissionData.contactNumber));
          const contactSnap = await getDocs(qContact);
          if (!contactSnap.empty) {
            showMessage("A donor with this contact number is already registered.", "error");
            return;
          }
        }
        
        if (submissionData.email) {
          const qEmail = query(donorsRef, where("email", "==", submissionData.email));
          const emailSnap = await getDocs(qEmail);
          if (!emailSnap.empty) {
            showMessage("A donor with this email address is already registered.", "error");
            return;
          }
        }
      }

      let currentUserId = userId;
      
      // If not logged in and not in admin mode, sign in anonymously first
      if (!currentUserId && !isAdminMode) {
        try {
          const userCredential = await signInAnonymously(auth);
          currentUserId = userCredential.user.uid;
        } catch (authError) {
          console.error("Anonymous auth failed:", authError);
          showMessage("Authentication failed. Please try again.", "error");
          return;
        }
      }

      const dataToSave = { ...submissionData };
      delete dataToSave.id; 
      dataToSave.updatedAt = serverTimestamp();

      if (isEditing) {
        // Update existing record
        await updateDoc(doc(db, `artifacts/${appId}/public/data/donors`, initialData.id), dataToSave);
        showMessage("Record updated successfully!", "success");
      } else {
        // Create new record
        dataToSave.timestamp = serverTimestamp();
        dataToSave.userId = currentUserId;
        dataToSave.appId = appId;
        await addDoc(collection(db, `artifacts/${appId}/public/data/donors`), dataToSave);
        showMessage("Registration successful! Thank you for being a hero.", "success");
        triggerSuccess();
      }

      if (onComplete) onComplete();

      // Only clear the form after a new registration. When editing an existing
      // record, clearing can accidentally blank hidden fields on the next save.
      if (!isAdminMode && !isEditing) {
        setFormData({
          fullName: "",
          dob: "",
          gender: "",
          bloodGroup: "",
          contactNumber: "",
          email: "",
          address: "",
          recentIllness: "",
          recentTattoo: "",
          weight: "",
          recentDonation: "",
          medication: "",
          travelHistory: "",
          chronicConditions: "",
          dentalWork: "",
          healthyToday: "",
          alcoholConsumption: "",
          goodSleep: "",
          pregnancyStatus: "",
          eligibilityCheck: true,
          lastDonatedDate: "",
          donationCount: "",
          donorId: "",
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      showMessage("Something went wrong. Please try again.", "error");
    }
  };

  return (
    <div className="form-card">
      <form onSubmit={handleSubmit}>
        {!isAdminMode && (
          <div className="form-header">
            <h2>Donor Registration</h2>
            <p>
              Please provide accurate information for the safety of both donor
              and recipient.
            </p>
          </div>
        )}

        <h3 className="section-title">Personal Information</h3>
        <div className="form-grid">
          {isAdminMode && (
            <div className="input-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label htmlFor="donorId">Donor ID (Editable)</label>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, donorId: generateDonorId() }));
                  }}
                  className="date-mode-toggle"
                  style={{ fontSize: "10px" }}
                >
                  🔄 Regenerate ID
                </button>
              </div>
              <input
                type="text"
                id="donorId"
                name="donorId"
                value={formData.donorId}
                onChange={handleChange}
                placeholder="LD-XXXX-XXXX"
                readOnly={false}
              />
            </div>
          )}
          <div className="input-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label htmlFor="dob">Date of Birth</label>
              <button 
                type="button" 
                onClick={() => toggleDateMode("dob")}
                className="date-mode-toggle"
              >
                Switch to {dateModes.dob === "AD" ? "BS (Nepali)" : "AD (Gregorian)"}
              </button>
            </div>
            
            {dateModes.dob === "AD" ? (
              <input
                type="text"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={(e) => handleDateInputChange("dob", e.target.value)}
                placeholder="DD/MM/YYYY"
                maxLength="10"
                required={!isAdminMode}
              />
            ) : (
              <div className="bs-date-inputs">
                <input 
                  type="number" placeholder="YYYY" min="1970" max="2100"
                  value={bsValues.dob.y} 
                  onChange={(e) => handleBsChange("dob", "y", e.target.value)}
                />
                <input 
                  type="number" placeholder="MM" min="1" max="12"
                  value={bsValues.dob.m} 
                  onChange={(e) => handleBsChange("dob", "m", e.target.value)}
                />
                <input 
                  type="number" placeholder="DD" min="1" max="32"
                  value={bsValues.dob.d} 
                  onChange={(e) => handleBsChange("dob", "d", e.target.value)}
                />
              </div>
            )}
            {dateModes.dob === "BS" && formData.dob && (
              <p className="date-preview" style={{ marginTop: '8px', fontSize: '13px', color: 'var(--primary)' }}>
                AD Equivalent: {formatDate(formData.dob)}
              </p>
            )}
          </div>
          <div className="input-group">
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                Select Gender
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="bloodGroup">Blood Group</label>
            <select
              id="bloodGroup"
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                Select Blood Group
              </option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                (group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="contactNumber">Contact Number</label>
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="+977 98XXXXXXXX"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required={!isAdminMode}
            />
          </div>
          <div className="input-group">
            <label htmlFor="weight">Weight (kg)</label>
            <input
              type="number"
              id="weight"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              placeholder="e.g. 65"
              min="45"
              max="300"
              required={!isAdminMode}
            />
          </div>
          <div className="input-group">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Your current residential address"
              required={!isAdminMode}
            />
          </div>
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label htmlFor="lastDonatedDate">Last Donated Date (Optional)</label>
              <button 
                type="button" 
                onClick={() => toggleDateMode("lastDonatedDate")}
                className="date-mode-toggle"
              >
                Switch to {dateModes.lastDonatedDate === "AD" ? "BS" : "AD"}
              </button>
            </div>

            {dateModes.lastDonatedDate === "AD" ? (
              <input
                type="text"
                id="lastDonatedDate"
                name="lastDonatedDate"
                placeholder="DD/MM/YYYY"
                maxLength="10"
                value={formData.lastDonatedDate}
                onChange={(e) => handleDateInputChange("lastDonatedDate", e.target.value)}
              />
            ) : (
              <div className="bs-date-inputs">
                <input 
                  type="number" placeholder="YYYY" min="2000" max="2100"
                  value={bsValues.lastDonatedDate.y} 
                  onChange={(e) => handleBsChange("lastDonatedDate", "y", e.target.value)}
                />
                <input 
                  type="number" placeholder="MM" min="1" max="12"
                  value={bsValues.lastDonatedDate.m} 
                  onChange={(e) => handleBsChange("lastDonatedDate", "m", e.target.value)}
                />
                <input 
                  type="number" placeholder="DD" min="1" max="32"
                  value={bsValues.lastDonatedDate.d} 
                  onChange={(e) => handleBsChange("lastDonatedDate", "d", e.target.value)}
                />
              </div>
            )}
            {dateModes.lastDonatedDate === "BS" && formData.lastDonatedDate && (
              <p className="date-preview" style={{ marginTop: '8px', fontSize: '13px', color: 'var(--primary)' }}>
                AD Equivalent: {formatDate(formData.lastDonatedDate)}
              </p>
            )}
          </div>
          <div className="input-group">
            <label htmlFor="donationCount">Number of Times Donated (Optional)</label>
            <input
              type="number"
              id="donationCount"
              name="donationCount"
              value={formData.donationCount}
              onChange={handleChange}
              placeholder="e.g. 5"
              min="0"
            />
          </div>
        </div>

        {isAdminMode && (
          <div className="admin-eligibility-section" style={{ marginTop: '20px', padding: '20px', background: 'rgba(var(--primary), 0.05)', borderRadius: '12px', border: '1px dashed var(--primary)' }}>
            <label className="question" style={{ marginBottom: '12px', display: 'block', fontWeight: '700' }}>Mark as Eligible for Donation?</label>
            <div className="radio-group-container">
              <label className="custom-radio">
                <input
                  type="radio"
                  name="eligibilityCheck"
                  checked={formData.eligibilityCheck === true}
                  onChange={() => setFormData(prev => ({ ...prev, eligibilityCheck: true }))}
                />
                <span className="radio-label">Yes (Eligible)</span>
              </label>
              <label className="custom-radio" style={{ marginLeft: '20px' }}>
                <input
                  type="radio"
                  name="eligibilityCheck"
                  checked={formData.eligibilityCheck === false}
                  onChange={() => setFormData(prev => ({ ...prev, eligibilityCheck: false }))}
                />
                <span className="radio-label">No (Not Eligible)</span>
              </label>
            </div>
          </div>
        )}



        <button type="submit" className="submit-btn" style={{ marginBottom: '12px' }}>
          {initialData ? "Save Changes" : "Complete Registration"}
        </button>


      </form>
    </div>
  );
};

export default DonorForm;
