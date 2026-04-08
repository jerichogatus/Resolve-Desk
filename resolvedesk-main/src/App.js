import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Kanban from './components/Kanban';
import CreateTicket from './components/CreateTicket';
import TicketList from './components/TicketList';
import TicketDetails from './components/TicketDetails';
import AdminCreateUser from './components/AdminCreateUser';
import AdminUsers from './components/AdminUsers';
import './App.css';

// Protected Route Component
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

// IT Staff Only Route Component
function ITRoute({ children }) {
  const { currentUser, userRole } = useAuth();
  return currentUser && (userRole === 'it' || currentUser.email === 'master@admin.com') ? children : <Navigate to="/dashboard" />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/kanban" 
            element={
              <ITRoute>
                <Kanban />
              </ITRoute>
            } 
          />
          <Route 
            path="/create-ticket" 
            element={
              <PrivateRoute>
                <CreateTicket />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/tickets" 
            element={
              <PrivateRoute>
                <TicketList />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/ticket/:id" 
            element={
              <PrivateRoute>
                <TicketDetails />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin/create-user" 
            element={
              <PrivateRoute>
                <AdminCreateUser />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <PrivateRoute>
                <AdminUsers />
              </PrivateRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;