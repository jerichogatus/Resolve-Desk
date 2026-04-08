import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  db, 
  collection, 
  query, 
  where, 
  onSnapshot 
} from '../firebase';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import { 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiInbox, 
  FiArrowRight, 
  FiTrendingUp,
  FiPlusCircle 
} from 'react-icons/fi';
import './Dashboard.css';

function Dashboard() {
  const { currentUser, userRole } = useAuth();
  const [metrics, setMetrics] = useState({
    totalOpen: 0,
    inProgress: 0,
    resolvedToday: 0,
    totalTickets: 0
  });
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ticketsQuery;

    if (userRole === 'it') {
      // For IT staff, get all tickets
      ticketsQuery = query(collection(db, 'tickets'));
    } else {
      // For regular users, get their tickets only
      ticketsQuery = query(
        collection(db, 'tickets'),
        where('creatorId', '==', currentUser.uid)
      );
    }

    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
      const tickets = [];
      let openCount = 0;
      let inProgressCount = 0;
      let resolvedTodayCount = 0;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      snapshot.forEach((doc) => {
        const ticket = { id: doc.id, ...doc.data() };
        tickets.push(ticket);

        if (ticket.status === 'open') openCount++;
        if (ticket.status === 'in progress') inProgressCount++;
        
        if (ticket.status === 'resolved' && ticket.updatedAt) {
          let updatedDate;
          // Handle both Firestore Timestamp and Date objects
          if (ticket.updatedAt.toDate && typeof ticket.updatedAt.toDate === 'function') {
            updatedDate = ticket.updatedAt.toDate();
          } else if (ticket.updatedAt instanceof Date) {
            updatedDate = ticket.updatedAt;
          } else {
            updatedDate = new Date(ticket.updatedAt);
          }
          updatedDate.setHours(0, 0, 0, 0);
          if (updatedDate.getTime() === today.getTime()) {
            resolvedTodayCount++;
          }
        }
      });

      setMetrics({
        totalOpen: openCount,
        inProgress: inProgressCount,
        resolvedToday: resolvedTodayCount,
        totalTickets: tickets.length
      });

      setRecentTickets(tickets.slice(0, 5));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, userRole]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    
    try {
      // Handle Firestore Timestamp objects
      if (timestamp && typeof timestamp === 'object' && timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } 
      // Handle Date objects
      else if (timestamp instanceof Date) {
        date = timestamp;
      } 
      // Handle milliseconds (number)
      else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } 
      // Handle ISO strings
      else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } 
      // Handle objects with seconds property (Firestore Timestamp structure)
      else if (timestamp.seconds !== undefined) {
        date = new Date(timestamp.seconds * 1000);
      }
      else {
        return 'N/A';
      }
      
      // Validate date
      if (!date || isNaN(date.getTime())) {
        return 'N/A';
      }
      
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric'
        }).format(date);
      }
    } catch (error) {
      console.warn('Date formatting error:', error);
      return 'N/A';
    }
  };

  const formatFullTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';

    let date;
    try {
      // Handle Firestore Timestamp objects
      if (timestamp && typeof timestamp === 'object' && timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } 
      // Handle Date objects
      else if (timestamp instanceof Date) {
        date = timestamp;
      } 
      // Handle milliseconds (number)
      else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } 
      // Handle ISO strings
      else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } 
      // Handle objects with seconds property (Firestore Timestamp structure)
      else if (timestamp.seconds !== undefined) {
        date = new Date(timestamp.seconds * 1000);
      }
      else {
        return 'N/A';
      }

      if (!date || isNaN(date.getTime())) {
        return 'N/A';
      }

      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (error) {
      console.warn('Full timestamp formatting error:', error);
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Welcome back, {currentUser?.name}!</h1>
          <p className="welcome-text">Here's what's happening with your tickets today.</p>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">
              <FiInbox />
            </div>
            <h3>Open Tickets</h3>
            <p className="metric-value">{metrics.totalOpen}</p>
            <div className="metric-trend">
              <FiTrendingUp /> +12% from last week
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <FiClock />
            </div>
            <h3>In Progress</h3>
            <p className="metric-value">{metrics.inProgress}</p>
            <div className="metric-trend">
              {metrics.inProgress > 0 ? `${Math.round((metrics.inProgress/metrics.totalTickets)*100)}% of total` : 'No active tickets'}
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <FiCheckCircle />
            </div>
            <h3>Resolved Today</h3>
            <p className="metric-value">{metrics.resolvedToday}</p>
            <div className="metric-trend">
              {metrics.resolvedToday > 0 ? 'Great job! 🎉' : 'No resolutions yet'}
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <FiAlertCircle />
            </div>
            <h3>Total Tickets</h3>
            <p className="metric-value">{metrics.totalTickets}</p>
            <div className="metric-trend">
              Lifetime tickets
            </div>
          </div>
        </div>

        <div className="recent-tickets">
          <div className="section-header">
            <h2>Recent Ticket Activity</h2>
            <Link to="/tickets" className="view-all-link">
              View All <FiArrowRight />
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div className="no-tickets">
              <div className="no-tickets-icon">🎫</div>
              <h3>No tickets yet</h3>
              <p>Create your first support ticket to get started</p>
              <Link to="/create-ticket" className="create-first-ticket">
                <FiPlusCircle /> Create Your First Ticket
              </Link>
            </div>
          ) : (
            <div className="tickets-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Created By</th>
                    <th>Created</th>
                    <th>Timestamp</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.map(ticket => (
                    <tr key={ticket.id}>
                      <td>#{ticket.id.slice(-6).toUpperCase()}</td>
                      <td>{ticket.title}</td>
                      <td>
                        <span className={`status-badge ${ticket.status === 'in progress' ? 'in-progress' : ticket.status}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td>
                        <span className={`priority-indicator priority-${ticket.priority}`}>
                          <span className="priority-dot"></span>
                          {ticket.priority}
                        </span>
                      </td>
                      <td>{ticket.creatorName || ticket.createdBy || 'Unknown'}</td>
                      <td>{formatDate(ticket.createdAt)}</td>
                      <td>{formatFullTimestamp(ticket.createdAt)}</td>
                      <td>
                        <Link to={`/ticket/${ticket.id}`} className="view-btn">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;