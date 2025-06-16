import React from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import "../styles/adminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (err) {
      console.error(" Failed to logout:", err);
    }
  };

  return (
<div className="admin-page">
  <h1>🛠 Admin Dashboard</h1>
  <p>What would you like to manage?</p>

  <div className="admin-actions">
    <button className="admin-button" onClick={() => navigate("/admin/users")}>
      Manage Users
    </button>
    <button className="admin-button" onClick={() => navigate("/admin/movies")}>
      Manage Movies
    </button>
  </div>

  <button className="logout-btn" onClick={handleLogout}>
    Logout
  </button>
</div>
)}
export default AdminDashboard;
