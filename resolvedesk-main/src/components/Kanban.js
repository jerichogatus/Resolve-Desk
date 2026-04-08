import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  db, 
  collection, 
  query, 
  where, 
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp
} from '../firebase';
import Layout from './Layout';
import { FiPlus } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import './Kanban.css';

function Kanban() {
  const { currentUser, userRole } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedTicket, setDraggedTicket] = useState(null);

  const statuses = useMemo(() => ['open', 'in progress', 'resolved', 'closed'], []);

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
      const fetchedTickets = [];
      snapshot.forEach((doc) => {
        const ticket = { id: doc.id, ...doc.data() };
        // Filter by valid statuses
        if (statuses.includes(ticket.status)) {
          fetchedTickets.push(ticket);
        }
      });
      setTickets(fetchedTickets);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [statuses, currentUser, userRole]);

  const handleDragStart = (e, ticket) => {
    setDraggedTicket(ticket);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, status) => {
    e.preventDefault();
    if (!draggedTicket || draggedTicket.status === status) {
      setDraggedTicket(null);
      return;
    }

    try {
      const ticketRef = doc(db, 'tickets', draggedTicket.id);
      const updateData = { 
        status,
        updatedAt: serverTimestamp()
      };
      
      // If moving to resolved, capture resolver info
      if (status === 'resolved') {
        updateData.resolvedAt = serverTimestamp();
        updateData.resolvedBy = currentUser.name || currentUser.email;
        updateData.resolvedById = currentUser.uid;
      }
      
      await updateDoc(ticketRef, updateData);
      setDraggedTicket(null);
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const getTicketsByStatus = (status) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  const getPriorityColor = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'critical': return '#d32f2f';
      case 'high': return '#f57c00';
      case 'medium': return '#fbc02d';
      case 'low': return '#388e3c';
      default: return '#1976d2';
    }
  };

  const formatFullTimestamp = (timestamp) => {
    if (!timestamp) return 'No Date';
    
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
        return 'No Date';
      }
      
      // Validate date
      if (!date || isNaN(date.getTime())) {
        return 'No Date';
      }
      
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.warn('Date formatting error:', error);
      return 'No Date';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="kanban-container">
          <div className="loading">Loading Task Board...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="kanban-container">
        <div className="kanban-header">
          <h1>Task Board</h1>
          {userRole !== 'user' && (
            <Link to="/create-ticket" className="btn-create-ticket">
              <FiPlus /> New Ticket
            </Link>
          )}
        </div>

        <div className="kanban-board">
          {statuses.map((status) => (
            <div
              key={status}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className="column-header">
                <h2>{status.charAt(0).toUpperCase() + status.slice(1)}</h2>
                <span className="ticket-count">{getTicketsByStatus(status).length}</span>
              </div>

              <div className="tickets-list">
                {getTicketsByStatus(status).map((ticket) => (
                  <Link
                    key={ticket.id}
                    to={`/ticket/${ticket.id}`}
                    className="kanban-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticket)}
                  >
                    <div className="card-header">
                      <span className="ticket-id">{ticket.id.substring(0, 8)}</span>
                      <div
                        className="priority-indicator"
                        style={{ backgroundColor: getPriorityColor(ticket.priority) }}
                        title={ticket.priority}
                      ></div>
                    </div>
                    <h3 className="card-title">{ticket.title}</h3>
                    <p className="card-description">{ticket.description.substring(0, 80)}...</p>
                    <div className="card-footer">
                      {ticket.status === 'resolved' && ticket.resolvedAt ? (
                        <>
                          <span className="card-date resolved" title={formatFullTimestamp(ticket.resolvedAt)}>
                            Resolved: {formatFullTimestamp(ticket.resolvedAt)}
                          </span>
                          <span className="card-resolver">
                            By: {ticket.resolvedBy || 'Unknown'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="card-date" title={formatFullTimestamp(ticket.createdAt)}>
                            Created: {formatFullTimestamp(ticket.createdAt)}
                          </span>
                          <span className="card-assignee">{ticket.assignedTo || 'Unassigned'}</span>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default Kanban;
