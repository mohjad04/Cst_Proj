import React, { useEffect, useMemo, useState } from "react";
import {
  createAgent,
  createTeam,
  deleteAgent,
  deleteTeam,
  listAgents,
  listTeams,
  toggleAgentActive,
  toggleTeamActive,
  updateAgent,
  updateTeam,
} from "../../services/agentsApi";

const SHIFT_OPTIONS = ["Day", "Night", "24/7"];
const SAMPLE_ZONES = ["ZONE-DT-01", "ZONE-W-02", "ZONE-N-03", "ZONE-S-04"];
const SAMPLE_SKILLS = ["pothole", "asphalt_damage", "water_leak", "missed_trash", "street_light"];

export default function Agents() {
  const [tab, setTab] = useState("teams"); // teams | agents

  const [teams, setTeams] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all"); // all | active | disabled

  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  // modals
  const [teamModal, setTeamModal] = useState({ open: false, mode: "create", item: null });
  const [agentModal, setAgentModal] = useState({ open: false, mode: "create", item: null });

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [t, a] = await Promise.all([listTeams(), listAgents()]);
      setTeams(t);
      setAgents(a);
    } catch (e) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const teamsFiltered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return teams.filter((t) => {
      if (status === "active" && !t.active) return false;
      if (status === "disabled" && t.active) return false;
      if (!query) return true;
      return (
        t.name.toLowerCase().includes(query) ||
        (t.shift || "").toLowerCase().includes(query) ||
        (t.zones || []).join(",").toLowerCase().includes(query) ||
        (t.skills || []).join(",").toLowerCase().includes(query)
      );
    });
  }, [teams, q, status]);

  const agentsFiltered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return agents.filter((a) => {
      if (status === "active" && !a.active) return false;
      if (status === "disabled" && a.active) return false;
      if (!query) return true;
      const teamName = teams.find((t) => t.id === a.team_id)?.name || "";
      return (
        a.full_name.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query) ||
        teamName.toLowerCase().includes(query) ||
        (a.shift || "").toLowerCase().includes(query) ||
        (a.zones || []).join(",").toLowerCase().includes(query) ||
        (a.skills || []).join(",").toLowerCase().includes(query)
      );
    });
  }, [agents, teams, q, status]);

  async function onToggleTeam(teamId) {
    setError("");
    try {
      const updated = await toggleTeamActive(teamId);
      setTeams((prev) => prev.map((x) => (x.id === teamId ? updated : x)));
      // reload agents (because disabling team may disable agents)
      const a = await listAgents();
      setAgents(a);
      showToast(updated.active ? "Team enabled" : "Team disabled (agents disabled too)");
    } catch (e) {
      setError(e.message || "Failed");
    }
  }

  async function onDeleteTeam(teamId) {
    const ok = confirm("Delete this team? (Teams with agents cannot be deleted)");
    if (!ok) return;

    setError("");
    try {
      await deleteTeam(teamId);
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
      showToast("Team deleted");
    } catch (e) {
      setError(e.message || "Failed");
    }
  }

  async function onToggleAgent(agentId) {
    setError("");
    try {
      const updated = await toggleAgentActive(agentId);
      setAgents((prev) => prev.map((x) => (x.id === agentId ? updated : x)));
      showToast(updated.active ? "Agent enabled" : "Agent disabled");
    } catch (e) {
      setError(e.message || "Failed");
    }
  }

  async function onDeleteAgent(agentId) {
    const ok = confirm("Delete this agent? This cannot be undone.");
    if (!ok) return;

    setError("");
    try {
      await deleteAgent(agentId);
      setAgents((prev) => prev.filter((a) => a.id !== agentId));
      showToast("Agent deleted");
    } catch (e) {
      setError(e.message || "Failed");
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={{ margin: 0 }}>Agents & Teams</h1>
          <div style={{ color: "#6b7280", marginTop: 6 }}>
            Manage service teams: coverage zones, skill tags, shift schedules, active state.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {tab === "teams" ? (
            <button style={{ ...styles.btn, background: "#111827" }} onClick={() => setTeamModal({ open: true, mode: "create", item: null })}>
              + Add Team
            </button>
          ) : (
            <button style={{ ...styles.btn, background: "#111827" }} onClick={() => setAgentModal({ open: true, mode: "create", item: null })}>
              + Add Agent
            </button>
          )}
          <button style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }} onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs + Filters */}
      <div style={styles.card}>
        <div style={styles.tabsRow}>
          <div style={styles.tabs}>
            <button
              onClick={() => setTab("teams")}
              style={{ ...styles.tabBtn, ...(tab === "teams" ? styles.tabActive : {}) }}
            >
              Teams ({teams.length})
            </button>
            <button
              onClick={() => setTab("agents")}
              style={{ ...styles.tabBtn, ...(tab === "agents" ? styles.tabActive : {}) }}
            >
              Agents ({agents.length})
            </button>
          </div>

          <div style={styles.filters}>
            <input
              style={styles.input}
              placeholder={tab === "teams" ? "Search teams..." : "Search agents..."}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select style={styles.input} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 10, color: "#6b7280", fontSize: 13 }}>
          Showing <b>{tab === "teams" ? teamsFiltered.length : agentsFiltered.length}</b> records
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

      {/* Content */}
      <div style={styles.card}>
        {loading ? (
          <div style={{ padding: 12 }}>Loading…</div>
        ) : tab === "teams" ? (
          <TeamsTable
            rows={teamsFiltered}
            onEdit={(t) => setTeamModal({ open: true, mode: "edit", item: t })}
            onToggle={onToggleTeam}
            onDelete={onDeleteTeam}
          />
        ) : (
          <AgentsTable
            rows={agentsFiltered}
            teams={teams}
            onEdit={(a) => setAgentModal({ open: true, mode: "edit", item: a })}
            onToggle={onToggleAgent}
            onDelete={onDeleteAgent}
          />
        )}
      </div>

      {/* Modals */}
      {teamModal.open && (
        <TeamModal
          title={teamModal.mode === "create" ? "Add Team" : "Edit Team"}
          submitLabel={teamModal.mode === "create" ? "Create" : "Save"}
          initial={
            teamModal.item || { name: "", zones: [], skills: [], shift: "Day" }
          }
          onClose={() => setTeamModal({ open: false, mode: "create", item: null })}
          onSubmit={async (payload) => {
            setError("");
            try {
              if (teamModal.mode === "create") {
                const created = await createTeam(payload);
                setTeams((prev) => [created, ...prev]);
                showToast("Team created");
              } else {
                const updated = await updateTeam(teamModal.item.id, payload);
                setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
                showToast("Team updated");
              }
              setTeamModal({ open: false, mode: "create", item: null });
            } catch (e) {
              setError(e.message || "Failed");
            }
          }}
        />
      )}

      {agentModal.open && (
        <AgentModal
          title={agentModal.mode === "create" ? "Add Agent" : "Edit Agent"}
          submitLabel={agentModal.mode === "create" ? "Create" : "Save"}
          teams={teams}
          initial={
            agentModal.item || {
              full_name: "",
              email: "",
              phone: "",
              team_id: teams[0]?.id || null,
              zones: [],
              skills: [],
              shift: "Day",
              workload_open: 0,
            }
          }
          onClose={() => setAgentModal({ open: false, mode: "create", item: null })}
          onSubmit={async (payload) => {
            setError("");
            try {
              if (agentModal.mode === "create") {
                const created = await createAgent(payload);
                setAgents((prev) => [created, ...prev]);
                showToast("Agent created");
              } else {
                const updated = await updateAgent(agentModal.item.id, payload);
                setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
                showToast("Agent updated");
              }
              setAgentModal({ open: false, mode: "create", item: null });
            } catch (e) {
              setError(e.message || "Failed");
            }
          }}
        />
      )}
    </div>
  );
}

/* ---------- Tables ---------- */

function TeamsTable({ rows, onEdit, onToggle, onDelete }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Team</th>
            <th style={styles.th}>Zones</th>
            <th style={styles.th}>Skills</th>
            <th style={styles.th}>Shift</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td style={styles.td}>
                <div style={{ fontWeight: 800 }}>{t.name}</div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>ID: {t.id}</div>
              </td>
              <td style={styles.td}>{(t.zones || []).join(", ") || "—"}</td>
              <td style={styles.td}>{(t.skills || []).join(", ") || "—"}</td>
              <td style={styles.td}><span style={styles.badge}>{t.shift}</span></td>
              <td style={styles.td}>
                <span
                  style={{
                    ...styles.badge,
                    background: t.active ? "#ecfeff" : "#fef2f2",
                    borderColor: t.active ? "#a5f3fc" : "#fecaca",
                  }}
                >
                  {t.active ? "Active" : "Disabled"}
                </span>
              </td>
              <td style={styles.td}>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }} onClick={() => onEdit(t)}>
                    Edit
                  </button>
                  <button
                    style={{ ...styles.btn, background: t.active ? "#fee2e2" : "#dcfce7", color: "#111827" }}
                    onClick={() => onToggle(t.id)}
                  >
                    {t.active ? "Disable" : "Enable"}
                  </button>
                  <button style={{ ...styles.btn, background: "#111827" }} onClick={() => onDelete(t.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td style={styles.td} colSpan={6}>
                <div style={{ padding: 12, color: "#6b7280" }}>No teams found.</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AgentsTable({ rows, teams, onEdit, onToggle, onDelete }) {
  const teamName = (teamId) => teams.find((t) => t.id === teamId)?.name || "—";

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Agent</th>
            <th style={styles.th}>Team</th>
            <th style={styles.th}>Zones</th>
            <th style={styles.th}>Skills</th>
            <th style={styles.th}>Shift</th>
            <th style={styles.th}>Workload</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id}>
              <td style={styles.td}>
                <div style={{ fontWeight: 800 }}>{a.full_name}</div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>{a.email}</div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>Phone: {a.phone || "—"}</div>
              </td>
              <td style={styles.td}>{teamName(a.team_id)}</td>
              <td style={styles.td}>{(a.zones || []).join(", ") || "—"}</td>
              <td style={styles.td}>{(a.skills || []).join(", ") || "—"}</td>
              <td style={styles.td}><span style={styles.badge}>{a.shift}</span></td>
              <td style={styles.td}><span style={styles.badge}>{a.workload_open ?? 0} open</span></td>
              <td style={styles.td}>
                <span
                  style={{
                    ...styles.badge,
                    background: a.active ? "#ecfeff" : "#fef2f2",
                    borderColor: a.active ? "#a5f3fc" : "#fecaca",
                  }}
                >
                  {a.active ? "Active" : "Disabled"}
                </span>
              </td>
              <td style={styles.td}>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }} onClick={() => onEdit(a)}>
                    Edit
                  </button>
                  <button
                    style={{ ...styles.btn, background: a.active ? "#fee2e2" : "#dcfce7", color: "#111827" }}
                    onClick={() => onToggle(a.id)}
                  >
                    {a.active ? "Disable" : "Enable"}
                  </button>
                  <button style={{ ...styles.btn, background: "#111827" }} onClick={() => onDelete(a.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td style={styles.td} colSpan={8}>
                <div style={{ padding: 12, color: "#6b7280" }}>No agents found.</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Modals ---------- */

function TeamModal({ title, submitLabel, initial, onClose, onSubmit }) {
  const [name, setName] = useState(initial.name || "");
  const [zones, setZones] = useState(initial.zones || []);
  const [skills, setSkills] = useState(initial.skills || []);
  const [shift, setShift] = useState(initial.shift || "Day");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!name.trim()) return setErr("Team name is required");

    setBusy(true);
    try {
      await onSubmit({ name, zones, skills, shift });
    } catch (e2) {
      setErr(e2.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.modalOverlay} onMouseDown={onClose}>
      <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <Header title={title} onClose={onClose} />
        <form onSubmit={handleSubmit} style={styles.form}>
          <Field label="Team name">
            <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>

          <Field label="Shift">
            <select style={styles.input} value={shift} onChange={(e) => setShift(e.target.value)}>
              {SHIFT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Coverage zones">
            <MultiSelect
              options={SAMPLE_ZONES}
              values={zones}
              onChange={setZones}
              placeholder="Select zones..."
            />
          </Field>

          <Field label="Skill tags">
            <MultiSelect
              options={SAMPLE_SKILLS}
              values={skills}
              onChange={setSkills}
              placeholder="Select skills..."
            />
          </Field>

          {err && <ErrorBox text={err} />}

          <FooterButtons onClose={onClose} busy={busy} submitLabel={submitLabel} />
        </form>
      </div>
    </div>
  );
}

function AgentModal({ title, submitLabel, initial, teams, onClose, onSubmit }) {
  const [full_name, setFullName] = useState(initial.full_name || "");
  const [email, setEmail] = useState(initial.email || "");
  const [phone, setPhone] = useState(initial.phone || "");
  const [team_id, setTeamId] = useState(initial.team_id || null);
  const [zones, setZones] = useState(initial.zones || []);
  const [skills, setSkills] = useState(initial.skills || []);
  const [shift, setShift] = useState(initial.shift || "Day");
  const [workload_open, setWorkload] = useState(initial.workload_open ?? 0);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!full_name.trim()) return setErr("Full name is required");
    if (!email.trim()) return setErr("Email is required");

    setBusy(true);
    try {
      await onSubmit({ full_name, email, phone, team_id, zones, skills, shift, workload_open });
    } catch (e2) {
      setErr(e2.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.modalOverlay} onMouseDown={onClose}>
      <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <Header title={title} onClose={onClose} />
        <form onSubmit={handleSubmit} style={styles.form}>
          <Field label="Full name">
            <input style={styles.input} value={full_name} onChange={(e) => setFullName(e.target.value)} />
          </Field>

          <Field label="Email">
            <input style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>

          <Field label="Phone">
            <input style={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>

          <Field label="Team">
            <select style={styles.input} value={team_id ?? ""} onChange={(e) => setTeamId(e.target.value || null)}>
              <option value="">— No team —</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Shift">
            <select style={styles.input} value={shift} onChange={(e) => setShift(e.target.value)}>
              {SHIFT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Coverage zones">
            <MultiSelect options={SAMPLE_ZONES} values={zones} onChange={setZones} placeholder="Select zones..." />
          </Field>

          <Field label="Skill tags">
            <MultiSelect options={SAMPLE_SKILLS} values={skills} onChange={setSkills} placeholder="Select skills..." />
          </Field>

          <Field label="Open workload (for assignment)">
            <input
              style={styles.input}
              type="number"
              min={0}
              value={workload_open}
              onChange={(e) => setWorkload(e.target.value)}
            />
          </Field>

          {err && <ErrorBox text={err} />}

          <FooterButtons onClose={onClose} busy={busy} submitLabel={submitLabel} />
        </form>
      </div>
    </div>
  );
}

/* ---------- UI helpers ---------- */

function Header({ title, onClose }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <button style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }} onClick={onClose} type="button">
        ✕
      </button>
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

function FooterButtons({ onClose, busy, submitLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
      <button type="button" style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }} onClick={onClose}>
        Cancel
      </button>
      <button type="submit" style={{ ...styles.btn, background: "#111827" }} disabled={busy}>
        {busy ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}

function ErrorBox({ text }) {
  return (
    <div style={{ ...styles.card, border: "1px solid #fecaca", background: "#fff1f2", color: "#991b1b" }}>
      {text}
    </div>
  );
}

/**
 * Simple multi-select chips:
 * - shows selected chips
 * - select from dropdown and add
 * - remove chip
 */
function MultiSelect({ options, values, onChange, placeholder }) {
  const [pick, setPick] = useState("");

  function add() {
    if (!pick) return;
    if (values.includes(pick)) return;
    onChange([...values, pick]);
    setPick("");
  }

  function remove(v) {
    onChange(values.filter((x) => x !== v));
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <select style={styles.input} value={pick} onChange={(e) => setPick(e.target.value)}>
          <option value="">{placeholder || "Select..."}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <button type="button" style={{ ...styles.btn, background: "#111827" }} onClick={add}>
          Add
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(values || []).length === 0 ? (
          <span style={{ color: "#6b7280", fontSize: 13 }}>None selected</span>
        ) : (
          values.map((v) => (
            <span key={v} style={{ ...styles.badge, background: "#f9fafb", borderColor: "#e5e7eb" }}>
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                style={{ border: "none", background: "transparent", cursor: "pointer", marginLeft: 6 }}
                title="Remove"
              >
                ✕
              </button>
            </span>
          ))
        )}
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
  tabsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  tabs: { display: "flex", gap: 8 },
  tabBtn: {
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    padding: "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 800,
  },
  tabActive: { background: "#111827", color: "white", borderColor: "#111827" },
  filters: { display: "flex", gap: 10, alignItems: "center" },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    outline: "none",
    minWidth: 220,
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
    width: "min(640px, 100%)",
    background: "white",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
  },
  form: { marginTop: 12, display: "grid", gap: 10 },
  label: { fontSize: 13, color: "#374151", fontWeight: 700, display: "block", marginBottom: 6 },
};
