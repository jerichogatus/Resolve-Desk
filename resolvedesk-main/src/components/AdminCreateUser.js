import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, serverTimestamp } from '../firebase';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import Layout from './Layout';
import './Admin.css';

function AdminCreateUser() {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'bpo',
    department: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const departments = [
    'BPO Operations',
    'Customer Service',
    'Technical Support',
    'Sales',
    'Marketing',
    'HR',
    'Finance',
    'IT Department'
  ];

  // Only master admin can access this (check if email is master admin)
  const isMasterAdmin = currentUser?.email === 'master@admin.com';

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create user in Firebase Auth
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: formData.email,
        role: formData.role,
        department: formData.department,
        name: formData.name,
        createdAt: serverTimestamp(),
        createdBy: currentUser.email,
        active: true
      });

      setSuccess(`User ${formData.name} created successfully!`);
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'bpo',
        department: ''
      });
    } catch (error) {
      setError('Failed to create user: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }

  // If not master admin, show access denied
  if (!isMasterAdmin) {
    return (
      <Layout>
        <div className="admin-container">
          <div className="access-denied">
            <h2>Access Denied</h2>
            <p>Only the Master Admin can access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="admin-container">
        <div className="admin-header">
          <h1>Admin Panel - Create Users</h1>
          <p>Master Admin: Create accounts for IT staff and employees</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="admin-form-card">
          <h2>Create New User Account</h2>
          
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter full name"
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter email address"
              />
            </div>

            <div className="form-group">
              <label>Temporary Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter temporary password"
                minLength="6"
              />
              <small>Password must be at least 6 characters</small>
            </div>

            <div className="form-group">
              <label>Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="bpo">Employee (Can only create tickets)</option>
                <option value="it">IT Staff (Can view and edit all tickets)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Department *</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Creating User...' : 'Create User Account'}
            </button>
          </form>
        </div>

        <div className="info-box">
          <h3>Account Types:</h3>
          <ul>
            <li><strong>IT Staff:</strong> Can view all tickets, update status, assign tickets, add comments</li>
            <li><strong>Employee:</strong> Can only create tickets and view their own tickets</li>
          </ul>
          <p className="note">Note: New users will use the email and temporary password you set to login.</p>
        </div>
      </div>
    </Layout>
  );
}

export default AdminCreateUser;