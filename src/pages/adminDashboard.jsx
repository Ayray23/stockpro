import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import Sidebar from "../component/sidebar";
import Topbar from "../component/topbar";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";

/**
 * Admin Dashboard
 * - Only accessible to admins
 * - Shows system stats, quick actions, and recent activity
 * - Fully styled for professional SaaS appearance
 */

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Auth listener
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        navigate("/auth");
        return;
      }

      setUser(u);

      // Fetch user profile
      try {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          await setDoc(ref, {
            uid: u.uid,
            email: u.email,
            role: "staff",
            createdAt: new Date().toISOString(),
          });
          toast.info("Profile created automatically");
        }

        const data = snap.exists() ? snap.data() : { email: u.email, role: "staff" };
        setProfile(data);

        if (data.role !== "admin") {
          toast.error("Unauthorized access — redirecting...");
          navigate("/salesDashboard");
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        toast.error("Failed to load profile");
      }
    });

    return () => unsub();
  }, [navigate]);

  // ✅ Fetch dashboard data
  useEffect(() => {
    if (!profile || profile.role !== "admin") return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [pSnap, txSnap, uSnap] = await Promise.all([
          getDocs(collection(db, "products")),
          getDocs(query(collection(db, "transactions"), orderBy("timestamp", "desc"), limit(10))),
          getDocs(collection(db, "users")),
        ]);

        setProducts(pSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setTransactions(txSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setUsers(uSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile]);

  // ✅ Derived stats
  const totalUsers = users.length;
  const totalProducts = products.length;
  const lowStock = products.filter((p) => Number(p.quantity || 0) < 5).length;
  const totalSales = transactions.reduce(
    (sum, t) => sum + (t.total || t.amount || 0),
    0
  );

  // ✅ Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/auth");
      toast.info("Logged out successfully");
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  // ✅ Update user role
  const handleRoleUpdate = async (id, newRole) => {
    try {
      await updateDoc(doc(db, "users", id), { role: newRole });
      toast.success(`Updated user role to ${newRole}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update role");
    }
  };

  if (!profile || profile.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100 text-slate-600">
        Checking admin access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <div className="hidden md:block md:fixed md:inset-y-0 md:w-72">
        <Sidebar
          open={true}
          onNavigate={(path) => navigate(path)}
          user={{ email: user?.email, role: profile?.role }}
          active="adminDashboard"
          theme="dark"
        />
      </div>

      {/* Mobile Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={(path) => {
          setSidebarOpen(false);
          navigate(path);
        }}
        user={{ email: user?.email, role: profile?.role }}
        active="adminDashboard"
        theme="dark"
      />

      {/* Main Section */}
      <div className="md:pl-72">
        <Topbar
          title={`Welcome, ${user?.email?.split("@")[0] || "Admin"}`}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Total Users", value: totalUsers },
              { title: "Total Products", value: totalProducts },
              { title: "Low Stock", value: lowStock },
              { title: "Total Sales (₦)", value: totalSales.toLocaleString() },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition"
              >
                <div className="text-sm text-slate-500">{stat.title}</div>
                <div className="text-3xl font-bold text-indigo-700 mt-2">
                  {loading ? "..." : stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <section className="mt-10 bg-white rounded-2xl shadow p-6">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">
              ⚡ Quick Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button
                onClick={() => navigate("/addProduct")}
                className="bg-indigo-600 text-white rounded-lg py-3 hover:bg-indigo-700"
              >
                ➕ Add Product
              </button>
              <button
                onClick={() => navigate("/materials")}
                className="bg-emerald-600 text-white rounded-lg py-3 hover:bg-emerald-700"
              >
                📦 View Inventory
              </button>
              <button
                onClick={() => navigate("/transactions")}
                className="bg-blue-600 text-white rounded-lg py-3 hover:bg-blue-700"
              >
                🧾 View Sales
              </button>
              <button
                onClick={handleLogout}
                className="bg-rose-600 text-white rounded-lg py-3 hover:bg-rose-700"
              >
                🚪 Logout
              </button>
            </div>
          </section>

          {/* Recent Transactions */}
          <section className="mt-10 bg-white rounded-2xl shadow p-6 overflow-x-auto">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">
              🧾 Recent Transactions
            </h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="text-left py-2">Material</th>
                  <th className="text-left py-2">Qty</th>
                  <th className="text-left py-2">Cashier</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-slate-400">
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-slate-50">
                      <td className="py-2">{tx.materialName || "—"}</td>
                      <td className="py-2">{tx.quantity || "—"}</td>
                      <td className="py-2">{tx.cashierEmail || "—"}</td>
                      <td className="py-2">{tx.type}</td>
                      <td className="py-2">
                        {tx.timestamp
                          ? new Date(tx.timestamp.toDate()).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          {/* Manage Users */}
          <section className="mt-10 bg-white rounded-2xl shadow p-6 overflow-x-auto">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">
              👥 Manage Users
            </h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">Role</th>
                  <th className="text-left py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-slate-50">
                    <td className="py-2">{u.email}</td>
                    <td className="py-2 capitalize">{u.role}</td>
                    <td className="py-2">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleUpdate(u.id, e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </div>
  );
}