// import React from "react";
// import { NavLink, Outlet, useNavigate } from "react-router-dom";
// import { useAuth } from "../auth/AuthContext";

// export default function AdminLayout() {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   async function handleLogout() {
//     await logout();
//     navigate("/login");
//   }

//   return (
//     <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }}>
//       <aside style={{ background: "#0b1220", color: "white", padding: 16 }}>
//         <h3>Admin</h3>

//         <NavItem to="/admin">Dashboard</NavItem>
//         <NavItem to="/admin/users">Users</NavItem>
//         <NavItem to="/admin/agents">Teams</NavItem>
//         <NavItem to="/admin/categories">Categories</NavItem>
//         <NavItem to="/admin/requests">Requests</NavItem>
//         <NavItem to="/admin/audit">Audit</NavItem>
//         {/* <NavItem to="/admin/analytics">Analytics</NavItem> */}

//         <div style={{ marginTop: 18, fontSize: 12, opacity: 0.9 }}>
//           Signed in as: <b>{user?.email}</b>
//         </div>

//         <button onClick={handleLogout} style={{ marginTop: 12, width: "100%" }}>
//           Logout
//         </button>
//       </aside>

//       <main style={{ padding: 18 }}>
//         <Outlet />
//       </main>
//     </div>
//   );
// }

// function NavItem({ to, children }) {
//   return (
//     <NavLink
//       to={to}
//       end={to === "/admin"}
//       style={({ isActive }) => ({
//         display: "block",
//         padding: "10px 12px",
//         borderRadius: 10,
//         marginBottom: 6,
//         color: "white",
//         background: isActive ? "rgba(255,255,255,0.14)" : "transparent",
//       })}
//     >
//       {children}
//     </NavLink>
//   );
// }

import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);

  const pageTitle = useMemo(() => {
    const p = location.pathname;
    if (p === "/admin") return "Dashboard";
    if (p.startsWith("/admin/users")) return "Users";
    if (p.startsWith("/admin/agents")) return "Teams";
    if (p.startsWith("/admin/categories")) return "Categories";
    if (p.startsWith("/admin/requests")) return "Requests";
    if (p.startsWith("/admin/audit")) return "Audit";
    return "Admin";
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className={`adminShell ${collapsed ? "isCollapsed" : ""}`}>
      {/* Sidebar */}
      <aside className="adminSidebar">
        <div className="sbTop">
          <div className="brand">
            <div className="brandMark" aria-hidden="true" />
            <div className="brandText">
              <div className="brandTitle">Admin</div>
              <div className="brandSub">Control Center</div>
            </div>
          </div>

          <button
            className="iconBtn collapseBtn"
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <IconChevron />
          </button>
        </div>

        <nav className="sbNav">
          <div className="sbGroupLabel">Overview</div>
          <NavItem to="/admin" icon={<IconGrid />}>
            Dashboard
          </NavItem>

          <div className="sbGroupLabel">Management</div>
          <NavItem to="/admin/users" icon={<IconUsers />}>
            Users
          </NavItem>
          <NavItem to="/admin/agents" icon={<IconTeams />}>
            Teams
          </NavItem>
          <NavItem to="/admin/categories" icon={<IconTags />}>
            Categories
          </NavItem>

          <div className="sbGroupLabel">Operations</div>
          <NavItem to="/admin/requests" icon={<IconInbox />}>
            Requests
          </NavItem>

          <div className="sbGroupLabel">Compliance</div>
          <NavItem to="/admin/audit" icon={<IconShield />}>
            Audit
          </NavItem>
        </nav>

        <div className="sbBottom">
          <div className="userCard">
            <div className="userAvatar" aria-hidden="true" />
            <div className="userMeta">
              <div className="userLabel">Signed in</div>
              <div className="userValue" title={user?.email || ""}>
                {user?.email || "—"}
              </div>
            </div>
          </div>

          <button className="btnDanger" type="button" onClick={handleLogout}>
            <span className="btnIcon" aria-hidden="true">
              <IconLogout />
            </span>
            <span className="btnText">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="adminMain">
        <header className="topbar">
          <div className="topbarLeft">
            <div className="topbarTitleBig">{pageTitle}</div>
            <div className="topbarCrumb">Admin • {pageTitle}</div>
          </div>

          <div className="topbarRight">
            <button className="profileBtn" type="button" title={user?.email || ""}>
              <span className="profileDot" aria-hidden="true" />
              <span className="profileText">
                <span className="profileName">Admin</span>
                <span className="profileMail">{user?.email || "—"}</span>
              </span>
            </button>
          </div>
        </header>



        <main className="adminContent">
          <div className="contentInner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, children, icon }) {
  return (
    <NavLink
      to={to}
      end={to === "/admin"}
      className={({ isActive }) => `sbLink ${isActive ? "active" : ""}`}
    >
      <span className="sbIcon" aria-hidden="true">
        {icon}
      </span>
      <span className="sbText">{children}</span>
    </NavLink>
  );
}

/* ------------------------------ inline icons ----------------------------- */

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path
        d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path
        d="M16 21v-1.2c0-1.8-1.6-3.3-3.6-3.3H7.6C5.6 16.5 4 18 4 19.8V21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10 12.5c2.1 0 3.8-1.7 3.8-3.8S12.1 4.9 10 4.9 6.2 6.6 6.2 8.7 7.9 12.5 10 12.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M20 21v-1.2c0-1.4-1-2.6-2.4-3.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16.7 5.2a3.4 3.4 0 0 1 0 6.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M16.5 16.5 21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path
        d="M20 12a8 8 0 1 1-2.3-5.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M20 4v6h-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTeams() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path
        d="M7.5 11.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M16.5 11.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M3.8 21v-1c0-2 1.6-3.6 3.6-3.6h.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M20.2 21v-1c0-2-1.6-3.6-3.6-3.6h-.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8.6 16.4h6.8c2.1 0 3.8 1.7 3.8 3.8V21H4.8v-.8c0-2.1 1.7-3.8 3.8-3.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}
function IconTags() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path
        d="M3.5 12.2V5.8c0-1 0-1.6.3-2 .2-.3.5-.6.8-.8.4-.3 1-.3 2-.3h6.4l8.5 8.5a2 2 0 0 1 0 2.8l-6.7 6.7a2 2 0 0 1-2.8 0L3.5 12.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7.6 7.6h.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconInbox() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path
        d="M4.5 4.5h15v10.5l-3 4.5h-9l-3-4.5V4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 15h4l1.5 2h4L15.5 15h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconShield() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path
        d="M12 2.8 20 6.2v6.1c0 5.1-3.3 8.6-8 10.9-4.7-2.3-8-5.8-8-10.9V6.2L12 2.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9.5 12.2 11 13.7 14.8 9.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path
        d="M10 7V6a2 2 0 0 1 2-2h7v16h-7a2 2 0 0 1-2-2v-1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M13 12H4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.5 9.5 4 12l2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconChevron() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path
        d="M14 6 8 12l6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
