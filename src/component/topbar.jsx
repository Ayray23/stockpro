import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";

/**
 * Topbar Component
 * - Fetches user role dynamically from Firestore
 * - Syncs with sidebar and reflects live user data
 * - Shows search bar (only for admin)
 * - Adaptive color & layout
 */
export default function Topbar({
  title = "Dashboard",
  onToggleSidebar = () => {},
  onSearch = () => {},
}) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // ✅ Fetch Firebase user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        setUser(null);
        setProfile(null);
        return;
      }

      setUser(u);

      try {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          toast.warn("⚠️ No user profile found in Firestore");
          setProfile({ email: u.email, role: "unknown" });
        }
      } catch (err) {
        console.error("Topbar profile fetch error:", err);
        toast.error("❌ Failed to load user info");
      }
    });

    return () => unsubscribe();
  }, []);

  const username = user?.email
    ? user.email.split("@")[0].charAt(0).toUpperCase() +
      user.email.split("@")[0].slice(1)
    : "User";

  const role = profile?.role || "Loading...";

  return (
    <div className="sticky top-0 z-20 bg-gradient-to-r from-indigo-700/80 via-indigo-600/70 to-emerald-600/80 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between text-white">
          {/* Left Section: Title + Sidebar Toggle */}
          <div className="flex items-center gap-3">
            {/* Mobile sidebar toggle */}
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-md bg-white/10 hover:bg-white/20 sm:hidden"
              aria-label="Toggle sidebar"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>

            <div>
              <h2 className="text-lg font-semibold leading-none">{title}</h2>
              <p className="text-xs opacity-80">
                {role === "admin"
                  ? "Admin Panel"
                  : role === "staff"
                  ? "Staff Portal"
                  : "User Portal"}
              </p>
            </div>
          </div>

          {/* Right Section: Search + User Info */}
          <div className="flex items-center gap-4">
            {/* Admin-only search bar */}
            {role === "admin" && (
              <div className="hidden md:flex items-center bg-white/10 rounded-lg px-2 py-1 backdrop-blur-sm border border-white/20">
                <input
                  type="search"
                  placeholder="Search products, users, sales..."
                  onChange={(e) => onSearch(e.target.value)}
                  className="outline-none bg-transparent text-sm px-2 text-white placeholder-white/70"
                />
                <button
                  onClick={() => onSearch("")}
                  className="px-2 text-sm text-white/70 hover:text-white"
                >
                  🔍
                </button>
              </div>
            )}

            {/* User Info Badge */}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold uppercase">
                {user?.email?.charAt(0) || "U"}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium">
                  {username || "Loading..."}
                </div>
                <div className="text-xs opacity-80">{role}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
