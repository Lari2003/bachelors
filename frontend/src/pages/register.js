import React from "react";
import "../styles/register.css"; // Use the same CSS as login for consistency
import authBox from "../components/auth_box.jpg"; // Import the authentication box background

const Register = () => {
  return (
    <div className="register">
      <div className="register-container">
        <img src={authBox} alt="Authentication Box" className="auth-box-image" />
        <form className="register-form">
          <h2>REGISTER</h2>
          <label>Enter email:</label>
          <input type="email" required />
          <label>Enter password:</label>
          <input type="password" required />
          <label>Confirm password:</label>
          <input type="password" required />
          <button type="submit" className="register-btn">SUBMIT</button>
        </form>
      </div>
    </div>
  );
};

export default Register;
