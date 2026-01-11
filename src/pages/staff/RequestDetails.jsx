import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getRequest, transitionRequest } from "../../services/requestsApi";

const NEXT_STATES = {
  new: ["triaged", "closed"],
  triaged: ["assigned", "closed"],
  assigned: ["in_progress", "closed"],
  in_progress: ["resolved"],
  resolved: ["closed"],
  closed: [],
};

export default function RequestDetails() {
  const { requestId } = useParams();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getRequest(requestId).then(setData).catch((e) => setMsg(e.message));
  }, [requestId]);

  const allowedNext = useMemo(() => {
    if (!data?.status) return [];
    return NEXT_STATES[data.status] || [];
  }, [data]);

  async function doTransition(next) {
    setBusy(true);
    setMsg("");
    try {
      await transitionRequest(requestId, next);
      setData((prev) => ({ ...prev, status: next, timeline: [...(prev.timeline || []), { type: next, at: "now" }] }));
      setMsg(`Transitioned to ${next}`);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <div className="card">Loading…</div>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 }}>
          <div>
            <h2 style={{ marginTop: 0 }}>{data.request_id}</h2>
            <div style={{ color: "#4b5563" }}>{data.description}</div>
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="badge">status: {data.status}</span>
              <span className="badge">priority: {data.priority}</span>
              <span className="badge">sla: {data.sla_state}</span>
              <span className="badge">zone: {data.zone_id}</span>
            </div>
          </div>

          <div style={{ minWidth: 260 }}>
            <div style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>
              Allowed transitions
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {allowedNext.length === 0 ? (
                <span style={{ color: "#6b7280" }}>No actions</span>
              ) : (
                allowedNext.map((s) => (
                  <button key={s} className="btn" disabled={busy} onClick={() => doTransition(s)}>
                    {s}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {msg && (
          <div className="card" style={{ marginTop: 12, background: "#f9fafb" }}>
            {msg}
          </div>
        )}
      </div>

      <div className="grid2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Location</h3>
          <div><b>Address:</b> {data.location?.address_hint}</div>
          <div><b>Coords:</b> {JSON.stringify(data.location?.coordinates)}</div>
          <div style={{ marginTop: 10, color: "#6b7280" }}>
            (Map view can be added later using Leaflet)
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Timeline</h3>
          <ul style={{ margin: 0 }}>
            {(data.timeline || []).map((t, i) => (
              <li key={i}>
                <b>{t.type}</b> — {t.at}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
