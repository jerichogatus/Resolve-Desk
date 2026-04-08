import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  auth, 
  db, 
  doc, 
  getDoc 
} from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  async function login(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user is active (skip for master admin)
      if (email !== 'master@admin.com') {
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // User must have active: true to login (any other value blocks login)
          if (userData.active !== true) {
            // User is inactive - log them out
            await signOut(auth);
            const error = new Error('Your account has been deactivated. Contact administrator for assistance.');
            error.code = 'auth/user-inactive';
            throw error;
          }
        } else {
          // User document doesn't exist - log them out
          await signOut(auth);
          const error = new Error('User profile not found.');
          error.code = 'auth/user-not-found';
          throw error;
        }
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get user role and status from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Check if user is active - skip for master admin
            if (user.email !== 'master@admin.com' && userData.active !== true) {
              // User is inactive - log them out
              await signOut(auth);
              setCurrentUser(null);
              setUserRole(null);
            } else {
              setUserRole(userData.role);
              setCurrentUser({ ...user, ...userData });
            }
          } else {
            // User document doesn't exist - log them out
            await signOut(auth);
            setCurrentUser(null);
            setUserRole(null);
          }
        } catch (error) {
          console.error('Error checking user status:', error);
          await signOut(auth);
          setCurrentUser(null);
          setUserRole(null);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}