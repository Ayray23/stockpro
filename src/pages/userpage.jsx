// src/pages/usersPage.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import Sidebar from "../component/sidebar";
import Topbar from "../component/topbar";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

/**
 * UsersPage.jsx
 * - Admin-only page for managing and viewing registered users.
 * - Fetches all users from Firestore.
 * - Verifies current user's role before granting access.
 */

const UsersPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // ✅ Auth + Profile Verification
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        navigate("/auth");
        return;
      }

      setCurrentUser(u);

      try {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          toast.error("User profile not found!");
          navigate("/auth");
          return;
        }

        const data = snap.data();
        setProfile(data);

        // Redirect non-admin users
        if (data.role !== "admin") {
          toast.error("Unauthorized access — only admins can view users.");
          navigate("/salesDashboard");
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        toast.error("Failed to verify user.");
      }
    });

    return () => unsub();
  }, [navigate]);

  // ✅ Fetch users (Admins only)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCol = collection(db, "users");
        const snapshot = await getDocs(usersCol);
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(list);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Unable to load users list.");
      }
    };

    if (profile?.role === "admin") fetchUsers();
  }, [profile]);

  // ✅ Loading state
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100 text-slate-600">
        Verifying access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar (Desktop) */}
      <div className="hidden md:block md:fixed md:inset-y-0 md:w-72">
        <Sidebar
          open={true}
          onNavigate={(p) => navigate(p)}
          user={{ email: currentUser?.email, role: profile?.role }}
          active="users"
          theme="dark"
        />
      </div>

      {/* Sidebar (Mobile) */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={(p) => {
          setSidebarOpen(false);
          navigate(p);
        }}
        user={{ email: currentUser?.email, role: profile?.role }}
        active="users"
        theme="dark"
      />

      {/* Main Content */}
      <div className="flex-1 md:pl-72">
        <Topbar
          title={`Users Management • ${profile.email?.split("@")[0]}`}
          onToggleSidebar={() => setSidebarOpen(true)}
          user={profile}
        />

        <main className="max-w-5xl mx-auto py-10 px-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 transition hover:shadow-xl">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              👥 Users Management
            </h1>
            <p className="text-slate-600 mb-6">
              Manage users with system access — view roles and activity.
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-sm">
                    <th className="text-left py-2 px-3 border-b">#</th>
                    <th className="text-left py-2 px-3 border-b">Email</th>
                    <th className="text-left py-2 px-3 border-b">Role</th>
                    <th className="text-left py-2 px-3 border-b">Date Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((u, i) => (
                      <tr
                        key={u.id}
                        className={`${
                          currentUser?.email === u.email
                            ? "bg-indigo-50 text-indigo-700 font-medium"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="py-2 px-3 border-b">{i + 1}</td>
                        <td className="py-2 px-3 border-b">{u.email}</td>
                        <td className="py-2 px-3 border-b capitalize">
                          {u.role || "User"}
                          {currentUser?.email === u.email && (
                            <span className="ml-1 text-xs text-indigo-500">
                              (You)
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 border-b">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center text-slate-500 py-6"
                      >
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UsersPage;
