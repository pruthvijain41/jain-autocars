import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase/firebase'; // Adjust the path as necessary
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Clean up the subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading authentication state...</div>; // Or a more sophisticated loading spinner
  }

  if (!user) {
    // User is not authenticated, redirect to login page
    return <Navigate to="/admin/login" replace />;
  }

  // User is authenticated, render the child components (the protected route)
  return children;
};

export default ProtectedRoute;