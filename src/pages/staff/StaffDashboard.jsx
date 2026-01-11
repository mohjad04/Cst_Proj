import React, { useEffect, useState } from "react";
import { listRequests } from "../../services/requestsApi";

export default function StaffDashboard() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    listRequests({ status: "all" }).then(setRows);
  }, []);

  const open = rows.filter((r) => ["new", "triaged", "assigned", "in_progress"].includes(r.status)).length;
  const atRisk = rows.filter((r) => r.sla_state === "at_risk").length;
  const overdue = rows.filter((r) => r.sla_state === "overdue").length;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Dashboard</h2>

      <div className="grid3">
        <div className="kpi"><div className="label">Open Requests</div><div className="value">{open}</div></div>
        <div className="kpi"><div className="label">At Risk (SLA)</div><div className="value">{atRisk}</div></div>
        <div className="kpi"><div className="label">Overdue</div><div className="value">{overdue}</div></div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Quick Notes</h3>
        <ul style={{ margin: 0, color: "#374151" }}>
          <li>Triage new requests and confirm category/priority.</li>
          <li>Assign based on zone + skill + workload.</li>
          <li>Monitor SLA risk and escalate overdue items.</li>
        </ul>
      </div>
    </div>
  );
}
