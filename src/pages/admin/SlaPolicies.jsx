import React, { useEffect, useMemo, useState } from "react";
import {
  createSlaPolicy,
  deleteSlaPolicy,
  listSlaPolicies,
  toggleSlaActive,
  updateSlaPolicy,
} from "../../services/slaApi";

// keep them simple for now (later: fetch from Zones/Teams/Categories)
const ZONES = ["ZONE-DT-01", "ZONE-W-02", "ZONE-N-03", "ZONE-S-04"];
const PRIORITIES = ["P1", "P2", "P3"];
const ACTIONS = ["notify_dispatcher", "notify_manager", "notify_admin", "create_ticket"];

const CATEGORIES = [
  { category_code: "roads", subs: ["pothole", "asphalt_damage", "street_light"] },
  { category_code: "water", subs: ["water_leak"] },
  { category_code: "waste", subs: ["missed_trash"] },
];

export default function SlaMonitoring() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [zone, setZone] = useState("all");
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");

  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const [modal, setModal] = useState({ open: false, mode: "create", item: null });

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await listSlaPolicies();
      setRows(data);
    } catch (e) {
      setError(e.message || "Failed to load SLA policies");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((p) => {
      if (zone !== "all" && p.zone !== zone) return false;
      if (priority !== "all" && p.priority !== priority) return false;
      if (status === "active" && !p.active) return false;
      if (status === "disabled" && p.active) return false;

      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        p.zone.toLowerCase().includes(query) ||
        p.priority.toLowerCase().includes(query) ||
        p.category_code.toLowerCase().includes(query) ||
        p.subcategory_code.toLowerCase().includes(query)
      );
    });
  }, [rows, q, zone, priority, status]);

  async function onToggle(id) {
    setError("");
    try {
      const updated = await toggleSlaActive(id);
      setRows((prev) => prev.map((x) => (x.id === id ? updated : x)));
      showToast(updated.active ? "Policy enabled" : "Policy disabled");
    } catch (e) {
      setError(e.message || "Failed");
    }
  }

  async function onDelete(id) {
    const ok = confirm("Delete this SLA policy?");
    if (!ok) return;

    setError("");
    try {
      await deleteSlaPolicy(id);
      setRows((prev) => prev.filter((x) => x.id !== id));
      showToast("Policy deleted");
    } catch (e) {
      setError(e.message || "Failed");
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={{ margin: 0 }}>SLA Policies</h1>
          <div style={{ color: "#6b7280", marginTop: 6 }}>
            Configure SLA targets and escalation steps by zone/category/priority.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button style={{ ...styles.btn, background: "#111827" }} onClick={() => setModal({ open: true, mode: "create", item: null })}>
            + Add Policy
          </button>
          <button style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }} onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.card}>
        <div style={styles.toolbar}>
          <input style={styles.input} placeholder="Search policies..." value={q} onChange={(e) => setQ(e.target.value)} />

          <select style={styles.input} value={zone} onChange={(e) => setZone(e.target.value)}>
            <option value="all">All zones</option>
            {ZONES.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>

          <select style={styles.input} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="all">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select style={styles.input} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        <div style={{ marginTop: 10, color: "#6b7280", fontSize: 13 }}>
          Showing <b>{filtered.length}</b> of <b>{rows.length}</b> policies
        </div>
      </div>

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
                  <th style={styles.th}>Policy</th>
                  <th style={styles.th}>Match</th>
                  <th style={styles.th}>Targets</th>
                  <th style={styles.th}>Escalation</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 900 }}>{p.name}</div>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>ID: {p.id}</div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: "grid", gap: 4, fontSize: 13 }}>
                        <div><b>Zone:</b> {p.zone}</div>
                        <div><b>Category:</b> {p.category_code} / {p.subcategory_code}</div>
                        <div><b>Priority:</b> {p.priority}</div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: "grid", gap: 4, fontSize: 13 }}>
                        <div>Target: <b>{p.target_hours}h</b></div>
                        <div>Breach: <b>{p.breach_threshold_hours}h</b></div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <StepsPreview steps={p.escalation_steps} />
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          background: p.active ? "#ecfeff" : "#fef2f2",
                          borderColor: p.active ? "#a5f3fc" : "#fecaca",
                        }}
                      >
                        {p.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button
                          style={{ ...styles.smallBtn, background: "#e5e7eb", color: "#111827" }}
                          onClick={() => setModal({ open: true, mode: "edit", item: p })}
                        >
                          Edit
                        </button>
                        <button
                          style={{ ...styles.smallBtn, background: p.active ? "#fee2e2" : "#dcfce7", color: "#111827" }}
                          onClick={() => onToggle(p.id)}
                        >
                          {p.active ? "Disable" : "Enable"}
                        </button>
                        <button style={{ ...styles.smallBtn, background: "#111827", color: "white" }} onClick={() => onDelete(p.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td style={styles.td} colSpan={6}>
                      <div style={{ padding: 12, color: "#6b7280" }}>No SLA policies match filters.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal.open && (
        <SlaModal
          title={modal.mode === "create" ? "Add SLA Policy" : "Edit SLA Policy"}
          submitLabel={modal.mode === "create" ? "Create" : "Save"}
          initial={
            modal.item || {
              name: "",
              zone: ZONES[0],
              category_code: CATEGORIES[0].category_code,
              subcategory_code: CATEGORIES[0].subs[0],
              priority: "P3",
              target_hours: 48,
              breach_threshold_hours: 60,
              escalation_steps: [
                { after_hours: 48, action: "notify_dispatcher" },
                { after_hours: 60, action: "notify_manager" },
              ],
            }
          }
          onClose={() => setModal({ open: false, mode: "create", item: null })}
          onSubmit={async (payload) => {
            setError("");
            try {
              if (modal.mode === "create") {
                const created = await createSlaPolicy(payload);
                setRows((prev) => [created, ...prev]);
                showToast("Policy created");
              } else {
                const updated = await updateSlaPolicy(modal.item.id, payload);
                setRows((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                showToast("Policy updated");
              }
              setModal({ open: false, mode: "create", item: null });
            } catch (e) {
              setError(e.message || "Failed");
            }
          }}
        />
      )}
    </div>
  );
}

function StepsPreview({ steps }) {
  const arr = Array.isArray(steps) ? steps : [];
  if (arr.length === 0) return <span style={{ color: "#6b7280" }}>—</span>;
  return (
    <div style={{ display: "grid", gap: 4, fontSize: 13 }}>
      {arr.slice(0, 4).map((s, i) => (
        <div key={i}>
          after <b>{s.after_hours}h</b> → <span style={styles.badgePlain}>{s.action}</span>
        </div>
      ))}
      {arr.length > 4 && <div style={{ color: "#6b7280" }}>+{arr.length - 4} more</div>}
    </div>
  );
}

/* ---------- Modal ---------- */

function SlaModal({ title, submitLabel, initial, onClose, onSubmit }) {
  const [name, setName] = useState(initial.name || "");
  const [zone, setZone] = useState(initial.zone || ZONES[0]);
  const [priority, setPriority] = useState(initial.priority || "P3");

  const [category_code, setCategory] = useState(initial.category_code || CATEGORIES[0].category_code);
  const [subcategory_code, setSubcategory] = useState(initial.subcategory_code || CATEGORIES[0].subs[0]);

  const [target_hours, setTargetHours] = useState(initial.target_hours ?? 48);
  const [breach_threshold_hours, setBreachHours] = useState(initial.breach_threshold_hours ?? 60);

  const [steps, setSteps] = useState(Array.isArray(initial.escalation_steps) ? initial.escalation_steps : []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const subOptions = useMemo(() => {
    return CATEGORIES.find((c) => c.category_code === category_code)?.subs || [];
  }, [category_code]);

  useEffect(() => {
    if (!subOptions.includes(subcategory_code)) setSubcategory(subOptions[0] || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category_code]);

  function addStep() {
    setSteps((prev) => [...prev, { after_hours: Number(target_hours || 1), action: "notify_dispatcher" }]);
  }

  function updateStep(i, patch) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function removeStep(i) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!name.trim()) return setErr("Policy name is required");
    if (!zone) return setErr("Zone is required");
    if (!category_code) return setErr("Category is required");
    if (!subcategory_code) return setErr("Subcategory is required");
    if (!priority) return setErr("Priority is required");

    const t = Number(target_hours);
    const b = Number(breach_threshold_hours);
    if (!(t > 0)) return setErr("Target hours must be > 0");
    if (!(b > 0)) return setErr("Breach hours must be > 0");
    if (b < t) return setErr("Breach threshold must be >= target hours");

    setBusy(true);
    try {
      await onSubmit({
        name,
        zone,
        category_code,
        subcategory_code,
        priority,
        target_hours: t,
        breach_threshold_hours: b,
        escalation_steps: steps,
      });
    } catch (e2) {
      setErr(e2.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.modalOverlay} onMouseDown={onClose}>
      <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button style={{ ...styles.smallBtn, background: "#e5e7eb", color: "#111827" }} onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <Field label="Policy name">
            <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Zone">
              <select style={styles.input} value={zone} onChange={(e) => setZone(e.target.value)}>
                {ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Priority">
              <select style={styles.input} value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Category">
              <select style={styles.input} value={category_code} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c.category_code} value={c.category_code}>
                    {c.category_code}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Subcategory">
              <select style={styles.input} value={subcategory_code} onChange={(e) => setSubcategory(e.target.value)}>
                {subOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Target hours">
              <input style={styles.input} type="number" min={1} value={target_hours} onChange={(e) => setTargetHours(e.target.value)} />
            </Field>

            <Field label="Breach threshold hours">
              <input style={styles.input} type="number" min={1} value={breach_threshold_hours} onChange={(e) => setBreachHours(e.target.value)} />
            </Field>
          </div>

          <div style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 900 }}>Escalation steps</div>
              <button type="button" style={{ ...styles.smallBtn, background: "#111827", color: "white" }} onClick={addStep}>
                + Add step
              </button>
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              {steps.length === 0 && <div style={{ color: "#6b7280" }}>No steps</div>}

              {steps.map((s, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 1fr 90px", gap: 10, alignItems: "end" }}>
                  <Field label="After hours">
                    <input
                      style={styles.input}
                      type="number"
                      min={1}
                      value={s.after_hours}
                      onChange={(e) => updateStep(i, { after_hours: Number(e.target.value || 0) })}
                    />
                  </Field>

                  <Field label="Action">
                    <select style={styles.input} value={s.action} onChange={(e) => updateStep(i, { action: e.target.value })}>
                      {ACTIONS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <button type="button" style={{ ...styles.smallBtn, background: "#fee2e2", color: "#111827" }} onClick={() => removeStep(i)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {err && (
            <div style={{ ...styles.card, border: "1px solid #fecaca", background: "#fff1f2", color: "#991b1b" }}>
              {err}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
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

function Field({ label, children }) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      {children}
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
  toolbar: { display: "grid", gridTemplateColumns: "1fr 200px 160px 160px", gap: 10 },
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
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    background: "#eef2ff",
    border: "1px solid #e0e7ff",
  },
  badgePlain: {
    display: "inline-flex",
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    fontSize: 12,
  },
  label: { fontSize: 13, color: "#374151", fontWeight: 800, display: "block", marginBottom: 6 },
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
};
