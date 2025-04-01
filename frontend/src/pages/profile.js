import React, { useState, useEffect } from 'react';
import '../styles/profile.css';
import { auth, db } from '../firebase';
import { doc, getDoc } from "firebase/firestore";

const Profile = ({ userData, setUserData }) => {
  const [likedMovies, setLikedMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (userData?.uid) {
        try {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, "users", userData.uid));
          if (userDoc.exists()) {
            setUserData(prev => ({
              ...prev,
              ...userDoc.data()
            }));
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [userData?.uid]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUserData(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) return <div className="profile-page">Loading...</div>;

  return (
    <div className="profile-page">
      <h1>User Profile</h1>
      <div className="profile-info">
        <h2>{userData?.name || 'No name provided'}</h2>
        <p>Email: {userData?.email}</p>
        <p>Member since: {userData?.createdAt?.toDate().toLocaleDateString()}</p>
      </div>
      
      <div className="profile-actions">
        <button onClick={handleLogout} className="logout-btn">
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Profile;