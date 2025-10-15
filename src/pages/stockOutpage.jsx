// src/pages/StockOut.jsx
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
      if (!u) navigate("/login");
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
    if (!selected || !quantity)
      return toast.error("Please select material and quantity");

    try {
      const ref = doc(db, "materials", selected.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return toast.error("Item not found");

      const data = snap.data();
      const currentQty = data.quantity ?? 0;
      if (Number(quantity) > currentQty)
        return toast.error("Insufficient stock");

      const newQty = currentQty - Number(quantity);
      await updateDoc(ref, { quantity: newQty });

      const sale = {
        type: "Stock Out",
        materialId: selected.id,
        materialName: data.name,
        quantity: Number(quantity),
        unit: data.unit,
        note,
        cashierEmail: user?.email,
        timestamp: serverTimestamp(),
      };
      const txRef = await addDoc(collection(db, "transactions"), sale);

      toast.success("✅ Checkout completed!");
      setReceipt({
        id: txRef.id,
        ...sale,
        total: data.price ? data.price * quantity : quantity,
      });

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
        body { font-family: sans-serif; padding: 16px; }
        h2 { text-align: center; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        td, th { padding: 4px; border-bottom: 1px solid #ccc; }
        .total { font-weight: bold; text-align: right; margin-top: 10px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style></head><body>${content}</body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex">
      {/* Sidebar (Desktop + Mobile) */}
      <div className="hidden md:block md:fixed md:inset-y-0 md:w-72">
        <Sidebar
          open={true}
          onNavigate={(p) => navigate(p)}
          user={{ email: user?.email, role: "staff" }}
          active="checkout"
          theme="dark"
        />
      </div>

      {/* Mobile Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={(p) => {
          setSidebarOpen(false);
          navigate(p);
        }}
        user={{ email: user?.email, role: "staff" }}
        active="checkout"
        theme="dark"
      />

      {/* Main Content */}
      <div className="flex-1 md:pl-72">
        <Topbar
          title="Checkout / Stock Out"
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        <main className="max-w-3xl mx-auto py-12 px-6">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-center mb-6">
              Checkout Material
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Select Material
                </label>
                <select
                  value={selected?.id || ""}
                  onChange={(e) =>
                    setSelected(
                      materials.find((m) => m.id === e.target.value) || null
                    )
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Choose Material --</option>
                  {materials.map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} ({mat.quantity} {mat.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Purpose / Notes
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
              >
                 Complete Checkout
              </button>
            </form>
          </div>
        </main>
      </div>

      {/* ✅ Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-[400px] max-w-full p-6 animate-fadeIn">
            <div ref={receiptRef}>
              <h2> StockPro Receipt</h2>
              <p><strong>ID:</strong> {receipt.id}</p>
              <p><strong>Cashier:</strong> {receipt.cashierEmail}</p>
              <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
              <table>
                <tbody>
                  <tr>
                    <td>{receipt.materialName}</td>
                    <td>{receipt.quantity} {receipt.unit}</td>
                  </tr>
                </tbody>
              </table>
              <div className="total">Total: {receipt.total}</div>
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
