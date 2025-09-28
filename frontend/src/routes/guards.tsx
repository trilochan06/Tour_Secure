import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function RequireAuth({ children }: { children?: React.ReactNode }) {
  const { loading, user } = useAuth();
  const loc = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />;

  return children ? <>{children}</> : <Outlet />;
}

export function RequireAdmin({ children }: { children?: React.ReactNode }) {
  const { loading, user } = useAuth();
  const loc = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  return children ? <>{children}</> : <Outlet />;
}
