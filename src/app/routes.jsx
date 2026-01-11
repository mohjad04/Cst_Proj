import React from "react";
import { Navigate } from "react-router-dom";

import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import Unauthorized from "../pages/common/Unauthorized";

import ProtectedRoute from "../auth/ProtectedRoute";
import RoleGate from "../auth/RoleGate";

import AdminLayout from "../layouts/AdminLayout";
import StaffLayout from "../layouts/StaffLayout";

// Admin pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import Users from "../pages/admin/Users";
import Agents from "../pages/admin/Agents";
import Categories from "../pages/admin/Categories";
import SlaPolicies from "../pages/admin/SlaPolicies";
import SystemAudit from "../pages/admin/SystemAudit";
import Analytics from "../pages/admin/Analytics";

// Staff pages
import StaffDashboard from "../pages/staff/StaffDashboard";
import Requests from "../pages/staff/Requests";
import RequestDetails from "../pages/staff/RequestDetails";
import Assignment from "../pages/staff/Assignment";
import SlaMonitoring from "../pages/staff/SlaMonitoring";

export const routes = [
  { path: "/login", element: <Login /> },
  { path: "/unauthorized", element: <Unauthorized /> },

  {
    element: <ProtectedRoute />,
    children: [
      { path: "/", element: <HomeRedirect /> },

      // Admin Area
      {
        element: <RoleGate allowed={["admin"]} />,
        children: [
          {
            path: "/admin",
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboard /> },
              { path: "users", element: <Users /> },
              { path: "agents", element: <Agents /> },
              { path: "categories", element: <Categories /> },
              { path: "sla", element: <SlaPolicies /> },
              { path: "audit", element: <SystemAudit /> },
              { path: "analytics", element: <Analytics /> },
            ],
          },
        ],
      },

      // Staff Area
      {
        element: <RoleGate allowed={["staff"]} />,
        children: [
          {
            path: "/staff",
            element: <StaffLayout />,
            children: [
              { index: true, element: <StaffDashboard /> },
              { path: "requests", element: <Requests /> },
              { path: "requests/:requestId", element: <RequestDetails /> },
              { path: "assignment", element: <Assignment /> },
              { path: "sla", element: <SlaMonitoring /> },
            ],
          },
        ],
      },
    ],
  },

  { path: "*", element: <NotFound /> },
];

function HomeRedirect() {
  // Redirect user to their correct home based on role
  // This component will run inside ProtectedRoute so user exists
  return <RoleBasedRedirect />;
}

function RoleBasedRedirect() {
  const raw = sessionStorage.getItem("cst_auth_v1");
  const auth = raw ? JSON.parse(raw) : null;
  const role = auth?.user?.role;

  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "staff") return <Navigate to="/staff" replace />;
  return <Navigate to="/login" replace />;
}
