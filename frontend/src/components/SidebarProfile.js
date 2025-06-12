import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import personIcon from './person_icon.svg';
import { doc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

const SidebarProfile = ({ userData, onClose, onLogout }) => {
  const [avatar, setAvatar] = useState(personIcon);
  const [likedMovies, setLikedMovies] = useState([]);
  const [dislikedMovies, setDislikedMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [showLikedModal, setShowLikedModal] = useState(false);
  const [showDislikedModal, setShowDislikedModal] = useState(false);
  
  // Change Password Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (userData?.avatar) {
      setAvatar(userData.avatar);
    } else {
      setAvatar(personIcon);
    }
  }, [userData]);

  const fetchFeedback = async () => {
    if (auth.currentUser) {
      try {
        const feedbackRef = collection(db, "users", auth.currentUser.uid, "feedback");
        const snapshot = await getDocs(feedbackRef);
        const likes = [];
        const dislikes = [];

        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.status === "liked") likes.push({ id: doc.id, ...data });
          if (data.status === "disliked") dislikes.push({ id: doc.id, ...data });
        });

        setLikedMovies(likes);
        setDislikedMovies(dislikes);
      } catch (error) {
        console.error("Error fetching feedback:", error);
      }
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const deleteMovie = async (movieId) => {
    try {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "feedback", movieId));
      fetchFeedback(); // Refresh the lists
    } catch (err) {
      console.error("Failed to delete movie from feedback:", err);
    }
  };

  // Change Password Functions
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const user = auth.currentUser;
      
      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      setPasswordSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess("");
      }, 2000);
      
    } catch (error) {
      console.error("Error updating password:", error);
      
      if (error.code === 'auth/wrong-password') {
        setPasswordError("Current password is incorrect");
      } else if (error.code === 'auth/weak-password') {
        setPasswordError("Password is too weak");
      } else if (error.code === 'auth/requires-recent-login') {
        setPasswordError("Please log out and log back in, then try again");
      } else {
        setPasswordError("Failed to update password. Please try again.");
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setPasswordSuccess("");
  };

  const renderChangePasswordModal = () => (
    <div className="movie-modal">
      <div className="modal-overlay" onClick={closePasswordModal} />
      <div className="modal-content change-password-modal">
        <button className="modal-close" onClick={closePasswordModal}>×</button>
        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#fff' }}>Change Password</h3>
        
        <form onSubmit={handleChangePassword} className="password-form">
          <div className="form-group">
            <label htmlFor="current-password">Current Password</label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="password-input"
              placeholder="Enter your current password"
              disabled={isUpdatingPassword}
            />
          </div>

          <div className="form-group">
            <label htmlFor="new-password">New Password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="password-input"
              placeholder="Enter your new password"
              disabled={isUpdatingPassword}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Confirm New Password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="password-input"
              placeholder="Confirm your new password"
              disabled={isUpdatingPassword}
            />
          </div>

          {passwordError && (
            <div className="password-message error">{passwordError}</div>
          )}

          {passwordSuccess && (
            <div className="password-message success">{passwordSuccess}</div>
          )}

          <button 
            type="submit" 
            className="update-password-btn"
            disabled={isUpdatingPassword}
          >
            {isUpdatingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );

  const renderLikedPreview = () => (
    <div className="liked-preview-section">
      <h4>Movies you liked</h4>
      {likedMovies.length === 0 ? (
        <p style={{ fontStyle: 'italic', opacity: 0.6, fontSize: '0.9rem' }}>
          list is empty for now
        </p>
      ) : (
        <div className="liked-slider">
          <div className="slider-poster">
            <img
              src={likedMovies[0].poster || 'https://via.placeholder.com/200x300?text=No+Poster'}
              alt="Liked movie"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/200x300?text=No+Poster';
              }}
            />
          </div>
          <button className="slider-arrow" onClick={() => setShowLikedModal(true)}>
            ➤
          </button>
        </div>
      )}
    </div>
  );

  const renderDislikedPreview = () => (
    <div className="disliked-preview-section">
      <h4>Movies you disliked</h4>
      {dislikedMovies.length === 0 ? (
        <p style={{ fontStyle: 'italic', opacity: 0.6, fontSize: '0.9rem' }}>
          list is empty for now
        </p>
      ) : (
        <div className="disliked-slider">
          <div className="slider-poster">
            <img
              src={dislikedMovies[0].poster || 'https://via.placeholder.com/200x300?text=No+Poster'}
              alt="Disliked movie"
              style={{ border: '2px solid #ff4d4d' }}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/200x300?text=No+Poster';
              }}
            />
          </div>
          <button className="slider-arrow" onClick={() => setShowDislikedModal(true)}>
            ➤
          </button>
        </div>
      )}
    </div>
  );

  const renderLikedModal = () => (
    <div className="movie-modal">
      <div className="modal-overlay" onClick={() => setShowLikedModal(false)} />
      <div className="modal-content">
        <button className="modal-close" onClick={() => setShowLikedModal(false)}>×</button>
        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#fff' }}>Movies You Liked</h3>
        <div className="liked-movie-grid">
          {likedMovies.map((movie) => (
            <div key={movie.id} className="modal-movie-item">
              <img
                src={movie.poster || 'https://via.placeholder.com/200x300?text=No+Poster'}
                alt={movie.title}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/200x300?text=No+Poster';
                }}
              />
              <div className="movie-info">
                <h4>{movie.title}</h4>
                <p>{movie.year}</p>
              </div>
              <button 
                className="delete-button" 
                onClick={() => deleteMovie(movie.id)}
                title="Remove from liked movies"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDislikedModal = () => (
    <div className="movie-modal">
      <div className="modal-overlay" onClick={() => setShowDislikedModal(false)} />
      <div className="modal-content">
        <button className="modal-close" onClick={() => setShowDislikedModal(false)}>×</button>
        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#fff' }}>Movies You Disliked</h3>
        <div className="disliked-movie-grid">
          {dislikedMovies.map((movie) => (
            <div key={movie.id} className="modal-movie-item">
              <img
                src={movie.poster || 'https://via.placeholder.com/200x300?text=No+Poster'}
                alt={movie.title}
                style={{ border: '2px solid #ff4d4d' }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/200x300?text=No+Poster';
                }}
              />
              <div className="movie-info">
                <h4>{movie.title}</h4>
                <p>{movie.year}</p>
              </div>
              <button 
                className="delete-button" 
                onClick={() => deleteMovie(movie.id)}
                title="Remove from disliked movies"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!userData) {
    return (
      <div className="guest-sidebar">
        <button className="sidebar-close" onClick={onClose}>×</button>
        <div className="auth-options">
          <h3>Welcome to MovieRecs</h3>
          <Link to="/login" className="auth-btn login" onClick={onClose}>Log In</Link>
          <Link to="/register" className="auth-btn register" onClick={onClose}>Create Account</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <button className="sidebar-close" onClick={onClose}>×</button>

      <div className="profile-header">
        <label htmlFor="avatar-upload" className="avatar-label">
          <img 
            src={avatar} 
            alt="User" 
            className="user-avatar" 
            onError={(e) => { e.target.src = personIcon; }} 
          />
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;

              const reader = new FileReader();
              reader.onloadend = async () => {
                const base64 = reader.result;

                if (base64.length > 1048487) {
                  setAvatarError("Avatar image is too large. Please choose a smaller image.");
                  return;
                }

                try {
                  const userRef = doc(db, "users", auth.currentUser.uid);
                  await updateDoc(userRef, { avatar: base64 });
                  setAvatar(base64);
                } catch (err) {
                  console.error("Error saving avatar:", err);
                  setAvatarError("Failed to save avatar. Try again later.");
                }
              };

              reader.readAsDataURL(file);
            }}
          />
        </label>

        <h3>{userData.name}</h3>
        <p>{userData.email}</p>
      </div>

      <div className="profile-actions">
        <button 
          className="action-btn" 
          onClick={() => setShowPasswordModal(true)}
        >
          Change Password
        </button>
      </div>

      {renderLikedPreview()}
      {renderDislikedPreview()}

      <div className="logout-section">
        {showLogoutConfirm ? (
          <div className="logout-confirm">
            <p>Are you sure?</p>
            <div className="confirm-buttons">
              <button className="confirm-btn logout" onClick={onLogout}>Yes, Logout</button>
              <button className="confirm-btn cancel" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="action-btn logout" onClick={() => setShowLogoutConfirm(true)}>Logout</button>
        )}
      </div>

      {selectedMovie && (
        <div className="movie-modal">
          <div className="modal-overlay" onClick={() => setSelectedMovie(null)} />
          <div className="modal-content">
            <button className="modal-close" onClick={() => setSelectedMovie(null)}>×</button>
            <img
              src={selectedMovie.poster || 'https://via.placeholder.com/500x750?text=No+Poster'}
              alt={`Poster for ${selectedMovie.title}`}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/500x750?text=No+Poster';
              }}
            />
          </div>
        </div>
      )}

      {showLikedModal && renderLikedModal()}
      {showDislikedModal && renderDislikedModal()}
      {showPasswordModal && renderChangePasswordModal()}

      {avatarError && (
        <div className="avatar-error-modal">
          <div className="modal-content">
            <p>{avatarError}</p>
            <button onClick={() => setAvatarError("")}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarProfile;