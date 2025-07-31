// src/pages/AddMaterial.jsx
import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AddMaterial() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !quantity || !category || !unit) {
      toast.warning("⚠️ Please fill all required fields");
      return;
    }

    try {
      await addDoc(collection(db, "materials"), {
        name,
        code,
        category,
        quantity: Number(quantity),
        unit,
        addedAt: serverTimestamp(),
      });
      toast.success("✅ Material added!");
      setName("");
      setCode("");
      setCategory("");
      setQuantity("");
      setUnit("");
    } catch (err) {
      console.error("❌ Error adding material:", err);
      toast.error("❌ Something went wrong.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md pt-16 md:ml-64 p-4 bg-white rounded shadow">
      <h1 className="text-2xl text-center font-semibold">Add Material</h1>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Material Name"
        className="border px-3 py-2 w-full rounded"
        required
      />
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Material Code (optional)"
        className="border px-3 py-2 w-full rounded"
      />
      <input
        type="text"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Category"
        className="border px-3 py-2 w-full rounded"
        required
      />
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="Quantity"
        className="border px-3 py-2 w-full rounded"
        required
      />
      <input
        type="text"
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        placeholder="Unit (e.g. kg, bag, pcs)"
        className="border px-3 py-2 w-full rounded"
        required
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">
        ➕ Add Material
      </button>
    </form>
  );
}
