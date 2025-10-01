// src/pages/Dashboard.jsx
//adimin only
//sales summary by each loged in user

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const Dashboard = () => {
  const [totalMaterials, setTotalMaterials] = useState(0);
  const [totalStockIn, setTotalStockIn] = useState(0);
  const [totalStockOut, setTotalStockOut] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0); 

  useEffect(() => {
    const fetchStats = async () => {
      const materialsSnap = await getDocs(collection(db, "materials"));
      const materials = materialsSnap.docs.map((doc) => doc.data());

      const transSnap = await getDocs(collection(db, "transactions"));
      const transactions = transSnap.docs.map((doc) => doc.data());

      const stockInQty = transactions
        .filter((t) => t.type === "Stock In")
        .reduce((sum, t) => sum + t.quantity, 0);

      const stockOutQty = transactions
        .filter((t) => t.type === "Stock Out")
        .reduce((sum, t) => sum + t.quantity, 0);

      const lowStock = materials.filter((m) => m.quantity <= 5); // 🔴 Count low stock

      setTotalMaterials(materials.length);
      setTotalStockIn(stockInQty);
      setTotalStockOut(stockOutQty);
      setTotalTransactions(transactions.length);
      setLowStockCount(lowStock.length); // 🔴 Set count
    };

    fetchStats();
  }, []);

  return (
    <div className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <SummaryCard title="Total Materials" value={totalMaterials} color="bg-blue-100" />
      <SummaryCard title="Total Stock In" value={totalStockIn} color="bg-green-100" />
      <SummaryCard title="Total Stock Out" value={totalStockOut} color="bg-red-100" />
      <SummaryCard title="Transactions" value={totalTransactions} color="bg-yellow-100" />
      <SummaryCard title="Low Stock Items" value={lowStockCount} color="bg-orange-100" /> {/* 🔴 NEW */}
    </div>
  );
};

const SummaryCard = ({ title, value, color }) => (
  <div className={`p-4 rounded shadow ${color}`}>
    <h4 className="text-sm text-gray-600">{title}</h4>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

export default Dashboard;
