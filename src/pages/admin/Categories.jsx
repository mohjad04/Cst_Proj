// import React, { useEffect, useMemo, useState } from "react";
// import {
//   listCategories,
//   createCategory,
//   updateCategory,
//   toggleCategory,
//   deleteCategory,
//   listSubcategories,
//   createSubcategory,
//   updateSubcategory,
//   toggleSubcategory,
//   deleteSubcategory,
// } from "../../services/categoriesApi";

// export default function Categories() {
//   const [cats, setCats] = useState([]);
//   const [activeCatId, setActiveCatId] = useState(null);

//   const [subs, setSubs] = useState([]);
//   const [loadingCats, setLoadingCats] = useState(true);
//   const [loadingSubs, setLoadingSubs] = useState(false);

//   const [qCat, setQCat] = useState("");
//   const [qSub, setQSub] = useState("");

//   const [toast, setToast] = useState("");
//   const [error, setError] = useState("");

//   const [catModal, setCatModal] = useState({ open: false, mode: "create", item: null });
//   const [subModal, setSubModal] = useState({ open: false, mode: "create", item: null });

//   function showToast(msg) {
//     setToast(msg);
//     setTimeout(() => setToast(""), 2200);
//   }

//   async function loadCategories() {
//     setLoadingCats(true);
//     setError("");
//     try {
//       const rows = await listCategories();
//       setCats(rows || []);
//       setActiveCatId((prev) => {
//         const first = rows?.[0]?.id ?? null;
//         if (!prev) return first;
//         if (!rows?.some((c) => c.id === prev)) return first;
//         return prev;
//       });
//     } catch (e) {
//       setError(e.message || "Failed to load categories");
//     } finally {
//       setLoadingCats(false);
//     }
//   }

//   async function loadSubcategories(categoryId) {
//     if (!categoryId) {
//       setSubs([]);
//       return;
//     }
//     setLoadingSubs(true);
//     setError("");
//     try {
//       const rows = await listSubcategories(categoryId);
//       setSubs(rows || []);
//     } catch (e) {
//       setSubs([]);
//       setError(e.message || "Failed to load subcategories");
//     } finally {
//       setLoadingSubs(false);
//     }
//   }

//   useEffect(() => {
//     loadCategories();
//   }, []);

//   useEffect(() => {
//     loadSubcategories(activeCatId);
//   }, [activeCatId]);

//   const categoriesFiltered = useMemo(() => {
//     const query = qCat.trim().toLowerCase();
//     return cats.filter((c) => c.name.toLowerCase().includes(query));
//   }, [cats, qCat]);

//   const activeCategory = useMemo(
//     () => cats.find((c) => c.id === activeCatId) || null,
//     [cats, activeCatId]
//   );

//   const subFiltered = useMemo(() => {
//     const query = qSub.trim().toLowerCase();
//     return subs.filter((s) => s.name.toLowerCase().includes(query));
//   }, [subs, qSub]);

//   async function onToggleSub(subId) {
//     try {
//       const updated = await toggleSubcategory(activeCatId, subId);
//       setSubs((prev) => prev.map((s) => (s.id === subId ? updated : s)));
//     } catch (e) {
//       setError(e.message || "Failed");
//     }
//   }

//   async function onDeleteSub(subId) {
//     if (!confirm("Delete this subcategory?")) return;
//     try {
//       await deleteSubcategory(activeCatId, subId);
//       setSubs((prev) => prev.filter((s) => s.id !== subId));
//       loadCategories();
//     } catch (e) {
//       setError(e.message || "Failed");
//     }
//   }

//   return (
//     <div style={{ display: "grid", gap: 12 }}>
//       <div style={styles.headerRow}>
//         <h1 style={{ margin: 0 }}>Categories</h1>
//         <div style={{ display: "flex", gap: 10 }}>
//           <button
//             style={{ ...styles.btn, background: "#111827" }}
//             onClick={() => setCatModal({ open: true, mode: "create", item: null })}
//           >
//             + Add Category
//           </button>
//           <button style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }} onClick={loadCategories}>
//             Refresh
//           </button>
//         </div>
//       </div>

//       {error && <ErrorBox text={error} />}
//       {toast && <div style={{ ...styles.card, background: "#f0fdf4" }}>{toast}</div>}

//       <div style={styles.grid}>
//         {/* Categories */}
//         <div style={styles.card}>
//           <div style={styles.sectionTitle}>Categories</div>
//           <input
//             style={styles.input}
//             placeholder="Search categories..."
//             value={qCat}
//             onChange={(e) => setQCat(e.target.value)}
//           />

//           {loadingCats ? (
//             <div style={{ padding: 12 }}>Loading…</div>
//           ) : (
//             <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
//               {categoriesFiltered.map((c) => (
//                 <div
//                   key={c.id}
//                   style={{
//                     ...styles.itemRow,
//                     borderColor: c.id === activeCatId ? "#111827" : "rgba(17,24,39,0.10)",
//                   }}
//                   onClick={() => setActiveCatId(c.id)}
//                 >
//                   {/* LEFT: name + count */}
//                   <div>
//                     <div style={{ fontWeight: 900 }}>{c.name}</div>
//                     <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
//                       {c.subcategories_count} subcategories
//                     </div>
//                   </div>

//                   {/* RIGHT: delete button */}
//                   <button
//                     style={{
//                       ...styles.smallBtn,
//                       background: c.subcategories_count > 0 ? "#e5e7eb" : "#fee2e2",
//                       color: "#111827",
//                       cursor: c.subcategories_count > 0 ? "not-allowed" : "pointer",
//                     }}
//                     disabled={c.subcategories_count > 0}
//                     onClick={async (e) => {
//                       e.stopPropagation();

//                       if (!confirm("Delete this category?")) return;

//                       try {
//                         await deleteCategory(c.id);
//                         showToast("Category deleted");
//                         loadCategories();
//                       } catch (err) {
//                         setError(err.message || "Failed to delete category");
//                       }
//                     }}
//                   >
//                     Delete
//                   </button>
//                 </div>
//               ))}

//             </div>
//           )}
//         </div>

//         {/* Subcategories */}
//         <div style={styles.card}>
//           <div style={styles.rightHeader}>
//             <div>
//               <div style={styles.sectionTitle}>Subcategories</div>
//               <div style={{ fontSize: 13, color: "#6b7280" }}>
//                 Selected: <b>{activeCategory?.name || "—"}</b>
//               </div>
//             </div>

//             <button
//               style={{ ...styles.btn, background: "#111827" }}
//               disabled={!activeCategory}
//               onClick={() => setSubModal({ open: true, mode: "create", item: null })}
//             >
//               + Add Subcategory
//             </button>
//           </div>

//           <input
//             style={{ ...styles.input, marginTop: 10 }}
//             placeholder="Search subcategories..."
//             value={qSub}
//             onChange={(e) => setQSub(e.target.value)}
//             disabled={!activeCategory}
//           />

//           {loadingSubs ? (
//             <div style={{ padding: 12 }}>Loading…</div>
//           ) : (
//             <table style={{ ...styles.table, marginTop: 10 }}>
//               <thead>
//                 <tr>
//                   <th style={styles.th}>Subcategory</th>
//                   <th style={styles.th}>Priority</th>
//                   <th style={styles.th}>Status</th>
//                   <th style={styles.th}></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {subFiltered.map((s) => (
//                   <tr key={s.id}>
//                     <td style={styles.td}>{s.name}</td>

//                     <td style={styles.td}>{s.priority}</td>

//                     <td style={styles.td}>
//                       <span
//                         style={{
//                           ...styles.badge,
//                           background: s.active ? "#ecfeff" : "#fef2f2",
//                           borderColor: s.active ? "#a5f3fc" : "#fecaca",
//                         }}
//                       >
//                         {s.active ? "Active" : "Disabled"}
//                       </span>
//                     </td>

//                     <td style={styles.td}>
//                       <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
//                         <button
//                           style={{ ...styles.smallBtn, background: "#e5e7eb", color: "#111827" }}
//                           onClick={() =>
//                             setSubModal({ open: true, mode: "edit", item: s })
//                           }
//                         >
//                           Edit
//                         </button>

//                         <button
//                           style={{
//                             ...styles.smallBtn,
//                             background: s.active ? "#fecaca" : "#dcfce7",
//                             color: "#111827",
//                           }}
//                           onClick={() => onToggleSub(s.id)}
//                         >
//                           {s.active ? "Disable" : "Enable"}
//                         </button>

//                         <button
//                           style={{ ...styles.smallBtn, background: "#111827", color: "white" }}
//                           onClick={() => onDeleteSub(s.id)}
//                         >
//                           Delete
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>

//             </table>
//           )}
//         </div>
//       </div>

//       {catModal.open && (
//         <CategoryModal
//           title={catModal.mode === "create" ? "Add Category" : "Edit Category"}
//           submitLabel={catModal.mode === "create" ? "Create" : "Save"}
//           initial={catModal.item || { name: "" }}
//           onClose={() => setCatModal({ open: false, mode: "create", item: null })}
//           onSubmit={async (payload) => {
//             if (catModal.mode === "create") await createCategory(payload);
//             else await updateCategory(catModal.item.id, payload);
//             loadCategories();
//             setCatModal({ open: false, mode: "create", item: null });
//           }}
//         />
//       )}

//       {subModal.open && activeCategory && (
//         <SubcategoryModal
//           title={subModal.mode === "create" ? "Add Subcategory" : "Edit Subcategory"}
//           submitLabel={subModal.mode === "create" ? "Create" : "Save"}
//           initial={subModal.item || { name: "", priority: "P3" }}
//           onClose={() => setSubModal({ open: false, mode: "create", item: null })}
//           onSubmit={async (payload) => {
//             if (subModal.mode === "create") await createSubcategory(activeCategory.id, payload);
//             else await updateSubcategory(activeCategory.id, subModal.item.id, payload);
//             loadSubcategories(activeCategory.id);
//             setSubModal({ open: false, mode: "create", item: null });
//           }}
//         />
//       )}
//     </div>
//   );
// }

// /* ================= MODALS ================= */

// function CategoryModal({ title, submitLabel, initial, onClose, onSubmit }) {
//   const [name, setName] = useState(initial.name);

//   return (
//     <ModalShell title={title} onClose={onClose}>
//       <form
//         onSubmit={(e) => {
//           e.preventDefault();
//           onSubmit({ name });
//         }}
//         style={styles.form}
//       >
//         <Field label="Category name">
//           <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
//         </Field>
//         <FooterButtons submitLabel={submitLabel} onClose={onClose} />
//       </form>
//     </ModalShell>
//   );
// }

// function SubcategoryModal({ title, submitLabel, initial, onClose, onSubmit }) {
//   const [name, setName] = useState(initial.name);
//   const [priority, setPriority] = useState(initial.priority);

//   return (
//     <ModalShell title={title} onClose={onClose}>
//       <form
//         onSubmit={(e) => {
//           e.preventDefault();
//           onSubmit({ name, priority });
//         }}
//         style={styles.form}
//       >
//         <Field label="Subcategory name">
//           <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
//         </Field>
//         <Field label="Priority">
//           <select style={styles.input} value={priority} onChange={(e) => setPriority(e.target.value)}>
//             <option value="P1">P1</option>
//             <option value="P2">P2</option>
//             <option value="P3">P3</option>

//           </select>
//         </Field>
//         <FooterButtons submitLabel={submitLabel} onClose={onClose} />
//       </form>
//     </ModalShell>
//   );
// }

// /* ================= UI HELPERS ================= */

// function ModalShell({ title, onClose, children }) {
//   return (
//     <div style={styles.modalOverlay} onMouseDown={onClose}>
//       <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
//         <h2 style={{ margin: 0 }}>{title}</h2>
//         {children}
//       </div>
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

// function FooterButtons({ onClose, submitLabel }) {
//   return (
//     <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
//       <button type="button" style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }} onClick={onClose}>
//         Cancel
//       </button>
//       <button type="submit" style={{ ...styles.btn, background: "#111827" }}>
//         {submitLabel}
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

// /* ================= STYLES ================= */

// const styles = {
//   headerRow: { display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 },
//   grid: { display: "grid", gridTemplateColumns: "420px 1fr", gap: 12 },
//   rightHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
//   sectionTitle: { fontWeight: 900, marginBottom: 10, fontSize: 16 },
//   card: { background: "white", borderRadius: 14, padding: 14, boxShadow: "0 10px 25px rgba(0,0,0,0.06)" },
//   input: { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" },
//   btn: { border: "none", padding: "10px 14px", borderRadius: 10, fontWeight: 800, cursor: "pointer" },
//   smallBtn: { border: "none", padding: "8px 10px", borderRadius: 10, fontWeight: 800, cursor: "pointer" },
//   itemRow: {
//     display: "flex",
//     justifyContent: "space-between",
//     padding: 12,
//     borderRadius: 14,
//     border: "1px solid rgba(17,24,39,0.10)",
//     cursor: "pointer",
//   },
//   table: { width: "100%", borderCollapse: "collapse" },
//   th: { textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #e5e7eb", fontSize: 13 },
//   td: { padding: "10px 8px", borderBottom: "1px solid #e5e7eb" },
//   badge: {
//     padding: "4px 10px",
//     borderRadius: 999,
//     fontSize: 12,
//     background: "#ecfeff",
//     border: "1px solid #a5f3fc",
//   },
//   modalOverlay: {
//     position: "fixed",
//     inset: 0,
//     background: "rgba(0,0,0,0.4)",
//     display: "grid",
//     placeItems: "center",
//     zIndex: 999,
//   },
//   modalCard: { background: "white", borderRadius: 14, padding: 16, width: "min(760px,100%)" },
//   form: { display: "grid", gap: 10, marginTop: 12 },
//   label: { fontSize: 13, fontWeight: 800, marginBottom: 6 },
// };

// src/pages/admin/Categories.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listSubcategories,
  createSubcategory,
  updateSubcategory,
  toggleSubcategory,
  deleteSubcategory,
} from "../../services/categoriesApi";

/* ----------------------------- small helpers ----------------------------- */
const isArr = (v) => Array.isArray(v);
const s = (v) => String(v ?? "");
const sLower = (v) => s(v).toLowerCase();
const sTrim = (v) => s(v).trim();

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

/* ================================ PAGE ================================ */

export default function Categories() {
  const [cats, setCats] = useState([]);
  const [activeCatId, setActiveCatId] = useState(null);

  const [subs, setSubs] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const [qCat, setQCat] = useState("");
  const [qSub, setQSub] = useState("");

  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const [catModal, setCatModal] = useState({ open: false, mode: "create", item: null });
  const [subModal, setSubModal] = useState({ open: false, mode: "create", item: null });

  function showToast(msg) {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(""), 2200);
  }

  async function loadCategories() {
    setLoadingCats(true);
    setError("");
    try {
      const rows = await listCategories();
      const list = isArr(rows) ? rows : [];
      setCats(list);

      setActiveCatId((prev) => {
        const first = list?.[0]?.id ?? null;
        if (!prev) return first;
        if (!list.some((c) => c.id === prev)) return first;
        return prev;
      });
    } catch (e) {
      setError(e?.message || "Failed to load categories");
    } finally {
      setLoadingCats(false);
    }
  }

  async function loadSubcategories(categoryId) {
    if (!categoryId) {
      setSubs([]);
      return;
    }
    setLoadingSubs(true);
    setError("");
    try {
      const rows = await listSubcategories(categoryId);
      setSubs(isArr(rows) ? rows : []);
    } catch (e) {
      setSubs([]);
      setError(e?.message || "Failed to load subcategories");
    } finally {
      setLoadingSubs(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadSubcategories(activeCatId);
  }, [activeCatId]);

  const activeCategory = useMemo(() => cats.find((c) => c.id === activeCatId) || null, [cats, activeCatId]);

  const categoriesFiltered = useMemo(() => {
    const query = sLower(qCat).trim();
    if (!query) return cats;
    return cats.filter((c) => sLower(c?.name).includes(query));
  }, [cats, qCat]);

  const subFiltered = useMemo(() => {
    const query = sLower(qSub).trim();
    if (!query) return subs;
    return subs.filter((s1) => sLower(s1?.name).includes(query));
  }, [subs, qSub]);

  async function onDeleteCategory(cat) {
    if (!confirm("Delete this category?")) return;
    setError("");
    try {
      await deleteCategory(cat.id);
      showToast("Category deleted");
      await loadCategories();
    } catch (e) {
      setError(e?.message || "Failed to delete category");
    }
  }


  async function onDeleteSub(subId) {
    if (!confirm("Delete this subcategory?")) return;
    setError("");
    try {
      await deleteSubcategory(activeCatId, subId);
      setSubs((prev) => prev.filter((x) => x.id !== subId));
      showToast("Subcategory deleted");
      loadCategories();
    } catch (e) {
      setError(e?.message || "Failed");
    }
  }

  return (
    <div style={styles.page}>
      {/* top actions */}
      {/* top actions only (no page header text) */}
      <div style={styles.topBar}>
        <div />
        <div style={{ display: "flex", gap: 10 }}>
          <button
            style={{ ...styles.btn, background: "#111827" }}
            onClick={() => setCatModal({ open: true, mode: "create", item: null })}
          >
            + Add Category
          </button>
          <button style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }} onClick={loadCategories}>
            Refresh
          </button>
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

      {/* grid */}
      <div style={styles.grid}>
        {/* LEFT: categories */}
        <div style={styles.card}>
          <div style={styles.cardHead}>
            <div>
              <div style={styles.cardTitle}>Categories</div>
              <div style={styles.cardSub}>Pick one to manage subcategories</div>
            </div>
          </div>

          <div style={styles.cardBody}>
            <div style={styles.searchWrap}>
              <span style={styles.searchIcon}>
                <Icon name="search" />
              </span>
              <input
                style={styles.searchInput}
                placeholder="Search categories…"
                value={qCat}
                onChange={(e) => setQCat(e.target.value)}
              />
            </div>

            {loadingCats ? (
              <div style={styles.loadingBox}>Loading categories…</div>
            ) : categoriesFiltered.length === 0 ? (
              <div style={styles.emptyBox}>
                <div style={styles.emptyTitle}>No categories found</div>
                <div style={styles.emptyText}>Try changing the search.</div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                {categoriesFiltered.map((c) => {
                  const isActive = c.id === activeCatId;
                  const count = Number(c.subcategories_count ?? 0);

                  return (
                    <div
                      key={c.id}
                      onClick={() => setActiveCatId(c.id)}
                      style={{ ...styles.catRow, ...(isActive ? styles.catRowActive : null) }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={styles.catName} title={c.name}>
                          {c.name || "—"}
                        </div>
                        <div style={styles.catMeta}>{count} subcategories</div>
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="soft"
                          onClick={() => setCatModal({ open: true, mode: "edit", item: c })}
                          style={{ height: 34, padding: "0 10px" }}
                        >
                          <Icon name="edit" /> Edit
                        </Button>

                        <Button
                          variant="danger"
                          disabled={count > 0}
                          title={count > 0 ? "Delete disabled: category has subcategories" : "Delete category"}
                          onClick={() => onDeleteCategory(c)}
                          style={{ height: 34, padding: "0 10px", opacity: count > 0 ? 0.55 : 1, cursor: count > 0 ? "not-allowed" : "pointer" }}
                        >
                          <Icon name="trash" /> Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: subcategories */}
        <div style={styles.tableCard}>
          <div style={styles.cardHead}>
            <div>
              <div style={styles.cardTitle}>Subcategories</div>
              <div style={styles.cardSub}>
                Selected: <b>{activeCategory?.name || "—"}</b>
              </div>
            </div>

            <Button
              variant="primary"
              disabled={!activeCategory}
              onClick={() => setSubModal({ open: true, mode: "create", item: null })}
            >
              <span style={styles.btnIcon}>
                <Icon name="plus" />
              </span>
              Add Subcategory
            </Button>
          </div>

          <div style={styles.cardBody}>
            <div style={styles.searchWrap}>
              <span style={styles.searchIcon}>
                <Icon name="search" />
              </span>
              <input
                style={styles.searchInput}
                placeholder="Search subcategories…"
                value={qSub}
                onChange={(e) => setQSub(e.target.value)}
                disabled={!activeCategory}
              />
            </div>

            {!activeCategory ? (
              <div style={{ ...styles.emptyBox, marginTop: 12 }}>
                <div style={styles.emptyTitle}>Select a category</div>
                <div style={styles.emptyText}>Choose a category from the left.</div>
              </div>
            ) : loadingSubs ? (
              <div style={styles.loadingBox}>Loading subcategories…</div>
            ) : subFiltered.length === 0 ? (
              <div style={{ ...styles.emptyBox, marginTop: 12 }}>
                <div style={styles.emptyTitle}>No subcategories</div>
                <div style={styles.emptyText}>Create the first subcategory for this category.</div>
              </div>
            ) : (
              <div style={{ marginTop: 12, overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Subcategory</th>
                      <th style={styles.th}>Priority</th>
                      <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {subFiltered.map((sc) => (
                      <tr key={sc.id} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={{ fontWeight: 950 }}>{sc.name || "—"}</div>
                        </td>

                        <td style={styles.td}>
                          <span style={{ ...styles.pill, ...styles.pillBlue }}>{sc.priority || "—"}</span>
                        </td>

                        <td style={{ ...styles.td, textAlign: "right" }}>
                          <div style={styles.actions}>
                            <Button
                              variant="soft"
                              onClick={() => setSubModal({ open: true, mode: "edit", item: sc })}
                              style={{ height: 34, padding: "0 10px" }}
                            >
                              <Icon name="edit" /> Edit
                            </Button>

                            <Button
                              variant="danger"
                              onClick={() => onDeleteSub(sc.id)}
                              style={{ height: 34, padding: "0 10px" }}
                            >
                              <Icon name="trash" /> Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* modals */}
      {catModal.open && (
        <CategoryModal
          title={catModal.mode === "create" ? "Add Category" : "Edit Category"}
          submitLabel={catModal.mode === "create" ? "Create" : "Save"}
          initial={catModal.item || { name: "" }}
          onClose={() => setCatModal({ open: false, mode: "create", item: null })}
          onSubmit={async (payload) => {
            setError("");
            try {
              if (catModal.mode === "create") await createCategory(payload);
              else await updateCategory(catModal.item.id, payload);

              showToast(catModal.mode === "create" ? "Category created" : "Category updated");
              await loadCategories();
              setCatModal({ open: false, mode: "create", item: null });
            } catch (e) {
              setError(e?.message || "Failed");
            }
          }}
        />
      )}

      {subModal.open && activeCategory && (
        <SubcategoryModal
          title={subModal.mode === "create" ? "Add Subcategory" : "Edit Subcategory"}
          submitLabel={subModal.mode === "create" ? "Create" : "Save"}
          initial={subModal.item || { name: "", priority: "P3" }}
          onClose={() => setSubModal({ open: false, mode: "create", item: null })}
          onSubmit={async (payload) => {
            setError("");
            try {
              if (subModal.mode === "create") await createSubcategory(activeCategory.id, payload);
              else await updateSubcategory(activeCategory.id, subModal.item.id, payload);

              showToast(subModal.mode === "create" ? "Subcategory created" : "Subcategory updated");
              await loadSubcategories(activeCategory.id);
              setSubModal({ open: false, mode: "create", item: null });
            } catch (e) {
              setError(e?.message || "Failed");
            }
          }}
        />
      )}
    </div>
  );
}

/* ================= MODALS ================= */

function ModalShell({ title, onClose, children }) {
  return (
    <div style={styles.modalOverlay} onMouseDown={onClose}>
      <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.modalHead}>
          <div>
            <div style={styles.modalTitle}>{title}</div>
            <div style={styles.modalSub}>Fill the required fields and save.</div>
          </div>
          <button style={styles.modalClose} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function FooterButtons({ onClose, submitLabel, busy }) {
  return (
    <div style={styles.modalActions}>
      <button type="button" style={styles.modalBtnGhost} onClick={onClose} disabled={busy}>
        Cancel
      </button>
      <button type="submit" style={styles.modalBtnPrimary} disabled={busy}>
        {busy ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}

function CategoryModal({ title, submitLabel, initial, onClose, onSubmit }) {
  const [name, setName] = useState(initial.name);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  return (
    <ModalShell title={title} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setErr("");
          if (!sTrim(name)) return setErr("Category name is required");

          setBusy(true);
          try {
            await onSubmit({ name: sTrim(name) }); // payload shape unchanged
          } catch (e2) {
            setErr(e2?.message || "Failed");
          } finally {
            setBusy(false);
          }
        }}
        style={styles.modalForm}
      >
        <Field label="Category name">
          <input style={styles.field} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        {err && (
          <div style={{ ...styles.alert, ...styles.alertError }}>
            <div style={styles.alertTitle}>Fix this</div>
            <div style={styles.alertText}>{err}</div>
          </div>
        )}

        <FooterButtons submitLabel={submitLabel} onClose={onClose} busy={busy} />
      </form>
    </ModalShell>
  );
}

function SubcategoryModal({ title, submitLabel, initial, onClose, onSubmit }) {
  const [name, setName] = useState(initial.name);
  const [priority, setPriority] = useState(initial.priority);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  return (
    <ModalShell title={title} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setErr("");
          if (!sTrim(name)) return setErr("Subcategory name is required");

          setBusy(true);
          try {
            await onSubmit({ name: sTrim(name), priority }); // payload shape unchanged
          } catch (e2) {
            setErr(e2?.message || "Failed");
          } finally {
            setBusy(false);
          }
        }}
        style={styles.modalForm}
      >
        <Field label="Subcategory name">
          <input style={styles.field} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <Field label="Priority">
          <select style={styles.field} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
          </select>
        </Field>

        {err && (
          <div style={{ ...styles.alert, ...styles.alertError }}>
            <div style={styles.alertTitle}>Fix this</div>
            <div style={styles.alertText}>{err}</div>
          </div>
        )}

        <FooterButtons submitLabel={submitLabel} onClose={onClose} busy={busy} />
      </form>
    </ModalShell>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: { display: "grid", gap: 12, padding: 0 },

  actionsRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" },
  actionsRight: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },

  hTitle: { fontSize: 26, fontWeight: 950, color: "#0f172a" },
  hSub: { marginTop: 4, fontSize: 13, color: "#64748b" },

  grid: { display: "grid", gridTemplateColumns: "minmax(340px, 440px) 1fr", gap: 12 },

  card: {
    background: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,0.08)",
    boxShadow: "0 12px 26px rgba(2,6,23,0.06)",
    backdropFilter: "blur(10px)",
    overflow: "hidden",
  },
  tableCard: {
    background: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,0.08)",
    boxShadow: "0 16px 34px rgba(2,6,23,0.08)",
    backdropFilter: "blur(10px)",
    overflow: "hidden",
  },

  cardHead: {
    padding: 12,
    borderBottom: "1px solid rgba(15,23,42,0.06)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  cardTitle: { fontSize: 13, fontWeight: 950, color: "#0f172a" },
  cardSub: { marginTop: 2, fontSize: 12, color: "#64748b" },
  cardBody: { padding: 12 },

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
    fontWeight: 800,
    color: "#0f172a",
  },

  loadingBox: { padding: 12, color: "#0f172a", fontWeight: 900 },

  emptyBox: { border: "1px dashed rgba(15,23,42,0.18)", borderRadius: 14, padding: 14, background: "rgba(248,250,252,1)" },
  emptyTitle: { fontWeight: 950, color: "#0f172a" },
  emptyText: { marginTop: 4, fontSize: 13, color: "#64748b" },

  catRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,0.10)",
    background: "#ffffff",
    cursor: "pointer",
    boxShadow: "0 10px 18px rgba(2,6,23,0.03)",
  },
  catRowActive: { borderColor: "rgba(15,23,42,0.25)", boxShadow: "0 14px 22px rgba(2,6,23,0.06)" },
  catName: { fontWeight: 950, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 260 },
  catMeta: { marginTop: 6, color: "#64748b", fontSize: 12, fontWeight: 800 },

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
  tr: { height: 72 },
  td: { padding: "12px 14px", borderBottom: "1px solid rgba(15,23,42,0.06)", fontSize: 14, color: "#0f172a", verticalAlign: "middle" },

  actions: { display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" },

  pill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    border: "1px solid rgba(15,23,42,0.10)",
    background: "#f8fafc",
    color: "#0f172a",
    whiteSpace: "nowrap",
  },
  pillOk: { background: "rgba(34,197,94,0.10)", borderColor: "rgba(34,197,94,0.22)", color: "#166534" },
  pillWarn: { background: "rgba(245,158,11,0.10)", borderColor: "rgba(245,158,11,0.22)", color: "#92400e" },
  pillBlue: { background: "rgba(246, 59, 59, 0.1)", borderColor: "rgba(246, 59, 59, 0.18)", color: "#8d0b0b" },

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

  alert: { borderRadius: 14, padding: 10, border: "1px solid rgba(15,23,42,0.10)", boxShadow: "0 10px 22px rgba(2,6,23,0.06)" },
  alertTitle: { fontWeight: 950, marginBottom: 2 },
  alertText: { fontSize: 13, opacity: 0.95 },
  alertError: { background: "#fff1f2", borderColor: "#fecaca", color: "#9f1239" },
  alertOk: { background: "#f0fdf4", borderColor: "#bbf7d0", color: "#166534" },

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
    width: "min(780px, 100%)",
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
};
