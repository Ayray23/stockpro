import React, { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import Sidebar from "../component/sidebar";
import Topbar from "../component/topbar";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * addProduct.jsx
 * Admin-only page to add new products to the database
 * Includes live role check, clean UI, and form validation
 */

export default function AddProduct() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    quantity: "",
    unit: "",
    barcode: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Verify admin role before showing page
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        navigate("/auth");
        return;
      }

      try {
        const userRef = doc(db, "users", u.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          toast.error("⚠️ User profile not found.");
          navigate("/salesDashboard");
          return;
        }

        const data = snap.data();
        if (data.role !== "admin") {
          toast.error("❌ Unauthorized access");
          navigate("/salesDashboard");
          return;
        }

        setProfile({ email: u.email, role: "admin" });
      } catch (err) {
        console.error("Error verifying admin role:", err);
        toast.error("Error verifying access");
        navigate("/salesDashboard");
      }
    });

    return () => unsub();
  }, [navigate]);

  // ✅ Handle input
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  // ✅ Submit new product
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, category, price, quantity, unit } = form;

    if (!name || !category || !price || !quantity || !unit) {
      toast.warning("⚠️ Fill all required fields!");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "materials"), {
        name,
        category,
        price: Number(price),
        quantity: Number(quantity),
        unit,
        barcode: form.barcode || "",
        is_sold: false,
        createdAt: serverTimestamp(),
      });

      toast.success("✅ Product added successfully!");
      setForm({ name: "", category: "", price: "", quantity: "", unit: "", barcode: "" });
    } catch (err) {
      console.error("Add product error:", err);
      toast.error("❌ Failed to add product.");
    } finally {
      setLoading(false);
    }
  };

  // If not yet verified
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="text-center text-slate-600">Verifying admin access...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar (Desktop) */}
      <div className="hidden md:block md:fixed md:inset-y-0 md:w-72">
        <Sidebar
          open={true}
          onNavigate={navigate}
          user={profile}
          active="stockIn"
          theme="dark"
        />
      </div>

      {/* Sidebar (Mobile) */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={navigate}
        user={profile}
        active="stockIn"
        theme="dark"
      />

      {/* Main Section */}
      <div className="md:pl-72">
        <Topbar
          title={`Add Product • ${profile.email?.split("@")[0]}`}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        <main className="max-w-4xl mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">
              ➕ Add New Product
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-slate-600">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Milo 500g"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-600">Category *</label>
                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Beverages"
                  required
                />
              </div>

              {/* Price */}
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

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-slate-600">Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="100"
                  required
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-medium text-slate-600">Unit *</label>
                <input
                  type="text"
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. pcs, kg, pack"
                  required
                />
              </div>

              {/* Barcode */}
              <div>
                <label className="block text-sm font-medium text-slate-600">Barcode (optional)</label>
                <input
                  type="text"
                  name="barcode"
                  value={form.barcode}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 0123456789"
                />
              </div>

              {/* Submit */}
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {loading ? "Adding..." : "✅ Add Product"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
