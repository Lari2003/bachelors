import "./styles/global.css"; 
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import Profile from "./pages/profile";
import UserPreferences from "./pages/userPreferences";
import Recommendations from "./pages/recommendations";
import AdminDashboard from "./pages/adminDashboard";
import NotFound from "./pages/notFound";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UserPreferences />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
