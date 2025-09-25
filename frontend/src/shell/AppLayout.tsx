// src/shell/AppLayout.tsx
import { NavLink, Outlet } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const link =
  "px-3 py-1.5 rounded-md text-sm font-medium hover:bg-neutral-100";
const active = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? `${link} bg-neutral-900 text-white hover:bg-neutral-900`
    : link;

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded hover:bg-neutral-100"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="block w-5 h-[2px] bg-black mb-[5px]" />
            <span className="block w-5 h-[2px] bg-black mb-[5px]" />
            <span className="block w-5 h-[2px] bg-black" />
          </button>

          {/* Brand */}
          <div className="text-lg font-semibold">Tour Secure</div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex gap-1 ml-4">
            <NavLink to="/" className={active}>
              Home
            </NavLink>
            <NavLink to="/heatmap" className={active}>
              Heatmap
            </NavLink>
            <NavLink to="/reviews" className={active}>
              Reviews
            </NavLink>
            <NavLink to="/itinerary" className={active}>
              Itinerary
            </NavLink>
            <NavLink to="/efir" className={active}>
              e-FIR
            </NavLink>
            <NavLink to="/digital-id" className={active}>
              Digital ID
            </NavLink>
            <NavLink to="/about" className={active}>
              About
            </NavLink>
            {user?.role === "admin" && (
              <NavLink to="/admin" className={active}>
                Admin
              </NavLink>
            )}
          </nav>

          {/* Auth controls */}
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm text-neutral-600">
                  Hi, {user.name}
                </span>
                <button
                  className="text-sm underline"
                  onClick={logout}
                >
                  Logout
                </button>
              </>
            ) : (
              <NavLink to="/login" className={active}>
                Login
              </NavLink>
            )}
          </div>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div className="md:hidden border-t bg-white">
            <nav className="px-4 py-2 grid gap-1">
              {[
                ["/", "Home"],
                ["/heatmap", "Heatmap"],
                ["/reviews", "Reviews"],
                ["/itinerary", "Itinerary"],
                ["/efir", "e-FIR"],
                ["/digital-id", "Digital ID"],
                ["/about", "About"],
              ].map(([to, label]) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    isActive
                      ? "px-3 py-2 rounded-md bg-neutral-900 text-white"
                      : "px-3 py-2 rounded-md hover:bg-neutral-100"
                  }
                >
                  {label}
                </NavLink>
              ))}
              {user?.role === "admin" && (
                <NavLink
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    isActive
                      ? "px-3 py-2 rounded-md bg-neutral-900 text-white"
                      : "px-3 py-2 rounded-md hover:bg-neutral-100"
                  }
                >
                  Admin
                </NavLink>
              )}
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="px-3 py-2 rounded-md text-left hover:bg-neutral-100"
                >
                  Logout
                </button>
              ) : (
                <NavLink
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-md hover:bg-neutral-100"
                >
                  Login
                </NavLink>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-neutral-600">
        © 2025 Tour Secure
      </footer>
    </div>
  );
}
