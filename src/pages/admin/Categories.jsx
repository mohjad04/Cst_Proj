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
} from "../../services/categoriesApi";

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
    setTimeout(() => setToast(""), 2200);
  }

  async function loadCategories() {
    setLoadingCats(true);
    setError("");
    try {
      const rows = await listCategories();
      setCats(rows || []);
      setActiveCatId((prev) => {
        const first = rows?.[0]?.id ?? null;
        if (!prev) return first;
        if (!rows?.some((c) => c.id === prev)) return first;
        return prev;
      });
    } catch (e) {
      setError(e.message || "Failed to load categories");
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
    loadSubcategories(activeCatId);
  }, [activeCatId]);

  const categoriesFiltered = useMemo(() => {
    const query = qCat.trim().toLowerCase();
    return cats.filter((c) => c.name.toLowerCase().includes(query));
  }, [cats, qCat]);

  const activeCategory = useMemo(
    () => cats.find((c) => c.id === activeCatId) || null,
    [cats, activeCatId]
  );

  const subFiltered = useMemo(() => {
    const query = qSub.trim().toLowerCase();
    return subs.filter((s) => s.name.toLowerCase().includes(query));
  }, [subs, qSub]);

  async function onToggleSub(subId) {
    try {
      const updated = await toggleSubcategory(activeCatId, subId);
      setSubs((prev) => prev.map((s) => (s.id === subId ? updated : s)));
    } catch (e) {
      setError(e.message || "Failed");
    }
  }

  async function onDeleteSub(subId) {
    if (!confirm("Delete this subcategory?")) return;
    try {
      await deleteSubcategory(activeCatId, subId);
      setSubs((prev) => prev.filter((s) => s.id !== subId));
      loadCategories();
    } catch (e) {
      setError(e.message || "Failed");
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={styles.headerRow}>
        <h1 style={{ margin: 0 }}>Categories</h1>
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

      {error && <ErrorBox text={error} />}
      {toast && <div style={{ ...styles.card, background: "#f0fdf4" }}>{toast}</div>}

      <div style={styles.grid}>
        {/* Categories */}
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
                  key={c.id}
                  style={{
                    ...styles.itemRow,
                    borderColor: c.id === activeCatId ? "#111827" : "rgba(17,24,39,0.10)",
                  }}
                  onClick={() => setActiveCatId(c.id)}
                >
                  <div style={{ fontWeight: 900 }}>{c.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subcategories */}
        <div style={styles.card}>
          <div style={styles.rightHeader}>
            <div>
              <div style={styles.sectionTitle}>Subcategories</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                Selected: <b>{activeCategory?.name || "—"}</b>
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

          {loadingSubs ? (
            <div style={{ padding: 12 }}>Loading…</div>
          ) : (
            <table style={{ ...styles.table, marginTop: 10 }}>
              <thead>
                <tr>
                  <th style={styles.th}>Subcategory</th>
                  <th style={styles.th}>Priority</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {subFiltered.map((s) => (
                  <tr key={s.id}>
                    <td style={styles.td}>{s.name}</td>
                    <td style={styles.td}>{s.priority}</td>
                    <td style={styles.td}>
                      <span style={styles.badge}>{s.active ? "Active" : "Disabled"}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button
                          style={{ ...styles.smallBtn, background: "#e5e7eb" }}
                          onClick={() => setSubModal({ controversies: false, open: true, mode: "edit", item: s })}
                        >
                          Edit
                        </button>
                        <button
                          style={{ ...styles.smallBtn, background: "#fee2e2" }}
                          onClick={() => onToggleSub(s.id)}
                        >
                          Toggle
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
              </tbody>
            </table>
          )}
        </div>
      </div>

      {catModal.open && (
        <CategoryModal
          title={catModal.mode === "create" ? "Add Category" : "Edit Category"}
          submitLabel={catModal.mode === "create" ? "Create" : "Save"}
          initial={catModal.item || { name: "" }}
          onClose={() => setCatModal({ open: false, mode: "create", item: null })}
          onSubmit={async (payload) => {
            if (catModal.mode === "create") await createCategory(payload);
            else await updateCategory(catModal.item.id, payload);
            loadCategories();
            setCatModal({ open: false, mode: "create", item: null });
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
            if (subModal.mode === "create") await createSubcategory(activeCategory.id, payload);
            else await updateSubcategory(activeCategory.id, subModal.item.id, payload);
            loadSubcategories(activeCategory.id);
            setSubModal({ open: false, mode: "create", item: null });
          }}
        />
      )}
    </div>
  );
}

/* ================= MODALS ================= */

function CategoryModal({ title, submitLabel, initial, onClose, onSubmit }) {
  const [name, setName] = useState(initial.name);

  return (
    <ModalShell title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ name });
        }}
        style={styles.form}
      >
        <Field label="Category name">
          <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <FooterButtons submitLabel={submitLabel} onClose={onClose} />
      </form>
    </ModalShell>
  );
}

function SubcategoryModal({ title, submitLabel, initial, onClose, onSubmit }) {
  const [name, setName] = useState(initial.name);
  const [priority, setPriority] = useState(initial.priority);

  return (
    <ModalShell title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ name, priority });
        }}
        style={styles.form}
      >
        <Field label="Subcategory name">
          <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Priority">
          <select style={styles.input} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
            <option value="P4">P4</option>
            <option value="P5">P5</option>
          </select>
        </Field>
        <FooterButtons submitLabel={submitLabel} onClose={onClose} />
      </form>
    </ModalShell>
  );
}

/* ================= UI HELPERS ================= */

function ModalShell({ title, onClose, children }) {
  return (
    <div style={styles.modalOverlay} onMouseDown={onClose}>
      <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <h2 style={{ margin: 0 }}>{title}</h2>
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

function FooterButtons({ onClose, submitLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
      <button type="button" style={{ ...styles.btn, background: "#e5e7eb", color: "#111827" }} onClick={onClose}>
        Cancel
      </button>
      <button type="submit" style={{ ...styles.btn, background: "#111827" }}>
        {submitLabel}
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

/* ================= STYLES ================= */

const styles = {
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 },
  grid: { display: "grid", gridTemplateColumns: "420px 1fr", gap: 12 },
  rightHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontWeight: 900, marginBottom: 10, fontSize: 16 },
  card: { background: "white", borderRadius: 14, padding: 14, boxShadow: "0 10px 25px rgba(0,0,0,0.06)" },
  input: { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" },
  btn: { border: "none", padding: "10px 14px", borderRadius: 10, fontWeight: 800, cursor: "pointer" },
  smallBtn: { border: "none", padding: "8px 10px", borderRadius: 10, fontWeight: 800, cursor: "pointer" },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(17,24,39,0.10)",
    cursor: "pointer",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #e5e7eb", fontSize: 13 },
  td: { padding: "10px 8px", borderBottom: "1px solid #e5e7eb" },
  badge: {
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    background: "#ecfeff",
    border: "1px solid #a5f3fc",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "grid",
    placeItems: "center",
    zIndex: 999,
  },
  modalCard: { background: "white", borderRadius: 14, padding: 16, width: "min(760px,100%)" },
  form: { display: "grid", gap: 10, marginTop: 12 },
  label: { fontSize: 13, fontWeight: 800, marginBottom: 6 },
};
