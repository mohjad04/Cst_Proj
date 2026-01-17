// src/services/skillsApi.js
// Skills API (Categories + Subcategories for Teams)

const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

/* ---------- auth helpers (same as auditApi) ---------- */

function getAuth() {
    const raw = sessionStorage.getItem("cst_auth_v1");
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function authHeader() {
    const auth = getAuth();
    const token = auth?.access_token || auth?.token || auth?.accessToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { method = "GET", headers = {}, body } = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...authHeader(),
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
            const data = await res.json();
            msg = data?.detail || data?.message || msg;
        } catch {
            // ignore
        }
        throw new Error(msg);
    }

    return await res.json();
}

/* ---------- API ---------- */

/**
 * Returns skills grouped by category
 * [
 *   {
 *     category: "Roads",
 *     items: [
 *       { id: "696b...", label: "Pothole" }
 *     ]
 *   }
 * ]
 */
export async function listSkills() {
    return request("/admin/skills");
}
