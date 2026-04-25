import React, { useCallback, useEffect, useState } from "react";
import { auth, db, appId } from "../firebase-config";
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import DonorForm from "./DonorForm";

const AdminPanel = ({ showMessage, triggerSuccess }) => {
  const [donors, setDonors] = useState([]);
  const [loadingDonors, setLoadingDonors] = useState(false);
  const [isAddingDonor, setIsAddingDonor] = useState(false);
  const [isEditingDonor, setIsEditingDonor] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [editingDonorData, setEditingDonorData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBlood, setFilterBlood] = useState("all");
  const [filterEligible, setFilterEligible] = useState("all");
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showMessage("Logged out successfully.", "success");
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      showMessage("Logout failed.", "error");
    }
  };

  const fetchDonors = useCallback(async () => {
    setLoadingDonors(true);
    try {
      const q = query(
        collection(db, `artifacts/${appId}/public/data/donors`),
        orderBy("timestamp", "desc"),
      );
      const querySnapshot = await getDocs(q);
      const donorList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDonors(donorList);
    } catch (error) {
      console.error("Error fetching donors:", error);
      showMessage("Failed to load donor data.", "error");
    } finally {
      setLoadingDonors(false);
    }
  }, [showMessage]);

  const handleDeleteDonor = async (id) => {
    if (window.confirm("Are you sure you want to delete this donor record? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/donors`, id));
        showMessage("Record deleted successfully.", "success");
        fetchDonors();
      } catch (error) {
        console.error("Delete error:", error);
        showMessage("Failed to delete record.", "error");
      }
    }
  };

  const filteredDonors = donors.filter(donor => {
    const matchesSearch = 
      (donor.fullName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (donor.donorId?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesBlood = filterBlood === "all" || donor.bloodGroup === filterBlood;
    const matchesEligible = filterEligible === "all" || 
      (filterEligible === "yes" && donor.eligibilityCheck) ||
      (filterEligible === "no" && !donor.eligibilityCheck);

    return matchesSearch && matchesBlood && matchesEligible;
  });

  const checkAutoEligibility = (lastDate) => {
    if (!lastDate || lastDate === "Null") return true; // Assume eligible if no record
    try {
      const last = new Date(lastDate);
      const today = new Date();
      const diffTime = Math.abs(today - last);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 90; // 3 months roughly 90 days
    } catch {
      return true;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === "Null") return "Null";
    try {
      const [y, m, d] = dateString.split("-");
      if (!y || !m || !d) return dateString;
      return `${d}/${m}/${y}`;
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  return (
    <>
    <main className="admin-container">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Total Registered Donors: {donors.length}</p>
        </div>
        <div className="admin-actions">
          <button onClick={() => setIsAddingDonor(true)} className="btn-primary" style={{ marginRight: '8px' }}>+ Add Donor</button>
          <button onClick={fetchDonors} className="btn-secondary">Refresh Data</button>
          <button onClick={handleLogout} className="btn-secondary" style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}>Logout</button>
          <Link to="/" className="btn-primary">Back to Form</Link>
        </div>
      </div>

      <div className="admin-controls" style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-wrapper" style={{ flex: 1, minWidth: '300px' }}>
          <input 
            type="text" 
            placeholder="Search by Name or Donor ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-soft)' }}
          />
        </div>
        <div className="filters-wrapper" style={{ display: 'flex', gap: '12px' }}>
          <select 
            value={filterBlood} 
            onChange={(e) => setFilterBlood(e.target.value)}
            style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-soft)', minWidth: '130px' }}
          >
            <option value="all">All Groups</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <select 
            value={filterEligible} 
            onChange={(e) => setFilterEligible(e.target.value)}
            style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-soft)', minWidth: '130px' }}
          >
            <option value="all">All Status</option>
            <option value="yes">Eligible</option>
            <option value="no">Not Eligible</option>
          </select>
        </div>
      </div>

      <div className="admin-card">
        {loadingDonors ? (
          <div className="loading-state">Loading donor data...</div>
        ) : filteredDonors.length === 0 ? (
          <div className="empty-state">No donors matching your search criteria.</div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Donor ID</th>
                  <th>Donor Name</th>
                  <th>Blood Type</th>
                  <th>Eligibility Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDonors.map((donor) => (
                  <tr key={donor.id}>
                    <td style={{ fontSize: '12px', color: 'var(--text-soft)', fontFamily: 'monospace' }}>
                      {donor.donorId || "Pending"}
                    </td>
                    <td>
                      <button 
                        onClick={() => setSelectedDonor(donor)}
                        className="donor-name-btn"
                      >
                        {donor.fullName || "Null"}
                      </button>
                    </td>
                    <td>
                      <span className="blood-tag" style={{ border: '1px solid rgba(255,59,59,0.2)' }}>{donor.bloodGroup || "Null"}</span>
                    </td>
                    <td>
                      {(() => {
                        const isAutoEligible = checkAutoEligibility(donor.lastDonatedDate);
                        const isManuallyEligible = donor.eligibilityCheck;
                        const finalEligible = isManuallyEligible && isAutoEligible;
                        
                        return (
                          <span className={finalEligible ? "status-yes" : "status-no"}>
                            {finalEligible ? "Eligible" : !isAutoEligible ? "Wait (Cooldown)" : "Not Eligible"}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => {
                          setEditingDonorData(donor);
                          setIsEditingDonor(true);
                        }}
                        className="btn-delete"
                        style={{ borderColor: 'rgba(var(--primary), 0.3)', color: 'var(--text-main)' }}
                        title="Edit Record"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDeleteDonor(donor.id)}
                        className="btn-delete"
                        title="Delete Record"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
    
    {isAddingDonor && (
      <div className="admin-modal-overlay">
        <div className="admin-modal-content">
          <div className="modal-header">
            <h2>Add New Donor Record</h2>
            <button 
              onClick={() => setIsAddingDonor(false)} 
              className="close-btn"
            >✕</button>
          </div>
          <div className="modal-body">
            <DonorForm 
              key="admin-add"
              userId="admin-manual" 
              isAdminMode={true}
              showMessage={(text, type) => {
                showMessage(text, type);
                if (type === "success") {
                  setIsAddingDonor(false);
                  fetchDonors();
                  if (triggerSuccess) triggerSuccess();
                }
              }} 
            />
          </div>
        </div>
      </div>
    )}
      
      {isEditingDonor && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <div className="modal-header">
              <h2>Edit Donor: {editingDonorData?.fullName}</h2>
              <button 
                onClick={() => {
                  setIsEditingDonor(false);
                  setEditingDonorData(null);
                }} 
                className="close-btn"
              >✕</button>
            </div>
            <div className="modal-body">
              <DonorForm 
                key={editingDonorData?.id || "admin-edit"}
                userId="admin-edit" 
                isAdminMode={true}
                initialData={editingDonorData}
                onComplete={() => {
                  setIsEditingDonor(false);
                  setEditingDonorData(null);
                  fetchDonors();
                }}
                showMessage={showMessage} 
              />
            </div>
          </div>
        </div>
      )}
      {selectedDonor && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Donor Profile</h2>
              <button onClick={() => setSelectedDonor(null)} className="close-btn">✕</button>
            </div>
            <div className="modal-body donor-profile-view">
              <div className="profile-header">
                <div className="profile-avatar">{selectedDonor.fullName?.charAt(0)}</div>
                <div className="profile-main-info">
                  <h3>{selectedDonor.fullName}</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="blood-tag">{selectedDonor.bloodGroup || "Unknown"}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-soft)', fontFamily: 'monospace', background: 'var(--bg-soft)', padding: '2px 8px', borderRadius: '4px' }}>
                      {selectedDonor.donorId || "No ID"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <label>Contact Number</label>
                  <p>{selectedDonor.contactNumber || "Null"}</p>
                </div>
                <div className="info-item">
                  <label>Email Address</label>
                  <p>{selectedDonor.email || "Null"}</p>
                </div>
                <div className="info-item">
                  <label>Gender</label>
                  <p className="capitalize">{selectedDonor.gender || "Null"}</p>
                </div>
                <div className="info-item">
                  <label>Date of Birth</label>
                  <p>{formatDate(selectedDonor.dob)}</p>
                </div>
                <div className="info-item">
                  <label>Weight</label>
                  <p>{selectedDonor.weight ? `${selectedDonor.weight} kg` : "Null"}</p>
                </div>
                <div className="info-item">
                  <label>Blood Group</label>
                  <p>{selectedDonor.bloodGroup || "Null"}</p>
                </div>
                <div className="info-item full-width">
                  <label>Residential Address</label>
                  <p>{selectedDonor.address || "Null"}</p>
                </div>
                <div className="info-item">
                  <label>Last Donated</label>
                  <p>{formatDate(selectedDonor.lastDonatedDate)}</p>
                </div>
                <div className="info-item">
                  <label>Total Donations</label>
                  <p>{selectedDonor.donationCount || "0"}</p>
                </div>
                <div className="info-item">
                  <label>Eligibility Status</label>
                  <p className={selectedDonor.eligibilityCheck ? "status-yes" : "status-no"} style={{ background: 'none', border: 'none', padding: 0 }}>
                    {selectedDonor.eligibilityCheck ? "Verified Eligible" : "Not Eligible"}
                  </p>
                </div>
              </div>
              
              <div style={{ marginTop: '32px' }}>
                <button onClick={() => setSelectedDonor(null)} className="btn-secondary" style={{ width: '100%' }}>Close Profile</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPanel;
