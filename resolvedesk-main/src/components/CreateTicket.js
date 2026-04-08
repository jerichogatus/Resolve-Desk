import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  db, 
  storage, 
  collection, 
  addDoc, 
  serverTimestamp,
  ref,
  uploadBytes,
  getDownloadURL 
} from '../firebase';
import Layout from './Layout';
import './Ticket.css';

function CreateTicket() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'hardware',
    priority: 'medium',
    attachment: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categories = [
    'Hardware',
    'Software',
    'Network',
    'Account Access',
    'Other'
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'green' },
    { value: 'medium', label: 'Medium', color: 'orange' },
    { value: 'high', label: 'High', color: 'red' },
    { value: 'critical', label: 'Critical', color: 'darkred' }
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let attachmentURL = null;

      // Upload attachment if exists
      if (formData.attachment) {
        const storageRef = ref(storage, `tickets/${Date.now()}_${formData.attachment.name}`);
        await uploadBytes(storageRef, formData.attachment);
        attachmentURL = await getDownloadURL(storageRef);
      }

      // Create ticket in Firestore
      const ticketData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        status: 'open',
        creatorId: currentUser.uid,
        creatorName: currentUser.name,
        creatorEmail: currentUser.email,
        department: currentUser.department,
        attachmentURL,
        assignedTo: null,
        assignedToName: null,
        comments: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'tickets'), ticketData);
      
      // Show success message with timestamp
      const now = new Date();
      const timestamp = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      setSuccess(`✓ Ticket created successfully at ${timestamp}`);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'hardware',
        priority: 'medium',
        attachment: null
      });
      
      // Navigate after 2 seconds
      setTimeout(() => {
        navigate('/tickets');
      }, 2000);
    } catch (error) {
      setError('Failed to create ticket: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  function handleFileChange(e) {
    if (e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        attachment: e.target.files[0]
      }));
    }
  }

  return (
    <Layout>
      <div className="ticket-container">
        <div className="ticket-header">
          <h1>Create New Support Ticket</h1>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="ticket-form">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Brief summary of the issue"
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="5"
              placeholder="Detailed description of the problem..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {categories.map(cat => (
                  <option key={cat} value={cat.toLowerCase()}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Priority *</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
              >
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Attachment (Optional)</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx"
            />
            <small>Supported: Images, PDF, DOC</small>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/tickets')}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Creating Ticket...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default CreateTicket;