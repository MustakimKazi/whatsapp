// App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import ChatApp from "./pages/ChatApp";
import { AuthProvider, useAuth } from "../context/AuthContext"; // Adjust path as needed

// Protected Route - for pages that require authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#2f3136',
        color: 'white',
        fontFamily: 'Segoe UI, sans-serif'
      }}>
        <div>Loading...</div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

// Public Route - for pages that should NOT be accessible when authenticated
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#2f3136',
        color: 'white',
        fontFamily: 'Segoe UI, sans-serif'
      }}>
        <div>Loading...</div>
      </div>
    );
  }
  
  return !isAuthenticated ? children : <Navigate to="/chat" replace />;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/signup"  // Changed from sign_up to signup
            element={
              <PublicRoute>
                <SignUp />
              </PublicRoute>
            } 
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatApp />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;