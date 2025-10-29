// src/shell/AppLayout.tsx
import { NavLink, Outlet, useLocation } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { http } from "@/lib/http";

const linkBase =
  "px-3 py-1.5 rounded-md text-sm font-medium hover:bg-neutral-100";
const linkActive = "bg-neutral-900 text-white hover:bg-neutral-900";
const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${linkBase} ${linkActive}` : linkBase;

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  // user-specific visibility flags
  const [hasItinerary, setHasItinerary] = useState(false);
  const [hasEFIR, setHasEFIR] = useState(false);
  const [checking, setChecking] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    if (open) setOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // no-op
    }
  };

  // Helper: try a list of candidate API paths and return first count we can read
  const getCountFromCandidates = async (candidates: string[]): Promise<number> => {
    for (const path of candidates) {
      try {
        const { data, status } = await http.get(path);
        if (status >= 200 && status < 300) {
          const arr = Array.isArray(data) ? data : (data?.items ?? []);
          if (Array.isArray(arr)) return arr.length;
        }
      } catch (e: any) {
        // ignore and try next candidate
      }
    }
    return 0;
  };

  // Check if the logged-in user has at least one itinerary/e-FIR
  useEffect(() => {
    let cancelled = false;

    async function checkUserData() {
      if (!user) {
        if (!cancelled) {
          setHasItinerary(false);
          setHasEFIR(false);
        }
        return;
      }

      setChecking(true);

      // If your backend has different mount points, these candidates cover common cases.
      const itineraryCandidates = [
        "/itinerary",          // e.g., app uses /api baseURL -> /api/itinerary
        "/misc/itinerary",     // if routes were mounted as /api/misc
        "/user/itinerary"      // if user-scoped controller
      ];
      const efirCandidates = [
        "/efir",
        "/misc/efir",
        "/user/efir"
      ];

      const [itCount, efCount] = await Promise.all([
        getCountFromCandidates(itineraryCandidates),
        getCountFromCandidates(efirCandidates),
      ]);

      if (!cancelled) {
        setHasItinerary(itCount > 0);
        setHasEFIR(efCount > 0);
        setChecking(false);
      }
    }

    checkUserData();
    return () => {
      cancelled = true;
    };
  }, [user]);

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

            {/* Show only after the user has created at least one item */}
            {user && hasItinerary && (
              <NavLink to="/itinerary" className={linkClass}>
                Itinerary
              </NavLink>
            )}
            {user && hasEFIR && (
              <NavLink to="/efir" className={linkClass}>
                e-FIR
              </NavLink>
            )}

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
          <div className="ml-auto flex items-center gap-3">
            {/* If user is logged in but has no data yet, show small CTAs so they can create the first item. */}
            {user && !checking && !hasItinerary && (
              <NavLink
                to="/itinerary"
                className="text-xs underline text-neutral-700 hover:text-black"
                title="Create your first itinerary"
              >
                Create Itinerary
              </NavLink>
            )}
            {user && !checking && !hasEFIR && (
              <NavLink
                to="/efir"
                className="text-xs underline text-neutral-700 hover:text-black"
                title="File your first e-FIR"
              >
                File e-FIR
              </NavLink>
            )}

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
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive
                    ? "px-3 py-2 rounded-md bg-neutral-900 text-white"
                    : "px-3 py-2 rounded-md hover:bg-neutral-100"
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/heatmap"
                className={({ isActive }) =>
                  isActive
                    ? "px-3 py-2 rounded-md bg-neutral-900 text-white"
                    : "px-3 py-2 rounded-md hover:bg-neutral-100"
                }
              >
                Heatmap
              </NavLink>
              <NavLink
                to="/reviews"
                className={({ isActive }) =>
                  isActive
                    ? "px-3 py-2 rounded-md bg-neutral-900 text-white"
                    : "px-3 py-2 rounded-md hover:bg-neutral-100"
                }
              >
                Reviews
              </NavLink>

              {/* Tabs still hidden until there's data */}
              {user && hasItinerary && (
                <NavLink
                  to="/itinerary"
                  className={({ isActive }) =>
                    isActive
                      ? "px-3 py-2 rounded-md bg-neutral-900 text-white"
                      : "px-3 py-2 rounded-md hover:bg-neutral-100"
                  }
                >
                  Itinerary
                </NavLink>
              )}
              {user && hasEFIR && (
                <NavLink
                  to="/efir"
                  className={({ isActive }) =>
                    isActive
                      ? "px-3 py-2 rounded-md bg-neutral-900 text-white"
                      : "px-3 py-2 rounded-md hover:bg-neutral-100"
                  }
                >
                  e-FIR
                </NavLink>
              )}

              <NavLink
                to="/digital-id"
                className={({ isActive }) =>
                  isActive
                    ? "px-3 py-2 rounded-md bg-neutral-900 text-white"
                    : "px-3 py-2 rounded-md hover:bg-neutral-100"
                }
              >
                Digital ID
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  isActive
                    ? "px-3 py-2 rounded-md bg-neutral-900 text-white"
                    : "px-3 py-2 rounded-md hover:bg-neutral-100"
                }
              >
                About
              </NavLink>

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
                <>
                  {/* Mobile CTAs so you can create first items */}
                  {!hasItinerary && (
                    <NavLink
                      to="/itinerary"
                      className="px-3 py-2 rounded-md hover:bg-neutral-100"
                    >
                      Create Itinerary
                    </NavLink>
                  )}
                  {!hasEFIR && (
                    <NavLink
                      to="/efir"
                      className="px-3 py-2 rounded-md hover:bg-neutral-100"
                    >
                      File e-FIR
                    </NavLink>
                  )}
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-left hover:bg-neutral-100"
                  >
                    Logout
                  </button>
                </>
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
