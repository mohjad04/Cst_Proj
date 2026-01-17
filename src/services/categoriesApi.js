// src/services/categoriesApi.js
const BASE = "http://127.0.0.1:8000";

async function http(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });

  if (!res.ok) {
    let msg = "Failed";
    try {
      const data = await res.json();
      msg = data.detail || JSON.stringify(data);
    } catch { }
    throw new Error(msg);
  }

  return res.status === 204 ? null : res.json();
}

/** Default validation object used for new/edit subcategories */
export function defaultValidation() {
  return {
    required_fields: ["description", "location"],
    attachments: { min: 0, max: 4 },
    min_description_len: 10,
  };
}

/* Categories */
export async function listCategories() {
  return http("/admin/categories");
}

export async function createCategory(payload) {
  // payload: { name, code }
  return http("/admin/categories", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateCategory(code, payload) {
  // payload: { name } or { active }
  return http(`/admin/categories/${code}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function toggleCategory(code) {
  return http(`/admin/categories/${code}/toggle`, { method: "POST" });
}

export async function deleteCategory(code) {
  return http(`/admin/categories/${code}/delete`, { method: "POST" });
}

/* Subcategories */
export async function listSubcategories(categoryCode) {
  return http(`/admin/categories/${categoryCode}/subcategories`);
}

export async function createSubcategory(categoryCode, payload) {
  // payload: { name, code, validation: { required_fields, attachments:{min,max}, min_description_len } }
  return http(`/admin/categories/${categoryCode}/subcategories`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSubcategory(categoryCode, subCode, payload) {
  return http(`/admin/categories/${categoryCode}/subcategories/${subCode}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function toggleSubcategory(categoryCode, subCode) {
  return http(`/admin/categories/${categoryCode}/subcategories/${subCode}/toggle`, { method: "POST" });
}

export async function deleteSubcategory(categoryCode, subCode) {
  return http(`/admin/categories/${categoryCode}/subcategories/${subCode}`, { method: "DELETE" });
}
