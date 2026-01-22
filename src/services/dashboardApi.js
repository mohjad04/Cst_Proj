// src/services/dashboardApi.js

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
    const token = auth?.access_token || auth?.token || auth?.accessToken;
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
        let msg = `Request failed (${res.status})`;
        try {
            const data = await res.json();
            msg = data?.detail || data?.message || msg;
        } catch { }
        throw new Error(msg);
    }

    return await res.json();
}

// Get admin dashboard data
export function getAdminDashboard() {
    return request("/admin/dashboard");
}

// Refresh dashboard data
export function refreshDashboard() {
    return getAdminDashboard();
}