// src/pages/admin/SystemAudit.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  auditToCSV,
  downloadTextFile,
  listAuditEvents,
  exportAuditCsv,
} from "../../services/auditApi";

const TYPES = [
  "user.login",
  "user.register",
  "user.toggle",
  "user.create",
  "user.update",
  "user.delete",
  "team.create",
  "team.update",
  "team.delete",
  "team.toggle",
  "category.create",
  "category.delete",
  "subcategory.create",
  "subcategory.update",
  "subcategory.delete",
  "sla.update",
  "sla.create",
  "request.create",
  "request.update",
  "request.delete",
  "user.verify",
];

const ROLES = ["admin", "staff", "system"];

export default function SystemAudit() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [role, setRole] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await listAuditEvents({ q, type, role, dateFrom, dateTo });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load audit logs");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    // Backend already filters, but keep client filter as safety
    const query = q.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : null;
    const toTs = dateTo ? new Date(dateTo + "T23:59:59").getTime() : null;

    return rows.filter((e) => {
      if (type !== "all" && e.type !== type) return false;
      if (role !== "all" && e.actor?.role !== role) return false;

      const t = new Date(e.time).getTime();
      if (fromTs != null && t < fromTs) return false;
      if (toTs != null && t > toTs) return false;

      if (!query) return true;

      return (
        (e.id || "").toLowerCase().includes(query) ||
        (e.type || "").toLowerCase().includes(query) ||
        (e.actor?.email || "").toLowerCase().includes(query) ||
        (e.actor?.role || "").toLowerCase().includes(query) ||
        (e.entity?.kind || "").toLowerCase().includes(query) ||
        (e.entity?.id || "").toLowerCase().includes(query) ||
        (e.message || "").toLowerCase().includes(query)
      );
    });
  }, [rows, q, type, role, dateFrom, dateTo]);

  async function exportCSV() {
    setError("");
    const name = `cst_audit_${new Date().toISOString().slice(0, 10)}.csv`;

    try {
      // Prefer backend CSV (best for big data)
      const csv = await exportAuditCsv({ q, type, role, dateFrom, dateTo });
      downloadTextFile(name, csv, "text/csv");
    } catch {
      // fallback client side
      const csv = auditToCSV(filtered);
      downloadTextFile(name, csv, "text/csv");
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={{ margin: 0 }}>Audit Logs</h1>
          <div style={{ color: "#6b7280", marginTop: 6 }}>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button style={{ ...styles.btn, background: "#111827" }} onClick={exportCSV}>
            Export CSV
          </button>
          <button
            style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }}
            onClick={load}
          >
            Refresh
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.toolbar}>
          <input
            style={styles.input}
            placeholder="Search logs..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select style={styles.input} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select style={styles.input} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="all">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <input
            style={styles.input}
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <input
            style={styles.input}
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 10, color: "#6b7280", fontSize: 13 }}>
          Showing <b>{filtered.length}</b> of <b>{rows.length}</b> events
        </div>
      </div>

      {error && (
        <div style={{ ...styles.card, border: "1px solid #fecaca", background: "#fff1f2", color: "#991b1b" }}>
          {error}
        </div>
      )}

      <div style={styles.card}>
        {loading ? (
          <div style={{ padding: 12 }}>Loading…</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Actor</th>
                  <th style={styles.th}>Entity</th>
                  <th style={styles.th}>Message</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 900 }}>{formatDateTime(e.time)}</div>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>{e.id}</div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.badgePlain}>{e.type}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 900 }}>{e.actor?.role || "—"}</div>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>{e.actor?.email || "—"}</div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 900 }}>{e.entity?.type || "—"}</div>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>{e.entity?.id || "—"}</div>
                    </td>
                    <td style={styles.td}>{e.message || "—"}</td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          style={{ ...styles.smallBtn, background: "#111827", color: "white" }}
                          onClick={() => setSelected(e)}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td style={styles.td} colSpan={6}>
                      <div style={{ padding: 12, color: "#6b7280" }}>No logs found.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <EventModal event={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function EventModal({ event, onClose }) {
  return (
    <div style={styles.modalOverlay} onMouseDown={onClose}>
      <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <h2 style={{ margin: 0 }}>Event Details</h2>
          <button
            style={{ ...styles.smallBtn, background: "#e5e7eb", color: "#111827" }}
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          <Row k="ID" v={event.id} />
          <Row k="Timestamp" v={event.time} />
          <Row k="Type" v={event.type} />
          <Row k="Actor" v={`${event.actor?.role || "—"} / ${event.actor?.email || "—"}`} />
          <Row k="Entity" v={`${event.entity?.type || "—"} / ${event.entity?.id || "—"}`} />
          <Row k="Message" v={event.message || "—"} />
          <Row k="Meta" v={<pre style={styles.pre}>{JSON.stringify(event.meta || {}, null, 2)}</pre>} />
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10 }}>
      <div style={{ fontWeight: 900, color: "#374151" }}>{k}</div>
      <div style={{ color: "#111827" }}>{v}</div>
    </div>
  );
}

function formatDateTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return ts;
  }
}

const styles = {
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    gap: 12,
    flexWrap: "wrap",
  },
  card: {
    background: "white",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    border: "1px solid rgba(17,24,39,0.06)",
  },
  toolbar: { display: "grid", gridTemplateColumns: "1fr 260px 160px 180px 180px", gap: 10 },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    outline: "none",
  },
  btn: {
    border: "none",
    padding: "10px 14px",
    borderRadius: 10,
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
  },
  smallBtn: {
    border: "none",
    padding: "8px 10px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 800,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #e5e7eb", color: "#374151", fontSize: 13 },
  td: { padding: "10px 8px", borderBottom: "1px solid #e5e7eb", fontSize: 14, verticalAlign: "top" },
  badgePlain: {
    display: "inline-flex",
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    fontSize: 12,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "grid",
    placeItems: "center",
    padding: 16,
    zIndex: 999,
  },
  modalCard: {
    width: "min(860px, 100%)",
    background: "white",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
  },
  pre: {
    margin: 0,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    overflowX: "auto",
    fontSize: 12,
  },
};
