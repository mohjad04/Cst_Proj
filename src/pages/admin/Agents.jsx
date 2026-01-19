import React, { useEffect, useMemo, useState } from "react";
import {
  listTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  toggleTeamActive,
} from "../../services/agentsApi";
import { listUsers } from "../../services/usersApi";
import { listSkillsFromCategories } from "../../services/skillsApi";



const SHIFT_OPTIONS = ["Day", "Night", "24/7"];
const SAMPLE_ZONES = ["ZONE-DT-01", "ZONE-W-02", "ZONE-N-03", "ZONE-S-04"];
// const SAMPLE_SKILLS = ["pothole", "asphalt_damage", "water_leak", "missed_trash", "street_light"];


export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const [teamModal, setTeamModal] = useState({ open: false, mode: "create", item: null });
  const [skillsOptions, setSkillsOptions] = useState([]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [t, u] = await Promise.all([
        listTeams(),
        listUsers({ role: "staff" }),
      ]);
      setTeams(t);
      setStaff(u.filter(user => user.role === "staff"));
    } catch (e) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    listSkillsFromCategories()
      .then(setSkillsOptions)
      .catch(console.error);
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
        (t.skills || [])
          .map((v) => skillsOptions.find((s) => s.value === v)?.label || "")
          .join(",")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [teams, q, status, skillsOptions]);

  async function onToggleTeam(teamId) {
    setError("");
    try {
      const updated = await toggleTeamActive(teamId);
      setTeams((p) => p.map((x) => (x.id === teamId ? updated : x)));
      showToast(updated.active ? "Team enabled" : "Team disabled");
    } catch (e) {
      setError(e.message || "Failed");
    }
  }

  async function onDeleteTeam(teamId) {
    if (!confirm("Delete this team?")) return;
    setError("");
    try {
      await deleteTeam(teamId);
      setTeams((p) => p.filter((t) => t.id !== teamId));
      showToast("Team deleted");
    } catch (e) {
      setError(e.message || "Failed");
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={{ margin: 0 }}>Teams</h1>
          <div style={{ color: "#6b7280", marginTop: 6 }}>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            style={{ ...styles.btn, background: "#111827" }}
            onClick={() => setTeamModal({ open: true, mode: "create", item: null })}
          >
            + Add Team
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
        <div style={styles.filters}>
          <input
            style={styles.input}
            placeholder="Search teams..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            style={styles.input}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
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

      <div style={styles.card}>
        {loading ? (
          <div style={{ padding: 12 }}>Loading…</div>
        ) : (
          <TeamsTable
            rows={teamsFiltered}
            staff={staff}
            skillsOptions={skillsOptions}
            onEdit={(t) => setTeamModal({ open: true, mode: "edit", item: t })}
            onToggle={onToggleTeam}
            onDelete={onDeleteTeam}
          />

        )}
      </div>

      {teamModal.open && (
        <TeamModal
          title={teamModal.mode === "create" ? "Add Team" : "Edit Team"}
          submitLabel={teamModal.mode === "create" ? "Create" : "Save"}
          staff={staff}
          skillsOptions={skillsOptions}   // ✅ ADD THIS
          initial={
            teamModal.item || {
              name: "",
              members: [],
              zones: [],
              skills: [],
              shift: "Day",
            }
          }
          onClose={() => setTeamModal({ open: false, mode: "create", item: null })}
          onSubmit={async (payload) => {
            setError("");
            try {
              if (teamModal.mode === "create") {
                const created = await createTeam(payload);
                setTeams((p) => [created, ...p]);
                showToast("Team created");
              } else {
                const updated = await updateTeam(teamModal.item.id, payload);
                setTeams((p) => p.map((t) => (t.id === updated.id ? updated : t)));
                showToast("Team updated");
              }
              setTeamModal({ open: false, mode: "create", item: null });
            } catch (e) {
              setError(e.message || "Failed");
            }
          }}
        />
      )}
    </div>
  );
}

/* ---------- TABLE ---------- */

function TeamsTable({ rows, staff, skillsOptions, onEdit, onToggle, onDelete }) {
  const emailOf = (id) => staff.find((u) => u.id === id)?.email || "—";

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Team</th>
            <th style={styles.th}>Members</th>
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
              </td>
              <td style={styles.td}>
                {(t.members || []).length === 0
                  ? "—"
                  : t.members.map((id) => <div key={id}>{emailOf(id)}</div>)}
              </td>
              <td style={styles.td}>{(t.zones || []).join(", ") || "—"}</td>
              <td style={styles.td}>
                {(t.skills || [])
                  .map(
                    (v) =>
                      skillsOptions.find((s) => s.value === v)?.label || v
                  )
                  .join(", ") || "—"}
              </td>
              <td style={styles.td}>
                <span style={styles.badge}>{t.shift}</span>
              </td>
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
                  <button
                    style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }}
                    onClick={() => onEdit(t)}
                  >
                    Edit
                  </button>
                  <button
                    style={{ ...styles.btn, background: t.active ? "#fee2e2" : "#dcfce7", color: "#111827" }}
                    onClick={() => onToggle(t.id)}
                  >
                    {t.active ? "Disable" : "Enable"}
                  </button>
                  <button
                    style={{ ...styles.btn, background: "#111827" }}
                    onClick={() => onDelete(t.id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} style={styles.td}>
                <div style={{ padding: 12, color: "#6b7280" }}>No teams found.</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- MODAL ---------- */

function TeamModal({
  title,
  submitLabel,
  initial,
  staff,
  skillsOptions,   // ✅ ADD THIS
  onClose,
  onSubmit
}) {
  const [name, setName] = useState(initial.name);
  const [members, setMembers] = useState(initial.members);
  const [zones, setZones] = useState(initial.zones);
  const [skills, setSkills] = useState(initial.skills);
  const [shift, setShift] = useState(initial.shift);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!name.trim()) return setErr("Team name is required");
    if (!members.length) return setErr("Select at least one staff member");

    setBusy(true);
    try {
      await onSubmit({ name, members, zones, skills, shift });
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
            <div style={styles.boxedField}>
              <input
                style={{ ...styles.input, width: "100%" }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter team name"
              />
            </div>
          </Field>

          <Field label="Shift">
            <div style={styles.boxedField}>
              <select
                style={{ ...styles.input, width: "100%" }}
                value={shift}
                onChange={(e) => setShift(e.target.value)}
              >
                {SHIFT_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </Field>

          <Field label="Coverage zones">
            <div style={styles.boxedField}>
              <ZoneMultiSelect
                options={SAMPLE_ZONES}
                values={zones}
                onChange={setZones}
              />
            </div>
          </Field>

          <Field label="Skill tags">

            <div style={styles.boxedField}>

              <SkillMultiSelect
                options={skillsOptions}
                values={skills}
                onChange={setSkills}
              />
            </div>
          </Field>


          <Field label="Team members (staff)">
            <div style={styles.staffBox}>
              <div style={styles.staffHeader}>
                Select staff members ({members.length} selected)
              </div>

              <div style={styles.staffScroller}>
                {staff.length === 0 && (
                  <div style={styles.staffEmpty}>
                    No staff users available
                  </div>
                )}

                {staff.map((u) => (
                  <label key={u.id} style={styles.staffRow}>
                    <input
                      type="checkbox"
                      checked={members.includes(u.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setMembers([...members, u.id]);
                        } else {
                          setMembers(members.filter((id) => id !== u.id));
                        }
                      }}
                    />

                    <div>
                      <div style={styles.staffEmail}>{u.email}</div>
                      {u.full_name && (
                        <div style={styles.staffName}>{u.full_name}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </Field>



          {err && <ErrorBox text={err} />}
          <FooterButtons onClose={onClose} busy={busy} submitLabel={submitLabel} />
        </form>
      </div>
    </div>
  );
}

/* ---------- UI HELPERS (UNCHANGED STYLE) ---------- */

function Header({ title, onClose }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <button style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }} onClick={onClose}>
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
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
      <button
        type="button"
        style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }}
        onClick={onClose}
      >
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

function SkillMultiSelect({ options, values, onChange }) {
  const [input, setInput] = useState("");

  function add() {
    const v = input.trim();
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
    setInput("");
  }

  function remove(v) {
    onChange(values.filter((x) => x !== v));
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          style={{ ...styles.input, flex: 1 }}
          placeholder="Type or select skill…"
          list="skills-list"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />

        <datalist id="skills-list">
          {options.map((s) => (
            <option key={s.value} value={s.label}>
              {s.label}
            </option>
          ))}
        </datalist>


        <button
          type="button"
          style={{ ...styles.btn, background: "#111827" }}
          onClick={add}
        >
          Add
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {values.length === 0 ? (
          <span style={{ color: "#6b7280", fontSize: 13 }}>None selected</span>
        ) : (
          values.map((v) => (
            <span key={v} style={{ ...styles.badge }}>
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                style={{ marginLeft: 6, border: "none", background: "transparent" }}
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
function ZoneMultiSelect({ options, values, onChange }) {
  const [input, setInput] = useState("");

  function add() {
    const v = input.trim();
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
    setInput("");
  }

  function remove(v) {
    onChange(values.filter((x) => x !== v));
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          style={{ ...styles.input, flex: 1 }}
          placeholder="Type or select zone…"
          list="zones-list"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />

        <datalist id="zones-list">
          {options.map((z) => (
            <option key={z} value={z} />
          ))}
        </datalist>

        <button
          type="button"
          style={{ ...styles.btn, background: "#111827" }}
          onClick={add}
        >
          Add
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {values.length === 0 ? (
          <span style={{ color: "#6b7280", fontSize: 13 }}>None selected</span>
        ) : (
          values.map((v) => (
            <span key={v} style={{ ...styles.badge }}>
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                style={{ marginLeft: 6, border: "none", background: "transparent" }}
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

/* ---------- STYLES (UNCHANGED) ---------- */

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
  filters: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  input: {
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

  checkboxList: {
    display: "grid",
    gap: 8,
    maxHeight: 220,
    overflowY: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 10,
    background: "#f9fafb",
  },

  checkboxRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    padding: "6px 8px",
    borderRadius: 8,
    cursor: "pointer",
  },
  staffBox: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    background: "#f9fafb",
    overflow: "hidden",
  },

  staffHeader: {
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 800,
    background: "#f3f4f6",
    borderBottom: "1px solid #e5e7eb",
    color: "#374151",
  },

  staffScroller: {
    maxHeight: 240,
    overflowY: "auto",
    padding: 8,
    display: "grid",
    gap: 6,
  },

  staffRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    padding: "8px 10px",
    borderRadius: 10,
    cursor: "pointer",
    background: "white",
    border: "1px solid #e5e7eb",
  },

  staffEmail: {
    fontWeight: 700,
    fontSize: 14,
  },

  staffName: {
    fontSize: 12,
    color: "#6b7280",
  },

  staffEmpty: {
    padding: 12,
    color: "#6b7280",
    fontSize: 13,
    textAlign: "center",
  },
  boxedField: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 10,
    background: "#f9fafb",
  },

};
