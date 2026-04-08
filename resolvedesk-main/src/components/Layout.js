import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiHome, 
  FiPlusCircle, 
  FiList, 
  FiUsers, 
  FiLogOut, 
  FiSettings, 
  FiBell,
  FiTrello
} from 'react-icons/fi';
import './Layout.css';
import logo from '../logoResolveDesk.jpg'; // Import the logo

function Layout({ children }) {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  const isMasterAdmin = currentUser?.email === 'master@admin.com';

  const getPageTitle = () => {
    const path = window.location.pathname;
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('kanban')) return 'Task Board';
    if (path.includes('create-ticket')) return 'Create New Ticket';
    if (path.includes('tickets')) return 'Ticket Management';
    if (path.includes('admin/users')) return 'User Management';
    if (path.includes('admin/create-user')) return 'Create User';
    if (path.includes('admin')) return 'IT Administration';
    return 'ResolveDesk';
  };

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo">
              <img src={logo} alt="ResolveDesk Logo" className="logo-image" />
              <div className="logo-text">
                <h2>RESOLVEDESK</h2>
                <p>IT SOLUTION FOR BPO</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="user-profile">
          <div className="user-avatar">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div className="user-details">
            <p className="user-name">{currentUser?.name || 'User'}</p>
            <p className="user-badge">
              {isMasterAdmin ? 'Master Admin' : userRole === 'it' ? 'IT Specialist' : 'BPO Staff'}
            </p>
          </div>
        </div>

        <div className="nav-section">
          <p className="nav-section-title">MAIN MENU</p>
          <ul className="nav-links">
            <li>
              <Link to="/dashboard">
                <FiHome /> <span>Dashboard</span>
              </Link>
            </li>
            {(userRole === 'it' || isMasterAdmin) && (
              <li>
                <Link to="/kanban">
                  <FiTrello /> <span>Kanban Board</span>
                </Link>
              </li>
            )}
            <li>
              <Link to="/create-ticket">
                <FiPlusCircle /> <span>Create Ticket</span>
              </Link>
            </li>
            <li>
              <Link to="/tickets">
                <FiList /> <span>My Tickets</span>
              </Link>
            </li>
          </ul>
        </div>

        {(userRole === 'it' || isMasterAdmin) && (
          <div className="nav-section">
            <p className="nav-section-title">ADMINISTRATION</p>
            <ul className="nav-links">
              <li>
                <Link to="/admin/users">
                  <FiUsers /> <span>User Management</span>
                </Link>
              </li>
              {isMasterAdmin && (
                <li>
                  <Link to="/admin/create-user">
                    <FiSettings /> <span>Create User</span>
                  </Link>
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <FiLogOut /> <span>Sign Out</span>
          </button>
        </div>
      </nav>

      <main className="main-content">
        <div className="top-bar">
          <div className="page-title">
            <h1>{getPageTitle()}</h1>
          </div>
          <div className="top-bar-actions">
            <button className="notification-btn">
              <FiBell />
              <span className="notification-badge">3</span>
            </button>
          </div>
        </div>
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;