// src/app/routes.jsx
import React from "react";
import { Navigate } from "react-router-dom";

import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import Unauthorized from "../pages/common/Unauthorized";

import ProtectedRoute from "../auth/ProtectedRoute";
import RoleGate from "../auth/RoleGate";

import AdminLayout from "../layouts/AdminLayout";
// import StaffLayout from "../layouts/StaffLayout";

// Admin pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import Users from "../pages/admin/Users";
import Agents from "../pages/admin/Agents";
import Categories from "../pages/admin/Categories";
// import SlaPolicies from "../pages/admin/SlaPolicies";
import SystemAudit from "../pages/admin/SystemAudit";
// import Analytics from "../pages/admin/Analytics";
import AdminRequests from "../pages/admin/Requests";
import AdminRequestDetails from "../pages/admin/RequestDetails";

// // Staff pages
// import StaffDashboard from "../pages/staff/StaffDashboard";
// import StaffRequests from "../pages/staff/Requests";
// import StaffRequestDetails from "../pages/staff/RequestDetails";
// import Assignment from "../pages/staff/Assignment";
// import SlaMonitoring from "../pages/staff/SlaMonitoring";


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

              // ✅ ADD THESE
              { path: "requests", element: <AdminRequests /> },
              { path: "requests/:requestId", element: <AdminRequestDetails /> },

              // { path: "sla", element: <SlaPolicies /> },
              { path: "audit", element: <SystemAudit /> },
              // { path: "analytics", element: <Analytics /> },
            ],
          },
        ],
      },

      // // Staff Area
      // {
      //   element: <RoleGate allowed={["staff"]} />,
      //   children: [
      //     {
      //       path: "/staff",
      //       element: <StaffLayout />,
      //       children: [
      //         { index: true, element: <StaffDashboard /> },
      //         { path: "requests", element: <StaffRequests /> },
      //         { path: "requests/:requestId", element: <StaffRequestDetails /> },
      //         { path: "assignment", element: <Assignment /> },
      //         { path: "sla", element: <SlaMonitoring /> },
      //       ],
      //     },
      //   ],
      // },
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
