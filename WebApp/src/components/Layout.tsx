import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import './Layout.css';

const Layout: React.FC = () => {
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
