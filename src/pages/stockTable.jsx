//adimin only

//out of stock alarm
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const StockTable = () => {
  const [stockItems, setStockItems] = useState([]);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "materials"));
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStockItems(items);
      } catch (error) {
        console.error("Error fetching materials:", error);
      }
    };

    fetchMaterials();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md p-4 overflow-x-auto">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Materials Overview</h2>
      <table className="w-full text-sm text-left text-gray-700">
        <thead className="text-xs uppercase bg-blue-100 text-blue-700">
          <tr>
            <th className="px-4 py-2">Item</th>
            <th className="px-4 py-2">Category</th>
            <th className="px-4 py-2">Quantity</th>
            <th className="px-4 py-2">Unit</th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {stockItems.map((item, index) => (
            <tr key={index} className="border-t">
              <td className="px-4 py-2">{item.name}</td>
              <td className="px-4 py-2">{item.category || "-"}</td>
              <td className="px-4 py-2">{item.quantity}</td>
              <td className="px-4 py-2">{item.unit || "-"}</td>
              <td className="px-4 py-2">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    item.quantity === 0
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {item.quantity === 0 ? "Out of Stock" : "In Stock"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StockTable;
