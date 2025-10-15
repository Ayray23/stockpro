import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Sidebar from "../component/sidebar";
import Topbar from "../component/topbar";
import { toast } from "react-toastify";

/**
 * SalesDashboard.jsx
 * - Accessible by staff (non-admin users)
 * - Displays current stock summary and recent transactions
 * - Styled as a professional SaaS panel
 */

export default function SalesDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // ✅ Auth listener
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        navigate("/auth");
        return;
      }

      setUser(u);
      try {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          toast.error("No profile found!");
          navigate("/auth");
          return;
        }

        const data = snap.data();
        if (data.role === "admin") navigate("/adminDashboard");
        else setProfile(data);
      } catch (err) {
        console.error("Error fetching user:", err);
        toast.error("Failed to load profile");
      }
    });

    return () => unsub();
  }, [navigate]);

  // ✅ Fetch materials & user-specific transactions
  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const materialSnap = await getDocs(collection(db, "materials"));
        setMaterials(materialSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        const txSnap = await getDocs(
          query(
            collection(db, "transactions"),
            where("cashierEmail", "==", profile.email),
            orderBy("timestamp", "desc"),
            limit(10)
          )
        );
        setTransactions(txSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Data fetch error:", err);
        toast.error("Failed to fetch sales data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100 text-slate-600">
        Checking user access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar (Desktop) */}
      <div className="hidden md:block md:fixed md:inset-y-0 md:w-72">
        <Sidebar
          open={true}
          onNavigate={(p) => navigate(p)}
          user={{ email: user?.email, role: profile.role }}
          active="salesDashboard"
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
        user={{ email: user?.email, role: profile.role }}
        active="salesDashboard"
        theme="dark"
      />

      {/* Main Section */}
      <div className="md:pl-72">
        <Topbar
          title={`Welcome, ${user?.email?.split("@")[0] || "Staff"}`}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Total Products", value: materials.length },
              {
                title: "Total Transactions",
                value: transactions.length,
              },
              {
                title: "Low Stock Items",
                value: materials.filter((m) => m.quantity < 5).length,
              },
              {
                title: "Recent Checkout",
                value: transactions[0]?.materialName || "—",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition"
              >
                <div className="text-sm text-slate-500">{card.title}</div>
                <div className="text-3xl font-bold text-indigo-700 mt-2">
                  {loading ? "..." : card.value}
                </div>
              </div>
            ))}
          </div>

          {/* Available Stock */}
          <section className="bg-white rounded-2xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-700">
              📦 Available Materials
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Category</th>
                    <th className="text-left py-2">Quantity</th>
                    <th className="text-left py-2">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center text-slate-400 py-4"
                      >
                        No materials found
                      </td>
                    </tr>
                  ) : (
                    materials.map((mat) => (
                      <tr
                        key={mat.id}
                        className="border-b hover:bg-slate-50 transition"
                      >
                        <td className="py-2">{mat.name}</td>
                        <td className="py-2">{mat.category}</td>
                        <td
                          className={`py-2 font-semibold ${
                            mat.quantity < 5
                              ? "text-red-600"
                              : "text-slate-800"
                          }`}
                        >
                          {mat.quantity}
                        </td>
                        <td className="py-2">{mat.unit}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Recent Transactions */}
          <section className="bg-white rounded-2xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-700">
              🧾 Your Recent Transactions
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="text-left py-2">Material</th>
                    <th className="text-left py-2">Qty</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center text-slate-400 py-4"
                      >
                        No recent transactions
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b hover:bg-slate-50 transition"
                      >
                        <td className="py-2">{tx.materialName}</td>
                        <td className="py-2">{tx.quantity}</td>
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
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => navigate("/stock-out")}
                className="bg-emerald-600 text-white rounded-lg py-2 px-4 hover:bg-emerald-700 transition"
              >
                ➕ Checkout Item
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
