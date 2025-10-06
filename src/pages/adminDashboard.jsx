// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useRouter } from "next/router"; // remove if not using nextjs, adapt to your router

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState(null); // firebase auth user
  const [userProfile, setUserProfile] = useState(null); // our user doc with role
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const router = typeof window !== "undefined" ? useRouter?.() : null;

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setCurrentUser(u || null);
      if (u) {
        // fetch role from users collection (assumes a `users` collection keyed by uid)
        try {
          const usersSnap = await getDocs(
            query(collection(db, "users"), where("uid", "==", u.uid))
          );
          const docs = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setUserProfile(docs[0] ?? null);
        } catch (e) {
          console.error("fetch user profile error", e);
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // products
        const prodSnap = await getDocs(collection(db, "products"));
        setProducts(prodSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        // latest transactions (sales)
        const txSnap = await getDocs(
          query(collection(db, "transactions"), orderBy("timestamp", "desc"), limit(8))
        );
        setTransactions(txSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        // users
        const usersSnap = await getDocs(collection(db, "users"));
        setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("fetch dashboard data", err);
      }
    };

    fetchData();
  }, []);

  // Derived stats
  const totalProducts = products.length;
  const totalUsers = users.length;
  const lowStock = products.filter((p) => Number(p.quantity || 0) < 5).length;

  // total sales amount (assumes transactions have totalAmount or total)
  const totalSales = transactions.reduce((acc, tx) => {
    const amt =
      tx.totalAmount ??
      tx.total ??
      tx.amount ??
      (tx.items ? tx.items.reduce((a, it) => a + (it.total || 0), 0) : 0);
    return acc + Number(amt || 0);
  }, 0);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // if you use next/router or react-router adapt this
      if (router && router.push) router.push("/login");
      else window.location.href = "/login";
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  // quick nav helper (adapt if you use react-router)
  const navTo = (path) => {
    if (router && router.push) router.push(path);
    else (window.location.href = path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar 1 */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navTo("/")}
                className="text-xl font-bold text-gray-800"
              >
                StockPro Supermarket
              </button>
              <span className="hidden sm:inline-block text-gray-500">/</span>
              <div className="text-gray-600">Dashboard</div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navTo("/products")}
                className="px-3 py-1 border rounded-md text-sm"
              >
                Products
              </button>

              <button
                onClick={() => navTo("/checkout")}
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
              >
                Checkout
              </button>

              <div className="flex items-center gap-3 border-l pl-4">
                <div className="text-sm text-gray-700">
                  {currentUser?.email ?? "Not signed in"}
                </div>
                <div className="text-sm text-gray-500">
                  {userProfile?.role ? userProfile.role.toUpperCase() : "—"}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm px-3 py-1 bg-red-500 text-white rounded"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Secondary Navbar (tabs / sidebar-like) */}
      <nav className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-md shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 p-3">
              <button
                onClick={() => navTo("/admin")}
                className="px-3 py-2 text-sm font-medium rounded hover:bg-gray-100"
              >
                Dashboard
              </button>
              <button
                onClick={() => navTo("/products")}
                className="px-3 py-2 text-sm font-medium rounded hover:bg-gray-100"
              >
                Products
              </button>
              <button
                onClick={() => navTo("/users")}
                className="px-3 py-2 text-sm font-medium rounded hover:bg-gray-100"
              >
                Users
              </button>
              <button
                onClick={() => navTo("/sales")}
                className="px-3 py-2 text-sm font-medium rounded hover:bg-gray-100"
              >
                Sales
              </button>
              <div className="ml-auto text-sm text-gray-500 hidden sm:block">
                Admin Dashboard
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-sm text-gray-500">Total Users</h3>
            <p className="text-2xl font-semibold">{totalUsers}</p>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-sm text-gray-500">Total Sales (Recent)</h3>
            <p className="text-2xl font-semibold">
              {Number(totalSales).toLocaleString()}
            </p>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-sm text-gray-500">Low Stock</h3>
            <p className="text-2xl font-semibold">{lowStock}</p>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-sm text-gray-500">Total Products</h3>
            <p className="text-2xl font-semibold">{totalProducts}</p>
          </div>
        </section>

        {/* Quick Actions + Recent Sales */}
        <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1 bg-white p-4 rounded shadow">
            <h4 className="text-lg font-semibold mb-3">Quick Actions</h4>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navTo("/products/new")}
                className="w-full text-left px-4 py-2 rounded border hover:bg-gray-50"
              >
                ➕ Add Product
              </button>

              <button
                onClick={() => navTo("/products")}
                className="w-full text-left px-4 py-2 rounded border hover:bg-gray-50"
              >
                📦 View Products
              </button>

              <button
                onClick={() => navTo("/users")}
                className="w-full text-left px-4 py-2 rounded border hover:bg-gray-50"
              >
                👥 Manage Users
              </button>

              <button
                onClick={() => navTo("/sales")}
                className="w-full text-left px-4 py-2 rounded border hover:bg-gray-50"
              >
                🧾 View Sales
              </button>

              <button
                onClick={() => navTo("/checkout")}
                className="w-full text-left px-4 py-2 rounded bg-blue-600 text-white"
              >
                ✅ Open Checkout
              </button>
            </div>
          </div>

          {/* Recent Sales Table */}
          <div className="lg:col-span-2 bg-white p-4 rounded shadow overflow-x-auto">
            <h4 className="text-lg font-semibold mb-3">Recent Sales</h4>
            {transactions.length === 0 ? (
              <div className="text-gray-500">No recent sales.</div>
            ) : (
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-sm text-gray-600">#</th>
                    <th className="p-2 text-sm text-gray-600">Product</th>
                    <th className="p-2 text-sm text-gray-600">Qty</th>
                    <th className="p-2 text-sm text-gray-600">Amount</th>
                    <th className="p-2 text-sm text-gray-600">Cashier</th>
                    <th className="p-2 text-sm text-gray-600">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, i) => {
                    // robust mapping for amount and productName
                    const amount =
                      tx.totalAmount ?? tx.total ?? tx.amount ?? 0;
                    const pname =
                      tx.productName ??
                      (tx.items && tx.items[0] && tx.items[0].name) ??
                      "—";
                    return (
                      <tr key={tx.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2">{pname}</td>
                        <td className="p-2">{tx.quantity ?? (tx.items ? tx.items.reduce((a, it) => a + (it.qty || it.quantity || 0), 0) : "—")}</td>
                        <td className="p-2">{Number(amount).toLocaleString()}</td>
                        <td className="p-2">{tx.cashierEmail ?? tx.cashier ?? "—"}</td>
                        <td className="p-2">
                          {tx.timestamp?.toDate
                            ? tx.timestamp.toDate().toLocaleString()
                            : tx.timestamp ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} StockPro Supermarket. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
