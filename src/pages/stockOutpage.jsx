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
// import { ShoppingCart, Printer, X, Check, Search, Trash2 } from "lucide-react";

export default function StockOut() {
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [note, setNote] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const receiptRef = useRef();
  const navigate = useNavigate();

  // Auth + Profile Fetch
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) return navigate("/auth");

      setUser(u);

      try {
        const userRef = doc(db, "users", u.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          toast.error("User profile not found. Please contact admin.");
          navigate("/auth");
          return;
        }

        setProfile(snap.data());
      } catch (err) {
        console.error("Profile fetch error:", err);
        toast.error("Failed to verify user role.");
      }
    });

    return () => unsub();
  }, [navigate]);

  // Fetch materials
  useEffect(() => {
    const fetchMaterials = async () => {
      const snap = await getDocs(collection(db, "materials"));
      const mats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMaterials(mats);
      setFilteredMaterials(mats);
    };
    fetchMaterials();
  }, []);

  // Search filter
  useEffect(() => {
    const filtered = materials.filter((mat) =>
      mat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMaterials(filtered);
  }, [searchTerm, materials]);

  // Add to cart
  const addToCart = (material) => {
    const existing = cart.find((item) => item.id === material.id);
    if (existing) {
      updateCartQuantity(material.id, existing.quantity + 1);
    } else {
      setCart([...cart, { ...material, cartQuantity: 1 }]);
      toast.success(`${material.name} added to cart`);
    }
  };

  // Update cart quantity
  const updateCartQuantity = (id, newQty) => {
    const item = cart.find((i) => i.id === id);
    if (newQty > item.quantity) {
      toast.error("Quantity exceeds available stock");
      return;
    }
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(cart.map((i) => (i.id === id ? { ...i, cartQuantity: newQty } : i)));
  };

  // Remove from cart
  const removeFromCart = (id) => {
    setCart(cart.filter((i) => i.id !== id));
  };

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => sum + (item.price || 0) * item.cartQuantity,
    0
  );
  const tax = subtotal * 0.075; // 7.5% VAT
  const total = subtotal + tax;

  // Handle checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");

    setIsProcessing(true);

    try {
      const transactions = [];

      for (const item of cart) {
        const ref = doc(db, "materials", item.id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          toast.error(`Product ${item.name} not found`);
          continue;
        }

        const data = snap.data();
        const currentQty = data.quantity ?? 0;
        if (item.cartQuantity > currentQty) {
          toast.error(`Insufficient stock for ${item.name}`);
          continue;
        }

        const newQty = currentQty - item.cartQuantity;
        await updateDoc(ref, { quantity: newQty });

        const tx = {
          type: "Stock Out",
          materialId: item.id,
          materialName: data.name,
          quantity: item.cartQuantity,
          unit: data.unit,
          price: data.price ?? 0,
          total: (data.price ?? 0) * item.cartQuantity,
          cashierEmail: user?.email,
          timestamp: serverTimestamp(),
        };

        const txRef = await addDoc(collection(db, "transactions"), tx);
        transactions.push({ id: txRef.id, ...tx });
      }

      // Update materials list
      const snap = await getDocs(collection(db, "materials"));
      const mats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMaterials(mats);
      setFilteredMaterials(mats);

      toast.success("✅ Checkout successful!");
      
      setReceipt({
        id: `TXN-${Date.now()}`,
        items: cart,
        subtotal,
        tax,
        total,
        note,
        cashierEmail: user?.email,
        timestamp: new Date(),
      });

      setCart([]);
      setNote("");
      
      // Auto print after 500ms
      setTimeout(() => {
        handlePrint();
      }, 500);
      
    } catch (err) {
      console.error(err);
      toast.error("❌ Checkout failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Print receipt
  const handlePrint = () => {
    const content = receiptRef.current.innerHTML;
    const w = window.open("", "PrintWindow", "width=400,height=600");
    w.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              padding: 20px; 
              max-width: 350px;
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
            }
            .header h2 { margin: 5px 0; font-size: 20px; }
            .info { margin: 15px 0; font-size: 12px; }
            .info p { margin: 3px 0; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 15px 0;
              font-size: 12px;
            }
            th { 
              text-align: left; 
              border-bottom: 1px solid #000;
              padding: 5px 0;
            }
            td { 
              padding: 5px 0; 
              border-bottom: 1px dashed #ddd;
            }
            .right { text-align: right; }
            .totals { 
              margin-top: 15px; 
              border-top: 2px solid #000;
              padding-top: 10px;
            }
            .totals p { 
              display: flex; 
              justify-content: space-between;
              margin: 5px 0;
            }
            .grand-total { 
              font-size: 16px; 
              font-weight: bold;
              border-top: 2px solid #000;
              padding-top: 10px;
              margin-top: 10px;
            }
            .footer { 
              text-align: center; 
              margin-top: 20px; 
              font-size: 11px;
              border-top: 2px dashed #000;
              padding-top: 15px;
            }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    w.document.close();
    w.print();
  };

  // Loading guard
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100 text-slate-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Verifying account...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 flex">
      {/* Sidebar (Desktop) */}
      <div className="hidden md:block md:fixed md:inset-y-0 md:w-72">
        <Sidebar
          open={true}
          onNavigate={(p) => navigate(p)}
          user={{ email: user?.email, role: profile?.role }}
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
        user={{ email: user?.email, role: profile?.role }}
        active="stockOut"
        theme="dark"
      />

      {/* Main Content */}
      <div className="flex-1 md:pl-72">
        <Topbar
          title={`POS Checkout • ${user?.email?.split("@")[0] || "Staff"}`}
          onToggleSidebar={() => setSidebarOpen(true)}
          user={profile}
        />

        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Products Section */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 border-0 focus:ring-0 text-lg font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredMaterials.map((mat) => (
                    <div
                      key={mat.id}
                      onClick={() => mat.quantity > 0 && addToCart(mat)}
                      className={`bg-white rounded-xl shadow-md p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                        mat.quantity === 0 ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <div className="aspect-square bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg mb-3 flex items-center justify-center">
                        <ShoppingCart className="w-10 h-10 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                        {mat.name}
                      </h3>
                      <p className="text-xs text-slate-500 mb-2">
                        Stock: {mat.quantity} {mat.unit || "units"}
                      </p>
                      <p className="text-lg font-bold text-emerald-600">
                        ₦{(mat.price || 0).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart Section */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <ShoppingCart className="w-6 h-6" />
                      Cart ({cart.length})
                    </h2>
                    {cart.length > 0 && (
                      <button
                        onClick={() => setCart([])}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-30" />
                      <p>Your cart is empty</p>
                      <p className="text-sm mt-1">Add products to get started</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
                        {cart.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm mb-1">
                                {item.name}
                              </h4>
                              <p className="text-xs text-slate-500">
                                ₦{(item.price || 0).toLocaleString()} each
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateCartQuantity(item.id, item.cartQuantity - 1)
                                }
                                className="w-7 h-7 bg-white rounded border hover:bg-slate-100"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-semibold">
                                {item.cartQuantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateCartQuantity(item.id, item.cartQuantity + 1)
                                }
                                className="w-7 h-7 bg-white rounded border hover:bg-slate-100"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1 hover:bg-red-100 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="border-t pt-4 space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Subtotal:</span>
                          <span className="font-semibold">
                            ₦{subtotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Tax (7.5%):</span>
                          <span className="font-semibold">
                            ₦{tax.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                          <span>Total:</span>
                          <span className="text-emerald-600">
                            ₦{total.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add note (optional)..."
                        className="w-full border rounded-lg px-3 py-2 text-sm mb-4 resize-none"
                        rows={2}
                      />

                      <button
                        onClick={handleCheckout}
                        disabled={isProcessing}
                        className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            Complete Checkout
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div ref={receiptRef}>
                <div className="header">
                  <h2>StockPro System</h2>
                  <p>Inventory Management</p>
                </div>

                <div className="info">
                  <p><strong>Receipt #:</strong> {receipt.id}</p>
                  <p><strong>Cashier:</strong> {receipt.cashierEmail}</p>
                  <p><strong>Date:</strong> {receipt.timestamp.toLocaleString()}</p>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="right">Qty</th>
                      <th className="right">Price</th>
                      <th className="right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name}</td>
                        <td className="right">{item.cartQuantity}</td>
                        <td className="right">₦{(item.price || 0).toLocaleString()}</td>
                        <td className="right">
                          ₦{((item.price || 0) * item.cartQuantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="totals">
                  <p>
                    <span>Subtotal:</span>
                    <strong>₦{receipt.subtotal.toLocaleString()}</strong>
                  </p>
                  <p>
                    <span>Tax (7.5%):</span>
                    <strong>₦{receipt.tax.toLocaleString()}</strong>
                  </p>
                  <p className="grand-total">
                    <span>TOTAL:</span>
                    <strong>₦{receipt.total.toLocaleString()}</strong>
                  </p>
                </div>

                {receipt.note && (
                  <div className="info">
                    <p><em>Note: {receipt.note}</em></p>
                  </div>
                )}

                <div className="footer">
                  <p>Thank you for your business!</p>
                  <p>Please come again</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={handlePrint}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Print Receipt
              </button>
              <button
                onClick={() => setReceipt(null)}
                className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-semibold flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}