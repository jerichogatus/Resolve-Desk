import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  db, 
  doc, 
  updateDoc, 
  arrayUnion, 
  onSnapshot,
  collection,
  query,
  where,
  getDocs
} from '../firebase';
import Layout from './Layout';
import './Ticket.css';

function TicketDetails() {
  const { id } = useParams();
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [status, setStatus] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Real-time ticket updates
    const unsubscribe = onSnapshot(doc(db, 'tickets', id), (doc) => {
      if (doc.exists()) {
        setTicket({ id: doc.id, ...doc.data() });
        setStatus(doc.data().status);
      } else {
        navigate('/tickets');
      }
      setLoading(false);
    });

    // Load IT staff for assignment (if IT user)
    if (userRole === 'it') {
      loadITStaff();
    }

    return () => unsubscribe();
  }, [id, navigate, userRole]);

  async function loadITStaff() {
    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'it')
    );
    const snapshot = await getDocs(usersQuery);
    const staffList = [];
    snapshot.forEach((doc) => {
      staffList.push({ id: doc.id, ...doc.data() });
    });
    setUsers(staffList);
  }

  async function addComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const ticketRef = doc(db, 'tickets', id);
      await updateDoc(ticketRef, {
        comments: arrayUnion({
          text: comment,
          author: currentUser.name,
          authorId: currentUser.uid,
          authorRole: userRole,
          timestamp: new Date().toISOString()
        }),
        updatedAt: new Date().toISOString()
      });
      setComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }

  async function assignTicket() {
    if (!assignTo) return;

    try {
      const selectedUser = users.find(u => u.id === assignTo);
      const ticketRef = doc(db, 'tickets', id);
      await updateDoc(ticketRef, {
        assignedTo: assignTo,
        assignedToName: selectedUser?.name || 'Unknown',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error assigning ticket:', error);
    }
  }

  async function updateStatus(newStatus) {
    try {
      const ticketRef = doc(db, 'tickets', id);
      await updateDoc(ticketRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      setStatus(newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      open: '#3498db',
      'in progress': '#f39c12',
      resolved: '#27ae60',
      closed: '#95a5a6'
    };
    return colors[status?.toLowerCase()] || '#95a5a6';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#27ae60',
      medium: '#f39c12',
      high: '#e74c3c',
      critical: '#c0392b'
    };
    return colors[priority?.toLowerCase()] || '#95a5a6';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading ticket...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ticket-details-container">
        <button onClick={() => navigate('/tickets')} className="back-btn">
          ← Back to Tickets
        </button>

        <div className="ticket-details">
          <div className="ticket-details-header">
            <h1>{ticket.title}</h1>
            <div className="ticket-badges">
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(ticket.status) }}
              >
                {ticket.status}
              </span>
              <span 
                className="priority-badge"
                style={{ backgroundColor: getPriorityColor(ticket.priority) }}
              >
                {ticket.priority}
              </span>
            </div>
          </div>

          <div className="ticket-info-grid">
            <div className="info-item">
              <label>Ticket ID</label>
              <span>#{ticket.id.slice(-8)}</span>
            </div>
            <div className="info-item">
              <label>Created By</label>
              <span>{ticket.creatorName}</span>
            </div>
            <div className="info-item">
              <label>Department</label>
              <span>{ticket.department}</span>
            </div>
            <div className="info-item">
              <label>Category</label>
              <span>{ticket.category}</span>
            </div>
            <div className="info-item">
              <label>Created</label>
              <span>{formatDate(ticket.createdAt)}</span>
            </div>
            <div className="info-item">
              <label>Last Updated</label>
              <span>{formatDate(ticket.updatedAt)}</span>
            </div>
            {ticket.assignedToName && (
              <div className="info-item">
                <label>Assigned To</label>
                <span>{ticket.assignedToName}</span>
              </div>
            )}
          </div>

          <div className="ticket-description-section">
            <h3>Description</h3>
            <p>{ticket.description}</p>
          </div>

          {ticket.attachmentURL && (
            <div className="attachment-section">
              <h3>Attachment</h3>
              <a href={ticket.attachmentURL} target="_blank" rel="noopener noreferrer">
                View Attachment
              </a>
            </div>
          )}

          {/* IT Staff Controls */}
          {userRole === 'it' && (
            <div className="it-controls">
              <h3>IT Management</h3>
              <div className="control-group">
                <label>Assign to IT Staff:</label>
                <div className="assign-control">
                  <select 
                    value={assignTo} 
                    onChange={(e) => setAssignTo(e.target.value)}
                  >
                    <option value="">Select IT Staff</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} - {user.department}
                      </option>
                    ))}
                  </select>
                  <button onClick={assignTicket} className="assign-btn">
                    Assign
                  </button>
                </div>
              </div>

              <div className="control-group">
                <label>Update Status:</label>
                <div className="status-control">
                  <select 
                    value={status} 
                    onChange={(e) => updateStatus(e.target.value)}
                  >
                    <option value="open">Open</option>
                    <option value="in progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="comments-section">
            <h3>Comments & Updates</h3>
            
            <div className="comments-list">
              {ticket.comments && ticket.comments.length > 0 ? (
                ticket.comments.map((comment, index) => (
                  <div key={index} className="comment">
                    <div className="comment-header">
                      <span className="comment-author">{comment.author}</span>
                      <span className="comment-role">{comment.authorRole}</span>
                      <span className="comment-date">
                        {formatDate(comment.timestamp)}
                      </span>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                ))
              ) : (
                <p className="no-comments">No comments yet</p>
              )}
            </div>

            <form onSubmit={addComment} className="comment-form">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment or update..."
                rows="3"
                required
              />
              <button type="submit" className="submit-comment">
                Add Comment
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default TicketDetails;