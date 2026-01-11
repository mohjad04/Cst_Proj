import React from "react";

export default function SlaMonitoring() {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>SLA Monitoring</h2>
      <p style={{ color: "#4b5563" }}>
        Track requests by SLA state: <b>on_time</b>, <b>at_risk</b>, <b>overdue</b>.
      </p>
      <div className="card" style={{ background: "#f9fafb" }}>
        Add filters: zone, category, priority, date range, merged/master.
      </div>
    </div>
  );
}
