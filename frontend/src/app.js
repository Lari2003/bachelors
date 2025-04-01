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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);

  // Check authentication status on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and fetch user data
      fetchUserData(token);
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      // Replace with your actual API call
      const response = await fetch('/api/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setIsAuthenticated(true);
        setUserData(data.user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

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