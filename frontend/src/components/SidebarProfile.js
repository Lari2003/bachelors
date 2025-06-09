import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import personIcon from './person_icon.svg';

const SidebarProfile = ({ userData, onClose, onLogout }) => {
  const [avatar, setAvatar] = useState(personIcon);
  const [likedMovies, setLikedMovies] = useState([]);
  const [dislikedMovies, setDislikedMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [showLikedModal, setShowLikedModal] = useState(false);
  const [showDislikedModal, setShowDislikedModal] = useState(false);

  useEffect(() => {
    if (userData?.avatar) {
      setAvatar(userData.avatar);
    } else {
      setAvatar(personIcon);
    }
  }, [userData]);

  useEffect(() => {
    const fetchFeedback = async () => {
      if (auth.currentUser) {
        const feedbackRef = collection(db, "users", auth.currentUser.uid, "feedback");
        const snapshot = await getDocs(feedbackRef);
        const likes = [];
        const dislikes = [];

        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.status === "liked") likes.push(doc.id);
          if (data.status === "disliked") dislikes.push(doc.id);
        });

        setLikedMovies(likes);
        setDislikedMovies(dislikes);
      }
    };

    fetchFeedback();
  }, []);

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
              src={`https://image.tmdb.org/t/p/w200/${likedMovies[0]}.jpg`}
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
              src={`https://image.tmdb.org/t/p/w200/${dislikedMovies[0]}.jpg`}
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
        <div className="liked-movie-grid">
          {likedMovies.map(movieId => (
            <img
              key={movieId}
              src={`https://image.tmdb.org/t/p/w200/${movieId}.jpg`}
              alt={movieId}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/200x300?text=No+Poster';
              }}
            />
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
        <div className="disliked-movie-grid">
          {dislikedMovies.map(movieId => (
            <img
              key={movieId}
              src={`https://image.tmdb.org/t/p/w200/${movieId}.jpg`}
              alt={movieId}
              style={{ border: '2px solid #ff4d4d' }}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/200x300?text=No+Poster';
              }}
            />
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
          <img src={avatar} alt="User" className="user-avatar" onError={(e) => { e.target.src = personIcon; }} />
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
        <Link to="/change-password" className="action-btn" onClick={onClose}>Change Password</Link>
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
              src={`https://image.tmdb.org/t/p/w500/${selectedMovie}.jpg`}
              alt={`Poster for ${selectedMovie}`}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/500x750?text=No+Poster';
              }}
            />
          </div>
        </div>
      )}

      {showLikedModal && renderLikedModal()}
      {showDislikedModal && renderDislikedModal()}

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
