import React from "react";
import { Link } from "react-router-dom";
import "../styles/navbar.css"; // Import the CSS file for styles
import personIcon from "../components/person_icon.svg"; // Profile icon

const Navbar = ({ isLoggedIn, handleLogout }) => {
  return (
    <nav className="navbar">
      {/* Left Section (Profile Icon if logged in) */}
      <div className="left-section">
        {isLoggedIn && (
          <Link to="/profile">
            <img src={personIcon} alt="Profile" className="profile-icon" />
          </Link>
        )}
      </div>

      {/* Right Section (Buttons) */}
      <div className="right-section">
        {!isLoggedIn ? (
          <>
            <Link to="/login" className="nav-button">Login</Link>
            <Link to="/register" className="nav-button">Register</Link>
          </>
        ) : (
          <>
            <Link to="/recommendations" className="nav-button">Recommendations</Link>
            <button className="nav-button logout" onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
