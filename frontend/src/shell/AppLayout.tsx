// src/shell/AppLayout.tsx
import { NavLink, Outlet, useLocation } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const linkBase =
  "px-3 py-1.5 rounded-md text-sm font-medium hover:bg-neutral-100";
const linkActive = "bg-neutral-900 text-white hover:bg-neutral-900";
const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${linkBase} ${linkActive}` : linkBase;

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    if (open) setOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (_) {
      // no-op; keep UI responsive even if network hiccups
    }
  };

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Skip to content (a11y) */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 bg-white px-3 py-2 rounded-md shadow"
      >
        Skip to content
      </a>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded hover:bg-neutral-100"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
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
            <NavLink to="/" end className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/heatmap" className={linkClass}>
              Heatmap
            </NavLink>
            <NavLink to="/reviews" className={linkClass}>
              Reviews
            </NavLink>
            <NavLink to="/itinerary" className={linkClass}>
              Itinerary
            </NavLink>
            <NavLink to="/efir" className={linkClass}>
              e-FIR
            </NavLink>
            <NavLink to="/digital-id" className={linkClass}>
              Digital ID
            </NavLink>
            <NavLink to="/about" className={linkClass}>
              About
            </NavLink>
            {user?.role === "admin" && (
              <NavLink to="/admin" className={linkClass}>
                Admin
              </NavLink>
            )}
          </nav>

          {/* Auth controls */}
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm text-neutral-600">
                  Hi, {user.name || "User"}
                </span>
                <button className="text-sm underline" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
            )}
          </div>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div id="mobile-nav" className="md:hidden border-t bg-white">
            <nav className="px-4 py-2 grid gap-1">
              {[
                ["/", "Home", true],
                ["/heatmap", "Heatmap"],
                ["/reviews", "Reviews"],
                ["/itinerary", "Itinerary"],
                ["/efir", "e-FIR"],
                ["/digital-id", "Digital ID"],
                ["/about", "About"],
              ].map(([to, label, end]) => (
                <NavLink
                  key={to as string}
                  to={to as string}
                  end={Boolean(end)}
                  className={({ isActive }) =>
                    isActive
                      ? "px-3 py-2 rounded-md bg-neutral-900 text-white"
                      : "px-3 py-2 rounded-md hover:bg-neutral-100"
                  }
                >
                  {label as string}
                </NavLink>
              ))}

              {user?.role === "admin" && (
                <NavLink
                  to="/admin"
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
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-left hover:bg-neutral-100"
                >
                  Logout
                </button>
              ) : (
                <NavLink
                  to="/login"
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
      <main id="main" className="flex-1">
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-neutral-600">
        © {new Date().getFullYear()} Tour Secure
      </footer>
    </div>
  );
}
