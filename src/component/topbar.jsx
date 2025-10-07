// src/components/Topbar.jsx
import React from "react";

/**
 * Topbar - compact, shows current page title, search, and mobile sidebar toggle
 *
 * Props:
 *  - title (string)
 *  - onToggleSidebar (fn) opens/closes sidebar in mobile
 *  - onSearch (fn) optional
 */

export default function Topbar({ title = "Dashboard", onToggleSidebar = () => {}, onSearch = () => {} }) {
  return (
    <div className="sticky top-0 z-20 bg-transparent backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-md bg-white/6 hover:bg-white/10 text-white sm:hidden"
              aria-label="Toggle menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>

            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
            <div className="hidden sm:block text-sm text-slate-500">• Admin panel</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center bg-white rounded-lg px-2 py-1 border">
              <input
                type="search"
                placeholder="Search products, sales, users..."
                onChange={(e) => onSearch(e.target.value)}
                className="outline-none bg-transparent text-sm px-2"
              />
              <button onClick={() => onSearch("")} className="px-2 text-sm text-slate-500">Search</button>
            </div>

            <div className="text-sm text-slate-600 hidden sm:block">v1.0</div>
          </div>
        </div>
      </div>
    </div>
  );
}
