import React, { useEffect, useState, useRef } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { toast } from "react-toastify";
import Sidebar from "../component/sidebar";
import Topbar from "../component/topbar";
import { useNavigate } from "react-router-dom";

/**
 * stockOut.jsx
 * Checkout / POS Page
 * - Only accessible by logged-in staff
 * - Updates product stock & creates transaction record
 * - Generates a print-ready receipt
 */

export default function StockOut() {
  const [materials, setMaterials] = useState([]);
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const receiptRef = useRef();
  const navigate = useNavigate();

  // ✅ Auth listener
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) navigate("/auth");
      else setUser(u);
    });
    return () => unsub();
  }, [navigate]);

  // ✅ Fetch materials
  useEffect(() => {
    const fetchMaterials = async () => {
      const snap = await getDocs(collection(db, "materials"));
      setMaterials(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetchMaterials();
  }, []);

  // ✅ Handle checkout
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected || !quantity) return toast.error("Select product and quantity");

    try {
      const ref = doc(db, "materials", selected.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return toast.error("Product not found");

      const data = snap.data();
      const currentQty = data.quantity ?? 0;
      if (Number(quantity) > currentQty) return toast.error("Insufficient stock");

      const newQty = currentQty - Number(quantity);
      await updateDoc(ref, { quantity: newQty });

      const tx = {
        type: "Stock Out",
        materialId: selected.id,
        materialName: data.name,
        quantity: Number(quantity),
        unit: data.unit,
        note,
        price: data.price ?? 0,
        total: (data.price ?? 0) * Number(quantity),
        cashierEmail: user?.email,
        timestamp: serverTimestamp(),
      };

      const txRef = await addDoc(collection(db, "transactions"), tx);

      toast.success("✅ Checkout successful!");
      setReceipt({ id: txRef.id, ...tx });
      setQuantity("");
      setNote("");
      setSelected(null);
    } catch (err) {
      console.error(err);
      toast.error("❌ Checkout failed");
    }
  };

  // ✅ Print receipt
  const handlePrint = () => {
    const content = receiptRef.current.innerHTML;
    const w = window.open("", "PrintWindow", "width=400,height=600");
    w.document.write(`
      <html><head><title>Receipt</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 16px; }
        h2 { text-align: center; margin-bottom: 8px; color: #2563eb; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        td, th { padding: 4px; border-bottom: 1px solid #e5e7eb; }
        .total { font-weight: bold; text-align: right; margin-top: 10px; color: #0f172a; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
      </style></head><body>${content}</body></html>
    `);
    w.document.close();
    w.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar (Desktop) */}
      <div className="hidden md:block md:fixed md:inset-y-0 md:w-72">
        <Sidebar
          open={true}
          onNavigate={(p) => navigate(p)}
          user={{ email: user?.email, role: "staff" }}
          active="stockOut"
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
        user={{ email: user?.email, role: "staff" }}
        active="stockOut"
        theme="dark"
      />

      {/* Main Content */}
      <div className="flex-1 md:pl-72">
        <Topbar
          title={`Checkout • ${user?.email?.split("@")[0] || "Staff"}`}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        <main className="max-w-3xl mx-auto py-12 px-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition">
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">
              🛒 Checkout / Stock Out
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Product Select */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Select Product
                </label>
                <select
                  value={selected?.id || ""}
                  onChange={(e) =>
                    setSelected(
                      materials.find((m) => m.id === e.target.value) || null
                    )
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">-- Choose Product --</option>
                  {materials.map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} ({mat.quantity} {mat.unit ?? ""})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Notes / Purpose (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="E.g. Customer purchase, internal usage..."
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
              >
                ✅ Complete Checkout
              </button>
            </form>
          </div>
        </main>
      </div>

      {/* ✅ Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-[400px] max-w-full p-6">
            <div ref={receiptRef}>
              <h2>🧾 StockPro Receipt</h2>
              <p><strong>ID:</strong> {receipt.id}</p>
              <p><strong>Cashier:</strong> {receipt.cashierEmail}</p>
              <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
              <table>
                <tbody>
                  <tr>
                    <td>{receipt.materialName}</td>
                    <td>{receipt.quantity} {receipt.unit}</td>
                    <td>₦{receipt.price?.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
              <div className="total">Total: ₦{receipt.total?.toLocaleString()}</div>
              {receipt.note && <p><em>Note:</em> {receipt.note}</p>}
              <div className="footer">Thank you for your purchase!</div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handlePrint}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                🖨 Print
              </button>
              <button
                onClick={() => setReceipt(null)}
                className="flex-1 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
