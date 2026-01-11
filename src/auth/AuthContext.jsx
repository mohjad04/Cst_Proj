import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "./authApi";

const AuthContext = createContext(null);
const STORAGE_KEY = "cst_auth_v1";

function readStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => readStored());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    else sessionStorage.removeItem(STORAGE_KEY);
  }, [auth]);

  const value = useMemo(() => {
    return {
      user: auth?.user ?? null,
      token: auth?.token ?? null,
      isAuthenticated: Boolean(auth?.token),
      loading,
      async login(email, password) {
        setLoading(true);
        try {
          const res = await authApi.login(email, password);
          setAuth(res);
          return res;
        } finally {
          setLoading(false);
        }
      },
      async logout() {
        setLoading(true);
        try {
          await authApi.logout();
          setAuth(null);
        } finally {
          setLoading(false);
        }
      },
    };
  }, [auth, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
