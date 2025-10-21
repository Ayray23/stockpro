// src/pages/authPage.jsx
import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc, getDocs, collection } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle login/signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        if (password !== confirm) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }

        // Create user
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCred.user;

        // Determine role — first user becomes admin
        const usersSnap = await getDocs(collection(db, "users"));
        const role = usersSnap.empty ? "admin" : "staff";

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          role,
          createdAt: new Date().toISOString(),
        });

        toast.success(`🎉 Account created successfully as ${role}`);
        navigate(role === "admin" ? "/adminDashboard" : "/salesDashboard");
      } else {
        // Login
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const user = userCred.user;
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          toast.error("Account not found in database");
          return;
        }

        const data = snap.data();
        toast.success(`👋 Welcome back, ${data.role === "admin" ? "Admin" : "Staff"}`);
        navigate(data.role === "admin" ? "/adminDashboard" : "/salesDashboard");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-indigo-800 via-blue-700 to-emerald-600 text-slate-900">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-center items-start p-16 text-white w-1/2">
        <h1 className="text-5xl font-extrabold mb-6 leading-tight">
          Manage Your <span className="text-emerald-300">Stock</span> Smarter
        </h1>
        <p className="text-lg text-slate-200 max-w-md">
          StockPro helps businesses track inventory, monitor sales, and manage staff effortlessly — all from a single dashboard.
        </p>
      </div>

      {/* Auth card */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 transition-all">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-indigo-700">StockPro</h1>
            <p className="text-sm text-slate-500 mt-1">Smart Inventory Management</p>
          </div>

          {/* Mode Tabs */}
          <div className="flex justify-center mb-8 border-b border-slate-200">
            {["login", "signup"].map((tab) => (
              <button
                key={tab}
                onClick={() => setMode(tab)}
                className={`flex-1 py-2 font-medium text-sm transition-all duration-300 ${
                  mode === tab
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-slate-500 hover:text-indigo-600"
                }`}
              >
                {tab === "login" ? "Login" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-600">
                Email Address
              </label>
              <input
                type="email"
                className="mt-1 w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600">
                Password
              </label>
              <input
                type="password"
                className="mt-1 w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-slate-600">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="mt-1 w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm password"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all duration-200 disabled:opacity-60"
            >
              {loading
                ? mode === "login"
                  ? "Logging in..."
                  : "Creating Account..."
                : mode === "login"
                ? "Login"
                : "Sign Up"}
            </button>
          </form>

          {/* Footer Switch */}
          <p className="text-sm text-center text-slate-500 mt-6">
            {mode === "login" ? (
              <>
                Don’t have an account?{" "}
                <button
                  type="button"
                  className="text-indigo-600 font-medium hover:underline"
                  onClick={() => setMode("signup")}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-indigo-600 font-medium hover:underline"
                  onClick={() => setMode("login")}
                >
                  Login
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
