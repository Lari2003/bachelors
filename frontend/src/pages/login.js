import React from "react";
import "../styles/login.css"; // Import styles for login page
import authBox from "../components/auth_box.jpg"; // Import the auth box image

const Login = () => {
  return (
    <div className="page login">
      <div className="login-container">
        <img src={authBox} alt="Auth Box" className="auth-box-image" />

        <div className="login-form">
          <h2>LOGIN</h2>
          <label>Enter email:</label>
          <input type="email" placeholder="Enter your email" />

          <label>Enter password:</label>
          <input type="password" placeholder="Enter your password" />

          <div className="forgot-password">
            <a href="#">Forgot password?</a>
          </div>

          <button className="login-btn">SUBMIT</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
