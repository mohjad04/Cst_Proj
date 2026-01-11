// Mock Categories API (replace with FastAPI later)
const KEY = "cst_categories_v1";

const DEFAULT = [
  {
    id: "cat_road",
    name: "Roads",
    code: "roads",
    active: true,
    created_at: "2026-01-02",
    subcategories: [
      {
        id: "sub_pothole",
        name: "Pothole",
        code: "pothole",
        active: true,
        validation: {
          required_fields: ["description", "location"],
          attachments: { min: 1, max: 4 },
          min_description_len: 10,
        },
      },
      {
        id: "sub_asphalt",
        name: "Asphalt Damage",
        code: "asphalt_damage",
        active: true,
        validation: {
          required_fields: ["description", "location"],
          attachments: { min: 0, max: 4 },
          min_description_len: 10,
        },
      },
    ],
  },
  {
    id: "cat_water",
    name: "Water",
    code: "water",
    active: true,
    created_at: "2026-01-04",
    subcategories: [
      {
        id: "sub_leak",
        name: "Water Leak",
        code: "water_leak",
        active: true,
        validation: {
          required_fields: ["description", "location"],
          attachments: { min: 1, max: 4 },
          min_description_len: 10,
        },
      },
    ],
  },
];

function uid(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function read() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return DEFAULT;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function normCode(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export async function listCategories() {
  await new Promise((r) => setTimeout(r, 160));
  return read();
}

export async function createCategory(payload) {
  await new Promise((r) => setTimeout(r, 220));
  const data = read();

  const name = payload.name.trim();
  const code = normCode(payload.code || payload.name);

  if (!name) throw new Error("Category name is required");
  if (!code) throw new Error("Category code is required");

  // unique code
  if (data.some((c) => c.code === code)) {
    const err = new Error("Category code already exists");
    err.code = "DUPLICATE_CODE";
    throw err;
  }

  const item = {
    id: uid("cat"),
    name,
    code,
    active: true,
    created_at: new Date().toISOString().slice(0, 10),
    subcategories: [],
  };

  data.unshift(item);
  write(data);
  return item;
}

export async function updateCategory(catId, payload) {
  await new Promise((r) => setTimeout(r, 220));
  const data = read();
  const idx = data.findIndex((c) => c.id === catId);
  if (idx === -1) throw new Error("Category not found");

  const next = { ...data[idx] };

  if (payload.name != null) next.name = payload.name.trim();
  if (payload.code != null) next.code = normCode(payload.code);

  if (!next.name) throw new Error("Category name is required");
  if (!next.code) throw new Error("Category code is required");

  if (data.some((c) => c.code === next.code && c.id !== catId)) {
    const err = new Error("Category code already exists");
    err.code = "DUPLICATE_CODE";
    throw err;
  }

  data[idx] = next;
  write(data);
  return next;
}

export async function toggleCategoryActive(catId) {
  await new Promise((r) => setTimeout(r, 160));
  const data = read();
  const idx = data.findIndex((c) => c.id === catId);
  if (idx === -1) throw new Error("Category not found");

  const updated = { ...data[idx], active: !data[idx].active };
  data[idx] = updated;

  // if category disabled => disable all subcategories (optional)
  if (!updated.active) {
    updated.subcategories = updated.subcategories.map((s) => ({ ...s, active: false }));
  }

  write(data);
  return updated;
}

export async function deleteCategory(catId) {
  await new Promise((r) => setTimeout(r, 160));
  const data = read();
  const cat = data.find((c) => c.id === catId);
  if (!cat) throw new Error("Category not found");

  // prevent delete if has subcategories
  if ((cat.subcategories || []).length > 0) {
    const err = new Error("Cannot delete category: remove its subcategories first.");
    err.code = "HAS_SUBCATEGORIES";
    throw err;
  }

  const next = data.filter((c) => c.id !== catId);
  write(next);
  return true;
}

/* -------- Subcategories -------- */

export async function createSubcategory(catId, payload) {
  await new Promise((r) => setTimeout(r, 220));
  const data = read();
  const idx = data.findIndex((c) => c.id === catId);
  if (idx === -1) throw new Error("Category not found");

  const name = payload.name.trim();
  const code = normCode(payload.code || payload.name);

  if (!name) throw new Error("Subcategory name is required");
  if (!code) throw new Error("Subcategory code is required");

  // unique within all subcategories
  const allSubCodes = data.flatMap((c) => c.subcategories || []).map((s) => s.code);
  if (allSubCodes.includes(code)) {
    const err = new Error("Subcategory code already exists");
    err.code = "DUPLICATE_SUB_CODE";
    throw err;
  }

  const sub = {
    id: uid("sub"),
    name,
    code,
    active: true,
    validation: payload.validation || defaultValidation(),
  };

  data[idx] = { ...data[idx], subcategories: [sub, ...(data[idx].subcategories || [])] };
  write(data);
  return sub;
}

export async function updateSubcategory(catId, subId, payload) {
  await new Promise((r) => setTimeout(r, 220));
  const data = read();
  const cIdx = data.findIndex((c) => c.id === catId);
  if (cIdx === -1) throw new Error("Category not found");

  const subs = data[cIdx].subcategories || [];
  const sIdx = subs.findIndex((s) => s.id === subId);
  if (sIdx === -1) throw new Error("Subcategory not found");

  const next = { ...subs[sIdx] };

  if (payload.name != null) next.name = payload.name.trim();
  if (payload.code != null) next.code = normCode(payload.code);
  if (payload.validation != null) next.validation = payload.validation;

  if (!next.name) throw new Error("Subcategory name is required");
  if (!next.code) throw new Error("Subcategory code is required");

  const all = data.flatMap((c) => c.subcategories || []);
  if (all.some((s) => s.code === next.code && s.id !== subId)) {
    const err = new Error("Subcategory code already exists");
    err.code = "DUPLICATE_SUB_CODE";
    throw err;
  }

  const newSubs = subs.map((s) => (s.id === subId ? next : s));
  data[cIdx] = { ...data[cIdx], subcategories: newSubs };
  write(data);
  return next;
}

export async function toggleSubcategoryActive(catId, subId) {
  await new Promise((r) => setTimeout(r, 160));
  const data = read();
  const cIdx = data.findIndex((c) => c.id === catId);
  if (cIdx === -1) throw new Error("Category not found");

  const subs = data[cIdx].subcategories || [];
  const sIdx = subs.findIndex((s) => s.id === subId);
  if (sIdx === -1) throw new Error("Subcategory not found");

  subs[sIdx] = { ...subs[sIdx], active: !subs[sIdx].active };
  data[cIdx] = { ...data[cIdx], subcategories: subs };
  write(data);
  return subs[sIdx];
}

export async function deleteSubcategory(catId, subId) {
  await new Promise((r) => setTimeout(r, 160));
  const data = read();
  const cIdx = data.findIndex((c) => c.id === catId);
  if (cIdx === -1) throw new Error("Category not found");

  const subs = data[cIdx].subcategories || [];
  data[cIdx] = { ...data[cIdx], subcategories: subs.filter((s) => s.id !== subId) };
  write(data);
  return true;
}

export function defaultValidation() {
  return {
    required_fields: ["description", "location"],
    attachments: { min: 0, max: 4 },
    min_description_len: 10,
  };
}
