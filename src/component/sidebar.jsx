import React from "react";

/**
 * Sidebar - animated drawer with active tab highlight
 * - Smooth underline + gradient glow
 * - Dark/light dual theme support
 * - Super fast load (Tailwind-only)
 */

const NavItem = ({ icon, label, active, onClick, theme }) => (
  <button
    onClick={onClick}
    className={`group relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-300
      ${
        active
          ? theme === "dark"
            ? "bg-gradient-to-r from-indigo-600 to-emerald-500 text-white shadow-md"
            : "bg-indigo-100 text-indigo-700 shadow-sm"
          : theme === "dark"
          ? "text-slate-300 hover:text-white hover:bg-white/10"
          : "text-slate-600 hover:text-slate-900 hover:bg-indigo-50"
      }`}
  >
    {/* Icon */}
    <span
      className={`w-5 h-5 flex-none transition-transform duration-300 ${
        active ? "scale-110" : "group-hover:scale-105"
      }`}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: icon }}
    />

    {/* Label */}
    <span className="flex-1 text-left font-medium">{label}</span>

    {/* Underline animation */}
    {active && (
      <span
        className={`absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all duration-500 ${
          theme === "dark"
            ? "bg-gradient-to-r from-indigo-400 to-emerald-400 shadow-[0_0_6px_rgba(99,102,241,0.8)]"
            : "bg-gradient-to-r from-indigo-500 to-emerald-500"
        }`}
      />
    )}
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
  return (
    <>
      {/* Backdrop */}
      {/* <div
        onClick={onClose}
        className={`fixed inset-0 z-30 transition-opacity ${
          open ? "opacity-60 pointer-events-auto" : "opacity-0 pointer-events-none"
        } bg-black/40`}
        aria-hidden={!open}
      /> */}

      {/* Sidebar drawer */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-72 max-w-[85%] transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } flex flex-col ${
          theme === "dark"
            ? "bg-gradient-to-b from-slate-900 to-slate-800 text-white"
            : "bg-gradient-to-b from-white to-slate-50 text-slate-900"
        } shadow-xl`}
        aria-hidden={!open}
      >
        <div className="px-5 py-6 flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`rounded-lg p-2 ${
                theme === "dark" ? "bg-white/10" : "bg-indigo-100"
              }`}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                className={theme === "dark" ? "text-white" : "text-indigo-600"}
              >
                <path
                  d="M3 12h18M12 3v18"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div
                className={`text-lg font-semibold leading-none ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                StockPro
              </div>
              <div
                className={`text-xs ${
                  theme === "dark" ? "text-white/70" : "text-slate-500"
                }`}
              >
                Supermarket POS
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-3">
          <NavItem
            //icon={<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'><path d='M3 12h18M12 3v18'/></svg>}
            label="Dashboard"
            active={active === "dashboard"}
            onClick={() => onNavigate("/dashboard")}
            theme={theme}
          />

          <NavItem
            //icon={<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'><rect x='3' y='3' width='7' height='7'/><rect x='14' y='3' width='7' height='7'/><rect x='14' y='14' width='7' height='7'/><rect x='3' y='14' width='7' height='7'/></svg>}
            label="Admin Dashboard"
            active={active === "adminDashboard"}
            onClick={() => onNavigate("/adminDashboard")}
            theme={theme}
          />

          <NavItem
            //icon={<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'><path d='M12 12a4 4 0 100-8 4 4 0 000 8z'/><path d='M6 20v-1a4 4 0 014-4h4a4 4 0 014 4v1'/></svg>}
            label="Sales Dashboard"
            active={active === "salesDashboard"}
            onClick={() => onNavigate("/salesDashboard")}
            theme={theme}
          />

          <NavItem
            //icon={<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'><path d='M3 3h18v4H3z'/><path d='M7 21h10v-7H7z'/></svg>}
            label="Materials"
            active={active === "materials"}
            onClick={() => onNavigate("/materials")}
            theme={theme}
          />

          <NavItem
            //icon={<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'><path d='M4 6h16M4 12h16M4 18h16'/></svg>}
            label="Stock In"
            active={active === "stockIn"}
            onClick={() => onNavigate("/stock-in")}
            theme={theme}
          />

          <NavItem
            //icon={<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'><path d='M3 3h18v4H3z'/><path d='M7 21h10v-7H7z'/></svg>}
            label="Stock Out"
            active={active === "stockOut"}
            onClick={() => onNavigate("/stock-out")}
            theme={theme}
          />

          <NavItem
            //icon={<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'><path d='M4 4h16v16H4z'/></svg>}
            label="Stock Table"
            active={active === "stockTable"}
            onClick={() => onNavigate("/stock-table")}
            theme={theme}
          />

          <NavItem
            //icon={<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'><path d='M12 20v-6M6 20v-4M18 20v-8'/></svg>}
            label="Transactions"
            active={active === "transactions"}
            onClick={() => onNavigate("/transactions")}
            theme={theme}
          />

          <NavItem
            //icon={<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'><circle cx='12' cy='12' r='10'/><path d='M8 12h8'/></svg>}
            label="Summary"
            active={active === "summary"}
            onClick={() => onNavigate("/summary")}
            theme={theme}
          />

          <NavItem
            //icon={<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'><path d='M12 12a5 5 0 100-10 5 5 0 000 10z'/><path d='M4 20v-1a7 7 0 0114 0v1'/></svg>}
            label="Users"
            active={active === "users"}
            onClick={() => onNavigate("/users")}
            theme={theme}
          />
        </nav>


          {/* User Info + Logout */}
          <div
            className={`mt-6 pt-4 border-t ${
              theme === "dark" ? "border-white/10" : "border-slate-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  theme === "dark"
                    ? "bg-white/10 text-white"
                    : "bg-indigo-100 text-indigo-700"
                }`}
              >
                {user.email ? user.email.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="flex-1">
                <div
                  className={`text-sm font-medium ${
                    theme === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  {user.email ?? "Guest"}
                </div>
                <div
                  className={`text-xs ${
                    theme === "dark" ? "text-white/70" : "text-slate-500"
                  }`}
                >
                  {user.role ?? "—"}
                </div>
              </div>
              <button
                onClick={() => onNavigate("/profile")}
                className={`px-2 py-1 rounded-md text-xs ${
                  theme === "dark"
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                Profile
              </button>
            </div>

            <div className="mt-3">
              <button
                onClick={() => onNavigate("/logout")}
                className={`w-full px-3 py-2 rounded-md font-medium transition ${
                  theme === "dark"
                    ? "bg-rose-500 text-white hover:bg-rose-400"
                    : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                }`}
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
