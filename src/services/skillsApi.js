// src/services/skillsApi.js

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

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
    const token = auth?.access_token || auth?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...authHeader(),
        },
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Request failed");
    }

    return res.json();
}

// 🔥 MAIN FUNCTION
export async function listSkillsFromCategories() {
    const categories = await request("/admin/categories");

    const skills = [];

    for (const c of categories) {
        const subs = await request(`/admin/categories/${c.id}/subcategories`);

        for (const s of subs) {
            skills.push({
                value: `${c.id}:${s.id}`, // unique
                label: `${c.name} → ${s.name}`,
            });
        }
    }

    return skills;
}
