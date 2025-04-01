import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/navbar.css';
import personIcon from './person_icon.svg';

const Navbar = ({ isAuthenticated, userData, setIsAuthenticated }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setSidebarOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">MovieRec</Link>
        
        <div className="profile-container">
          <div className="profile-icon" onClick={toggleSidebar}>
            <img src={personIcon} alt="Profile" />
          </div>

          <div className={`profile-sidebar ${sidebarOpen ? 'active' : ''}`}>
            <div className="sidebar-content">
              {isAuthenticated ? (
                <div className="user-profile">
                  <img 
                    src={userData?.avatar || personIcon} 
                    alt="User" 
                    className="user-avatar" 
                  />
                  <h3>{userData?.name || 'User'}</h3>
                  <p>{userData?.email || ''}</p>
                  <Link 
                    to="/profile" 
                    className="profile-btn edit"
                    onClick={closeSidebar}
                  >
                    View Profile
                  </Link>
                  <button 
                    className="profile-btn logout"
                    onClick={handleLogout}
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="auth-options">
                  <h3>Welcome</h3>
                  <Link 
                    to="/login" 
                    className="auth-btn login"
                    onClick={closeSidebar}
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
            <button className="sidebar-close" onClick={closeSidebar}>
              ×
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;