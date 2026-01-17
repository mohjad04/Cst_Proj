import React, { useEffect, useMemo, useState } from "react";
import {
  createUser,
  deleteUser,
  listUsers,
  toggleUserActive,
  updateUser,
} from "../../services/usersApi";

const ROLES = [
  { value: "all", label: "All roles" },
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Office Employee" },
];

const STATUS = [
  { value: "all", label: "All status" },
  { value: "true", label: "Active" },
  { value: "false", label: "Disabled" },
];

export default function Users() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");

  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await listUsers();
      setRows(data);
    } catch (e) {
      setError(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return rows
      .filter((u) => {
        if (role !== "all" && u.role !== role) return false;
        if (status === "true" && !u.is_active) return false;
        if (status === "false" && u.is_active) return false;
        if (!query) return true;
        return (
          u.full_name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.role.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [rows, q, role, status]);

  function roleLabel(r) {
    return r === "admin" ? "Admin" : "Office Employee";
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  async function onToggleActive(userId) {
    setError("");
    try {
      const updated = await toggleUserActive(userId);
      setRows((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      showToast(updated.is_active ? "User enabled" : "User disabled");
    } catch (e) {
      setError(e.message || "Failed");
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
      setError(e.message || "Failed");
    }
  }

  function openEdit(user) {
    setSelected(user);
    setEditOpen(true);
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={{ margin: 0 }}>Users</h1>
          <div style={{ color: "#6b7280", marginTop: 6 }}>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button style={{ ...styles.btn, background: "#111827" }} onClick={() => setCreateOpen(true)}>
            + Add User
          </button>
          <button style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }} onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={styles.card}>
        <div style={styles.toolbar}>
          <input
            style={styles.input}
            placeholder="Search by name, email, or role..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select style={styles.input} value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <select style={styles.input} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 10, color: "#6b7280", fontSize: 13 }}>
          Showing <b>{filtered.length}</b> of <b>{rows.length}</b> users
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ ...styles.card, border: "1px solid #fecaca", background: "#fff1f2", color: "#991b1b" }}>
          {error}
        </div>
      )}
      {toast && (
        <div style={{ ...styles.card, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534" }}>
          {toast}
        </div>
      )}

      {/* Table */}
      <div style={styles.card}>
        {loading ? (
          <div style={{ padding: 12 }}>Loading…</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Created</th>
                  <th style={styles.th}>Last login</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 800 }}>{u.full_name}</div>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>ID: {u.id}</div>
                    </td>
                    <td style={styles.td}>{u.email}</td>
                    <td style={styles.td}>
                      <span style={styles.badge}>{roleLabel(u.role)}</span>
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          background: u.is_active ? "#ecfeff" : "#fef2f2",
                          borderColor: u.is_active ? "#a5f3fc" : "#fecaca",
                        }}
                      >
                        {u.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td style={styles.td}>{u.created_at || "—"}</td>
                    <td style={styles.td}>{u.last_login_at || "—"}</td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }} onClick={() => openEdit(u)}>
                          Edit
                        </button>
                        <button
                          style={{ ...styles.btn, background: u.is_active ? "#fee2e2" : "#dcfce7", color: "#111827" }}
                          onClick={() => onToggleActive(u.id)}
                        >
                          {u.is_active ? "Disable" : "Enable"}
                        </button>
                        <button style={{ ...styles.btn, background: "#111827" }} onClick={() => onDelete(u.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td style={styles.td} colSpan={7}>
                      <div style={{ padding: 12, color: "#6b7280" }}>No users match the filters.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
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
              setError(e.message || "Failed to create user");
            }
          }}
        />
      )}

      {editOpen && selected && (
        <UserModal
          title="Edit User"
          submitLabel="Save"
          initial={{ full_name: selected.full_name, email: selected.email, role: selected.role }}
          onClose={() => {
            setEditOpen(false);
            setSelected(null);
          }}
          onSubmit={async (payload) => {
            setError("");
            try {
              const updated = await updateUser(selected.id, payload);
              setRows((prev) => prev.map((u) => (u.id === selected.id ? updated : u)));
              setEditOpen(false);
              setSelected(null);
              showToast("User updated");
            } catch (e) {
              setError(e.message || "Failed to update user");
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

    setBusy(true);
    try {
      const payload = { full_name, email, role };
      if (title === "Add User") payload.password = password;

      await onSubmit(payload);
    } catch (e2) {
      setErr(e2.message || "Failed");
    } finally {
      setBusy(false);
    }
    if (title === "Add User" && password.length > 72) {
      return setErr("Password must be 72 characters or less");
    }

  }

  return (
    <div style={styles.modalOverlay} onMouseDown={onClose}>
      <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <div>
            <label style={styles.label}>Full name</label>
            <input style={styles.input} value={full_name} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div>
            <label style={styles.label}>Email</label>
            <input style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          {title === "Add User" && (
            <div>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                style={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label style={styles.label}>Role</label>
            <select style={styles.input} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="admin">Admin</option>
              <option value="staff">Office Employee</option>
            </select>
          </div>

          {err && (
            <div style={{ ...styles.card, border: "1px solid #fecaca", background: "#fff1f2", color: "#991b1b" }}>
              {err}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
            <button type="button" style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={{ ...styles.btn, background: "#111827" }} disabled={busy}>
              {busy ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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
  toolbar: {
    display: "grid",
    gridTemplateColumns: "1fr 200px 200px",
    gap: 10,
  },
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
    fontWeight: 700,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #e5e7eb", color: "#374151", fontSize: 13 },
  td: { padding: "10px 8px", borderBottom: "1px solid #e5e7eb", fontSize: 14, verticalAlign: "top" },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    background: "#eef2ff",
    border: "1px solid #e0e7ff",
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
    width: "min(520px, 100%)",
    background: "white",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
  },
  label: { fontSize: 13, color: "#374151", fontWeight: 700, display: "block", marginBottom: 6 },
};
