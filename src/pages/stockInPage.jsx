// src/pages/AddProduct.jsx
import React, { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import Sidebar from "../component/sidebar";
import Topbar from "../component/topbar";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AddProduct() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    quantity: "",
    barcode: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Only admin can access
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        navigate("/login");
        return;
      }
      const token = await u.getIdTokenResult();
      const claims = token.claims || {};
      if (!claims.admin && u.email !== "admin@stockpro.com") {
        toast.error("🚫 Unauthorized access");
        navigate("/checkout");
      } else {
        setProfile({ email: u.email, role: "admin" });
      }
    });
    return () => unsub();
  }, [navigate]);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, category, price, quantity, barcode } = form;
    if (!name || !category || !price || !quantity) {
      toast.warning("⚠️ Fill all required fields!");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "products"), {
        name,
        category,
        price: Number(price),
        quantity: Number(quantity),
        barcode: barcode || "",
        is_sold: false,
        createdAt: serverTimestamp(),
      });

      toast.success("✅ Product added successfully!");
      setForm({ name: "", category: "", price: "", quantity: "", barcode: "" });
    } catch (err) {
      console.error("Add product error:", err);
      toast.error("❌ Failed to add product.");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="text-center text-slate-600">Checking admin access...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <div className="hidden md:block md:fixed md:inset-y-0 md:w-72">
        <Sidebar
          open={true}
          onNavigate={navigate}
          user={profile}
          active="products"
          theme="dark"
        />
      </div>

      {/* Mobile Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={navigate}
        user={profile}
        active="products"
        theme="dark"
      />

      <div className="md:pl-72">
        <Topbar
          title="Add New Product"
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-white rounded-2xl shadow-lg p-8 transition hover:shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">
              🛒 Add Product to Inventory
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-600">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Golden Penny Spaghetti"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600">Category *</label>
                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Pasta & Grains"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600">Price (₦) *</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600">Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600">Barcode</label>
                <input
                  type="text"
                  name="barcode"
                  value={form.barcode}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Optional"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {loading ? "Adding..." : "➕ Add Product"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
