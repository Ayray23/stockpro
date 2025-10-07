// src/pages/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";

/**
 * Premium Admin Dashboard — TailwindCSS
 * - Two navbars: top (app name / page / actions / user) + sub-nav (tabs)
 * - 4 stat cards with sparklines
 * - Quick Actions with large CTA
 * - Recent Sales table with badges and responsive layout
 * - Footer
 *
 * Notes:
 * - Assumes Firestore collections: products, transactions, users
 * - transactions should include fields: items (array) or productName, quantity, totalAmount, cashierEmail, timestamp
 */

function Sparkline({ values = [], width = 100, height = 28, stroke = "currentColor" }) {
  if (!values || values.length === 0) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1 || 1);

  const points = values
    .map((v, i) => {
      const x = i * step;
      // invert y so larger values go upper
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  // area path (smooth not implemented to avoid deps)
  const pathD = `M ${points}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  // auth listener + fetch user profile (role)
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setCurrentUser(u);
      if (u) {
        try {
          const usersSnap = await getDocs(query(collection(db, "users"), where("uid", "==", u.uid)));
          const doc = usersSnap.docs[0];
          setUserProfile(doc ? { id: doc.id, ...doc.data() } : null);
        } catch (e) {
          console.error("Error fetching user profile:", e);
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => unsub();
  }, []);

  // fetch collections
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
        console.error("Dashboard fetch error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Derived metrics
  const totalProducts = products.length;
  const totalUsers = users.length;
  const lowStockCount = products.filter((p) => Number(p.quantity || 0) < 5).length;

  // compute recent sales total from loaded transactions
  const recentSalesTotal = useMemo(() => {
    return transactions.reduce((sum, tx) => {
      const amt = tx.totalAmount ?? tx.total ?? tx.amount ?? (tx.items ? tx.items.reduce((a, it) => a + (it.total ?? 0), 0) : 0);
      return sum + Number(amt || 0);
    }, 0);
  }, [transactions]);

  // for sparkline: use last N tx amounts
  const sparkData = useMemo(() => {
    return transactions
      .slice(0, 8)
      .map((t) => Number(t.totalAmount ?? t.total ?? t.amount ?? (t.items ? t.items.reduce((a, it) => a + (it.total ?? 0), 0) : 0)));
  }, [transactions]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // navigation (simple)
  const navTo = (path) => (window.location.href = path);

  // format timestamp safely
  const fmtTime = (ts) => {
    try {
      if (!ts) return "—";
      if (ts.toDate) return ts.toDate().toLocaleString();
      return new Date(ts).toLocaleString();
    } catch {
      return "—";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-800">
      {/* Top fixed navbar */}
      <header className="fixed w-full z-40 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* left: app name */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navTo("/")}
                className="flex items-center gap-3"
                aria-label="Go home"
              >
                <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg p-2 shadow">
                  {/* logo glyph */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M12 3v18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="font-semibold text-lg leading-none">StockPro Supermarket</span>
              </button>

              <div className="hidden sm:flex items-center text-sm text-gray-500">
                <span className="mx-2">/</span>
                <span className="font-medium">Dashboard</span>
              </div>
            </div>

            {/* right: actions & user */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => navTo("/products")}
                  className="px-3 py-1 rounded-md text-sm border hover:bg-gray-50"
                >
                  Products
                </button>
                <button
                  onClick={() => navTo("/checkout")}
                  className="px-3 py-1 rounded-md text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow"
                >
                  Open Checkout
                </button>
              </div>

              <div className="flex items-center gap-3 border-l pl-4">
                <div className="text-sm text-slate-700">{currentUser?.email ?? "Not signed in"}</div>
                <div className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">
                  {userProfile?.role?.toUpperCase() ?? "—"}
                </div>
                <button onClick={handleLogout} className="text-sm px-3 py-1 rounded bg-red-500 text-white">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* secondary nav tabs */}
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 p-3">
              {[
                { id: "dashboard", label: "Dashboard" },
                { id: "products", label: "Products" },
                { id: "users", label: "Users" },
                { id: "sales", label: "Sales" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTab(t.id);
                    navTo(t.id === "dashboard" ? "/admin" : `/${t.id}`);
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    activeTab === t.id ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
              <div className="ml-auto text-sm text-slate-500 hidden sm:block">Admin Dashboard</div>
            </div>
          </div>
        </div>
      </div>

      {/* main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* top section: cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users */}
          <div className="bg-white rounded-2xl p-5 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h6 className="text-xs text-slate-400">Total Users</h6>
                <p className="text-2xl font-semibold mt-1">{loading ? "..." : totalUsers}</p>
              </div>
              <div className="rounded-full bg-sky-50 p-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M17 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="mt-3">
              <Sparkline values={sparkData.map((v, i) => (v ? v / 100 : 0))} width={120} height={30} stroke="#06b6d4" />
            </div>
          </div>

          {/* Total Sales */}
          <div className="bg-white rounded-2xl p-5 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h6 className="text-xs text-slate-400">Total Sales (Recent)</h6>
                <p className="text-2xl font-semibold mt-1">₦{loading ? "..." : Number(recentSalesTotal).toLocaleString()}</p>
              </div>
              <div className="rounded-full bg-amber-50 p-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 8v8" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 12h8" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="9" stroke="#f59e0b" strokeWidth="1.5"/>
                </svg>
              </div>
            </div>

            <div className="mt-3">
              <Sparkline values={sparkData} width={120} height={30} stroke="#f59e0b" />
            </div>
          </div>

          {/* Low Stock */}
          <div className="bg-white rounded-2xl p-5 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h6 className="text-xs text-slate-400">Low Stock Items</h6>
                <p className="text-2xl font-semibold mt-1">{loading ? "..." : lowStockCount}</p>
              </div>
              <div className="rounded-full bg-rose-50 p-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 3v3" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 12h-3" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 21v-3" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 12h3" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div className="mt-3">
              <Sparkline values={products.slice(0, 8).map(p => Number(p.quantity || 0))} width={120} height={30} stroke="#fb7185" />
            </div>
          </div>

          {/* Total Products */}
          <div className="bg-white rounded-2xl p-5 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h6 className="text-xs text-slate-400">Total Products</h6>
                <p className="text-2xl font-semibold mt-1">{loading ? "..." : totalProducts}</p>
              </div>
              <div className="rounded-full bg-emerald-50 p-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="3" y="7" width="18" height="12" rx="2" stroke="#10b981" strokeWidth="1.5"/>
                  <path d="M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="mt-3">
              <Sparkline values={products.slice(0, 8).map((p,i) => (p.quantity || 0) + i)} width={120} height={30} stroke="#10b981" />
            </div>
          </div>
        </section>

        {/* content: Quick Actions + Recent Sales */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <aside className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <p className="text-sm text-slate-500 mt-1">Jump straight to frequently used tasks</p>

            <div className="mt-4 grid gap-3">
              <button onClick={() => navTo("/products/new")} className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-medium shadow hover:scale-[1.01] transition">
                ➕ Add New Product
              </button>
              <button onClick={() => navTo("/products")} className="w-full py-3 rounded-lg border text-slate-700 hover:bg-slate-50">
                📦 Browse Products
              </button>
              <button onClick={() => navTo("/users")} className="w-full py-3 rounded-lg border text-slate-700 hover:bg-slate-50">
                👥 Manage Users
              </button>
              <button onClick={() => navTo("/sales")} className="w-full py-3 rounded-lg border text-slate-700 hover:bg-slate-50">
                🧾 View All Sales
              </button>
              <button onClick={() => navTo("/checkout")} className="w-full py-3 rounded-lg bg-emerald-600 text-white font-semibold">
                ✅ Open Checkout POS
              </button>
            </div>
          </aside>

          <div className="lg:col-span-2 bg-white rounded-2xl p-4 shadow-md overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Recent Sales</h3>
                <p className="text-sm text-slate-500">Latest transactions captured from the POS</p>
              </div>

              <div className="flex items-center gap-2">
                <input type="search" placeholder="Search product or cashier" className="px-3 py-2 border rounded-md text-sm" />
                <button className="px-3 py-2 bg-slate-100 rounded-md text-sm">Export</button>
              </div>
            </div>

            <table className="min-w-full divide-y">
              <thead>
                <tr className="text-sm text-slate-500">
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Products</th>
                  <th className="p-2 text-left">Qty</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2 text-left">Cashier</th>
                  <th className="p-2 text-left">Time</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {!transactions || transactions.length === 0 ? (
                  <tr><td colSpan="7" className="p-4 text-slate-500">No sales yet</td></tr>
                ) : (
                  transactions.map((tx, idx) => {
                    const amount = Number(tx.totalAmount ?? tx.total ?? tx.amount ?? (tx.items ? tx.items.reduce((a, it) => a + (it.total ?? 0), 0) : 0));
                    const qty = tx.quantity ?? (tx.items ? tx.items.reduce((a, it) => a + (it.qty ?? it.quantity ?? 0), 0) : "—");
                    const productName = tx.productName ?? (tx.items && tx.items[0] ? tx.items[0].name : "Various");
                    const cashier = tx.cashierEmail ?? tx.cashier ?? "—";
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="p-2 align-top">{idx + 1}</td>
                        <td className="p-2 align-top">
                          <div className="font-medium">{productName}</div>
                          <div className="text-xs text-slate-400">{tx.items ? `${tx.items.length} items` : tx.productCode ?? ""}</div>
                        </td>
                        <td className="p-2 align-top">{qty}</td>
                        <td className="p-2 align-top">₦{Number(amount).toLocaleString()}</td>
                        <td className="p-2 align-top">{cashier}</td>
                        <td className="p-2 align-top">{fmtTime(tx.timestamp)}</td>
                        <td className="p-2 align-top">
                          <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">Completed</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} StockPro Supermarket — Designed with ❤️ for accuracy & speed.
        </footer>
      </main>
    </div>
  );
}
