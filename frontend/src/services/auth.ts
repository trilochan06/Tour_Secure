import { api } from "../lib/axios";

export async function login(email: string, password: string) {
  const { data } = await api.post("/api/auth/login", { email, password });
  return data;
}

export async function register(name: string, email: string, password: string) {
  const { data } = await api.post("/api/auth/register", { name, email, password });
  return data;
}

export async function me() {
  const { data } = await api.get("/api/auth/me");
  return data;
}

export async function logout() {
  const { data } = await api.post("/api/auth/logout");
  return data;
}
