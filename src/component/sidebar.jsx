// src/components/Sidebar.jsx
import React from "react";

/**
 * Sidebar - slide-in drawer, dark/light dual-tone, animated, icons inline
 *
 * Props:
 *  - open (bool) : whether drawer is visible (mobile)
 *  - onClose (fn) : close handler
 *  - onNavigate (fn) : called with path string when nav item clicked
 *  - user (object) : {email, role}
 *  - theme ('dark'|'light') optional - only for styling hints
 *
 * Note: This component uses Tailwind transitions; it's lightweight.
 */

const NavItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
      active ? "bg-gradient-to-r from-indigo-600 to-emerald-500 text-white shadow-md" : "text-slate-200 hover:bg-white/6"
    }`}
  >
    <span className="w-5 h-5 flex-none" aria-hidden dangerouslySetInnerHTML={{ __html: icon }} />
    <span className="flex-1 text-left">{label}</span>
  </button>
);

export default function Sidebar({
  open,
  onClose = () => {},
  onNavigate = (p) => {},
  user = { email: "guest@local", role: "GUEST" },
  active = "dashboard",
  theme = "dark",
}) {
  // Colors adapt via classes; theme prop can be used if desired
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 transition-opacity ${
          open ? "opacity-60 pointer-events-auto" : "opacity-0 pointer-events-none"
        } bg-black/40`}
        aria-hidden={!open}
      />

      {/* Sidebar drawer */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-72 max-w-[85%] transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } flex flex-col bg-gradient-to-b ${
          theme === "dark" ? "from-slate-900 to-slate-800" : "from-white to-slate-50"
        } shadow-xl`}
        aria-hidden={!open}
      >
        <div className="px-5 py-6 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg p-2 bg-white/6">
              {/* glyph */}
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M3 12h18M12 3v18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="text-white text-lg font-semibold leading-none">StockPro</div>
              <div className="text-xs text-white/70">Supermarket POS</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-3">
            <NavItem
              icon={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12h18M12 3v18"/></svg>`}
              label="Dashboard"
              active={active === "dashboard"}
              onClick={() => onNavigate("/admin")}
            />
            <NavItem
              icon={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`}
              label="Products"
              active={active === "products"}
              onClick={() => onNavigate("/products")}
            />
            <NavItem
              icon={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 12a4 4 0 100-8 4 4 0 000 8z"/><path d="M6 20v-1a4 4 0 014-4h4a4 4 0 014 4v1"/></svg>`}
              label="Users"
              active={active === "users"}
              onClick={() => onNavigate("/users")}
            />
            <NavItem
              icon={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>`}
              label="Sales"
              active={active === "sales"}
              onClick={() => onNavigate("/sales")}
            />
            <NavItem
              icon={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3h18v4H3z"/><path d="M7 21h10v-7H7z"/></svg>`}
              label="Checkout"
              active={active === "checkout"}
              onClick={() => onNavigate("/checkout")}
            />
          </nav>

          {/* bottom user area */}
          <div className="mt-6 pt-4 border-t border-white/6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center text-white text-sm font-medium">
                {user.email ? user.email.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="flex-1">
                <div className="text-sm text-white font-medium">{user.email ?? "Guest"}</div>
                <div className="text-xs text-white/70">{user.role ?? "—"}</div>
              </div>
              <div>
                <button
                  onClick={() => onNavigate("/profile")}
                  className="px-2 py-1 rounded-md text-xs bg-white/6 text-white hover:bg-white/10"
                >
                  Profile
                </button>
              </div>
            </div>

            <div className="mt-3">
              <button
                onClick={() => onNavigate("/logout")}
                className="w-full px-3 py-2 rounded-md bg-rose-500 text-white font-medium hover:opacity-95"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
