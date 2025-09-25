import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

export function RequireAdmin({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user?.role === "admin" ? children : <Navigate to="/login" replace />;
}
