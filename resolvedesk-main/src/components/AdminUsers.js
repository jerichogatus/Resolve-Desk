import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, onSnapshot, updateDoc, deleteDoc, doc } from '../firebase';
import Layout from './Layout';
import { FiUsers, FiSearch, FiFilter, FiTrash2 } from 'react-icons/fi';
import './AdminUsers.css';

function AdminUsers() {
  const { userRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [deletingUserId, setDeletingUserId] = useState(null);

  useEffect(() => {
    if (userRole !== 'it') {
      return;
    }

    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const fetchedUsers = [];
      snapshot.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() });
      });
      setUsers(fetchedUsers.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userRole]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    
    // Handle both Firestore Timestamp and Date objects
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      try {
        date = timestamp.toDate();
      } catch (e) {
        return 'N/A';
      }
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return 'N/A';
    }
    
    // Validate date
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleDateString('en-US');
  };

  const getRoleColor = (role) => {
    switch(role?.toLowerCase()) {
      case 'it':
      case 'admin':
        return '#d32f2f';
      case 'user':
        return '#1976d2';
      default:
        return '#757575';
    }
  };

  const handleToggleStatus = async (userId, userEmail, currentStatus) => {
    if (userEmail === 'master@admin.com') {
      alert('Cannot modify Master Admin account status');
      return;
    }

    const newStatus = !currentStatus;
    const statusText = newStatus ? 'Active' : 'Inactive';
    const confirmToggle = window.confirm(
      `Are you sure you want to set ${userEmail} as ${statusText}?`
    );

    if (!confirmToggle) return;

    try {
      await updateDoc(doc(db, 'users', userId), {
        active: newStatus
      });
    } catch (error) {
      alert('Error updating user status: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (userEmail === 'master@admin.com') {
      alert('Cannot delete Master Admin account');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete the account for ${userEmail}? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setDeletingUserId(userId);
    try {
      await deleteDoc(doc(db, 'users', userId));
      alert('User account deleted successfully');
    } catch (error) {
      alert('Error deleting user: ' + error.message);
    } finally {
      setDeletingUserId(null);
    }
  };

  if (userRole !== 'it') {
    return (
      <Layout>
        <div className="admin-users-container">
          <div className="unauthorized">
            <h2>Access Denied</h2>
            <p>Only IT administrators can access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="admin-users-container">
          <div className="loading">Loading users...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="admin-users-container">
        <div className="users-header">
          <div className="header-title">
            <FiUsers size={28} />
            <h1>User Management</h1>
          </div>
          <div className="users-stats">
            <div className="stat-card">
              <span className="stat-number">{users.length}</span>
              <span className="stat-label">Total Users</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{users.filter(u => u.role === 'it').length}</span>
              <span className="stat-label">IT Admin</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{users.filter(u => u.role === 'user').length}</span>
              <span className="stat-label">Regular Users</span>
            </div>
          </div>
        </div>

        <div className="users-controls">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-box">
            <FiFilter />
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="it">IT Admin</option>
              <option value="user">Regular User</option>
            </select>
          </div>
        </div>

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Last Activity</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="email-cell">{user.email}</td>
                    <td className="name-cell">{user.fullName || user.displayName || user.name || 'N/A'}</td>
                    <td>
                      <span
                        className="role-badge"
                        style={{ borderColor: getRoleColor(user.role) }}
                      >
                        {user.role?.toUpperCase() || 'USER'}
                      </span>
                    </td>
                    <td>
                      {user.email !== 'master@admin.com' && (
                        <span
                          className={`status-badge ${user.active ? 'active' : 'inactive'} status-clickable`}
                          onClick={() => handleToggleStatus(user.id, user.email, user.active)}
                          title="Click to toggle status"
                          style={{ cursor: 'pointer' }}
                        >
                          {user.active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>{formatDate(user.lastLogin) || 'Never'}</td>
                    <td>
                      {user.email !== 'master@admin.com' && (
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={deletingUserId === user.id}
                          title="Delete user account"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-results">
                    No users found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

export default AdminUsers;
