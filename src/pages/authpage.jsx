import React, { useState } from "react";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

/**
 * AuthPage (Login + Signup)
 * - Modern glassy design
 * - Handles both login and signup
 * - Automatically assigns admin to first user
 * - Routes user based on Firestore role
 */

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const resetFields = () => {
    setEmail("");
    setPassword("");
    setConfirm("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        if (password !== confirm)
          return toast.error("Passwords do not match ❌");

        // create user
        const userCred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCred.user;

        // check if first user → admin
        const allUsers = await getDocs(collection(db, "users"));
        const isFirst = allUsers.empty;
        const role = isFirst ? "admin" : "staff";

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          role,
          createdAt: serverTimestamp(),
        });

        toast.success(
          `🎉 Account created! You are logged in as ${role.toUpperCase()}`
        );

        if (role === "admin") navigate("/adminDashboard");
        else navigate("/salesDashboard");
      } else {
        // login flow
        const userCred = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCred.user;

        const snap = await getDoc(doc(db, "users", user.uid));

        if (!snap.exists()) {
          toast.error("User record not found. Please sign up again.");
          await auth.signOut();
          return;
        }

        const data = snap.data();
        toast.success(`Welcome back, ${data.role}!`);

        if (data.role === "admin") navigate("/adminDashboard");
        else navigate("/salesDashboard");
      }

      resetFields();
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-700 via-blue-700 to-emerald-600 p-4">
      <div className="relative w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-8 text-white">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">StockPro</h1>
          <p className="text-sm text-white/80 mt-1">
            {mode === "login"
              ? "Welcome back — please login to continue"
              : "Create an account to get started"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/10 rounded-xl mb-6 overflow-hidden">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2 font-medium transition ${
              mode === "login"
                ? "bg-white/30 text-white"
                : "hover:bg-white/10 text-white/70"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 font-medium transition ${
              mode === "signup"
                ? "bg-white/30 text-white"
                : "hover:bg-white/10 text-white/70"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-white/70 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 placeholder-white/60 text-white focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 placeholder-white/60 text-white focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-sm text-white/70 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 placeholder-white/60 text-white focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {loading
              ? mode === "login"
                ? "Signing in..."
                : "Creating account..."
              : mode === "login"
              ? "Login"
              : "Create Account"}
          </button>
        </form>

        <p className="text-xs text-center text-white/70 mt-6">
          By continuing, you agree to StockPro’s{" "}
          <span className="underline">Terms</span> &{" "}
          <span className="underline">Privacy Policy</span>.
        </p>

        <div className="absolute inset-x-0 bottom-3 text-center text-[10px] text-white/40">
          © {new Date().getFullYear()} StockPro
        </div>
      </div>
    </div>
  );
}
