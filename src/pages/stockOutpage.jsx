// src/pages/StockOut.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";

const StockOut = () => {
  const [materials, setMaterials] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  // Fetch materials
  useEffect(() => {
    const fetchMaterials = async () => {
      const snapshot = await getDocs(collection(db, "materials"));
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMaterials(items);
    };

    fetchMaterials();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedId || !quantity) {
      return toast.error("Please select material and enter quantity");
    }

    const materialRef = doc(db, "materials", selectedId);
    const materialSnap = await getDoc(materialRef);

    if (!materialSnap.exists()) {
      return toast.error("Material not found!");
    }

    const currentData = materialSnap.data();
    const currentQty = currentData.quantity;

    if (Number(quantity) > currentQty) {
      return toast.error("Not enough stock");
    }

    try {
      // 1. Update quantity
      await updateDoc(materialRef, {
        quantity: currentQty - Number(quantity),
      });

      // 2. Log transaction
      await addDoc(collection(db, "transactions"), {
        type: "Stock Out",
        materialId: selectedId,
        materialName: currentData.name,
        quantity: Number(quantity),
        unit: currentData.unit,
        note,
        timestamp: serverTimestamp(),
      });

      toast.success("✅ Stock updated!");
      setSelectedId("");
      setQuantity("");
      setNote("");
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to stock out");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md pt-16 md:ml-64  space-y-4 bg-white p-4 rounded shadow">
      <h2 className="text-xl font-semibold text-center">Stock Out</h2>

      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full border px-3 py-2 rounded"
        required
      >
        <option value="">Select Material</option>
        {materials.map((mat) => (
          <option key={mat.id} value={mat.id}>
            {mat.name} ({mat.quantity} {mat.unit})
          </option>
        ))}
      </select>

      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="Quantity to remove"
        className="w-full border px-3 py-2 rounded"
        required
      />

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Purpose / Notes (optional)"
        className="w-full border px-3 py-2 rounded"
      />

      <button
        type="submit"
        className="bg-red-600 text-white w-full py-2 rounded hover:bg-red-700"
      >
        ➖ Stock Out
      </button>
    </form>
  );
};

export default StockOut;
