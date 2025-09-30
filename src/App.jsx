import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import ChatApp from "./pages/ChatApp";
import { AuthProvider, AuthContext } from "../AuthContext"; // 👈 Fixed path (should be relative to App.jsx)

// Protected Route - for pages that require authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = React.useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

// Public Route - for pages that should NOT be accessible when authenticated
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = React.useContext(AuthContext);
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
            path="/sign_up" 
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