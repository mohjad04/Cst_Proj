
// src/pages/admin/SystemAudit.jsx
import React, { useEffect, useMemo, useState } from "react";
import { auditToCSV, downloadTextFile, listAuditEvents, exportAuditCsv } from "../../services/auditApi";

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
  "request.feedback",
  "request.close",
  "request.status_update",
];

const ROLES = ["admin", "staff", "system"];

export default function SystemAudit() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);

  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [role, setRole] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [busyExport, setBusyExport] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);

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
      setLastLoadedAt(new Date());
      setLoading(false);
    }


  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    setPage(1);
  }, [q, type, role, dateFrom, dateTo, rows.length]);


  const filtered = useMemo(() => {
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
        (e.entity?.type || "").toLowerCase().includes(query) ||
        (e.entity?.id || "").toLowerCase().includes(query) ||
        (e.message || "").toLowerCase().includes(query)
      );
    });
  }, [rows, q, type, role, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);


  async function exportCSV() {
    setError("");
    setBusyExport(true);

    const name = `cst_audit_${new Date().toISOString().slice(0, 10)}.csv`;
    try {
      const csv = await exportAuditCsv({ q, type, role, dateFrom, dateTo });
      downloadTextFile(name, csv, "text/csv");
    } catch {
      const csv = auditToCSV(filtered);
      downloadTextFile(name, csv, "text/csv");
    } finally {
      setBusyExport(false);
    }
  }

  return (
    <div style={styles.page}>
      {/* ✅ NO PAGE HEADER (removed) */}

      {/* Compact hero strip (fills the empty top nicely) */}
      <div style={styles.hero}>
        <div>
          <div style={styles.heroSub}>
            Track system actions across users, teams, categories, requests, and SLA changes.
          </div>

          <div style={styles.heroPills}>
            <span style={styles.heroPill}>
              Showing <b>{filtered.length}</b>
            </span>
            <span style={styles.heroPill}>
              Total <b>{rows.length}</b>
            </span>
            <span style={styles.heroPill}>
              Type: <b>{type === "all" ? "All" : type}</b>
            </span>
            <span style={styles.heroPill}>
              Role: <b>{role === "all" ? "All" : role}</b>
            </span>

          </div>
        </div>

        <div style={styles.heroActions}>
          <button
            style={{ ...styles.btnPrimary, opacity: busyExport ? 0.85 : 1 }}
            onClick={exportCSV}
            disabled={busyExport}
          >
            {busyExport ? "Exporting..." : "Export CSV"}
          </button>

          <button style={styles.btnGhost} onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>


      {/* Filters */}
      <div style={styles.card}>
        <div style={styles.toolbar}>
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>⌕</span>
            <input
              style={styles.searchInput}
              placeholder="Search logs..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <select style={styles.select} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select style={styles.select} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="all">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <input style={styles.date} type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input style={styles.date} type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>

        <div style={styles.counterRow}>
          Showing <b>{filtered.length}</b> of <b>{rows.length}</b> events
        </div>
      </div>

      {/* Error */}
      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Table */}
      <div style={styles.card}>
        {loading ? (
          <div style={styles.loading}>Loading…</div>
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
                  <th style={styles.thRight}></th>
                </tr>
              </thead>

              <tbody>
                {paged.map((e) => (
                  <tr key={e.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.timeMain}>{formatDateTime(e.time)}</div>
                      <div style={styles.mutedSmall}>{e.id}</div>
                    </td>

                    <td style={styles.td}>
                      <span style={typePillStyle(e.type)}>{e.type}</span>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.bold}>{e.actor?.role || "—"}</div>
                      <div style={styles.mutedSmall}>{e.actor?.email || "—"}</div>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.bold}>{e.entity?.type || "—"}</div>
                      <div style={styles.mutedSmall}>{e.entity?.id || "—"}</div>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.message}>{e.message || "—"}</div>
                    </td>

                    <td style={styles.tdRight}>
                      <button style={styles.viewBtn} onClick={() => setSelected(e)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td style={styles.td} colSpan={6}>
                      <div style={styles.empty}>No logs found.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {filtered.length > PAGE_SIZE && (
              <div style={styles.paginationBar}>
                <button
                  style={{ ...styles.btnGhost, ...styles.pageBtn, opacity: safePage === 1 ? 0.6 : 1 }}
                  disabled={safePage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>

                <div style={styles.pageInfo}>
                  Page <b>{safePage}</b> / <b>{totalPages}</b> •{" "}
                  <b>{filtered.length === 0 ? 0 : start + 1}</b>–<b>{Math.min(start + PAGE_SIZE, filtered.length)}</b>{" "}
                  of <b>{filtered.length}</b>
                </div>

                <button
                  style={{ ...styles.btnGhost, ...styles.pageBtn, opacity: safePage === totalPages ? 0.6 : 1 }}
                  disabled={safePage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            )}

          </div>



        )


        }
      </div>

      {selected && <EventModal event={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/* ---------------- Modal ---------------- */

function EventModal({ event, onClose }) {
  return (
    <div style={styles.modalOverlay} onMouseDown={onClose}>
      <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <div style={styles.modalTitle}>Event Details</div>
            <div style={styles.modalHint}>Full payload for debugging and traceability.</div>
          </div>

          <button style={styles.closeBtn} onClick={onClose} type="button" aria-label="Close">
            ✕
          </button>
        </div>

        <div style={styles.modalGrid}>
          <KV k="ID" v={event.id} />
          <KV k="Timestamp" v={formatDateTime(event.time)} />
          <KV k="Type" v={<span style={typePillStyle(event.type)}>{event.type}</span>} />
          <KV k="Actor" v={`${event.actor?.role || "—"} / ${event.actor?.email || "—"}`} />
          <KV k="Entity" v={`${event.entity?.type || "—"} / ${event.entity?.id || "—"}`} />
          <KV k="Message" v={event.message || "—"} />
          <KV k="Meta" v={<pre style={styles.pre}>{JSON.stringify(event.meta || {}, null, 2)}</pre>} />
        </div>

        <div style={styles.modalFooter}>
          <button onClick={onClose} style={styles.btnGhost}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div style={styles.kvRow}>
      <div style={styles.kvKey}>{k}</div>
      <div style={styles.kvVal}>{v}</div>
    </div>
  );
}

function formatDateTime(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

/* ---------------- Color helpers ---------------- */

function typePillStyle(type) {
  // Soft colors by category (simple but looks good)
  const t = (type || "").toLowerCase();

  if (t.includes("login") || t.includes("register") || t.includes("verify")) {
    return { ...styles.pillBase, background: "#ecfeff", borderColor: "#a5f3fc", color: "#155e75" }; // cyan
  }
  if (t.includes("create")) {
    return { ...styles.pillBase, background: "#ecfdf5", borderColor: "#86efac", color: "#166534" }; // green
  }
  if (t.includes("update")) {
    return { ...styles.pillBase, background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }; // blue
  }
  if (t.includes("delete")) {
    return { ...styles.pillBase, background: "#fff1f2", borderColor: "#fecaca", color: "#9f1239" }; // rose
  }
  if (t.includes("toggle")) {
    return { ...styles.pillBase, background: "#fffbeb", borderColor: "#fde68a", color: "#92400e" }; // amber
  }

  return { ...styles.pillBase, background: "#f8fafc", borderColor: "#e5e7eb", color: "#0f172a" };
}

/* ---------------- Styles ---------------- */

const styles = {
  page: { display: "grid", gap: 12 },

  topActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    alignItems: "center",
  },

  card: {
    background: "white",
    borderRadius: 16,
    padding: 14,
    border: "1px solid rgba(15, 23, 42, 0.06)",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
  },

  toolbar: {
    display: "grid",
    gridTemplateColumns: "1.2fr 260px 180px 170px 170px",
    gap: 10,
    alignItems: "center",
  },

  searchWrap: { position: "relative", display: "flex", alignItems: "center" },
  searchIcon: { position: "absolute", left: 12, fontWeight: 900, color: "#64748b", fontSize: 14 },

  searchInput: {
    width: "100%",
    padding: "11px 12px 11px 34px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontSize: 14,
    background: "#ffffff",
  },

  select: {
    width: "100%",
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontSize: 14,
    background: "#ffffff",
  },

  date: {
    width: "100%",
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontSize: 14,
    background: "#ffffff",
  },

  counterRow: { marginTop: 10, color: "#64748b", fontSize: 13 },

  btnPrimary: {
    border: "none",
    padding: "10px 14px",
    borderRadius: 12,
    background: "linear-gradient(180deg, #0f172a 0%, #111827 100%)",
    color: "white",
    cursor: "pointer",
    fontWeight: 900,
    boxShadow: "0 10px 22px rgba(15, 23, 42, 0.18)",
  },
  btnGhost: {
    border: "1px solid #e5e7eb",
    padding: "10px 14px",
    borderRadius: 12,
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    color: "#0f172a",
    cursor: "pointer",
    fontWeight: 900,
  },

  errorBox: {
    background: "#fff1f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    borderRadius: 16,
    padding: 14,
    fontWeight: 900,
  },

  loading: { padding: 12, color: "#475569", fontWeight: 800 },

  table: { width: "100%", borderCollapse: "separate", borderSpacing: "0 0", minWidth: 980 },

  th: {
    textAlign: "left",
    padding: "12px 10px",
    borderBottom: "1px solid #e5e7eb",
    color: "#475569",
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    fontWeight: 900,
    background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
  },
  thRight: {
    textAlign: "right",
    padding: "12px 10px",
    borderBottom: "1px solid #e5e7eb",
    color: "#475569",
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    fontWeight: 900,
    background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
  },

  tr: {},
  td: {
    padding: "14px 10px",
    borderBottom: "1px solid #eef2f7",
    verticalAlign: "top",
  },
  tdRight: {
    padding: "14px 10px",
    borderBottom: "1px solid #eef2f7",
    verticalAlign: "top",
    textAlign: "right",
    whiteSpace: "nowrap",
  },

  timeMain: { fontWeight: 900, color: "#0f172a" },
  bold: { fontWeight: 900, color: "#0f172a" },
  mutedSmall: { marginTop: 3, fontSize: 12, color: "#64748b" },
  message: { color: "#0f172a" },

  pillBase: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    fontSize: 12,
    fontWeight: 900,
  },

  viewBtn: {
    border: "none",
    background: "linear-gradient(180deg, #0f172a 0%, #111827 100%)",
    color: "white",
    padding: "10px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 900,
    boxShadow: "0 10px 22px rgba(15, 23, 42, 0.16)",
  },

  empty: { padding: 12, color: "#64748b", fontWeight: 800 },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    display: "grid",
    placeItems: "center",
    padding: 16,
    zIndex: 999,
  },
  modalCard: {
    width: "min(880px, 100%)",
    background: "white",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
    border: "1px solid rgba(59, 130, 246, 0.15)", // subtle blue
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingBottom: 10,
    borderBottom: "1px solid #eef2f7",
  },
  modalTitle: { fontSize: 18, fontWeight: 900, color: "#0f172a" },
  modalHint: { marginTop: 4, fontSize: 12, color: "#64748b" },

  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    cursor: "pointer",
    fontWeight: 900,
    color: "#0f172a",
  },

  modalGrid: { marginTop: 12, display: "grid", gap: 10 },

  kvRow: { display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "start" },
  kvKey: { fontWeight: 900, color: "#475569" },
  kvVal: { color: "#0f172a" },

  pre: {
    margin: 0,
    padding: 12,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    overflowX: "auto",
    fontSize: 12,
  },

  modalFooter: {
    marginTop: 14,
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: 12,
    borderTop: "1px solid #eef2f7",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    padding: 16,
    borderRadius: 16,
    border: "1px solid rgba(59,130,246,0.18)",
    background: "linear-gradient(180deg, #ffffff 0%, #f2f7ff 100%)",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
  },

  heroTitle: {
    fontSize: 22,
    fontWeight: 950,
    color: "#0f172a",
    letterSpacing: -0.3,
  },

  heroSub: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748b",
    maxWidth: 720,
  },

  heroPills: {
    marginTop: 10,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },

  heroPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    color: "#1e3a8a",
    fontSize: 12,
    fontWeight: 800,
  },

  heroPillMuted: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    color: "#64748b",
    fontSize: 12,
    fontWeight: 800,
  },

  heroActions: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },

  paginationBar: {
    marginTop: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
    borderTop: "1px solid #eef2f7",
  },
  pageBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 900,
  },
  pageInfo: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: 800,
    textAlign: "center",
    flex: 1,
  },


};
