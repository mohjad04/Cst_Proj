// import React, { useEffect, useMemo, useState } from "react";
// import {
//   listTeams,
//   createTeam,
//   updateTeam,
//   deleteTeam,
//   toggleTeamActive,
// } from "../../services/agentsApi";
// import { listUsers } from "../../services/usersApi";
// import { listSkillsFromCategories } from "../../services/skillsApi";



// const SHIFT_OPTIONS = ["Day", "Night", "24/7"];
// const SAMPLE_ZONES = ["ZONE-R1-C1",
//   "ZONE-R1-C2",
//   "ZONE-R1-C3",
//   "ZONE-R1-C4",
//   "ZONE-R2-C1",
//   "ZONE-R2-C2",
//   "ZONE-R2-C3",
//   "ZONE-R2-C4",
//   "ZONE-R3-C1",
//   "ZONE-R3-C2",
//   "ZONE-R3-C3",
//   "ZONE-R3-C4"];
// // const SAMPLE_SKILLS = ["pothole", "asphalt_damage", "water_leak", "missed_trash", "street_light"];


// export default function Teams() {
//   const [teams, setTeams] = useState([]);
//   const [staff, setStaff] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const [q, setQ] = useState("");
//   const [status, setStatus] = useState("all");

//   const [toast, setToast] = useState("");
//   const [error, setError] = useState("");

//   const [teamModal, setTeamModal] = useState({ open: false, mode: "create", item: null });
//   const [skillsOptions, setSkillsOptions] = useState([]);

//   function showToast(msg) {
//     setToast(msg);
//     setTimeout(() => setToast(""), 2200);
//   }

//   async function load() {
//     setLoading(true);
//     setError("");
//     try {
//       const [t, u] = await Promise.all([
//         listTeams(),
//         listUsers({ role: "staff" }),
//       ]);
//       setTeams(t);
//       setStaff(u.filter(user => user.role === "staff"));
//     } catch (e) {
//       setError(e.message || "Failed to load");
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     load();

//     listSkillsFromCategories()
//       .then(setSkillsOptions)
//       .catch(console.error);
//   }, []);


//   const teamsFiltered = useMemo(() => {
//     const query = q.trim().toLowerCase();
//     return teams.filter((t) => {
//       if (status === "active" && !t.active) return false;
//       if (status === "disabled" && t.active) return false;
//       if (!query) return true;
//       return (
//         t.name.toLowerCase().includes(query) ||
//         (t.shift || "").toLowerCase().includes(query) ||
//         (t.zones || []).join(",").toLowerCase().includes(query) ||
//         (t.skills || [])
//           .map((v) => skillsOptions.find((s) => s.value === v)?.label || "")
//           .join(",")
//           .toLowerCase()
//           .includes(query)
//       );
//     });
//   }, [teams, q, status, skillsOptions]);

//   async function onToggleTeam(teamId) {
//     setError("");
//     try {
//       const updated = await toggleTeamActive(teamId);
//       setTeams((p) => p.map((x) => (x.id === teamId ? updated : x)));
//       showToast(updated.active ? "Team enabled" : "Team disabled");
//     } catch (e) {
//       setError(e.message || "Failed");
//     }
//   }

//   async function onDeleteTeam(teamId) {
//     if (!confirm("Delete this team?")) return;
//     setError("");
//     try {
//       await deleteTeam(teamId);
//       setTeams((p) => p.filter((t) => t.id !== teamId));
//       showToast("Team deleted");
//     } catch (e) {
//       setError(e.message || "Failed");
//     }
//   }

//   return (
//     <div style={{ display: "grid", gap: 12 }}>
//       <div style={styles.headerRow}>
//         <div>
//           <h1 style={{ margin: 0 }}>Teams</h1>
//           <div style={{ color: "#6b7280", marginTop: 6 }}>
//           </div>
//         </div>

//         <div style={{ display: "flex", gap: 10 }}>
//           <button
//             style={{ ...styles.btn, background: "#111827" }}
//             onClick={() => setTeamModal({ open: true, mode: "create", item: null })}
//           >
//             + Add Team
//           </button>
//           <button
//             style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }}
//             onClick={load}
//           >
//             Refresh
//           </button>
//         </div>
//       </div>

//       <div style={styles.card}>
//         <div style={styles.filters}>
//           <input
//             style={styles.input}
//             placeholder="Search teams..."
//             value={q}
//             onChange={(e) => setQ(e.target.value)}
//           />
//           <select
//             style={styles.input}
//             value={status}
//             onChange={(e) => setStatus(e.target.value)}
//           >
//             <option value="all">All status</option>
//             <option value="active">Active</option>
//             <option value="disabled">Disabled</option>
//           </select>
//         </div>
//       </div>

//       {error && (
//         <div style={{ ...styles.card, border: "1px solid #fecaca", background: "#fff1f2", color: "#991b1b" }}>
//           {error}
//         </div>
//       )}
//       {toast && (
//         <div style={{ ...styles.card, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534" }}>
//           {toast}
//         </div>
//       )}

//       <div style={styles.card}>
//         {loading ? (
//           <div style={{ padding: 12 }}>Loading…</div>
//         ) : (
//           <TeamsTable
//             rows={teamsFiltered}
//             staff={staff}
//             skillsOptions={skillsOptions}
//             onEdit={(t) => setTeamModal({ open: true, mode: "edit", item: t })}
//             onToggle={onToggleTeam}
//             onDelete={onDeleteTeam}
//           />

//         )}
//       </div>

//       {teamModal.open && (
//         <TeamModal
//           title={teamModal.mode === "create" ? "Add Team" : "Edit Team"}
//           submitLabel={teamModal.mode === "create" ? "Create" : "Save"}
//           staff={staff}
//           skillsOptions={skillsOptions}   // ✅ ADD THIS
//           initial={
//             teamModal.item || {
//               name: "",
//               members: [],
//               zones: [],
//               skills: [],
//               shift: "Day",
//             }
//           }
//           onClose={() => setTeamModal({ open: false, mode: "create", item: null })}
//           onSubmit={async (payload) => {
//             setError("");
//             try {
//               if (teamModal.mode === "create") {
//                 const created = await createTeam(payload);
//                 setTeams(p => [normalizeTeam(created, staff), ...p]);

//                 showToast("Team created");
//               } else {
//                 const updated = await updateTeam(teamModal.item.id, payload);
//                 setTeams(p =>
//                   p.map(t =>
//                     t.id === updated.id ? normalizeTeam(updated, staff) : t
//                   )
//                 );

//                 showToast("Team updated");
//               }
//               setTeamModal({ open: false, mode: "create", item: null });
//             } catch (e) {
//               setError(e.message || "Failed");
//             }
//           }}
//         />
//       )}
//     </div>
//   );
// }

// /* ---------- TABLE ---------- */

// function TeamsTable({ rows, staff, skillsOptions, onEdit, onToggle, onDelete }) {
//   const emailOf = (id) => staff.find((u) => u.id === id)?.email || "—";

//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={styles.table}>
//         <thead>
//           <tr>
//             <th style={styles.th}>Team</th>
//             <th style={styles.th}>Members</th>
//             <th style={styles.th}>Zones</th>
//             <th style={styles.th}>Skills</th>
//             <th style={styles.th}>Shift</th>
//             <th style={styles.th}>Status</th>
//             <th style={styles.th}></th>
//           </tr>
//         </thead>
//         <tbody>
//           {rows.map((t) => (
//             <tr key={t.id}>
//               <td style={styles.td}>
//                 <div style={{ fontWeight: 800 }}>{t.name}</div>
//               </td>
//               <td style={styles.td}>
//                 {(t.members || []).length === 0 ? (
//                   "—"
//                 ) : (
//                   t.members.map((m) => (
//                     <div key={m.id}>
//                       {m.email || m.full_name || "—"}
//                     </div>
//                   ))
//                 )}
//               </td>

//               <td style={styles.td}>{(t.zones || []).join(", ") || "—"}</td>
//               <td style={styles.td}>
//                 {(t.skills || [])
//                   .map(
//                     (v) =>
//                       skillsOptions.find((s) => s.value === v)?.label || v
//                   )
//                   .join(", ") || "—"}
//               </td>
//               <td style={styles.td}>
//                 <span style={styles.badge}>{t.shift}</span>
//               </td>
//               <td style={styles.td}>
//                 <span
//                   style={{
//                     ...styles.badge,
//                     background: t.active ? "#ecfeff" : "#fef2f2",
//                     borderColor: t.active ? "#a5f3fc" : "#fecaca",
//                   }}
//                 >
//                   {t.active ? "Active" : "Disabled"}
//                 </span>
//               </td>
//               <td style={styles.td}>
//                 <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
//                   <button
//                     style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }}
//                     onClick={() => onEdit(t)}
//                   >
//                     Edit
//                   </button>
//                   <button
//                     style={{ ...styles.btn, background: t.active ? "#fee2e2" : "#dcfce7", color: "#111827" }}
//                     onClick={() => onToggle(t.id)}
//                   >
//                     {t.active ? "Disable" : "Enable"}
//                   </button>
//                   <button
//                     style={{ ...styles.btn, background: "#111827" }}
//                     onClick={() => onDelete(t.id)}
//                   >
//                     Delete
//                   </button>
//                 </div>
//               </td>
//             </tr>
//           ))}
//           {rows.length === 0 && (
//             <tr>
//               <td colSpan={7} style={styles.td}>
//                 <div style={{ padding: 12, color: "#6b7280" }}>No teams found.</div>
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// /* ---------- MODAL ---------- */

// function TeamModal({
//   title,
//   submitLabel,
//   initial,
//   staff,
//   skillsOptions,   // ✅ ADD THIS
//   onClose,
//   onSubmit
// }) {
//   const [name, setName] = useState(initial.name);
//   const [members, setMembers] = useState(
//     (initial.members || []).map(m => typeof m === "string" ? m : m.id)
//   );
//   const [zones, setZones] = useState(initial.zones);
//   const [skills, setSkills] = useState(initial.skills);
//   const [shift, setShift] = useState(initial.shift);
//   const [busy, setBusy] = useState(false);
//   const [err, setErr] = useState("");

//   async function handleSubmit(e) {
//     e.preventDefault();
//     setErr("");
//     if (!name.trim()) return setErr("Team name is required");
//     if (!members.length) return setErr("Select at least one staff member");

//     setBusy(true);
//     try {
//       await onSubmit({ name, members: members.map(m => typeof m === "string" ? m : m.id), zones, skills, shift });
//     } catch (e2) {
//       setErr(e2.message || "Failed");
//     } finally {
//       setBusy(false);
//     }
//   }

//   return (
//     <div style={styles.modalOverlay} onMouseDown={onClose}>
//       <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
//         <Header title={title} onClose={onClose} />
//         <form onSubmit={handleSubmit} style={styles.form}>
//           <Field label="Team name">
//             <div style={styles.boxedField}>
//               <input
//                 style={{ ...styles.input, width: "100%" }}
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 placeholder="Enter team name"
//               />
//             </div>
//           </Field>

//           <Field label="Shift">
//             <div style={styles.boxedField}>
//               <select
//                 style={{ ...styles.input, width: "100%" }}
//                 value={shift}
//                 onChange={(e) => setShift(e.target.value)}
//               >
//                 {SHIFT_OPTIONS.map((s) => (
//                   <option key={s} value={s}>{s}</option>
//                 ))}
//               </select>
//             </div>
//           </Field>

//           <Field label="Coverage zones">
//             <div style={styles.boxedField}>
//               <ZoneMultiSelect
//                 options={SAMPLE_ZONES}
//                 values={zones}
//                 onChange={setZones}
//               />
//             </div>
//           </Field>

//           <Field label="Skill tags">

//             <div style={styles.boxedField}>

//               <SkillMultiSelect
//                 options={skillsOptions}
//                 values={skills}
//                 onChange={setSkills}
//               />
//             </div>
//           </Field>


//           <Field label="Team members (staff)">
//             <div style={styles.staffBox}>
//               <div style={styles.staffHeader}>
//                 Select staff members ({members.length} selected)
//               </div>

//               <div style={styles.staffScroller}>
//                 {staff.length === 0 && (
//                   <div style={styles.staffEmpty}>
//                     No staff users available
//                   </div>
//                 )}

//                 {staff.map((u) => (
//                   <label key={u.id} style={styles.staffRow}>
//                     <input
//                       type="checkbox"
//                       checked={members.includes(u.id)}
//                       onChange={(e) => {
//                         if (e.target.checked) {
//                           setMembers([...members, u.id]);
//                         } else {
//                           setMembers(members.filter((id) => id !== u.id));
//                         }
//                       }}
//                     />

//                     <div>
//                       <div style={styles.staffEmail}>
//                         {u.email || u.contacts?.email || "—"}
//                       </div>

//                       {u.full_name && (
//                         <div style={styles.staffName}>
//                           {u.full_name}
//                         </div>
//                       )}
//                     </div>

//                   </label>
//                 ))}
//               </div>
//             </div>
//           </Field>



//           {err && <ErrorBox text={err} />}
//           <FooterButtons onClose={onClose} busy={busy} submitLabel={submitLabel} />
//         </form>
//       </div>
//     </div>
//   );
// }

// /* ---------- UI HELPERS (UNCHANGED STYLE) ---------- */

// function Header({ title, onClose }) {
//   return (
//     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//       <h2 style={{ margin: 0 }}>{title}</h2>
//       <button style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }} onClick={onClose}>
//         ✕
//       </button>
//     </div>
//   );
// }

// function Field({ label, children }) {
//   return (
//     <div>
//       <label style={styles.label}>{label}</label>
//       {children}
//     </div>
//   );
// }

// function FooterButtons({ onClose, busy, submitLabel }) {
//   return (
//     <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
//       <button
//         type="button"
//         style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }}
//         onClick={onClose}
//       >
//         Cancel
//       </button>
//       <button type="submit" style={{ ...styles.btn, background: "#111827" }} disabled={busy}>
//         {busy ? "Saving..." : submitLabel}
//       </button>
//     </div>
//   );
// }

// function ErrorBox({ text }) {
//   return (
//     <div style={{ ...styles.card, border: "1px solid #fecaca", background: "#fff1f2", color: "#991b1b" }}>
//       {text}
//     </div>
//   );
// }

// function SkillMultiSelect({ options, values, onChange }) {
//   const [input, setInput] = useState("");

//   function add() {
//     const v = input.trim();
//     if (!v || values.includes(v)) return;
//     onChange([...values, v]);
//     setInput("");
//   }

//   function remove(v) {
//     onChange(values.filter((x) => x !== v));
//   }

//   return (
//     <div style={{ display: "grid", gap: 8 }}>
//       <div style={{ display: "flex", gap: 8 }}>
//         <input
//           style={{ ...styles.input, flex: 1 }}
//           placeholder="Type or select skill…"
//           list="skills-list"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyDown={(e) => {
//             if (e.key === "Enter") {
//               e.preventDefault();
//               add();
//             }
//           }}
//         />

//         <datalist id="skills-list">
//           {options.map((s) => (
//             <option key={s.value} value={s.label}>
//               {s.label}
//             </option>
//           ))}
//         </datalist>


//         <button
//           type="button"
//           style={{ ...styles.btn, background: "#111827" }}
//           onClick={add}
//         >
//           Add
//         </button>
//       </div>

//       <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//         {values.length === 0 ? (
//           <span style={{ color: "#6b7280", fontSize: 13 }}>None selected</span>
//         ) : (
//           values.map((v) => (
//             <span key={v} style={{ ...styles.badge }}>
//               {v}
//               <button
//                 type="button"
//                 onClick={() => remove(v)}
//                 style={{ marginLeft: 6, border: "none", background: "transparent" }}
//               >
//                 ✕
//               </button>
//             </span>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }
// function ZoneMultiSelect({ options, values, onChange }) {
//   const [input, setInput] = useState("");

//   function add() {
//     const v = input.trim();
//     if (!v || values.includes(v)) return;
//     onChange([...values, v]);
//     setInput("");
//   }

//   function remove(v) {
//     onChange(values.filter((x) => x !== v));
//   }

//   return (
//     <div style={{ display: "grid", gap: 8 }}>
//       <div style={{ display: "flex", gap: 8 }}>
//         <input
//           style={{ ...styles.input, flex: 1 }}
//           placeholder="Type or select zone…"
//           list="zones-list"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyDown={(e) => {
//             if (e.key === "Enter") {
//               e.preventDefault();
//               add();
//             }
//           }}
//         />

//         <datalist id="zones-list">
//           {options.map((z) => (
//             <option key={z} value={z} />
//           ))}
//         </datalist>

//         <button
//           type="button"
//           style={{ ...styles.btn, background: "#111827" }}
//           onClick={add}
//         >
//           Add
//         </button>
//       </div>

//       <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//         {values.length === 0 ? (
//           <span style={{ color: "#6b7280", fontSize: 13 }}>None selected</span>
//         ) : (
//           values.map((v) => (
//             <span key={v} style={{ ...styles.badge }}>
//               {v}
//               <button
//                 type="button"
//                 onClick={() => remove(v)}
//                 style={{ marginLeft: 6, border: "none", background: "transparent" }}
//               >
//                 ✕
//               </button>
//             </span>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// function normalizeTeam(team, staff) {
//   return {
//     ...team,
//     members: (team.members || []).map(m => {
//       const id = typeof m === "string" ? m : m.id;
//       const u = staff.find(s => s.id === id);

//       return {
//         id,
//         email: u?.email || u?.contacts?.email || null,
//         full_name: u?.full_name || null,
//       };
//     })
//   };
// }


// /* ---------- STYLES (UNCHANGED) ---------- */

// const styles = {
//   headerRow: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "start",
//     gap: 12,
//     flexWrap: "wrap",
//   },
//   card: {
//     background: "white",
//     borderRadius: 14,
//     padding: 14,
//     boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
//     border: "1px solid rgba(17,24,39,0.06)",
//   },
//   filters: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
//   input: {
//     padding: "10px 12px",
//     borderRadius: 10,
//     border: "1px solid #e5e7eb",
//     outline: "none",
//     minWidth: 220,
//   },
//   btn: {
//     border: "none",
//     padding: "10px 14px",
//     borderRadius: 10,
//     color: "white",
//     cursor: "pointer",
//     fontWeight: 700,
//   },
//   table: { width: "100%", borderCollapse: "collapse" },
//   th: { textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #e5e7eb", color: "#374151", fontSize: 13 },
//   td: { padding: "10px 8px", borderBottom: "1px solid #e5e7eb", fontSize: 14, verticalAlign: "top" },
//   badge: {
//     display: "inline-flex",
//     alignItems: "center",
//     padding: "4px 10px",
//     borderRadius: 999,
//     fontSize: 12,
//     background: "#eef2ff",
//     border: "1px solid #e0e7ff",
//   },
//   modalOverlay: {
//     position: "fixed",
//     inset: 0,
//     background: "rgba(0,0,0,0.4)",
//     display: "grid",
//     placeItems: "center",
//     padding: 16,
//     zIndex: 999,
//   },
//   modalCard: {
//     width: "min(640px, 100%)",
//     background: "white",
//     borderRadius: 14,
//     padding: 16,
//     boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
//   },
//   form: { marginTop: 12, display: "grid", gap: 10 },
//   label: { fontSize: 13, color: "#374151", fontWeight: 700, display: "block", marginBottom: 6 },

//   checkboxList: {
//     display: "grid",
//     gap: 8,
//     maxHeight: 220,
//     overflowY: "auto",
//     border: "1px solid #e5e7eb",
//     borderRadius: 10,
//     padding: 10,
//     background: "#f9fafb",
//   },

//   checkboxRow: {
//     display: "flex",
//     gap: 10,
//     alignItems: "flex-start",
//     padding: "6px 8px",
//     borderRadius: 8,
//     cursor: "pointer",
//   },
//   staffBox: {
//     border: "1px solid #e5e7eb",
//     borderRadius: 12,
//     background: "#f9fafb",
//     overflow: "hidden",
//   },

//   staffHeader: {
//     padding: "8px 12px",
//     fontSize: 13,
//     fontWeight: 800,
//     background: "#f3f4f6",
//     borderBottom: "1px solid #e5e7eb",
//     color: "#374151",
//   },

//   staffScroller: {
//     maxHeight: 240,
//     overflowY: "auto",
//     padding: 8,
//     display: "grid",
//     gap: 6,
//   },

//   staffRow: {
//     display: "flex",
//     gap: 10,
//     alignItems: "flex-start",
//     padding: "8px 10px",
//     borderRadius: 10,
//     cursor: "pointer",
//     background: "white",
//     border: "1px solid #e5e7eb",
//   },

//   staffEmail: {
//     fontWeight: 700,
//     fontSize: 14,
//   },

//   staffName: {
//     fontSize: 12,
//     color: "#6b7280",
//   },

//   staffEmpty: {
//     padding: 12,
//     color: "#6b7280",
//     fontSize: 13,
//     textAlign: "center",
//   },
//   boxedField: {
//     border: "1px solid #e5e7eb",
//     borderRadius: 12,
//     padding: 10,
//     background: "#f9fafb",
//   },

// };
// src/pages/admin/Teams.jsx
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

const SAMPLE_ZONES = [
  "ZONE-R1-C1",
  "ZONE-R1-C2",
  "ZONE-R1-C3",
  "ZONE-R1-C4",
  "ZONE-R2-C1",
  "ZONE-R2-C2",
  "ZONE-R2-C3",
  "ZONE-R2-C4",
  "ZONE-R3-C1",
  "ZONE-R3-C2",
  "ZONE-R3-C3",
  "ZONE-R3-C4",
];

const SHIFT_FILTERS = [
  { value: "all", label: "All shifts" },
  { value: "Day", label: "Day" },
  { value: "Night", label: "Night" },
  { value: "24/7", label: "24/7" },
];

/* ----------------------------- small helpers ----------------------------- */
const isArr = (v) => Array.isArray(v);
const clampText = (s) => String(s ?? "").trim();

function Icon({ name, style }) {
  const common = { width: 16, height: 16, display: "inline-block", ...style };
  if (name === "search")
    return (
      <svg viewBox="0 0 24 24" style={common} fill="none">
        <path d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" />
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
        <path d="M20 12a8 8 0 1 1-2.34-5.66" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
  if (name === "toggle")
    return (
      <svg viewBox="0 0 24 24" style={common} fill="none">
        <path d="M7 7h10a5 5 0 0 1 0 10H7A5 5 0 0 1 7 7Z" stroke="currentColor" strokeWidth="2" />
        <path d="M17 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  if (name === "edit")
    return (
      <svg viewBox="0 0 24 24" style={common} fill="none">
        <path
          d="M4 20h4l10.5-10.5a2 2 0 0 0 0-3L16.5 4a2 2 0 0 0-3 0L3 14.5V20Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  if (name === "chevDown")
    return (
      <svg viewBox="0 0 24 24" style={common} fill="none">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (name === "chevUp")
    return (
      <svg viewBox="0 0 24 24" style={common} fill="none">
        <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
        : variant === "neutral"
          ? styles.btnNeutral
          : variant === "soft"
            ? styles.btnSoft
            : styles.btnNeutral;

  return (
    <button type="button" {...props} style={{ ...styles.btn, ...v, ...style }}>
      {children}
    </button>
  );
}

function Chip({ children, tone = "neutral" }) {
  const toneStyle =
    tone === "blue" ? styles.chipBlue : tone === "green" ? styles.chipGreen : tone === "amber" ? styles.chipAmber : styles.chipNeutral;
  return <span style={{ ...styles.chip, ...toneStyle }}>{children}</span>;
}

function TeamAvatar({ name }) {
  const letter = (name || "T").trim().charAt(0).toUpperCase() || "T";
  return (
    <div style={styles.avatar}>
      <span style={styles.avatarText}>{letter}</span>
    </div>
  );
}

function normalizeTeam(team, staff) {
  const st = isArr(staff) ? staff : [];
  return {
    ...team,
    members: (team?.members || []).map((m) => {
      const id = typeof m === "string" ? m : m?.id;
      const u = st.find((s) => s.id === id);
      return {
        id,
        email: u?.email || u?.contacts?.email || m?.email || null,
        full_name: u?.full_name || m?.full_name || null,
      };
    }),
  };
}

function labelForSkill(options, value) {
  const opt = (options || []).find((s) => s.value === value);
  return opt?.label || value;
}

/* ================================ PAGE ================================ */

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [staff, setStaff] = useState([]);
  const [skillsOptions, setSkillsOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");

  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const [expandedMembers, setExpandedMembers] = useState(() => new Set());
  const [expandedZones, setExpandedZones] = useState(() => new Set());
  const [expandedSkills, setExpandedSkills] = useState(() => new Set());
  const [teamModal, setTeamModal] = useState({ open: false, mode: "create", item: null });

  function showToast(msg) {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(""), 2200);
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [t, u] = await Promise.all([listTeams(), listUsers({ role: "staff" })]);
      const staffOnly = (isArr(u) ? u : []).filter((user) => user.role === "staff");
      const teamsRaw = isArr(t) ? t : [];
      setStaff(staffOnly);
      setTeams(teamsRaw.map((x) => normalizeTeam(x, staffOnly)));
      // keep expanded state, but remove ids that no longer exist
      const alive = new Set((isArr(t) ? t : []).map((x) => x.id));
      const clean = (setter) =>
        setter((prev) => {
          const next = new Set();
          prev.forEach((id) => alive.has(id) && next.add(id));
          return next;
        });

      clean(setExpandedMembers);
      clean(setExpandedZones);
      clean(setExpandedSkills);

    } catch (e) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    listSkillsFromCategories().then((x) => setSkillsOptions(isArr(x) ? x : [])).catch(console.error);
  }, []);

  const stats = useMemo(() => {
    const total = teams.length;
    const active = teams.filter((t) => !!t.active).length;
    const disabled = total - active;
    return { total, active, disabled };
  }, [teams]);

  const teamsFiltered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return teams.filter((t) => {
      if (status === "active" && !t.active) return false;
      if (status === "disabled" && t.active) return false;
      if (shiftFilter !== "all" && (t.shift || "") !== shiftFilter) return false;

      if (!query) return true;

      const name = String(t.name || "").toLowerCase();
      const shift = String(t.shift || "").toLowerCase();
      const zones = (t.zones || []).join(",").toLowerCase();
      const skills = (t.skills || []).map((v) => labelForSkill(skillsOptions, v)).join(",").toLowerCase();
      const members = (t.members || []).map((m) => String(m?.email || m?.full_name || "").toLowerCase()).join(",");

      return name.includes(query) || shift.includes(query) || zones.includes(query) || skills.includes(query) || members.includes(query);
    });
  }, [teams, q, status, shiftFilter, skillsOptions]);

  async function onToggleTeam(teamId) {
    setError("");
    try {
      const updated = await toggleTeamActive(teamId);
      setTeams((p) => p.map((x) => (x.id === teamId ? normalizeTeam(updated, staff) : x)));
      showToast(updated.active ? "Team enabled" : "Team disabled");
    } catch (e) {
      setError(e?.message || "Failed");
    }
  }

  async function onDeleteTeam(teamId) {
    if (!confirm("Delete this team?")) return;
    setError("");
    try {
      await deleteTeam(teamId);
      setTeams((p) => p.filter((t) => t.id !== teamId));
      setExpandedMembers((p) => { const n = new Set(p); n.delete(teamId); return n; });
      setExpandedZones((p) => { const n = new Set(p); n.delete(teamId); return n; });
      setExpandedSkills((p) => { const n = new Set(p); n.delete(teamId); return n; });

      showToast("Team deleted");
    } catch (e) {
      setError(e?.message || "Failed");
    }
  }

  function toggleExpandMembers(teamId) {
    setExpandedMembers((prev) => {
      const next = new Set(prev);
      next.has(teamId) ? next.delete(teamId) : next.add(teamId);
      return next;
    });
  }
  function toggleExpandZones(teamId) {
    setExpandedZones((prev) => {
      const next = new Set(prev);
      next.has(teamId) ? next.delete(teamId) : next.add(teamId);
      return next;
    });
  }
  function toggleExpandSkills(teamId) {
    setExpandedSkills((prev) => {
      const next = new Set(prev);
      next.has(teamId) ? next.delete(teamId) : next.add(teamId);
      return next;
    });
  }


  return (
    <div style={styles.page}>
      {/* top actions */}
      <div style={styles.actionsRow}>
        <div style={styles.actionsLeft}>
          <Chip Chip tone="blue">{stats.total} teams</Chip>
          <Chip tone="neutral">{stats.active} active</Chip>
          <Chip tone="neutral">{stats.disabled} disabled</Chip>
        </div>

        <div style={styles.actionsRight}>
          <Button variant="primary" onClick={() => setTeamModal({ open: true, mode: "create", item: null })}>
            <span style={styles.btnIcon}>
              <Icon name="plus" />
            </span>
            Add Team
          </Button>

          <Button variant="neutral" onClick={load} disabled={loading}>
            <span style={styles.btnIcon}>
              <Icon name="refresh" />
            </span>
            Refresh
          </Button>
        </div>
      </div>

      {/* alerts */}
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

      {/* filters */}
      <div style={styles.card}>
        <div style={styles.cardHead}>
          <div>
            <div style={styles.cardTitle}>Search Teams</div>
            <div style={styles.cardSub}>
              Showing {teamsFiltered.length} of {teams.length} teams
            </div>
          </div>
        </div>

        <div style={styles.cardBody}>
          <div style={styles.filtersRow}>
            <div style={styles.searchWrap}>
              <span style={styles.searchIcon}>
                <Icon name="search" />
              </span>
              <input
                style={styles.searchInput}
                placeholder="Search team name, member, zone, skill…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <select style={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>

            <select style={styles.select} value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value)}>
              {SHIFT_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* table */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.loadingBox}>Loading teams…</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: 270 }}>Team</th>
                  <th style={styles.th}>Members</th>
                  <th style={styles.th}>Zones</th>
                  <th style={styles.th}>Skills</th>
                  <th style={{ ...styles.th, width: 120 }}>Shift</th>
                  <th style={{ ...styles.th, width: 140 }}>Status</th>
                  <th style={{ ...styles.th, width: 310, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {teamsFiltered.map((t) => {
                  const members = isArr(t.members) ? t.members : [];
                  const count = members.length;
                  const isMembersOpen = expandedMembers.has(t.id);
                  const isZonesOpen = expandedZones.has(t.id);
                  const isSkillsOpen = expandedSkills.has(t.id);
                  const isOpen = isMembersOpen || isZonesOpen || isSkillsOpen;


                  const zonesArr = isArr(t.zones) ? t.zones : [];
                  const skillsArr = isArr(t.skills) ? t.skills.map((v) => labelForSkill(skillsOptions, v)) : [];


                  const skillsText =
                    (t.skills || []).map((v) => labelForSkill(skillsOptions, v)).join(", ") || "—";

                  const zonesText = (t.zones || []).join(", ") || "—";

                  return (
                    <tr key={t.id} style={{ ...styles.tr, ...(isOpen ? styles.trExpanded : null) }}>
                      <td style={styles.td}>
                        <div style={styles.teamCell}>
                          <TeamAvatar name={t.name} />
                          <div style={{ minWidth: 0 }}>
                            <div style={styles.teamName} title={t.name}>
                              {t.name}
                            </div>
                            <div style={styles.teamMeta}>ID: {t.id}</div>
                          </div>
                        </div>
                      </td>

                      <td style={styles.td}>
                        {count === 0 ? (
                          <span style={styles.muted}>—</span>
                        ) : (
                          <div style={styles.membersBlock}>
                            <div style={{ ...styles.stackList, ...(isMembersOpen ? styles.stackOpen : styles.stackClosed) }}>
                              {(isMembersOpen ? members : members.slice(0, 2)).map((m) => (
                                <div key={m.id} style={styles.stackLine} title={m.email || m.full_name || ""}>
                                  {m.email || m.full_name || "—"}
                                </div>
                              ))}
                            </div>

                            {members.length > 2 && (
                              <button type="button" onClick={() => toggleExpandMembers(t.id)} style={styles.moreBtn}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                  {isMembersOpen ? "Show less" : `+${members.length - 2} more`}
                                  <Icon name={isMembersOpen ? "chevUp" : "chevDown"} style={{ opacity: 0.85 }} />
                                </span>
                              </button>
                            )}
                          </div>

                        )}
                      </td>

                      <td style={styles.td}>
                        {zonesArr.length === 0 ? (
                          <span style={styles.muted}>—</span>
                        ) : (
                          <div style={styles.membersBlock}>
                            <div style={{ ...styles.stackList, ...(isZonesOpen ? styles.stackOpen : styles.stackClosed) }}>
                              {(isZonesOpen ? zonesArr : zonesArr.slice(0, 2)).map((z) => (
                                <div key={z} style={styles.stackLine} title={z}>
                                  {z}
                                </div>
                              ))}
                            </div>

                            {zonesArr.length > 2 && (
                              <button type="button" onClick={() => toggleExpandZones(t.id)} style={styles.moreBtn}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                  {isZonesOpen ? "Show less" : `+${zonesArr.length - 2} more`}
                                  <Icon name={isZonesOpen ? "chevUp" : "chevDown"} style={{ opacity: 0.85 }} />
                                </span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>


                      <td style={styles.td}>
                        {skillsArr.length === 0 ? (
                          <span style={styles.muted}>—</span>
                        ) : (
                          <div style={styles.membersBlock}>
                            <div style={{ ...styles.stackList, ...(isSkillsOpen ? styles.stackOpen : styles.stackClosed) }}>
                              {(isSkillsOpen ? skillsArr : skillsArr.slice(0, 2)).map((s) => (
                                <div key={s} style={styles.stackLine} title={s}>
                                  {s}
                                </div>
                              ))}
                            </div>

                            {skillsArr.length > 2 && (
                              <button type="button" onClick={() => toggleExpandSkills(t.id)} style={styles.moreBtn}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                  {isSkillsOpen ? "Show less" : `+${skillsArr.length - 2} more`}
                                  <Icon name={isSkillsOpen ? "chevUp" : "chevDown"} style={{ opacity: 0.85 }} />
                                </span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>


                      <td style={styles.td}>
                        <span style={{ ...styles.pill, ...styles.shiftPill }}>{t.shift || "—"}</span>
                      </td>

                      <td style={styles.td}>
                        <span style={{ ...styles.pill, ...(t.active ? styles.statusActive : styles.statusDisabled) }}>
                          {t.active ? "Active" : "Disabled"}
                        </span>
                      </td>

                      <td style={{ ...styles.td, textAlign: "right" }}>
                        <div style={styles.actions}>
                          <Button variant="soft" onClick={() => setTeamModal({ open: true, mode: "edit", item: t })}>
                            <span style={styles.btnIcon}>
                              <Icon name="edit" />
                            </span>
                            Edit
                          </Button>

                          <Button variant="neutral" onClick={() => onToggleTeam(t.id)}>
                            <span style={styles.btnIcon}>
                              <Icon name="toggle" />
                            </span>
                            {t.active ? "Disable" : "Enable"}
                          </Button>

                          <Button variant="danger" onClick={() => onDeleteTeam(t.id)}>
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

                {teamsFiltered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={styles.emptyTd}>
                      <div style={styles.emptyBox}>
                        <div style={styles.emptyTitle}>No teams found</div>
                        <div style={styles.emptyText}>Try changing the search or filters.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* modal */}
      {teamModal.open && (
        <TeamModal
          title={teamModal.mode === "create" ? "Add Team" : "Edit Team"}
          submitLabel={teamModal.mode === "create" ? "Create" : "Save"}
          staff={staff}
          skillsOptions={skillsOptions}
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
                setTeams((p) => [normalizeTeam(created, staff), ...p]);
                showToast("Team created");
              } else {
                const updated = await updateTeam(teamModal.item.id, payload);
                setTeams((p) => p.map((x) => (x.id === updated.id ? normalizeTeam(updated, staff) : x)));
                showToast("Team updated");
              }
              setTeamModal({ open: false, mode: "create", item: null });
            } catch (e) {
              setError(e?.message || "Failed");
            }
          }}
        />
      )}
    </div>
  );
}

/* ================================ MODAL ================================ */

function TeamModal({ title, submitLabel, initial, staff, skillsOptions, onClose, onSubmit }) {
  const [name, setName] = useState(initial.name);
  const [members, setMembers] = useState((initial.members || []).map((m) => (typeof m === "string" ? m : m.id)));
  const [zones, setZones] = useState(initial.zones || []);
  const [skills, setSkills] = useState(initial.skills || []);
  const [shift, setShift] = useState(initial.shift || "Day");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [staffQuery, setStaffQuery] = useState("");

  const staffFiltered = useMemo(() => {
    const q = staffQuery.trim().toLowerCase();
    const arr = isArr(staff) ? staff : [];
    if (!q) return arr;
    return arr.filter((u) => {
      const em = String(u.email || u.contacts?.email || "").toLowerCase();
      const nm = String(u.full_name || "").toLowerCase();
      return em.includes(q) || nm.includes(q);
    });
  }, [staff, staffQuery]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!clampText(name)) return setErr("Team name is required");
    if (!members.length) return setErr("Select at least one staff member");

    setBusy(true);
    try {
      // ✅ payload shape unchanged
      await onSubmit({ name: clampText(name), members, zones, skills, shift });
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
            <div style={styles.modalSub}>Configure members, zones, skills, and shift.</div>
          </div>
          <button style={styles.modalClose} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.modalForm}>
          <div style={styles.modalGrid}>
            {/* Left column */}
            <div style={styles.modalCol}>
              <div style={styles.modalSection}>
                <div style={styles.sectionTitle}>Basics</div>

                <label style={styles.label}>Team name</label>
                <input
                  style={styles.field}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter team name"
                />

                <div style={{ height: 10 }} />

                <label style={styles.label}>Shift</label>
                <select style={styles.field} value={shift} onChange={(e) => setShift(e.target.value)}>
                  {SHIFT_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.modalSection}>
                <div style={styles.sectionTitle}>Coverage</div>

                <label style={styles.label}>Zones</label>
                <ZoneMultiSelect options={SAMPLE_ZONES} values={zones} onChange={setZones} />

                <div style={{ height: 12 }} />

                <label style={styles.label}>Skills</label>
                {/* ✅ no IDs shown: searchable suggestions by label, stored value = option.value */}
                <SkillPicker options={skillsOptions} values={skills} onChange={setSkills} />
              </div>
            </div>

            {/* Right column */}
            <div style={styles.modalCol}>
              <div style={styles.modalSection}>
                <div style={styles.sectionTitle}>Team Members</div>

                <div style={styles.staffTopRow}>
                  <div style={styles.staffCountPill}>
                    {members.length} selected
                  </div>
                  <div style={styles.staffSearchWrap}>
                    <span style={styles.staffSearchIcon}>
                      <Icon name="search" />
                    </span>
                    <input
                      style={styles.staffSearchInput}
                      placeholder="Search staff…"
                      value={staffQuery}
                      onChange={(e) => setStaffQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div style={styles.staffScroller}>
                  {staffFiltered.length === 0 ? (
                    <div style={styles.staffEmpty}>No staff users found</div>
                  ) : (
                    staffFiltered.map((u) => {
                      const checked = members.includes(u.id);
                      return (
                        <label key={u.id} style={{ ...styles.staffRow, ...(checked ? styles.staffRowOn : null) }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) setMembers((p) => [...p, u.id]);
                              else setMembers((p) => p.filter((id) => id !== u.id));
                            }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={styles.staffEmail} title={u.email || u.contacts?.email || ""}>
                              {u.email || u.contacts?.email || "—"}
                            </div>
                            {u.full_name && <div style={styles.staffName}>{u.full_name}</div>}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {err && (
            <div style={{ ...styles.alert, ...styles.alertError }}>
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

/* ============================ Skill Picker ============================ */
/** Shows ONLY labels in suggestions + chips, stores value in `values` */
function SkillPicker({ options, values, onChange }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const opts = isArr(options) ? options : [];
  const selected = new Set(values);

  const suggestions = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return opts.slice(0, 8);
    return opts
      .filter((o) => String(o.label || "").toLowerCase().includes(s))
      .slice(0, 10);
  }, [opts, q]);

  function addByValue(v) {
    if (!v || selected.has(v)) return;
    onChange([...values, v]);
    setQ("");
    setOpen(false);
  }

  function remove(v) {
    onChange(values.filter((x) => x !== v));
  }

  return (
    <div style={{ display: "grid", gap: 8, position: "relative" }}>
      <div style={styles.pickerRow}>
        <div style={styles.pickerInputWrap}>
          <input
            style={styles.pickerInput}
            placeholder="Search skills…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              // small delay to allow click on suggestion
              window.setTimeout(() => setOpen(false), 120);
            }}
          />
          <button
            type="button"
            style={styles.pickerBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpen((p) => !p)}
            aria-label="Toggle suggestions"
          >
            <Icon name="chevDown" />
          </button>
        </div>

        <Button
          variant="primary"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            // if user typed exact label, convert to value; else do nothing (avoid saving label as value)
            const exact = opts.find((o) => String(o.label).toLowerCase() === q.trim().toLowerCase());
            if (exact) addByValue(exact.value);
          }}
          style={{ height: 44 }}
        >
          Add
        </Button>
      </div>

      {open && suggestions.length > 0 && (
        <div style={styles.suggestBox}>
          {suggestions.map((o) => {
            const already = selected.has(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addByValue(o.value)}
                style={{ ...styles.suggestItem, ...(already ? styles.suggestItemOn : null) }}
                disabled={already}
                title={o.label}
              >
                <div style={styles.suggestLabel}>{o.label}</div>
                {already && <div style={styles.suggestHint}>Added</div>}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {values.length === 0 ? (
          <span style={styles.muted}>None selected</span>
        ) : (
          values.map((v) => (
            <span key={v} style={styles.pill}>
              {labelForSkill(opts, v)}
              <button type="button" onClick={() => remove(v)} style={styles.pillX} aria-label="Remove skill">
                ✕
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}

/* ============================ Zones Multi ============================ */

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
      <div style={styles.pickerRow}>
        <div style={styles.pickerInputWrap}>
          <input
            style={styles.pickerInput}
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
        </div>
        <Button variant="primary" onClick={add} style={{ height: 44 }}>
          Add
        </Button>
      </div>

      <datalist id="zones-list">
        {options.map((z) => (
          <option key={z} value={z} />
        ))}
      </datalist>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {values.length === 0 ? (
          <span style={styles.muted}>None selected</span>
        ) : (
          values.map((v) => (
            <span key={v} style={styles.pill}>
              {v}
              <button type="button" onClick={() => remove(v)} style={styles.pillX} aria-label="Remove zone">
                ✕
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}

/* ================================ STYLES ================================ */

const styles = {
  page: { display: "grid", gap: 10, padding: 0 },

  actionsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  actionsLeft: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  actionsRight: { display: "flex", gap: 10, alignItems: "center" },

  card: {
    background: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,0.08)",
    boxShadow: "0 12px 26px rgba(2,6,23,0.06)",
    backdropFilter: "blur(10px)",
    overflow: "hidden",
  },
  cardHead: {
    padding: 12,
    borderBottom: "1px solid rgba(15,23,42,0.06)",
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: { fontSize: 13, fontWeight: 950, color: "#0f172a" },
  cardSub: { marginTop: 2, fontSize: 12, color: "#64748b" },
  cardBody: { padding: 12 },

  filtersRow: {
    display: "grid",
    gridTemplateColumns: "1fr 220px 220px",
    gap: 10,
    alignItems: "center",
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
    whiteSpace: "nowrap",
  },

  tr: { height: 74 },
  trExpanded: { height: "auto" },

  td: {
    padding: "12px 14px",
    borderBottom: "1px solid rgba(15,23,42,0.06)",
    fontSize: 14,
    color: "#0f172a",
    verticalAlign: "middle",
  },

  teamCell: { display: "flex", alignItems: "center", gap: 12, minWidth: 0 },
  teamName: { fontWeight: 950, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 },
  teamMeta: { marginTop: 2, fontSize: 12, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 },

  singleLineEllipsis: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 420 },

  membersBlock: { display: "grid", gap: 6 },


  moreBtn: {
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900,
    color: "#1d4ed8",
    textAlign: "left",
  },

  actions: {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    flexWrap: "nowrap",
  },

  muted: { color: "#64748b", fontSize: 13, fontWeight: 800 },

  chip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    border: "1px solid rgba(15,23,42,0.10)",
    background: "#f8fafc",
    color: "#0f172a",
    whiteSpace: "nowrap",
  },
  chipNeutral: { background: "#f8fafc", color: "#0f172a", borderColor: "rgba(15,23,42,0.10)" },
  chipBlue: { background: "rgba(59,130,246,0.10)", color: "#1e40af", borderColor: "rgba(59,130,246,0.18)" },
  chipGreen: { background: "rgba(34,197,94,0.10)", color: "#166534", borderColor: "rgba(34,197,94,0.22)" },
  chipAmber: { background: "rgba(245,158,11,0.10)", color: "#92400e", borderColor: "rgba(245,158,11,0.22)" },

  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    border: "1px solid rgba(15,23,42,0.10)",
    background: "#f8fafc",
    color: "#0f172a",
    whiteSpace: "nowrap",
  },
  pillX: {
    marginLeft: 6,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontWeight: 900,
    color: "#0f172a",
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    background: "linear-gradient(135deg, rgba(59,130,246,0.14), rgba(99,102,241,0.10))",
    border: "1px solid rgba(59,130,246,0.16)",
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
  },
  avatarText: { fontWeight: 950, color: "#0f172a", fontSize: 12, letterSpacing: "0.06em" },

  btn: {
    height: 38,
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
  btnSoft: { background: "#f8fafc", color: "#0f172a" },
  btnDanger: { background: "#111827", color: "#fff" },

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

  emptyTd: { padding: 18 },
  emptyBox: { border: "1px dashed rgba(15,23,42,0.18)", borderRadius: 14, padding: 14, background: "rgba(248,250,252,1)" },
  emptyTitle: { fontWeight: 950, color: "#0f172a" },
  emptyText: { marginTop: 4, fontSize: 13, color: "#64748b" },

  loadingBox: { padding: 14, color: "#0f172a", fontWeight: 900 },

  // small color accents
  shiftPill: {
    background: "rgba(59,130,246,0.10)",
    borderColor: "rgba(59,130,246,0.18)",
    color: "#1e40af",
  },
  statusActive: {
    background: "rgba(34,197,94,0.10)",
    borderColor: "rgba(34,197,94,0.22)",
    color: "#166534",
  },
  statusDisabled: {
    background: "rgba(179, 35, 35, 0.1)",
    borderColor: "rgba(245,158,11,0.22)",
    color: "#3c0606",
  },

  // modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.55)",
    display: "grid",
    placeItems: "center",
    padding: 16,
    zIndex: 999,
  },
  modalCard: {
    width: "min(1040px, 100%)",
    borderRadius: 22,
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(15,23,42,0.10)",
    boxShadow: "0 30px 90px rgba(2,6,23,0.36)",
    backdropFilter: "blur(14px)",
    padding: 16,
  },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: 950, color: "#0f172a" },
  modalSub: { marginTop: 4, fontSize: 12, color: "#64748b" },
  modalClose: {
    border: "1px solid rgba(15,23,42,0.12)",
    background: "#ffffff",
    width: 40,
    height: 40,
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 950,
    color: "#0f172a",
  },
  modalForm: { marginTop: 12, display: "grid", gap: 12 },

  modalGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  modalCol: { display: "grid", gap: 12 },

  modalSection: {
    border: "1px solid rgba(15,23,42,0.08)",
    background: "rgba(248,250,252,0.7)",
    borderRadius: 18,
    padding: 12,
    boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
  },
  sectionTitle: { fontSize: 12, fontWeight: 950, letterSpacing: "0.08em", textTransform: "uppercase", color: "#475569", marginBottom: 10 },

  label: { fontSize: 12, color: "#64748b", fontWeight: 950, textTransform: "uppercase", letterSpacing: "0.06em" },

  field: {
    width: "100%",
    height: 44,
    padding: "0 12px",
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,0.10)",
    outline: "none",
    background: "#ffffff",
    boxShadow: "0 10px 22px rgba(2,6,23,0.04)",
    fontWeight: 800,
    color: "#0f172a",
    marginTop: 6,
  },

  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 2 },
  modalBtnGhost: {
    height: 40,
    padding: "0 14px",
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,0.12)",
    background: "#ffffff",
    cursor: "pointer",
    fontWeight: 900,
    color: "#0f172a",
  },
  modalBtnPrimary: {
    height: 40,
    padding: "0 14px",
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,0.12)",
    background: "#0f172a",
    cursor: "pointer",
    fontWeight: 900,
    color: "#ffffff",
  },

  // picker (zones + skills)
  pickerRow: { display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" },
  pickerInputWrap: {
    display: "flex",
    alignItems: "center",
    border: "1px solid rgba(15,23,42,0.10)",
    background: "#ffffff",
    borderRadius: 14,
    height: 44,
    boxShadow: "0 10px 22px rgba(2,6,23,0.04)",
    overflow: "hidden",
  },
  pickerInput: { width: "100%", height: "100%", border: "none", outline: "none", padding: "0 12px", fontWeight: 800, color: "#0f172a" },
  pickerBtn: {
    height: "100%",
    width: 44,
    border: "none",
    background: "rgba(15,23,42,0.04)",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    color: "#0f172a",
  },

  suggestBox: {
    position: "absolute",
    zIndex: 30,
    marginTop: 46,
    width: "calc(100% - 0px)",
    background: "#ffffff",
    border: "1px solid rgba(15,23,42,0.12)",
    borderRadius: 16,
    boxShadow: "0 24px 60px rgba(2,6,23,0.18)",
    overflow: "hidden",
  },
  suggestItem: {
    width: "100%",
    border: "none",
    background: "#ffffff",
    padding: "10px 12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    textAlign: "left",
  },
  suggestItemOn: { opacity: 0.55, cursor: "default" },
  suggestLabel: { fontWeight: 850, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  suggestHint: { fontSize: 12, fontWeight: 900, color: "#64748b" },

  // staff
  staffTopRow: { display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" },
  staffCountPill: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(59,130,246,0.10)",
    border: "1px solid rgba(59,130,246,0.18)",
    color: "#1e40af",
    fontWeight: 950,
    fontSize: 12,
    whiteSpace: "nowrap",
  },
  staffSearchWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    border: "1px solid rgba(15,23,42,0.10)",
    background: "#ffffff",
    borderRadius: 14,
    height: 40,
    minWidth: 260,
    flex: "1 1 260px",
  },
  staffSearchIcon: { position: "absolute", left: 12, color: "#64748b", display: "grid", placeItems: "center" },
  staffSearchInput: { width: "100%", height: "100%", border: "none", outline: "none", padding: "0 12px 0 38px", fontWeight: 850, color: "#0f172a" },

  staffScroller: {
    marginTop: 10,
    maxHeight: 360,
    overflowY: "auto",
    display: "grid",
    gap: 8,
    paddingRight: 6,
  },
  staffRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    padding: "10px 12px",
    borderRadius: 14,
    cursor: "pointer",
    background: "#ffffff",
    border: "1px solid rgba(15,23,42,0.10)",
    boxShadow: "0 10px 18px rgba(2,6,23,0.03)",
  },
  staffRowOn: {
    borderColor: "rgba(59,130,246,0.22)",
    boxShadow: "0 14px 22px rgba(59,130,246,0.08)",
  },
  staffEmail: { fontWeight: 900, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 420 },
  staffName: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  staffEmpty: { padding: 12, color: "#6b7280", fontSize: 13, textAlign: "center" },
  stackList: { display: "grid", gap: 2 },
  stackClosed: { maxHeight: 44, overflow: "hidden" },
  stackOpen: { maxHeight: 240, overflow: "auto", paddingRight: 6 },
  stackLine: {
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 360,
  },

};
