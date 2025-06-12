import "./styles/global.css";
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import UserPreferences from "./pages/userPreferences"; 
import Recommendations from "./pages/recommendations";
import AdminDashboard from "./pages/adminDashboard";
import NotFound from "./pages/notFound";
import Navbar from "./components/navbar";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import ManageUsers from "./pages/ManageUsers";
import ManageMovies from "./pages/ManageMovies";

// Optional test: ensure Firestore connection works
getDocs(collection(db, "test"))
  .then(() => console.log("✅ Firestore working"))
  .catch(err => console.error("❌ Firestore error:", err));

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          console.log("✅ Firebase user detected:", user);

          const basicUserData = {
            id: user.uid,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            avatar: user.photoURL || "./person_icon.svg"
          };

          try {
            const userDocRef = doc(db, "users", user.uid);
            let userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
              await setDoc(userDocRef, {
                email: user.email,
                name: basicUserData.name,
                avatar: basicUserData.avatar,
                isAdmin: false,
                createdAt: new Date()
              });
              userDoc = await getDoc(userDocRef);
              console.log("✨ Created user document in Firestore");
            }

            const fullUserData = {
              ...basicUserData,
              ...userDoc.data()
            };

            setUserData(fullUserData);
            setIsAuthenticated(true);
          } catch (firestoreError) {
            console.warn("⚠️ Firestore error, using fallback user data:", firestoreError);
            setUserData(basicUserData);
            setIsAuthenticated(true);
          }
        } else {
          console.log("❌ No user logged in");
          setIsAuthenticated(false);
          setUserData(null);
        }
      } catch (error) {
        console.error("Auth state error:", error);
        setIsAuthenticated(false);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // ✅ Safe redirect to admin
  useEffect(() => {
    if (!loading && isAuthenticated && userData?.isAdmin && window.location.pathname === "/") {
      window.location.href = "/admin";
    }
  }, [loading, isAuthenticated, userData]);

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
      {!loading && isAuthenticated && !userData?.isAdmin && (
        <Navbar 
          isAuthenticated={isAuthenticated} 
          userData={userData}
          setIsAuthenticated={setIsAuthenticated}
        />
      )}

      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated ? 
              <UserPreferences userData={userData} /> : 
              <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/login" 
          element={
            !isAuthenticated ? 
              <Login setIsAuthenticated={setIsAuthenticated} setUserData={setUserData} /> : 
              <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/register" 
          element={
            !isAuthenticated ? 
              <Register setIsAuthenticated={setIsAuthenticated} setUserData={setUserData} /> : 
              <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/recommendations" 
          element={
            isAuthenticated ? 
              <Recommendations userData={userData} /> : 
              <Navigate to="/login" state={{ from: "/recommendations" }} replace />
          } 
        />
        <Route 
          path="/admin" 
          element={
            isAuthenticated && userData?.isAdmin ? 
              <AdminDashboard /> : 
              <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            isAuthenticated && userData?.isAdmin ? 
              <ManageUsers /> : 
              <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/admin/movies" 
          element={
            isAuthenticated && userData?.isAdmin ? 
              <ManageMovies /> : 
              <Navigate to="/" replace />
          } 
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
