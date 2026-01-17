import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }}>
      <aside style={{ background: "#0b1220", color: "white", padding: 16 }}>
        <h3>Admin</h3>

        <NavItem to="/admin">Dashboard</NavItem>
        <NavItem to="/admin/users">Users</NavItem>
        <NavItem to="/admin/agents">Teams</NavItem>
        <NavItem to="/admin/categories">Categories</NavItem>
        <NavItem to="/admin/sla">SLA Policies</NavItem>
        <NavItem to="/admin/audit">Audit</NavItem>
        <NavItem to="/admin/analytics">Analytics</NavItem>

        <div style={{ marginTop: 18, fontSize: 12, opacity: 0.9 }}>
          Signed in as: <b>{user?.email}</b>
        </div>

        <button onClick={handleLogout} style={{ marginTop: 12, width: "100%" }}>
          Logout
        </button>
      </aside>

      <main style={{ padding: 18 }}>
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      end={to === "/admin"}
      style={({ isActive }) => ({
        display: "block",
        padding: "10px 12px",
        borderRadius: 10,
        marginBottom: 6,
        color: "white",
        background: isActive ? "rgba(255,255,255,0.14)" : "transparent",
      })}
    >
      {children}
    </NavLink>
  );
}
