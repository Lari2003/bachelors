import "./styles/global.css";
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
              // Auto-create Firestore user doc
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

            setUserData({
              ...basicUserData,
              ...userDoc.data()
            });
          } catch (firestoreError) {
            console.warn("⚠️ Firestore error, using fallback user data:", firestoreError);
            setUserData(basicUserData);
          }

          setIsAuthenticated(true);
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
      {!loading && (
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
            loading ? null : (
              isAuthenticated ? 
                <UserPreferences userData={userData} /> : 
                <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/login" 
          element={
            loading ? null : (
              !isAuthenticated ? 
                <Login setIsAuthenticated={setIsAuthenticated} setUserData={setUserData} /> : 
                <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/register" 
          element={
            loading ? null : (
              !isAuthenticated ? 
                <Register setIsAuthenticated={setIsAuthenticated} setUserData={setUserData} /> : 
                <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/recommendations" 
          element={
            loading ? null : (
              isAuthenticated ? 
                <Recommendations userData={userData} /> : 
                <Navigate to="/login" state={{ from: "/recommendations" }} replace />
            )
          } 
        />
        <Route 
          path="/admin" 
          element={
            loading ? null : (
              isAuthenticated && userData?.isAdmin ? 
                <AdminDashboard /> : 
                <Navigate to="/" replace />
            )
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
