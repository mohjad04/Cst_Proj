// src/app/routes.jsx
import React from "react";
import { Navigate } from "react-router-dom";

import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import Unauthorized from "../pages/common/Unauthorized";

import ProtectedRoute from "../auth/ProtectedRoute";
import RoleGate from "../auth/RoleGate";
import AdminLayout from "../layouts/AdminLayout";

// Admin pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import Users from "../pages/admin/Users";
import Agents from "../pages/admin/Agents";
import Categories from "../pages/admin/Categories";
import SystemAudit from "../pages/admin/SystemAudit";
import AdminRequests from "../pages/admin/Requests";
import AdminRequestDetails from "../pages/admin/RequestDetails";



export const routes = [


  { path: "/login", element: <Login /> },
  { path: "/unauthorized", element: <Unauthorized /> },

  {
    element: <ProtectedRoute />,
    children: [
      { path: "/", element: <HomeRedirect /> },

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
              { path: "requests", element: <AdminRequests /> },
              { path: "requests/:requestId", element: <AdminRequestDetails /> },
              { path: "audit", element: <SystemAudit /> },
            ],
          },
        ],
      },
    ],
  },

  { path: "*", element: <NotFound /> },
];

function HomeRedirect() {
  return <RoleBasedRedirect />;
}

function RoleBasedRedirect() {
  const raw = sessionStorage.getItem("cst_auth_v1");
  const auth = raw ? JSON.parse(raw) : null;
  const role = auth?.user?.role;

  if (role === "admin") return <Navigate to="/admin" replace />;
  // if (role === "staff") return <Navigate to="/staff" replace />;
  return <Navigate to="/login" replace />;
}
