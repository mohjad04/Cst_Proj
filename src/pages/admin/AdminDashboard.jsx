import React from "react";

export default function AdminDashboard() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Admin Dashboard</h2>

      <div className="grid3">
        <div className="kpi"><div className="label">Total Requests</div><div className="value">—</div></div>
        <div className="kpi"><div className="label">SLA Compliance</div><div className="value">—</div></div>
        <div className="kpi"><div className="label">Avg Rating</div><div className="value">—</div></div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Admin Responsibilities</h3>
        <ul style={{ margin: 0, color: "#374151" }}>
          <li>Manage users and service teams.</li>
          <li>Configure categories and SLA policies.</li>
          <li>Review audit logs and analytics.</li>
        </ul>
      </div>
    </div>
  );
}
