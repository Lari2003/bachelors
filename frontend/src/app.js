import "./styles/global.css";
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import UserPreferences from "./pages/userPreferences";
import Recommendations from "./pages/recommendations";
import AdminDashboard from "./pages/adminDashboard";
import NotFound from "./pages/notFound";
import Navbar from "./components/navbar";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        const token = await user.getIdToken();
        
        // Set authentication state
        setIsAuthenticated(true);
        setUserData({
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'User', // Fallback if no name
          avatar: user.photoURL || './person_icon.svg' // Fallback avatar
        });
        
        // Store token if needed for backend
        localStorage.setItem('token', token);
      } else {
        // User is signed out
        setIsAuthenticated(false);
        setUserData(null);
        localStorage.removeItem('token');
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <Navbar 
        isAuthenticated={isAuthenticated} 
        userData={userData}
        setIsAuthenticated={setIsAuthenticated}
      />
      <Routes>
        <Route path="/" element={<UserPreferences isAuthenticated={isAuthenticated} />} />
        <Route 
          path="/login" 
          element={<Login setIsAuthenticated={setIsAuthenticated} setUserData={setUserData} />} 
        />
        <Route 
          path="/register" 
          element={<Register setIsAuthenticated={setIsAuthenticated} setUserData={setUserData} />} 
        />
        <Route path="/recommendations" element={<Recommendations isAuthenticated={isAuthenticated} />} />
        <Route path="/admin" element={<AdminDashboard isAuthenticated={isAuthenticated} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;