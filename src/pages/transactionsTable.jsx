import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Sidebar from "../component/sidebar";
import Topbar from "../component/topbar";

const TransactionPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Auth listener + profile fetch
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
          toast.error("User profile not found!");
          navigate("/auth");
          return;
        }
        setProfile(snap.data());
      } catch (err) {
        console.error("Profile fetch error:", err);
        toast.error("Error fetching profile");
      }
    });
    return () => unsub();
  }, [navigate]);

  // ✅ Fetch transactions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, "transactions"),
          orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(q);
        setTransactions(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching transactions:", err);
        toast.error("Failed to fetch transactions");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ✅ Filtering logic
  const filtered = transactions.filter((tx) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      tx.materialName?.toLowerCase().includes(searchLower) ||
      tx.type?.toLowerCase().includes(searchLower) ||
      tx.cashierEmail?.toLowerCase().includes(searchLower);

    const matchesFilter =
      filter === "all" ||
      (filter === "stockIn" && tx.type === "Stock In") ||
      (filter === "stockOut" && tx.type === "Stock Out");

    return matchesSearch && matchesFilter;
  });

  // ✅ Stats
  const stats = {
    total: transactions.length,
    stockIn: transactions.filter((t) => t.type === "Stock In").length,
    stockOut: transactions.filter((t) => t.type === "Stock Out").length,
    totalValue: transactions.reduce((sum, t) => sum + (t.total || 0), 0),
  };

  // ✅ Export CSV
  const exportToCSV = () => {
    const headers = [
      "Type",
      "Material",
      "Quantity",
      "Unit",
      "Price",
      "Total",
      "Cashier",
      "Date",
    ];
    const rows = filtered.map((tx) => [
      tx.type,
      tx.materialName,
      tx.quantity,
      tx.unit,
      tx.price || 0,
      tx.total || 0,
      tx.cashierEmail,
      tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleString() : "-",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date()
      .toISOString()
      .split("T")[0]}.csv`;
    a.click();
    toast.success("Transactions exported!");
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4 rounded-full"></div>
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <div className="hidden md:block md:fixed md:inset-y-0 md:w-72">
        <Sidebar
          open={true}
          onNavigate={(p) => navigate(p)}
          user={{ email: user?.email, role: profile.role }}
          active="transactions"
          theme="dark"
        />
      </div>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={(p) => {
          setSidebarOpen(false);
          navigate(p);
        }}
        user={{ email: user?.email, role: profile.role }}
        active="transactions"
        theme="dark"
      />

      {/* Main */}
      <div className="flex-1 md:pl-72">
        <Topbar
          title={`Transactions • ${user?.email?.split("@")[0] || "Guest"}`}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        <main className="p-6 max-w-7xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
              <p className="text-sm text-slate-600 mb-1">Total Transactions</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
              <p className="text-sm text-slate-600 mb-1">Stock In</p>
              <p className="text-2xl font-bold text-green-600">{stats.stockIn}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
              <p className="text-sm text-slate-600 mb-1">Stock Out</p>
              <p className="text-2xl font-bold text-red-600">{stats.stockOut}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6 border-l-4 border-emerald-500">
              <p className="text-sm text-slate-600 mb-1">Total Value</p>
              <p className="text-2xl font-bold text-emerald-600">
                ₦{stats.totalValue.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow p-6 mb-6 flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by material, type, or cashier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              {["all", "stockIn", "stockOut"].map((key) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === key
                      ? key === "stockIn"
                        ? "bg-green-600 text-white"
                        : key === "stockOut"
                        ? "bg-red-600 text-white"
                        : "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {key === "all"
                    ? "All"
                    : key === "stockIn"
                    ? "Stock In"
                    : "Stock Out"}
                </button>
              ))}
            </div>

            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
            >
              Export CSV
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {loading ? (
              <div className="py-12 text-center text-slate-500">
                Loading transactions...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                No transactions found
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Type</th>
                    <th className="px-6 py-3 text-left">Material</th>
                    <th className="px-6 py-3 text-left">Quantity</th>
                    <th className="px-6 py-3 text-left">Total</th>
                    <th className="px-6 py-3 text-left">Cashier</th>
                    <th className="px-6 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            tx.type === "Stock In"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">{tx.materialName}</td>
                      <td className="px-6 py-4">
                        {tx.quantity} {tx.unit}
                      </td>
                      <td className="px-6 py-4">
                        ₦{(tx.total || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {tx.cashierEmail?.split("@")[0]}
                      </td>
                      <td className="px-6 py-4">
                        {tx.timestamp?.toDate
                          ? new Date(tx.timestamp.toDate()).toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TransactionPage;
