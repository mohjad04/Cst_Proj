import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RoleGate({ allowed }) {
  const { user } = useAuth();
  const role = user?.role;

  if (!role) return <Navigate to="/login" replace />;
  if (!allowed.includes(role)) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
}
