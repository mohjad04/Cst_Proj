// src/pages/admin/Categories.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  listCategories,
  createCategory,
  updateCategory,
  toggleCategory,
  deleteCategory,
  listSubcategories,
  createSubcategory,
  updateSubcategory,
  toggleSubcategory,
  deleteSubcategory,
  defaultValidation,
} from "../../services/categoriesApi";

export default function Categories() {
  const [cats, setCats] = useState([]);
  const [activeCatCode, setActiveCatCode] = useState(null);

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
    setTimeout(() => setToast(""), 2200);
  }

  async function loadCategories() {
    setLoadingCats(true);
    setError("");
    try {
      const rows = await listCategories();
      setCats(rows || []);
      // keep selection stable
      setActiveCatCode((prev) => {
        const first = rows?.[0]?.code ?? null;
        if (!prev) return first;
        if (!rows?.some((c) => c.code === prev)) return first;
        return prev;
      });
    } catch (e) {
      setError(e.message || "Failed to load categories");
    } finally {
      setLoadingCats(false);
    }
  }

  async function loadSubcategories(categoryCode) {
    if (!categoryCode) {
      setSubs([]);
      return;
    }
    setLoadingSubs(true);
    setError("");
    try {
      const rows = await listSubcategories(categoryCode);
      setSubs(rows || []);
    } catch (e) {
      setSubs([]);
      setError(e.message || "Failed to load subcategories");
    } finally {
      setLoadingSubs(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadSubcategories(activeCatCode);
  }, [activeCatCode]);

  const categoriesFiltered = useMemo(() => {
    const query = qCat.trim().toLowerCase();
    return (cats || []).filter((c) => {
      if (!query) return true;
      return (c.name || "").toLowerCase().includes(query) || (c.code || "").toLowerCase().includes(query);
    });
  }, [cats, qCat]);

  const activeCategory = useMemo(
    () => (cats || []).find((c) => c.code === activeCatCode) || null,
    [cats, activeCatCode]
  );

  const subFiltered = useMemo(() => {
    const query = qSub.trim().toLowerCase();
    return (subs || []).filter((s) => {
      if (!query) return true;
      return (s.name || "").toLowerCase().includes(query) || (s.code || "").toLowerCase().includes(query);
    });
  }, [subs, qSub]);

  async function onToggleCategory(catCode) {
    setError("");
    try {
      const updated = await toggleCategory(catCode);
      setCats((prev) => prev.map((c) => (c.code === catCode ? updated : c)));
      showToast(updated.active ? "Category enabled" : "Category disabled");
    } catch (e) {
      setError(e.message || "Failed");
    }
  }

  async function onDeleteCategory(catCode) {
    const ok = confirm("Delete this category? (must have 0 subcategories)");
    if (!ok) return;

    setError("");
    try {
      await deleteCategory(catCode);
      setCats((prev) => prev.filter((c) => c.code !== catCode));
      if (activeCatCode === catCode) setActiveCatCode(null);
      setSubs([]);
      showToast("Category deleted");
    } catch (e) {
      setError(e.message || "Failed");
    }
  }

  async function onToggleSub(subCode) {
    if (!activeCatCode) return;
    setError("");
    try {
      const updated = await toggleSubcategory(activeCatCode, subCode);
      setSubs((prev) => prev.map((s) => (s.code === subCode ? updated : s)));
      showToast(updated.active ? "Subcategory enabled" : "Subcategory disabled");
    } catch (e) {
      setError(e.message || "Failed");
    }
  }

  async function onDeleteSub(subCode) {
    if (!activeCatCode) return;
    const ok = confirm("Delete this subcategory?");
    if (!ok) return;

    setError("");
    try {
      await deleteSubcategory(activeCatCode, subCode);
      setSubs((prev) => prev.filter((s) => s.code !== subCode));
      showToast("Subcategory deleted");
      // refresh categories to update counts if backend exposes them
      loadCategories();
    } catch (e) {
      setError(e.message || "Failed");
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={{ margin: 0 }}>Categories</h1>
          <div style={{ color: "#6b7280", marginTop: 6 }}>
            Manage taxonomy (category/sub-category) and validation rules.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
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

      <div style={styles.grid}>
        {/* Left: categories */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Categories</div>
          <input
            style={styles.input}
            placeholder="Search categories..."
            value={qCat}
            onChange={(e) => setQCat(e.target.value)}
          />

          {loadingCats ? (
            <div style={{ padding: 12 }}>Loading…</div>
          ) : (
            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              {categoriesFiltered.map((c) => (
                <div
                  key={c.code}
                  style={{
                    ...styles.itemRow,
                    borderColor: c.code === activeCatCode ? "#111827" : "rgba(17,24,39,0.10)",
                  }}
                  onClick={() => setActiveCatCode(c.code)}
                >
                  <div>
                    <div style={{ fontWeight: 900 }}>{c.name}</div>
                    <div style={{ color: "#6b7280", fontSize: 12 }}>code: {c.code}</div>
                    <div style={{ color: "#6b7280", fontSize: 12 }}>
                      subcategories: {c.subcategories_count ?? subsCountFallback(c, subs, activeCatCode)}
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                    <span
                      style={{
                        ...styles.badge,
                        background: c.active ? "#ecfeff" : "#fef2f2",
                        borderColor: c.active ? "#a5f3fc" : "#fecaca",
                      }}
                    >
                      {c.active ? "Active" : "Disabled"}
                    </span>

                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        style={{ ...styles.smallBtn, background: "#e5e7eb", color: "#111827" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCatModal({ open: true, mode: "edit", item: c });
                        }}
                      >
                        Edit
                      </button>

                      <button
                        style={{ ...styles.smallBtn, background: c.active ? "#fee2e2" : "#dcfce7", color: "#111827" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleCategory(c.code);
                        }}
                      >
                        {c.active ? "Disable" : "Enable"}
                      </button>

                      <button
                        style={{ ...styles.smallBtn, background: "#111827", color: "white" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCategory(c.code);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {categoriesFiltered.length === 0 && (
                <div style={{ color: "#6b7280", padding: 12 }}>No categories found.</div>
              )}
            </div>
          )}
        </div>

        {/* Right: subcategories */}
        <div style={styles.card}>
          <div style={styles.rightHeader}>
            <div>
              <div style={styles.sectionTitle}>Subcategories</div>
              <div style={{ color: "#6b7280", fontSize: 13 }}>
                Selected: <b>{activeCategory ? activeCategory.name : "—"}</b>
              </div>
            </div>

            <button
              style={{ ...styles.btn, background: "#111827" }}
              disabled={!activeCategory}
              onClick={() => setSubModal({ open: true, mode: "create", item: null })}
            >
              + Add Subcategory
            </button>
          </div>

          <input
            style={{ ...styles.input, marginTop: 10 }}
            placeholder="Search subcategories..."
            value={qSub}
            onChange={(e) => setQSub(e.target.value)}
            disabled={!activeCategory}
          />

          {!activeCategory ? (
            <div style={{ padding: 12, color: "#6b7280" }}>Pick a category from the left.</div>
          ) : loadingSubs ? (
            <div style={{ padding: 12, color: "#6b7280" }}>Loading subcategories…</div>
          ) : (
            <div style={{ marginTop: 10, overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Subcategory</th>
                    <th style={styles.th}>Code</th>
                    <th style={styles.th}>Validation</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {subFiltered.map((s) => (
                    <tr key={s.code}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 900 }}>{s.name}</div>
                      </td>
                      <td style={styles.td}>{s.code}</td>
                      <td style={styles.td}>
                        <ValidationPreview v={s.validation} />
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            background: s.active ? "#ecfeff" : "#fef2f2",
                            borderColor: s.active ? "#a5f3fc" : "#fecaca",
                          }}
                        >
                          {s.active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button
                            style={{ ...styles.smallBtn, background: "#e5e7eb", color: "#111827" }}
                            onClick={() => setSubModal({ open: true, mode: "edit", item: s })}
                          >
                            Edit
                          </button>
                          <button
                            style={{ ...styles.smallBtn, background: s.active ? "#fee2e2" : "#dcfce7", color: "#111827" }}
                            onClick={() => onToggleSub(s.code)}
                          >
                            {s.active ? "Disable" : "Enable"}
                          </button>
                          <button
                            style={{ ...styles.smallBtn, background: "#111827", color: "white" }}
                            onClick={() => onDeleteSub(s.code)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {subFiltered.length === 0 && (
                    <tr>
                      <td style={styles.td} colSpan={5}>
                        <div style={{ padding: 12, color: "#6b7280" }}>No subcategories found.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {catModal.open && (
        <CategoryModal
          title={catModal.mode === "create" ? "Add Category" : "Edit Category"}
          submitLabel={catModal.mode === "create" ? "Create" : "Save"}
          initial={catModal.item || { name: "", code: "" }}
          onClose={() => setCatModal({ open: false, mode: "create", item: null })}
          onSubmit={async (payload) => {
            setError("");
            try {
              if (catModal.mode === "create") {
                const created = await createCategory(payload);
                setCats((prev) => [created, ...prev]);
                setActiveCatCode((prev) => prev || created.code);
                showToast("Category created");
              } else {
                // IMPORTANT: code is identifier -> if user edits code, treat carefully (usually you should NOT allow code edit)
                const updated = await updateCategory(catModal.item.code, { name: payload.name });
                setCats((prev) => prev.map((c) => (c.code === catModal.item.code ? updated : c)));
                showToast("Category updated");
              }
              setCatModal({ open: false, mode: "create", item: null });
            } catch (e) {
              setError(e.message || "Failed");
            }
          }}
        />
      )}

      {subModal.open && activeCategory && (
        <SubcategoryModal
          title={subModal.mode === "create" ? "Add Subcategory" : "Edit Subcategory"}
          submitLabel={subModal.mode === "create" ? "Create" : "Save"}
          initial={
            subModal.item || {
              name: "",
              code: "",
              validation: defaultValidation(),
            }
          }
          onClose={() => setSubModal({ open: false, mode: "create", item: null })}
          onSubmit={async (payload) => {
            setError("");
            try {
              if (subModal.mode === "create") {
                const created = await createSubcategory(activeCategory.code, payload);
                setSubs((prev) => [created, ...prev]);
                showToast("Subcategory created");
                loadCategories(); // refresh counts
              } else {
                const updated = await updateSubcategory(activeCategory.code, subModal.item.code, payload);
                setSubs((prev) => prev.map((s) => (s.code === subModal.item.code ? updated : s)));
                showToast("Subcategory updated");
              }
              setSubModal({ open: false, mode: "create", item: null });
            } catch (e) {
              setError(e.message || "Failed");
            }
          }}
        />
      )}
    </div>
  );
}

/* ---------- helpers ---------- */

function subsCountFallback(cat, subs, activeCatCode) {
  // if backend doesn't send subcategories_count, show current loaded count for active category, else 0
  if (cat?.code === activeCatCode) return subs?.length ?? 0;
  return 0;
}

/* ---------- Modals ---------- */

function CategoryModal({ title, submitLabel, initial, onClose, onSubmit }) {
  const [name, setName] = useState(initial.name || "");
  const [code, setCode] = useState(initial.code || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!name.trim()) return setErr("Category name is required");
    if (!code.trim()) return setErr("Category code is required");

    setBusy(true);
    try {
      await onSubmit({ name, code });
    } catch (e2) {
      setErr(e2.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <Field label="Category name">
          <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <Field label="Code (used in API & DB)">
          <input
            style={styles.input}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="example: roads"
            disabled={!!initial.code} // disable editing code on edit (safer)
          />
        </Field>

        {err && <ErrorBox text={err} />}
        <FooterButtons onClose={onClose} busy={busy} submitLabel={submitLabel} />
      </form>
    </ModalShell>
  );
}

function SubcategoryModal({ title, submitLabel, initial, onClose, onSubmit }) {
  const [name, setName] = useState(initial.name || "");
  const [code, setCode] = useState(initial.code || "");
  const [validation, setValidation] = useState(initial.validation || defaultValidation());

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!name.trim()) return setErr("Subcategory name is required");
    if (!code.trim()) return setErr("Subcategory code is required");

    setBusy(true);
    try {
      await onSubmit({ name, code, validation });
    } catch (e2) {
      setErr(e2.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Subcategory name">
            <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Code (used in API & ML)">
            <input
              style={styles.input}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="example: pothole"
              disabled={!!initial.code} // safer on edit
            />
          </Field>
        </div>

        <div style={{ marginTop: 4, padding: 12, border: "1px solid #e5e7eb", borderRadius: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Validation rules</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Min description length">
              <input
                style={styles.input}
                type="number"
                min={0}
                value={validation.min_description_len ?? 0}
                onChange={(e) => setValidation((v) => ({ ...v, min_description_len: Number(e.target.value || 0) }))}
              />
            </Field>

            <Field label="Required fields (comma separated)">
              <input
                style={styles.input}
                value={(validation.required_fields || []).join(",")}
                onChange={(e) =>
                  setValidation((v) => ({
                    ...v,
                    required_fields: e.target.value
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  }))
                }
                placeholder="description, location"
              />
            </Field>

            <Field label="Min attachments">
              <input
                style={styles.input}
                type="number"
                min={0}
                value={validation.attachments?.min ?? 0}
                onChange={(e) =>
                  setValidation((v) => ({
                    ...v,
                    attachments: { ...(v.attachments || {}), min: Number(e.target.value || 0) },
                  }))
                }
              />
            </Field>

            <Field label="Max attachments">
              <input
                style={styles.input}
                type="number"
                min={0}
                value={validation.attachments?.max ?? 0}
                onChange={(e) =>
                  setValidation((v) => ({
                    ...v,
                    attachments: { ...(v.attachments || {}), max: Number(e.target.value || 0) },
                  }))
                }
              />
            </Field>
          </div>
        </div>

        {err && <ErrorBox text={err} />}
        <FooterButtons onClose={onClose} busy={busy} submitLabel={submitLabel} />
      </form>
    </ModalShell>
  );
}

/* ---------- UI helpers ---------- */

function ValidationPreview({ v }) {
  if (!v) return <span style={{ color: "#6b7280" }}>—</span>;
  return (
    <div style={{ display: "grid", gap: 4, fontSize: 13, color: "#374151" }}>
      <div>
        Required: <b>{(v.required_fields || []).join(", ") || "—"}</b>
      </div>
      <div>
        Attachments: <b>{v.attachments?.min ?? 0}</b> to <b>{v.attachments?.max ?? 0}</b>
      </div>
      <div>
        Min desc len: <b>{v.min_description_len ?? 0}</b>
      </div>
    </div>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div style={styles.modalOverlay} onMouseDown={onClose}>
      <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button style={{ ...styles.smallBtn, background: "#e5e7eb", color: "#111827" }} onClick={onClose} type="button">
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

/* ---------- styles ---------- */

const styles = {
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    gap: 12,
    flexWrap: "wrap",
  },
  grid: { display: "grid", gridTemplateColumns: "420px 1fr", gap: 12 },
  rightHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" },
  sectionTitle: { fontWeight: 900, marginBottom: 10, fontSize: 16 },
  card: {
    background: "white",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    border: "1px solid rgba(17,24,39,0.06)",
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
    fontWeight: 800,
  },
  smallBtn: {
    border: "none",
    padding: "8px 10px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 800,
  },

  // avoid React warning by not mixing border + borderColor:
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.10)",
    cursor: "pointer",
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
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e0e7ff",
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
    width: "min(760px, 100%)",
    background: "white",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
  },
  form: { marginTop: 12, display: "grid", gap: 10 },
  label: { fontSize: 13, color: "#374151", fontWeight: 800, display: "block", marginBottom: 6 },
};
