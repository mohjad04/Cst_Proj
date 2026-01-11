import React from "react";

export default function Assignment() {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Assignment</h2>
      <p style={{ color: "#4b5563" }}>
        This page should show candidate service teams based on <b>zone + skill + workload + on-shift</b>.
      </p>

      <div className="card" style={{ background: "#f9fafb" }}>
        <b>Next step (backend integration):</b>
        <ul style={{ marginTop: 8 }}>
          <li>GET agents with coverage/skills + current workload</li>
          <li>POST /requests/:id/auto-assign</li>
          <li>Manual assign override</li>
        </ul>
      </div>
    </div>
  );
}
