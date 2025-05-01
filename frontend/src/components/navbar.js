import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import '../styles/navbar.css';
import personIcon from './person_icon.svg';
import SidebarProfile from './SidebarProfile';

const Navbar = ({ isAuthenticated, userData, setIsAuthenticated }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setSidebarOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">MovieRec</Link>
        
        <div className="profile-container">
          <div 
            className="profile-icon" 
            onClick={toggleSidebar}
            aria-label="User menu"
            aria-expanded={sidebarOpen}
            role="button"
          >
            <img 
              src={isAuthenticated ? (userData?.avatar || personIcon) : personIcon} 
              alt="Profile" 
              className={isAuthenticated && userData?.avatar ? 'user-avatar-icon' : ''}
              onError={(e) => {
                e.target.src = personIcon;
                e.target.className = '';
              }}
            />
          </div>

          <div className={`profile-sidebar ${sidebarOpen ? 'active' : ''}`}>
            <div className="sidebar-content">
              {isAuthenticated ? (
                <>
                  <SidebarProfile 
                    userData={userData}
                    onClose={closeSidebar}
                    onLogout={handleLogout}
                  />
                  <div className="quick-actions">
                    <Link 
                      to="/recommendations" 
                      className="quick-btn"
                      onClick={closeSidebar}
                    >
                      My Recommendations
                    </Link>
                    <Link 
                      to="/preferences" 
                      className="quick-btn"
                      onClick={closeSidebar}
                    >
                      Preferences
                    </Link>
                  </div>
                </>
              ) : (
                <div className="auth-options">
                  <h3>Welcome</h3>
                  <Link 
                    to="/login" 
                    className="auth-btn login"
                    onClick={closeSidebar}
                    state={{ from: window.location.pathname }}
                  >
                    Log In
                  </Link>
                  <div className="divider">or</div>
                  <Link 
                    to="/register" 
                    className="auth-btn register"
                    onClick={closeSidebar}
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
            <button 
              className="sidebar-close" 
              onClick={closeSidebar}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;