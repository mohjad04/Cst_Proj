import React, { useEffect, useMemo, useState } from "react";


import { getSlaRules } from "../../services/slaApi";
import { listTeamsByZone } from "../../services/agentsApi";


const ACTIONS = ["notify_dispatcher", "notify_manager", "notify_admin", "create_ticket"];


const CATEGORIES = [
  { category_code: "roads", subs: ["pothole", "asphalt_damage", "street_light"] },
  { category_code: "water", subs: ["water_leak"] },
  { category_code: "waste", subs: ["missed_trash"] },
];


/* ---------- Modal ---------- */

export function SlaModal({ title, submitLabel, initial, onClose, onSubmit }) {
  const [name, setName] = useState(initial.name || "");
  const [zone] = useState(initial.zone);
  const [priority] = useState(initial.priority);
  const [team_id, setTeam] = useState(initial.team_id || "");


  const [target_hours, setTargetHours] = useState(initial.target_hours ?? 48);
  const [breach_threshold_hours, setBreachHours] = useState(initial.breach_threshold_hours ?? 60);

  const [steps, setSteps] = useState(Array.isArray(initial.escalation_steps) ? initial.escalation_steps : []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [slaRules, setSlaRules] = useState(null);

  const category_code = initial.category_code;
  const subcategory_code = initial.subcategory_code;
  const [teams, setTeams] = useState([]);


  useEffect(() => {
    let alive = true;

    async function load() {
      const rules = await getSlaRules();
      if (!alive) return;
      setSlaRules(rules);

      if (initial.zone) {
        const t = await listTeamsByZone(initial.zone);
        if (!alive) return;
        setTeams(Array.isArray(t) ? t : []);
      } else {
        setTeams([]);
      }
    }

    load();
    return () => { alive = false; };
  }, [initial.zone]);


  function addStep() {
    setSteps((prev) => [...prev, { after_hours: Number(target_hours || 1), action: "notify_dispatcher" }]);
  }

  function updateStep(i, patch) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function removeStep(i) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i));
  }

  function calculateTarget(zone, priority) {
    if (!slaRules) return 0;

    const z = slaRules.zones?.[zone] || 0;
    const p = slaRules.priorities?.[priority] || 0;

    return z + p;
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
        team_id: team_id,                // ✅ CORRECT KEY
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
            <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} disabled />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Zone">
              <select style={styles.input} value={zone} disabled>
                <option value={zone}>{zone}</option>
              </select>

            </Field>

            <Field label="Priority">
              <select style={styles.input} value={priority} disabled>
                <option value={priority}>{priority}</option>
              </select>

            </Field>

          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Category">
              <input
                style={{ ...styles.input, background: "#f9fafb" }}
                value={category_code}
                disabled
              />
            </Field>

            <Field label="Subcategory">
              <input
                style={{ ...styles.input, background: "#f9fafb" }}
                value={subcategory_code}
                disabled
              />
            </Field>
          </div>


          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Target hours">
              <input style={styles.input} type="number" min={1} value={target_hours} onChange={(e) => setTargetHours(e.target.value)} disabled />
            </Field>

            <Field label="Breach threshold hours">
              <input style={styles.input} type="number" min={1} value={breach_threshold_hours} onChange={(e) => setBreachHours(e.target.value)} />
            </Field>
          </div>
          <Field label="Assigned Team">
            <select
              style={styles.input}
              value={team_id}
              onChange={(e) => setTeam(e.target.value)}
            >
              <option value="">Select team</option>

              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {(!t.zones || t.zones.length === 0) ? " (All zones)" : ""}
                </option>
              ))}
            </select>
          </Field>



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
