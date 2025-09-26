import { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, register as apiRegister, me as apiMe, logout as apiLogout } from "@/services/auth";

type User = { id: string; name: string; email: string; role?: string } | null;

type AuthCtx = {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiMe();
        setUser(res.user || res.session || null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    await apiLogin(email, password);
    await refresh();
  };

  const register = async (name: string, email: string, password: string) => {
    await apiRegister(name, email, password);
    await refresh();
  };

  const refresh = async () => {
    const res = await apiMe();
    setUser(res.user || res.session || null);
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within <AuthProvider>");
  return v;
};
