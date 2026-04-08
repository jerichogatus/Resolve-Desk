import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  db, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from '../firebase';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import './Ticket.css';

function TicketList() {
  const { currentUser, userRole } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let q;
    
    if (userRole === 'it') {
      // IT staff can see all tickets
      q = query(
        collection(db, 'tickets'),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Regular users see only their tickets
      q = query(
        collection(db, 'tickets'),
        where('creatorId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketData = [];
      snapshot.forEach((doc) => {
        ticketData.push({ id: doc.id, ...doc.data() });
      });
      setTickets(ticketData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tickets:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, userRole]);

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
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading tickets...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ticket-list-container">
        <div className="ticket-list-header">
          <h1>Support Tickets</h1>
          <Link to="/create-ticket" className="create-ticket-btn">
            + New Ticket
          </Link>
        </div>

        <div className="filter-bar">
          <label>Filter by Status:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Tickets</option>
            <option value="open">Open</option>
            <option value="in progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="no-tickets">
            <p>No tickets found</p>
            <Link to="/create-ticket" className="create-first-ticket">
              Create your first ticket
            </Link>
          </div>
        ) : (
          <div className="ticket-grid">
            {filteredTickets.map(ticket => (
              <Link to={`/ticket/${ticket.id}`} key={ticket.id} className="ticket-card">
                <div className="ticket-card-header">
                  <h3>{ticket.title}</h3>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(ticket.status) }}
                  >
                    {ticket.status}
                  </span>
                </div>
                
                <p className="ticket-description">{ticket.description.substring(0, 100)}...</p>
                
                <div className="ticket-meta">
                  <span>#{ticket.id.slice(-6)}</span>
                  <span>{ticket.category}</span>
                </div>
                
                <div className="ticket-footer">
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(ticket.priority) }}
                  >
                    {ticket.priority}
                  </span>
                  <span className="ticket-date">
                    {formatDate(ticket.createdAt)}
                  </span>
                </div>

                {ticket.assignedToName && (
                  <div className="assigned-info">
                    Assigned to: {ticket.assignedToName}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default TicketList;