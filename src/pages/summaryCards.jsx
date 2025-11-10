// src/pages/Dashboard.jsx
// STAFF DASHBOARD
// Shows sales summary and performance for the logged-in staff.

import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import Sidebar from "../component/sidebar";
import Topbar from "../component/topbar";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [totalStockOut, setTotalStockOut] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [materials, setMaterials] = useState([]);

  const navigate = useNavigate();

  // ✅ Auth & Profile Verification
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

        const data = snap.data();
        setProfile(data);

        if (data.role !== "staff") {
          toast.error("Unauthorized — only staff can view this dashboard.");
          navigate("/adminDashboard");
        }
      } catch (err) {
        console.error("Error verifying profile:", err);
        toast.error("Failed to load user data.");
      }
    });

    return () => unsub();
  }, [navigate]);

  // ✅ Fetch Staff's Own Transactions
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email) return;

      try {
        // Staff's own sales records
        const txQuery = query(
          collection(db, "transactions"),
          where("cashierEmail", "==", user.email)
        );
        const txSnap = await getDocs(txQuery);
        const txList = txSnap.docs.map((doc) => doc.data());

        const totalOut = txList
          .filter((t) => t.type === "Stock Out")
          .reduce((sum, t) => sum + (t.quantity || 0), 0);

        const totalAmt = txList
          .filter((t) => t.type === "Stock Out")
          .reduce((sum, t) => sum + (t.total || 0), 0);

        setTotalStockOut(totalOut);
        setTotalSales(totalAmt);
        setTotalTransactions(txList.length);

        // Fetch materials to check low stock
        const matSnap = await getDocs(collection(db, "materials"));
        const mats = matSnap.docs.map((doc) => doc.data());
        setMaterials(mats);

        const lowStock = mats.filter((m) => (m.quantity || 0) <= 5);
        setLowStockCount(lowStock.length);
      } catch (err) {
        console.error("Error fetching staff data:", err);
        toast.error("Unable to fetch dashboard data.");
      }
    };

    fetchData();
  }, [user]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100 text-slate-600">
        Loading staff dashboard...
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
          user={{ email: user?.email, role: profile?.role }}
          active="dashboard"
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
        user={{ email: user?.email, role: profile?.role }}
        active="dashboard"
        theme="dark"
      />

      {/* Main Section */}
      <div className="flex-1 md:pl-72">
        <Topbar
          title={`Sales Summary • ${profile.email?.split("@")[0]}`}
          onToggleSidebar={() => setSidebarOpen(true)}
          user={profile}
        />

        <main className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">
            📊 Staff Dashboard Summary
          </h1>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard
              title="My Transactions"
              value={totalTransactions}
              color="bg-indigo-100"
            />
            <SummaryCard
              title="Total Stock Out"
              value={totalStockOut}
              color="bg-rose-100"
            />
            <SummaryCard
              title="Total Sales (₦)"
              value={totalSales.toLocaleString()}
              color="bg-emerald-100"
            />
            <SummaryCard
              title="Low Stock Items"
              value={lowStockCount}
              color="bg-yellow-100"
            />
          </div>

          {/* Optional: Material Overview */}
          <div className="mt-10 bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">
              🧾 Inventory Overview
            </h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="text-left py-2">Material</th>
                  <th className="text-left py-2">Qty</th>
                  <th className="text-left py-2">Unit</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m, i) => (
                  <tr key={i} className="border-b hover:bg-slate-50">
                    <td className="py-2">{m.name}</td>
                    <td className="py-2">{m.quantity}</td>
                    <td className="py-2">{m.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, color }) => (
  <div
    className={`${color} p-6 rounded-2xl shadow hover:shadow-lg transition text-center`}
  >
    <h4 className="text-sm text-slate-600">{title}</h4>
    <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
  </div>
);

export default Dashboard;
