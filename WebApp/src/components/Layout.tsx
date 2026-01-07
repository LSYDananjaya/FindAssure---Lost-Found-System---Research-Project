import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <Link to="/" className="logo">
            <h1>FindAssure</h1>
          </Link>
          <nav className="nav">
            <Link to="/" className="nav-link">Dashboard</Link>
            <Link to="/add-item" className="nav-link nav-link-primary">Add Found Item</Link>
            
            {!loading && (
              <>
                {user ? (
                  <div className="user-menu">
                    <Link to="/profile" className="nav-link">👤 {user.name}</Link>
                    <button onClick={handleSignOut} className="btn-signout">
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="auth-links">
                    <Link to="/login" className="nav-link">Sign In</Link>
                    <Link to="/register" className="nav-link nav-link-primary">Sign Up</Link>
                  </div>
                )}
              </>
            )}
          </nav>
        </div>
      </header>
      
      <main className="main-content">
        <Outlet />
      </main>
      
      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 FindAssure - Lost & Found System. SLIIT Research Project.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
