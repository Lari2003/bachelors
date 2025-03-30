import React from "react";
import Navbar from "../components/navbar";
import "../styles/profile.css"; // Import profile styles
import backgroundImage from "../components/background_profile.jpg"; 

const Profile = () => {
  return (
    <div 
      className="profile-page"
      style={{ backgroundImage: `url(${backgroundImage})` }} 
    >
      <Navbar />

      {/* Profile Container - Centered Box */}
      <div className="profile-container">
        <h2>User Profile</h2>
        <p>This is where the profile information will be displayed.</p>
      </div>
    </div>
  );
};

export default Profile;
