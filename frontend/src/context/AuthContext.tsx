import { createContext, useContext, useEffect, useState } from "react";
import { http } from "@/lib/http";

type User = { id: string; email: string; name: string; role: "user"|"admin" } | null;
type AuthCtx = {
  user: User;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx>({ user: null, loading: true, login: async () => {}, logout: () => {} });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  async function hydrate() {
    try {
      const { data } = await http.get("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { hydrate(); }, []);

  async function login(token: string) {
    localStorage.setItem("auth_token", token);
    await hydrate();
  }
  function logout() {
    localStorage.removeItem("auth_token");
    setUser(null);
  }

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}
