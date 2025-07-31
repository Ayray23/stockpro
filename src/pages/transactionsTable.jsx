import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

const TransactionPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const q = query(collection(db, "transactions"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTransactions(data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    fetchTransactions();
  }, []);

  const filtered = transactions.filter(
    (tx) =>
      tx.materialName?.toLowerCase().includes(search.toLowerCase()) ||
      tx.type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pt-16 md:ml-64 p-4">
      <h2 className="text-2xl font-bold mb-4 text-center">📋 Transactions</h2>

      <input
        type="text"
        placeholder="🔍 Search by type or material name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 px-4 py-2 border rounded w-full md:w-1/2"
      />

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead className="bg-blue-100 text-blue-700">
            <tr>
              <th className="px-4 py-2 border">Type</th>
              <th className="px-4 py-2 border">Material</th>
              <th className="px-4 py-2 border">Qty</th>
              <th className="px-4 py-2 border">Unit</th>
              <th className="px-4 py-2 border">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td
                    className={`px-4 py-2 border font-semibold ${
                      tx.type === "Stock In"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {tx.type}
                  </td>
                  <td className="px-4 py-2 border">{tx.materialName || "-"}</td>
                  <td className="px-4 py-2 border">{tx.quantity ?? "-"}</td>
                  <td className="px-4 py-2 border">{tx.unit || "-"}</td>
                  <td className="px-4 py-2 border">
                    {tx.timestamp?.toDate
                      ? tx.timestamp.toDate().toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionPage;
