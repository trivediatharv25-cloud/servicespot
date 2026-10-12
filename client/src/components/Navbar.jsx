import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { CalendarCheck, ChevronDown, LayoutGrid, LogOut, Menu, Search, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const links = [
    { to: "/browse", label: "Browse", icon: Search },
    ...(user?.role === "provider" ? [{ to: "/dashboard", label: "My dashboard", icon: LayoutGrid }] : []),
    ...(user?.role === "user" ? [{ to: "/my-bookings", label: "My bookings", icon: CalendarCheck }] : []),
  ];

  // Close any open menu when the route changes
  useEffect(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // Account dropdown: close on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Mobile drawer: lock page scroll while open, close on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const handleLogout = () => {
    setDrawerOpen(false);
    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  const firstName = user?.name?.split(" ")[0] || "Account";
  const initial = (user?.name || "?").charAt(0).toUpperCase();

  const desktopLink = ({ isActive }) =>
    `flex items-center gap-1.5 transition-colors ${
      isActive ? "text-brass-400" : "text-ink-100 hover:text-brass-400"
    }`;

  return (
    <nav className="bg-ink-900 text-paper px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 h-16 border-b border-ink-700">
      <Link to="/" className="font-serif font-semibold text-xl tracking-tight text-paper">
        ServiceSpot
      </Link>

      <div className="flex items-center gap-4 sm:gap-6 text-sm">
        {/* Desktop links */}
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={(s) => `hidden sm:flex ${desktopLink(s)}`}>
            <Icon size={16} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}

        {user && <NotificationBell />}

        {/* Desktop account menu */}
        {user ? (
          <div className="relative hidden sm:block" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 border border-ink-500 hover:border-brass-400 transition-colors pl-1.5 pr-3 py-1 rounded-full"
            >
              <span className="w-6 h-6 rounded-full bg-brass-500 text-ink-900 text-xs font-semibold flex items-center justify-center">
                {initial}
              </span>
              <span>{firstName}</span>
              <ChevronDown size={14} className={`transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-60 bg-white text-ink-900 rounded-md border border-ink-100 shadow-lg overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-ink-100">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-xs text-ink-500 truncate">{user.email}</p>
                  <p className="text-xs text-ink-400 mt-1">
                    {user.role === "provider" ? "Service provider" : "Customer"}
                  </p>
                </div>
                <button
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-paper-200 transition-colors"
                >
                  <LogOut size={15} strokeWidth={1.75} /> Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-3">
            <Link to="/register" className="text-ink-100 hover:text-brass-400 transition-colors">
              Register
            </Link>
            <Link
              to="/login"
              className="bg-brass-500 hover:bg-brass-600 text-ink-900 font-medium px-4 py-1.5 rounded-full transition-colors"
            >
              Login
            </Link>
          </div>
        )}

        {/* Mobile menu button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="sm:hidden -mr-1 p-2 text-ink-100 hover:text-brass-400 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={22} strokeWidth={1.75} />
        </button>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 sm:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => setDrawerOpen(false)} />
          <div className="drawer-in absolute right-0 top-0 h-full w-[82%] max-w-xs bg-ink-900 border-l border-ink-700 flex flex-col pb-safe">
            <div className="h-16 px-5 flex items-center justify-between border-b border-ink-700">
              <span className="font-serif font-semibold text-lg">Menu</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 -mr-2 text-ink-100 hover:text-brass-400"
                aria-label="Close menu"
              >
                <X size={22} strokeWidth={1.75} />
              </button>
            </div>

            {user && (
              <div className="px-5 py-4 flex items-center gap-3 border-b border-ink-700">
                <span className="w-10 h-10 rounded-full bg-brass-500 text-ink-900 font-semibold flex items-center justify-center">
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-xs text-ink-300 truncate">
                    {user.role === "provider" ? "Service provider" : "Customer"}
                  </p>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-2">
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-5 py-3.5 text-base transition-colors ${
                      isActive ? "text-brass-400 bg-ink-800" : "text-ink-100 hover:bg-ink-800"
                    }`
                  }
                >
                  <Icon size={18} strokeWidth={1.75} /> {label}
                </NavLink>
              ))}
            </div>

            <div className="px-5 pt-3 border-t border-ink-700">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 border border-ink-500 rounded-full py-2.5 text-sm hover:border-brass-400 hover:text-brass-400 transition-colors"
                >
                  <LogOut size={16} strokeWidth={1.75} /> Log out
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    className="text-center bg-brass-500 hover:bg-brass-600 text-ink-900 font-medium rounded-full py-2.5 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-center border border-ink-500 rounded-full py-2.5 text-sm hover:border-brass-400 transition-colors"
                  >
                    Create an account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
