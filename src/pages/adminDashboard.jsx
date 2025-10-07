// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../component/sidebar";
import Topbar from "../component/topbar";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  getDoc,       
  setDoc,       
  query,
  orderBy,
  limit,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";


/**
 * AdminDashboard
 * - Admin-only page
 * - Sidebar highlights active route automatically
 * - Dashboard summary + Quick Actions + Recent Sales + Manage Roles
 */

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  const navigate = useNavigate();
  const location = useLocation();

  // Detect current route for sidebar highlight
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("product")) setActiveTab("products");
    else if (path.includes("user")) setActiveTab("users");
    else if (path.includes("sale")) setActiveTab("sales");
    else if (path.includes("checkout")) setActiveTab("checkout");
    else setActiveTab("dashboard");
  }, [location]);

  // Auth listener & role check
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        navigate("/login");
        return;
      }

      setCurrentUser(u);
      try {
      const userRef = doc(db, "users", u.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        // 👇 auto-create user record if missing
        await setDoc(userRef, {
          uid: u.uid,
          email: u.email,
          role: "staff", // default role
          createdAt: new Date().toISOString(),
        });
      }

      const userData = snap.exists() ? snap.data() : { email: u.email, role: "staff" };
      setProfile(userData);

      if (userData.role !== "admin") navigate("/salesDashboard");
      } catch (error) { console.error("Error fetching user profile:", error); 
    }
  });
    return () => unsub();
  }, [navigate]);

  // Fetch dashboard data (only after admin verified)
  useEffect(() => {
    if (!profile || profile.role !== "admin") return;

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [pSnap, txSnap, uSnap] = await Promise.all([
          getDocs(collection(db, "products")),
          getDocs(query(collection(db, "transactions"), orderBy("timestamp", "desc"), limit(12))),
          getDocs(collection(db, "users")),
        ]);
        if (!mounted) return;
        setProducts(pSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setTransactions(txSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setUsers(uSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Dashboard data error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [profile]);

  // Derived stats
  const totalUsers = users.length;
  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => Number(p.quantity || 0) < 5).length;
  const recentSalesTotal = transactions.reduce((acc, tx) => {
    const amt =
      tx.totalAmount ??
      tx.total ??
      tx.amount ??
      (tx.items ? tx.items.reduce((a, it) => a + (it.total ?? 0), 0) : 0);
    return acc + Number(amt || 0);
  }, 0);

  // Handle logout
  async function handleLogout() {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  // Navigate
  const go = (path) => navigate(path);

  // Handle role update
  async function handleRoleChange(userId, newRole) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      alert(`✅ Updated role to ${newRole.toUpperCase()}`);
    } catch (err) {
      console.error("Role update error:", err);
      alert("❌ Failed to update role. Check Firestore permissions.");
    }
  }

  if (!profile || profile.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-700">Checking access...</h2>
          <p className="text-slate-500 mt-2">Please wait while we verify your admin role.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar for desktop */}
       <div className="hidden md:block md:fixed md:inset-y-0 md:w-72">
        <Sidebar
          open={true}
          onNavigate={go}
          user={{ email: profile?.email ?? currentUser?.email, role: profile?.role }}
          active={activeTab}
          theme="dark"
        />
      </div> 

      {/* Sidebar for mobile */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={(p) => {
          setSidebarOpen(false);
          go(p);
        }}
        user={{ email: profile?.email ?? currentUser?.email, role: profile?.role }}
        active={activeTab}
        theme="dark"
      />

      <div className="md:pl-72">
        <Topbar
          title="Admin Dashboard"
          onToggleSidebar={() => setSidebarOpen(true)}
          onSearch={(q) => console.log("Search:", q)}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Total Users", value: totalUsers },
              { title: "Total Sales (Recent)", value: `₦${Number(recentSalesTotal).toLocaleString()}` },
              { title: "Low Stock", value: lowStockCount },
              { title: "Total Products", value: totalProducts },
            ].map((card, i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-2xl shadow hover:shadow-md transition"
              >
                <div className="text-xs text-slate-400">{card.title}</div>
                <div className="mt-2 text-2xl font-semibold">
                  {loading ? "..." : card.value}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions + Recent Sales */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick actions */}
            <aside className="lg:col-span-1 bg-white p-6 rounded-2xl shadow">
              <h3 className="text-lg font-semibold">Quick Actions</h3>
              <div className="mt-4 flex flex-col gap-3">
                <button
                  onClick={() => go("/stock-in")}
                  className="w-full py-3 rounded bg-indigo-600 text-white"
                >
                  ➕ Add Product
                </button>
                <button
                  onClick={() => go("/stock-in")}
                  className="w-full py-3 rounded border"
                >
                  📦 View Products
                </button>
                <button
                  onClick={() => go("/users")}
                  className="w-full py-3 rounded border"
                >
                  👥 Manage Users
                </button>
                <button
                  onClick={() => go("/sales")}
                  className="w-full py-3 rounded border"
                >
                  🧾 View Sales
                </button>
                <button
                  onClick={() => go("/checkout")}
                  className="w-full py-3 rounded bg-emerald-600 text-white"
                >
                  ✅ Open Checkout
                </button>
              </div>
            </aside>

            {/* Recent Sales */}
            <section className="lg:col-span-2 bg-white p-4 rounded-2xl shadow overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Recent Sales</h3>
                  <p className="text-sm text-slate-500">
                    Latest transactions from the POS system.
                  </p>
                </div>
              </div>

              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-slate-500">
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Product(s)</th>
                    <th className="p-2 text-left">Qty</th>
                    <th className="p-2 text-left">Amount</th>
                    <th className="p-2 text-left">Cashier</th>
                    <th className="p-2 text-left">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-4 text-slate-500">
                        No sales yet
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx, i) => {
                      const amt =
                        tx.totalAmount ??
                        tx.total ??
                        tx.amount ??
                        (tx.items
                          ? tx.items.reduce((a, it) => a + (it.total ?? 0), 0)
                          : 0);
                      const qty =
                        tx.quantity ??
                        (tx.items
                          ? tx.items.reduce(
                              (a, it) => a + (it.qty ?? it.quantity ?? 0),
                              0
                            )
                          : "—");
                      const pname =
                        tx.productName ??
                        (tx.items && tx.items[0]
                          ? tx.items[0].name
                          : "Various");
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50">
                          <td className="p-2">{i + 1}</td>
                          <td className="p-2">
                            <div className="font-medium">{pname}</div>
                            <div className="text-xs text-slate-400">
                              {tx.items ? `${tx.items.length} items` : ""}
                            </div>
                          </td>
                          <td className="p-2">{qty}</td>
                          <td className="p-2">
                            ₦{Number(amt).toLocaleString()}
                          </td>
                          <td className="p-2">
                            {tx.cashierEmail ?? tx.cashier ?? "—"}
                          </td>
                          <td className="p-2">
                            {tx.timestamp?.toDate
                              ? tx.timestamp.toDate().toLocaleString()
                              : tx.timestamp ?? "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </section>
          </div>

          {/* Manage Roles */}
          <section className="mt-8 bg-white p-6 rounded-2xl shadow">
            <h3 className="text-lg font-semibold mb-4">👥 Manage Roles</h3>
            <p className="text-sm text-slate-500 mb-4">
              Change user permissions. Only administrators can update roles.
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-slate-500">
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Current Role</th>
                    <th className="p-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-4 text-slate-500 text-center">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((usr, i) => (
                      <tr key={usr.id} className="hover:bg-slate-50">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2">{usr.email}</td>
                        <td className="p-2 capitalize">{usr.role ?? "staff"}</td>
                        <td className="p-2">
                          <select
                            value={usr.role ?? "staff"}
                            onChange={(e) =>
                              handleRoleChange(usr.id, e.target.value)
                            }
                            className="border rounded px-2 py-1 text-sm"
                          >
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="mt-8 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} StockPro — Superior POS & Inventory
          </footer>
        </main>
      </div>
    </div>
  );
} 
