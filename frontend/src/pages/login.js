import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const Login = ({ setIsAuthenticated, setUserData }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
  
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
  
      const user = userCredential.user;
      let userData = {};
  
      // ACTUALLY FETCH USER DATA FROM FIRESTORE
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          userData = userDoc.data();
        }
      } catch (firestoreError) {
        console.error("Firestore error:", firestoreError);
      }
  
      setIsAuthenticated(true);
      setUserData({
        id: user.uid,
        email: user.email,
        name: userData.name || user.displayName || "User",
        avatar: userData.avatar || user.photoURL || null
      });
  
      navigate("/");
    } catch (err) {
      console.error("Firebase login error:", err.code, err.message);
      setError(
        err.code === "auth/invalid-credential" 
          ? "Invalid email or password" 
          : "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>WELCOME BACK</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? "Logging In..." : "SIGN IN"}
          </button>

          <div className="register-redirect">
            Don't have an account? <a href="/register">Create account</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
