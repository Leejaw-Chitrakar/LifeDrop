
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './index.css';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};
const initialAuthToken = '';
const appId = process.env.REACT_APP_FIREBASE_APP_ID;

const App = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        dob: '',
        gender: '',
        bloodGroup: '',
        contactNumber: '',
        email: '',
        address: '',
        recentIllness: '',
        recentTattoo: '',
        eligibilityCheck: false
    });

    const [isDbReady, setIsDbReady] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const initFirebase = async () => {
            try {
                const app = initializeApp(firebaseConfig);
                const firestoreDb = getFirestore(app);
                const authInstance = getAuth(app);
                setDb(firestoreDb);
                setAuth(authInstance);

                if (initialAuthToken) {
                    await signInWithCustomToken(authInstance, initialAuthToken);
                } else {
                    await signInAnonymously(authInstance);
                }

                onAuthStateChanged(authInstance, (user) => {
                    if (user) {
                        setUserId(user.uid);
                    } else {
                        setUserId(null);
                    }
                    setIsDbReady(true);
                });

            } catch (error) {
                console.error("Firebase initialization failed:", error);
                setIsDbReady(true);
            }
        };
        initFirebase();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (Object.values(formData).some(val => val === '' || val === false)) {
            showMessage('Please fill out all required fields.', 'error');
            return;
        }

        if (!db) {
            showMessage('Database not initialized. Please try again.', 'error');
            return;
        }

        try {
            const donorData = {
                ...formData,
                timestamp: serverTimestamp(),
                userId: userId,
                appId: appId
            };

            await addDoc(collection(db, `/artifacts/${appId}/public/data/donors`), donorData);

            showMessage('Thank you for your interest! Your registration has been submitted.', 'success');
            setFormData({
                fullName: '',
                dob: '',
                gender: '',
                bloodGroup: '',
                contactNumber: '',
                email: '',
                address: '',
                recentIllness: '',
                recentTattoo: '',
                eligibilityCheck: false
            });

        } catch (error) {
            console.error("Error writing document:", error);
            showMessage('An error occurred during registration. Please try again.', 'error');
        }
    };

    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 5000);
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
            <div className="form-container">
                <div className="header">
                    <h1 className="form-title">Blood Donor Registration</h1>
                    <p className="form-subtitle">Your donation can save a life. Please fill out the form carefully.</p>
                </div>
                {userId && <div className="text-center text-sm text-gray-500 mb-4">User ID: {userId}</div>}

                <form onSubmit={handleSubmit} className="form">
                    <div className="section">
                        <h2 className="section-title">Personal Information</h2>

                        <div className="input-group">
                            <label htmlFor="fullName">Full Name</label>
                            <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
                        </div>

                        <div className="input-group">
                            <label htmlFor="dob">Date of Birth</label>
                            <input type="date" id="dob" name="dob" value={formData.dob} onChange={handleChange} required />
                        </div>

                        <div className="input-group">
                            <label htmlFor="gender">Gender</label>
                            <select id="gender" name="gender" value={formData.gender} onChange={handleChange} required>
                                <option value="" disabled>Select your gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label htmlFor="bloodGroup">Blood Group</label>
                            <select id="bloodGroup" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} required>
                                <option value="" disabled>Select your blood group</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label htmlFor="contactNumber">Contact Number</label>
                            <input type="tel" id="contactNumber" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required />
                        </div>

                        <div className="input-group">
                            <label htmlFor="email">Email Address</label>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                        </div>

                        <div className="input-group">
                            <label htmlFor="address">Address</label>
                            <textarea id="address" name="address" rows="3" value={formData.address} onChange={handleChange} required></textarea>
                        </div>
                    </div>

                    <div className="section health-section">
                        <h2 className="section-title">Health Information</h2>

                        <div className="question-group">
                            <p>Have you had a major illness or surgery in the last 6 months?</p>
                            <div className="radio-options">
                                <div className="flex items-center">
                                    <input type="radio" id="illnessYes" name="recentIllness" value="yes" checked={formData.recentIllness === 'yes'} onChange={handleChange} required />
                                    <label htmlFor="illnessYes" className="ml-2">Yes</label>
                                </div>
                                <div className="flex items-center">
                                    <input type="radio" id="illnessNo" name="recentIllness" value="no" checked={formData.recentIllness === 'no'} onChange={handleChange} />
                                    <label htmlFor="illnessNo" className="ml-2">No</label>
                                </div>
                            </div>
                        </div>

                        <div className="question-group">
                            <p>Have you received a tattoo or piercing in the last 6 months?</p>
                            <div className="radio-options">
                                <div className="flex items-center">
                                    <input type="radio" id="tattooYes" name="recentTattoo" value="yes" checked={formData.recentTattoo === 'yes'} onChange={handleChange} required />
                                    <label htmlFor="tattooYes" className="ml-2">Yes</label>
                                </div>
                                <div className="flex items-center">
                                    <input type="radio" id="tattooNo" name="recentTattoo" value="no" checked={formData.recentTattoo === 'no'} onChange={handleChange} />
                                    <label htmlFor="tattooNo" className="ml-2">No</label>
                                </div>
                            </div>
                        </div>

                        <div className="checkbox-group">
                            <input id="eligibilityCheck" name="eligibilityCheck" type="checkbox" checked={formData.eligibilityCheck} onChange={handleChange} required />
                            <label htmlFor="eligibilityCheck">
                                I confirm that I meet the basic eligibility criteria for blood donation (e.g., age, weight).
                            </label>
                        </div>
                    </div>

                    {message && (
                        <div className={`message-box ${messageType === 'success' ? 'success' : 'error'} visible`}>
                            {message}
                        </div>
                    )}

                    <button type="submit" className="submit-button" disabled={!isDbReady}>
                        {isDbReady ? 'Register to Donate' : 'Initializing...'}

                    </button>
                </form>
            </div>
        </div>
    );
};

export default App;
