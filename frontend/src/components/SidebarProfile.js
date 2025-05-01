import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, storage, db } from '../firebase';
import personIcon from './person_icon.svg';

const SidebarProfile = ({ userData, onClose, onLogout }) => {
  const [avatar, setAvatar] = useState(userData?.avatar || personIcon);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const user = auth.currentUser;
      
      // Convert to Base64 for local preview
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Avatar = reader.result;
        setAvatar(base64Avatar);
        
        // Optional: Store in Firestore as string (max ~1MB)
        updateDoc(doc(db, 'users', user.uid), {
          avatar: base64Avatar
        });
      };

    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="user-profile">
      <div className="avatar-upload-container">
        <img 
          src={avatar} 
          alt="User" 
          className="user-avatar"
          onClick={() => fileInputRef.current.click()}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarUpload}
          accept="image/*"
          style={{ display: 'none' }}
        />
        {isUploading && <div className="upload-overlay">Uploading...</div>}
      </div>
      
      <h3>{userData?.name || 'User'}</h3>
      <p>{userData?.email || ''}</p>
      
      <Link 
        to="/profile" 
        className="profile-btn edit"
        onClick={onClose}
      >
        View Full Profile
      </Link>
      
      <button 
        className="profile-btn logout"
        onClick={onLogout}
      >
        Log Out
      </button>
    </div>
  );
};

export default SidebarProfile;