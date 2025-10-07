// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "../components/sidebar";
import Topbar from "../components/topbar";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";

/**
 * AdminDashboard (wrapper)
 * - Desktop: sidebar pinned on left
 * - Mobile: slide-in sidebar toggled
 * - Uses Topbar for title + search
 * - Pulls data from 'products','transactions','users'
 */

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  // auth listener & profile fetch
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setCurrentUser(u);
      if (!u) {
        setProfile(null);
        return;
      }
      try {
        const q = query(collection(db, "users"), where("uid", "==", u.uid));
        const snap = await getDocs(q);
        const doc = snap.docs[0];
        setProfile(doc ? { id: doc.id, ...doc.data() } : { email: u.email, role: "STAFF" });
      } catch (err) {
        console.error("profile fetch err", err);
        setProfile({ email: u.email, role: "STAFF" });
      }
    });
    return () => unsub();
  }, []);

  // fetch dashboard data
  useEffect(() => {
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
        console.error("dashboard fetch err", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  // derived
  const totalUsers = users.length;
  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => Number(p.quantity || 0) < 5).length;
  const recentSalesTotal = transactions.reduce((acc, tx) => {
    const amt = tx.totalAmount ?? tx.total ?? tx.amount ?? (tx.items ? tx.items.reduce((a, it) => a + (it.total ?? 0), 0) : 0);
    return acc + Number(amt || 0);
  }, 0);

  function navigate(path) {
    // keep track of active tab for styles
    const name = path.replace("/", "") || "dashboard";
    setActiveTab(name);
    // navigate
    window.location.href = path;
  }

  async function handleLogout() {
    try {
      await signOut(auth);
      window.location.href = "/login";
    } catch (err) {
      console.error("logout err", err);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar (desktop pinned) */}
      <div className="hidden md:block md:fixed md:inset-y-0 md:w-72">
        <Sidebar open={true} onNavigate={navigate} user={{ email: profile?.email ?? currentUser?.email, role: profile?.role }} active={activeTab} theme="dark" />
      </div>

      {/* Mobile Sidebar (drawer) */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={(p) => { setSidebarOpen(false); navigate(p); }} user={{ email: profile?.email ?? currentUser?.email, role: profile?.role }} active={activeTab} theme="dark" />

      {/* Page content area */}
      <div className="md:pl-72">
        {/* topbar */}
        <Topbar title="Dashboard" onToggleSidebar={() => setSidebarOpen(true)} onSearch={(q) => console.log("search:", q)} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-4 rounded-2xl shadow">
              <div className="text-xs text-slate-400">Total Users</div>
              <div className="mt-2 text-2xl font-semibold">{loading ? "..." : totalUsers}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow">
              <div className="text-xs text-slate-400">Total Sales (Recent)</div>
              <div className="mt-2 text-2xl font-semibold">₦{loading ? "..." : Number(recentSalesTotal).toLocaleString()}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow">
              <div className="text-xs text-slate-400">Low Stock</div>
              <div className="mt-2 text-2xl font-semibold">{loading ? "..." : lowStockCount}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow">
              <div className="text-xs text-slate-400">Total Products</div>
              <div className="mt-2 text-2xl font-semibold">{loading ? "..." : totalProducts}</div>
            </div>
          </div>

          {/* quick actions + recent sales */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <aside className="lg:col-span-1 bg-white p-6 rounded-2xl shadow">
              <h3 className="text-lg font-semibold">Quick Actions</h3>
              <div className="mt-4 flex flex-col gap-3">
                <button onClick={() => navigate("/products/new")} className="w-full py-3 rounded bg-indigo-600 text-white">➕ Add Product</button>
                <button onClick={() => navigate("/products")} className="w-full py-3 rounded border">📦 View Products</button>
                <button onClick={() => navigate("/users")} className="w-full py-3 rounded border">👥 Manage Users</button>
                <button onClick={() => navigate("/sales")} className="w-full py-3 rounded border">🧾 View Sales</button>
                <button onClick={() => navigate("/checkout")} className="w-full py-3 rounded bg-emerald-600 text-white">✅ Open Checkout</button>
              </div>
            </aside>

            <section className="lg:col-span-2 bg-white p-4 rounded-2xl shadow overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Recent Sales</h3>
                  <p className="text-sm text-slate-500">Latest transactions captured from the POS.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input className="px-3 py-2 border rounded" placeholder="Search..." />
                  <button className="px-3 py-2 border rounded">Export</button>
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
                  {!transactions || transactions.length === 0 ? (
                    <tr><td colSpan="6" className="p-4 text-slate-500">No sales yet</td></tr>
                  ) : transactions.map((tx, idx) => {
                    const amount = Number(tx.totalAmount ?? tx.total ?? tx.amount ?? (tx.items ? tx.items.reduce((a, it) => a + (it.total ?? 0), 0) : 0));
                    const qty = tx.quantity ?? (tx.items ? tx.items.reduce((a, it) => a + (it.qty ?? it.quantity ?? 0), 0) : "—");
                    const pname = tx.productName ?? (tx.items && tx.items[0] ? tx.items[0].name : "Various");
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="p-2">{idx + 1}</td>
                        <td className="p-2">
                          <div className="font-medium">{pname}</div>
                          <div className="text-xs text-slate-400">{tx.items ? `${tx.items.length} items` : tx.productCode ?? ""}</div>
                        </td>
                        <td className="p-2">{qty}</td>
                        <td className="p-2">₦{Number(amount).toLocaleString()}</td>
                        <td className="p-2">{tx.cashierEmail ?? tx.cashier ?? "—"}</td>
                        <td className="p-2">{tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleString() : tx.timestamp ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </div>

          <footer className="mt-8 text-center text-sm text-slate-500">© {new Date().getFullYear()} StockPro — Superior POS & Inventory</footer>
        </main>
      </div>
    </div>
  );
}
