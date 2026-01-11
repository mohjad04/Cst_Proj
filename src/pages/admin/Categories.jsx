import React, { useEffect, useMemo, useState } from "react";
import {
  createCategory,
  createSubcategory,
  defaultValidation,
  deleteCategory,
  deleteSubcategory,
  listCategories,
  toggleCategoryActive,
  toggleSubcategoryActive,
  updateCategory,
  updateSubcategory,
} from "../../services/categoriesApi";

export default function Categories() {
  const [data, setData] = useState([]);
  const [activeCatId, setActiveCatId] = useState(null);
  const [loading, setLoading] = useState(true);

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

  async function load() {
    setLoading(true);
    setError("");
    try {
      const rows = await listCategories();
      setData(rows);
      if (!activeCatId && rows[0]?.id) setActiveCatId(rows[0].id);
      if (activeCatId && !rows.some((c) => c.id === activeCatId)) {
        setActiveCatId(rows[0]?.id ?? null);
      }
    } catch (e) {
      setError(e.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoriesFiltered = useMemo(() => {
    const query = qCat.trim().toLowerCase();
    return data.filter((c) => {
      if (!query) return true;
      return (
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query)
      );
    });
  }, [data, qCat]);

  const activeCategory = useMemo(() => data.find((c) => c.id === activeCatId) || null, [data, activeCatId]);

  const subFiltered = useMemo(() => {
    const subs = activeCategory?.subcategories || [];
    const query = qSub.trim().toLowerCase();
    return subs.filter((s) => {
      if (!query) return true;
      return (
        s.name.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query)
      );
    });
  }, [activeCategory, qSub]);

  async function onToggleCategory(catId) {
    setError("");
    try {
      const updated = await toggleCategoryActive(catId);
      setData((prev) => prev.map((c) => (c.id === catId ? updated : c)));
      showToast(updated.active ? "Category enabled" : "Category disabled");
    } catch (e) {
      setError(e.message || "Failed");
    }
  }

  async function onDeleteCategory(catId) {
    const ok = confirm("Delete this category? (must have 0 subcategories)");
    if (!ok) return;

    setError("");
    try {
      await deleteCategory(catId);
      setData((prev) => prev.filter((c) => c.id !== catId));
      if (activeCatId === catId) setActiveCatId(null);
      showToast("Category deleted");
    } catch (e) {
      setError(e.message || "Failed");
    }
  }

  async function onToggleSub(subId) {
    setError("");
    try {
      const updated = await toggleSubcategoryActive(activeCatId, subId);
      setData((prev) =>
        prev.map((c) =>
          c.id !== activeCatId
            ? c
            : { ...c, subcategories: c.subcategories.map((s) => (s.id === subId ? updated : s)) }
        )
      );
      showToast(updated.active ? "Subcategory enabled" : "Subcategory disabled");
    } catch (e) {
      setError(e.message || "Failed");
    }
  }

  async function onDeleteSub(subId) {
    const ok = confirm("Delete this subcategory?");
    if (!ok) return;

    setError("");
    try {
      await deleteSubcategory(activeCatId, subId);
      setData((prev) =>
        prev.map((c) =>
          c.id !== activeCatId ? c : { ...c, subcategories: c.subcategories.filter((s) => s.id !== subId) }
        )
      );
      showToast("Subcategory deleted");
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
          <button style={{ ...styles.btn, background: "#111827" }} onClick={() => setCatModal({ open: true, mode: "create", item: null })}>
            + Add Category
          </button>
          <button style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }} onClick={load}>
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

          {loading ? (
            <div style={{ padding: 12 }}>Loading…</div>
          ) : (
            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              {categoriesFiltered.map((c) => (
                <div
                  key={c.id}
                  style={{
                    ...styles.itemRow,
                    borderColor: c.id === activeCatId ? "#111827" : "rgba(17,24,39,0.08)",
                  }}
                  onClick={() => setActiveCatId(c.id)}
                >
                  <div>
                    <div style={{ fontWeight: 900 }}>{c.name}</div>
                    <div style={{ color: "#6b7280", fontSize: 12 }}>code: {c.code}</div>
                    <div style={{ color: "#6b7280", fontSize: 12 }}>
                      subcategories: {(c.subcategories || []).length}
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
                          onToggleCategory(c.id);
                        }}
                      >
                        {c.active ? "Disable" : "Enable"}
                      </button>
                      <button
                        style={{ ...styles.smallBtn, background: "#111827", color: "white" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCategory(c.id);
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
                    <tr key={s.id}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 900 }}>{s.name}</div>
                        <div style={{ color: "#6b7280", fontSize: 12 }}>ID: {s.id}</div>
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
                            onClick={() => onToggleSub(s.id)}
                          >
                            {s.active ? "Disable" : "Enable"}
                          </button>
                          <button
                            style={{ ...styles.smallBtn, background: "#111827", color: "white" }}
                            onClick={() => onDeleteSub(s.id)}
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
                setData((prev) => [created, ...prev]);
                if (!activeCatId) setActiveCatId(created.id);
                showToast("Category created");
              } else {
                const updated = await updateCategory(catModal.item.id, payload);
                setData((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
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
                const created = await createSubcategory(activeCategory.id, payload);
                setData((prev) =>
                  prev.map((c) =>
                    c.id !== activeCategory.id
                      ? c
                      : { ...c, subcategories: [created, ...(c.subcategories || [])] }
                  )
                );
                showToast("Subcategory created");
              } else {
                const updated = await updateSubcategory(activeCategory.id, subModal.item.id, payload);
                setData((prev) =>
                  prev.map((c) =>
                    c.id !== activeCategory.id
                      ? c
                      : {
                          ...c,
                          subcategories: c.subcategories.map((s) => (s.id === updated.id ? updated : s)),
                        }
                  )
                );
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
          <input style={styles.input} value={code} onChange={(e) => setCode(e.target.value)} placeholder="example: roads" />
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
            <input style={styles.input} value={code} onChange={(e) => setCode(e.target.value)} placeholder="example: pothole" />
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
                onChange={(e) =>
                  setValidation((v) => ({ ...v, min_description_len: Number(e.target.value || 0) }))
                }
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
      <div>Required: <b>{(v.required_fields || []).join(", ") || "—"}</b></div>
      <div>Attachments: <b>{v.attachments?.min ?? 0}</b> to <b>{v.attachments?.max ?? 0}</b></div>
      <div>Min desc len: <b>{v.min_description_len ?? 0}</b></div>
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
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(17,24,39,0.08)",
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
    width: "min(760px, 100%)",
    background: "white",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
  },
  form: { marginTop: 12, display: "grid", gap: 10 },
  label: { fontSize: 13, color: "#374151", fontWeight: 800, display: "block", marginBottom: 6 },
};
