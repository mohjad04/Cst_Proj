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

async function request(path, { method = "GET", body } = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...authHeader(),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
            const data = await res.json();
            msg = data?.detail || msg;
        } catch { }
        throw new Error(msg);
    }

    if (res.status === 204) return null;
    return await res.json();
}
export function getCohorts(days = 30, limit = 20) {
    const qs = new URLSearchParams({ days: String(days), limit: String(limit) }).toString();
    return request(`/admin/analytics/cohorts?${qs}`);
    // OR if backend is not under /admin:
    // return request(`/analytics/cohorts?${qs}`);
}