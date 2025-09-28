// src/services/auth.ts
import { api } from "./api";

export type User = { id: string; name?: string; email: string; role?: string };

export async function me(): Promise<User | null> {
  const { data } = await api.get("/auth/me");
  return data?.user ?? null;
}

export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.post("/auth/login", { email, password });
  return data.user;
}

export async function register(name: string, email: string, password: string): Promise<User> {
  const { data } = await api.post("/auth/register", { name, email, password });
  return data.user;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}
