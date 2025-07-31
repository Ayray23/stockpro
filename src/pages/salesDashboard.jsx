// src/pages/adminDashboard.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";

const SalesDashboard = () => {
  const [materials, setMaterials] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const materialsSnap = await getDocs(collection(db, "materials"));
      const materialList = materialsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMaterials(materialList);

      const txSnap = await getDocs(
        query(collection(db, "transactions"), orderBy("timestamp", "desc"), limit(5))
      );
      const txList = txSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(txList);
    };

    fetchData();
  }, []);

  const totalQuantity = materials.reduce((acc, mat) => acc + Number(mat.quantity || 0), 0);
  const lowStock = materials.filter((mat) => mat.quantity < 5);

  return (
    <div className="p-4 space-y-6 pt-16 md:ml-64 ">
      <h1 className="text-2xl font-bold">📊 Admin Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Total Materials</h2>
          <p className="text-2xl">{materials.length}</p>
        </div>
        <div className="bg-green-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Total Quantity in Stock</h2>
          <p className="text-2xl">{totalQuantity}</p>
        </div>
        <div className="bg-red-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Low Stock Items</h2>
          <p className="text-2xl">{lowStock.length}</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">🕒 Recent Stock Outs</h2>
        {transactions.length === 0 ? (
          <p>No recent transactions.</p>
        ) : (
          <table className="w-full text-left border">
            <thead>
              <tr className="border-b">
                <th className="p-2">Material</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Unit</th>
                <th className="p-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b">
                  <td className="p-2">{tx.materialName}</td>
                  <td className="p-2">{tx.quantity}</td>
                  <td className="p-2">{tx.unit}</td>
                  <td className="p-2">{tx.timestamp?.toDate().toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SalesDashboard;
