// src/pages/admin/Users.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createUser, deleteUser, listUsers, verifyUser } from "../../services/usersApi";

const ROLES = [
  { value: "all", label: "All roles" },
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Office Employee" },
  { value: "citizen", label: "Citizen" },
];

const VERIFY_FILTERS = [
  { value: "all", label: "All" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Unverified" },
];

function roleLabel(r) {
  return r === "admin" ? "Admin" : r === "staff" ? "Office Employee" : "Citizen";
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function Avatar({ name }) {
  const initials =
    (name || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("") || "U";
  return (
    <div style={styles.avatar}>
      <span style={styles.avatarText}>{initials}</span>
    </div>
  );
}

function Chip({ tone = "neutral", children }) {
  const toneStyle =
    tone === "blue"
      ? styles.chipBlue
      : tone === "green"
        ? styles.chipGreen
        : tone === "amber"
          ? styles.chipAmber
          : tone === "red"
            ? styles.chipRed
            : styles.chipNeutral;

  return <span style={{ ...styles.chip, ...toneStyle }}>{children}</span>;
}

function Icon({ name, style }) {
  const common = { width: 16, height: 16, display: "inline-block", ...style };
  if (name === "search")
    return (
      <svg viewBox="0 0 24 24" style={common} fill="none">
        <path
          d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M21 21l-4.2-4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  if (name === "plus")
    return (
      <svg viewBox="0 0 24 24" style={common} fill="none">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  if (name === "refresh")
    return (
      <svg viewBox="0 0 24 24" style={common} fill="none">
        <path
          d="M20 12a8 8 0 1 1-2.34-5.66"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M20 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  if (name === "trash")
    return (
      <svg viewBox="0 0 24 24" style={common} fill="none">
        <path
          d="M4 7h16M10 11v7M14 11v7M6 7l1 14h10l1-14M9 7V4h6v3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  if (name === "check")
    return (
      <svg viewBox="0 0 24 24" style={common} fill="none">
        <path
          d="M20 6L9 17l-5-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  return null;
}

function Button({ variant = "primary", children, style, ...props }) {
  const v =
    variant === "primary"
      ? styles.btnPrimary
      : variant === "danger"
        ? styles.btnDanger
        : variant === "success"
          ? styles.btnSuccess
          : styles.btnNeutral;

  return (
    <button type="button" {...props} style={{ ...styles.btn, ...v, ...style }}>
      {children}
    </button>
  );
}

function Card({ title, subtitle, right, children, bodyStyle }) {
  return (
    <div style={styles.card}>
      {(title || subtitle || right) && (
        <div style={styles.cardHead}>
          <div>
            {title && <div style={styles.cardTitle}>{title}</div>}
            {subtitle && <div style={styles.cardSub}>{subtitle}</div>}
          </div>
          {right ? <div>{right}</div> : null}
        </div>
      )}
      <div style={{ ...styles.cardBody, ...bodyStyle }}>{children}</div>
    </div>
  );
}

export default function Users() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [verification, setVerification] = useState("all"); // ✅ NEW

  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await listUsers();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (role !== "citizen" && verification !== "all") {
      setVerification("all");
    }
  }, [role, verification]);


  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return rows
      .filter((u) => {
        if (role !== "all" && u.role !== role) return false;

        const isCitizen = String(u.role) === "citizen";
        const isVerified = u.verification?.state === "verified";

        if (verification !== "all" && isCitizen) {
          if (verification === "verified" && !isVerified) return false;
          if (verification === "unverified" && isVerified) return false;
        }

        // search
        if (!query) return true;
        const n = String(u.full_name || "").toLowerCase();
        const em = String(u.email || "").toLowerCase();
        const rl = String(u.role || "").toLowerCase();
        return n.includes(query) || em.includes(query) || rl.includes(query);
      })
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [rows, q, role, verification]);

  const stats = useMemo(() => {
    const total = rows.length;
    const admins = rows.filter((u) => u.role === "admin").length;
    const staff = rows.filter((u) => u.role === "staff").length;

    const citizenRows = rows.filter((u) => u.role === "citizen");
    const citizens = citizenRows.length;

    const verified = citizenRows.filter((u) => u.verification?.state === "verified").length;
    const unverified = citizens - verified;

    return { total, verified, unverified, admins, staff, citizens };
  }, [rows]);

  function showToast(msg) {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(""), 2200);
  }

  async function onVerify(userId) {
    setError("");
    try {
      const updated = await verifyUser(userId);
      setRows((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      showToast("User verified");
    } catch (e) {
      setError(e?.message || "Failed to verify user");
    }
  }

  async function onDelete(userId) {
    const ok = confirm("Delete this user? This action cannot be undone.");
    if (!ok) return;

    setError("");
    try {
      await deleteUser(userId);
      setRows((prev) => prev.filter((u) => u.id !== userId));
      showToast("User deleted");
    } catch (e) {
      setError(e?.message || "Failed");
    }
  }

  /* And keep the role chip like: */
  return (
    <div style={styles.page}>
      {/* ✅ NO big header here (you already have topbar). Only actions row */}
      <div style={styles.actionsRow}>
        <div style={styles.actionsLeft}>
          <Chip tone="blue">{stats.total} users</Chip>
          <Chip tone="neutral">{stats.verified} verified citizens</Chip>
          <Chip tone="neutral">{stats.unverified} unverified citizens</Chip>

          <Chip tone="neutral">
            A {stats.admins} · S {stats.staff} · C {stats.citizens}
          </Chip>
        </div>

        <div style={styles.actionsRight}>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <span style={styles.btnIcon}>
              <Icon name="plus" />
            </span>
            Add User
          </Button>

          <Button variant="neutral" onClick={load} disabled={loading}>
            <span style={styles.btnIcon}>
              <Icon name="refresh" />
            </span>
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ ...styles.alert, ...styles.alertError }}>
          <div style={styles.alertTitle}>Something went wrong</div>
          <div style={styles.alertText}>{error}</div>
        </div>
      )}
      {toast && (
        <div style={{ ...styles.alert, ...styles.alertOk }}>
          <div style={styles.alertTitle}>Done</div>
          <div style={styles.alertText}>{toast}</div>
        </div>
      )}

      {/* Filters */}
      <Card
        title="Search & Filters"
        subtitle={`Showing ${filtered.length} of ${rows.length} users`}
        bodyStyle={{ paddingTop: 10 }}
      >
        <div style={styles.filtersRow}>
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>
              <Icon name="search" />
            </span>
            <input
              style={styles.searchInput}
              placeholder="Search by name, email, or role..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <select style={styles.select} value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          {role === "citizen" && (
            <select
              style={styles.select}
              value={verification}
              onChange={(e) => setVerification(e.target.value)}
            >
              {VERIFY_FILTERS.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          )}

        </div>
      </Card>

      {/* Table */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.loadingBox}>Loading users…</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: 360 }}>User</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Verification</th>
                  <th style={styles.th}>Created</th>
                  <th style={{ ...styles.th, width: 220, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((u) => {
                  const verified = u.verification?.state === "verified";
                  const roleTone = u.role === "admin" ? "green" : u.role === "staff" ? "neutral" : "neutral";

                  return (
                    <tr key={u.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.userCell}>
                          <Avatar name={u.full_name} />
                          <div style={{ minWidth: 0 }}>
                            <div style={styles.userName}>{u.full_name}</div>
                            <div style={styles.userId}>ID: {u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.email}>{u.email}</div>
                      </td>

                      <td style={styles.td}>
                        <Chip tone={roleTone}>{roleLabel(u.role)}</Chip>
                      </td>

                      <td style={styles.td}>
                        {u.role === "citizen" ? (
                          (u.verification?.state === "verified")
                            ? <Chip tone="blue">Verified</Chip>
                            : <Chip tone="neutral">Unverified</Chip>
                        ) : (
                          <span style={{ color: "#64748b", fontWeight: 800 }}>—</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.dateText}>{fmtDate(u.created_at)}</div>
                      </td>

                      <td style={{ ...styles.td, textAlign: "right" }}>
                        <div style={styles.actions}>
                          {u.role === "citizen" && u.verification?.state !== "verified" && (
                            <Button variant="success" onClick={() => onVerify(u.id)}>
                              <span style={styles.btnIcon}>
                                <Icon name="check" />
                              </span>
                              Verify
                            </Button>
                          )}

                          <Button variant="danger" onClick={() => onDelete(u.id)}>
                            <span style={styles.btnIcon}>
                              <Icon name="trash" />
                            </span>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td style={styles.emptyTd} colSpan={6}>
                      <div style={styles.emptyBox}>
                        <div style={styles.emptyTitle}>No results</div>
                        <div style={styles.emptyText}>Try changing the search/filters.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {createOpen && (
        <UserModal
          title="Add User"
          submitLabel="Create"
          initial={{ full_name: "", email: "", role: "staff" }}
          onClose={() => setCreateOpen(false)}
          onSubmit={async (payload) => {
            setError("");
            try {
              const created = await createUser(payload);
              setRows((prev) => [created, ...prev]);
              setCreateOpen(false);
              showToast("User created");
            } catch (e) {
              const detail = e?.response?.data?.detail;
              const msg = Array.isArray(detail)
                ? detail.map(d => `${d.loc?.join(".")}: ${d.msg}`).join(" | ")
                : (detail || e?.message || "Failed");

              setError(msg);
            }
          }}
        />
      )}
    </div>
  );
}

function UserModal({ title, submitLabel, initial, onClose, onSubmit }) {
  const [full_name, setFullName] = useState(initial.full_name);
  const [email, setEmail] = useState(initial.email);
  const [role, setRole] = useState(initial.role);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!full_name.trim()) return setErr("Full name is required");
    if (!email.trim()) return setErr("Email is required");
    if (title === "Add User") {
      if (!password) return setErr("Password is required");
      if (password.length > 72) return setErr("Password must be 72 characters or less");
    }

    setBusy(true);
    try {
      const payload = { full_name, email, role };
      if (title === "Add User") payload.password = password;
      await onSubmit(payload);
    } catch (e2) {
      setErr(e2?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.modalOverlay} onMouseDown={onClose}>
      <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.modalHead}>
          <div>
            <div style={styles.modalTitle}>{title}</div>
            <div style={styles.modalSub}>Create a new user with role and password.</div>
          </div>
          <button style={styles.modalClose} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.modalForm}>
          <div style={styles.fieldGrid}>
            <div>
              <label style={styles.label}>Full name</label>
              <input style={styles.field} value={full_name} onChange={(e) => setFullName(e.target.value)} />
            </div>

            <div>
              <label style={styles.label}>Email</label>
              <input style={styles.field} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            {title === "Add User" && (
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  style={styles.field}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={styles.label}>Role</label>
              <select style={styles.field} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="admin">Admin</option>
                <option value="staff">Office Employee</option>
              </select>
            </div>
          </div>

          {err && (
            <div style={{ ...styles.alert, ...styles.alertError, marginTop: 10 }}>
              <div style={styles.alertTitle}>Fix this</div>
              <div style={styles.alertText}>{err}</div>
            </div>
          )}

          <div style={styles.modalActions}>
            <button type="button" style={styles.modalBtnGhost} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={styles.modalBtnPrimary} disabled={busy}>
              {busy ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { display: "grid", gap: 10, padding: 0 },

  /* smaller top info ✅ */
  actionsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  actionsLeft: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  actionsRight: { display: "flex", gap: 10, alignItems: "center" },

  /* cards */
  card: {
    background: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    padding: 12,
    border: "1px solid rgba(15,23,42,0.08)",
    boxShadow: "0 12px 26px rgba(2,6,23,0.06)",
    backdropFilter: "blur(10px)",
  },
  cardHead: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 8,
    borderBottom: "1px solid rgba(15,23,42,0.06)",
  },
  cardTitle: { fontSize: 13, fontWeight: 950, color: "#0f172a" },
  cardSub: { marginTop: 2, fontSize: 12, color: "#64748b" },
  cardBody: { paddingTop: 10 },

  /* alerts */
  alert: {
    borderRadius: 14,
    padding: 10,
    border: "1px solid rgba(15,23,42,0.10)",
    boxShadow: "0 10px 22px rgba(2,6,23,0.06)",
  },
  alertTitle: { fontWeight: 950, marginBottom: 2 },
  alertText: { fontSize: 13, opacity: 0.95 },
  alertError: { background: "#fff1f2", borderColor: "#fecaca", color: "#9f1239" },
  alertOk: { background: "#f0fdf4", borderColor: "#bbf7d0", color: "#166534" },

  /* filters */
  filtersRow: {
    display: "grid",
    gridTemplateColumns: "1fr 220px 220px",
    gap: 10,
    alignItems: "center",
  },
  filtersRowMobile: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 10,
  },

  searchWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    background: "#ffffff",
    border: "1px solid rgba(15,23,42,0.10)",
    borderRadius: 14,
    height: 42,
    boxShadow: "0 10px 18px rgba(2,6,23,0.04)",
  },
  searchIcon: { position: "absolute", left: 12, color: "#64748b", display: "grid", placeItems: "center" },
  searchInput: {
    width: "100%",
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    padding: "0 12px 0 38px",
    fontSize: 14,
    color: "#0f172a",
  },
  select: {
    width: "100%",
    height: 42,
    padding: "0 12px",
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,0.10)",
    outline: "none",
    background: "#ffffff",
    boxShadow: "0 10px 18px rgba(2,6,23,0.04)",
    fontWeight: 800,
    color: "#0f172a",
    cursor: "pointer",
  },

  /* table */
  tableCard: {
    background: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,0.08)",
    boxShadow: "0 16px 34px rgba(2,6,23,0.08)",
    overflow: "hidden",
    backdropFilter: "blur(10px)",
  },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
  th: {
    textAlign: "left",
    padding: "11px 14px",
    fontSize: 12,
    color: "#64748b",
    fontWeight: 950,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    borderBottom: "1px solid rgba(15,23,42,0.08)",
    background: "linear-gradient(180deg, rgba(248,250,252,1), rgba(255,255,255,1))",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  tr: {
    height: 72,               // ✅ fixed height for every row
  },
  td: {
    padding: "12px 14px",
    borderBottom: "1px solid rgba(15,23,42,0.06)",
    fontSize: 14,
    color: "#0f172a",
    verticalAlign: "middle",
    height: 72,               // ✅ enforce
  },
  userCell: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },

  userName: {
    fontWeight: 950,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 240,
  },
  userId: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748b",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 260,
  },
  email: {
    fontWeight: 800,
    color: "#0f172a",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 340,
  },

  dateText: {
    fontSize: 13,
    color: "#0f172a",
    whiteSpace: "nowrap",
  },
  actions: {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    alignItems: "center",     // ✅ keep buttons centered
    flexWrap: "nowrap",       // ✅ don’t wrap to next line (causes height changes)
  },
  emptyTd: { padding: 18 },
  emptyBox: { border: "1px dashed rgba(15,23,42,0.18)", borderRadius: 14, padding: 14, background: "rgba(248,250,252,1)" },
  emptyTitle: { fontWeight: 950, color: "#0f172a" },
  emptyText: { marginTop: 4, fontSize: 13, color: "#64748b" },

  loadingBox: { padding: 14, color: "#0f172a", fontWeight: 900 },

  /* avatar */
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 14,
    background: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.12))",
    border: "1px solid rgba(37,99,235,0.18)",
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
  },
  avatarText: { fontWeight: 950, color: "#0f172a", fontSize: 12, letterSpacing: "0.06em" },

  /* chips */
  chip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    border: "1px solid rgba(15,23,42,0.10)",
    whiteSpace: "nowrap",
    background: "#f8fafc",
    color: "#0f172a",
  }, chipBlue: { background: "rgba(37,99,235,0.08)", color: "#1e40af", borderColor: "rgba(37,99,235,0.16)" },
  chipGreen: { background: "rgba(34,197,94,0.08)", color: "#166534", borderColor: "rgba(34,197,94,0.16)" },
  chipAmber: { background: "rgba(245,158,11,0.08)", color: "#92400e", borderColor: "rgba(245,158,11,0.16)" },
  chipRed: { background: "rgba(220,38,38,0.08)", color: "#991b1b", borderColor: "rgba(220,38,38,0.16)" },

  chipNeutral: { background: "#f8fafc", color: "#0f172a", borderColor: "rgba(15,23,42,0.10)" },

  btn: {
    height: 38,               // ✅ slightly smaller, consistent
    padding: "0 12px",
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,0.10)",
    cursor: "pointer",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    whiteSpace: "nowrap",
  },
  btnIcon: { width: 28, height: 28, borderRadius: 10, display: "grid", placeItems: "center", background: "rgba(15,23,42,0.06)" },
  btnPrimary: { background: "#0f172a", color: "#fff", boxShadow: "0 12px 26px rgba(2,6,23,0.16)" },
  btnNeutral: { background: "#ffffff", color: "#0f172a" },
  btnSuccess: { background: "rgba(16, 80, 163, 0.65)", color: "#ffffff", borderColor: "rgba(5, 10, 80, 0.22)" },
  btnDanger: { background: "#030303", color: "#fff" },


  /* modal */
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(2,6,23,0.55)", display: "grid", placeItems: "center", padding: 16, zIndex: 999 },
  modalCard: {
    width: "min(640px, 100%)",
    borderRadius: 20,
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(15,23,42,0.10)",
    boxShadow: "0 30px 80px rgba(2,6,23,0.35)",
    backdropFilter: "blur(12px)",
    padding: 16,
  },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: 950, color: "#0f172a" },
  modalSub: { marginTop: 4, fontSize: 12, color: "#64748b" },
  modalClose: { border: "1px solid rgba(15,23,42,0.12)", background: "#ffffff", width: 40, height: 40, borderRadius: 14, cursor: "pointer", fontWeight: 950, color: "#0f172a" },
  modalForm: { marginTop: 12, display: "grid", gap: 10 },
  fieldGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  label: { fontSize: 12, color: "#64748b", fontWeight: 950, textTransform: "uppercase", letterSpacing: "0.06em" },
  field: { width: "100%", height: 44, padding: "0 12px", borderRadius: 14, border: "1px solid rgba(15,23,42,0.10)", outline: "none", background: "#ffffff", boxShadow: "0 10px 22px rgba(2,6,23,0.04)", fontWeight: 800, color: "#0f172a" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 },
  modalBtnGhost: { height: 40, padding: "0 14px", borderRadius: 14, border: "1px solid rgba(15,23,42,0.12)", background: "#ffffff", cursor: "pointer", fontWeight: 900, color: "#0f172a" },
  modalBtnPrimary: { height: 40, padding: "0 14px", borderRadius: 14, border: "1px solid rgba(15,23,42,0.12)", background: "#0f172a", cursor: "pointer", fontWeight: 900, color: "#ffffff" },

  /* responsive */
  "@media (max-width: 900px)": {},
};
