import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listRequests } from "../../services/requestsApi";

export default function Requests() {
  const [status, setStatus] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await listRequests({ status });
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status]);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <h2 style={{ margin: 0 }}>Requests</h2>
        <select className="input" style={{ maxWidth: 220 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="new">New</option>
          <option value="triaged">Triaged</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div style={{ marginTop: 12 }}>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Category</th>
                <th>Zone</th>
                <th>Priority</th>
                <th>Status</th>
                <th>SLA</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.request_id}>
                  <td><b>{r.request_id}</b></td>
                  <td>{r.category}</td>
                  <td>{r.zone_id}</td>
                  <td>{r.priority}</td>
                  <td><span className="badge">{r.status}</span></td>
                  <td><span className="badge">{r.sla_state}</span></td>
                  <td className="rowActions">
                    <Link className="btn secondary" to={`/staff/requests/${r.request_id}`}>Open</Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan="7" style={{ color: "#6b7280" }}>No requests</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
