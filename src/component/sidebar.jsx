import React from "react";
import { useLocation } from "react-router-dom";

/**
 * Sidebar - Role-aware navigation with gradient UI
 * - Admin sees all
 * - Staff sees limited pages (Checkout, Transactions, Summary)
 */

const NavItem = ({ label, active, onClick, theme = "dark" }) => (
  <button
    onClick={onClick}
    className={`group relative w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
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
    <span>{label}</span>
    {active && (
      <span
        className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full transition-all duration-500 ${
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
  onNavigate = () => {},
  user = { email: "guest@local", role: "staff" },
  theme = "dark",
}) {
  const location = useLocation();
  const active = location.pathname;

  // ✅ Menu per role
  const adminMenu = [
    { label: "Dashboard", path: "/adminDashboard" },
    { label: "Add Product", path: "/addProduct" },
    { label: "Materials", path: "/materials" },
    { label: "Stock Out", path: "/stockOut" },
    { label: "Transactions", path: "/transactionsTable" },
    { label: "Summary", path: "/summary" },
    { label: "Users", path: "/users" },
  ];

  const staffMenu = [
    { label: "Checkout", path: "/stockout" },
    { label: "Transactions", path: "/transactions" },
    { label: "Summary", path: "/summary" },
  ];

  const menu = user.role === "admin" ? adminMenu : staffMenu;

  return (
    <>
      {/* Backdrop for mobile */}
      {/* <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity ${
          open ? "opacity-60 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
      /> */}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-72 max-w-[85%] transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } flex flex-col ${
          theme === "dark"
            ? "bg-gradient-to-b from-slate-900 to-slate-800 text-white"
            : "bg-gradient-to-b from-white to-slate-50 text-slate-900"
        } shadow-xl`}
      >
        <div className="px-5 py-6 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
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
                className={`text-lg font-semibold ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                StockPro
              </div>
              <div
                className={`text-xs ${
                  theme === "dark" ? "text-white/60" : "text-slate-500"
                }`}
              >
                Supermarket POS
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {menu.map((item) => (
              <NavItem
                key={item.path}
                label={item.label}
                active={active === item.path}
                onClick={() => {
                  onNavigate(item.path);
                  onClose();
                }}
                theme={theme}
              />
            ))}
          </nav>

          {/* User Info */}
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
                  {user.role ?? "staff"}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => onNavigate("/")}
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
