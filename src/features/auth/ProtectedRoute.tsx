import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Could be a proper spinner component later
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
