import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react"; // 👁️ icons

/**
 * AuthPage.jsx
 * - Login + Signup page with Email Verification
 * - Admin signup requires secret code
 * - Includes password visibility toggles and strong validation
 */

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const ADMIN_CODE = "STOCKPRO-2025"; // 🔒 Change this secret code

  // Handle login / signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        // 🟢 Signup
        if (password !== confirm) {
          toast.error("Passwords do not match");
          return setLoading(false);
        }

        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCred.user;

        await sendEmailVerification(user);
        toast.info("📩 Verification email sent. Please verify before logging in.");

        const role = adminCode === ADMIN_CODE ? "admin" : "staff";

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          role,
          verified: false,
          createdAt: new Date().toISOString(),
        });

        await signOut(auth);
        toast.success(`🎉 Account created as ${role}. Verify your email before login.`);
      } else {
        // 🔵 Login
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const user = userCred.user;

        if (!user.emailVerified) {
          toast.warn("⚠️ Please verify your email before logging in.");
          await signOut(auth);
          return;
        }

        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          toast.error("User record not found.");
          await signOut(auth);
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

  // Handle resend verification
  const handleResendVerification = async () => {
    if (!email) {
      toast.error("⚠️ Please enter your email first.");
      return;
    }

    try {
      // Try signing in silently to get user object
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      if (user.emailVerified) {
        toast.info("✅ This email is already verified.");
        await signOut(auth);
        return;
      }

      await sendEmailVerification(user);
      toast.success("📨 Verification email sent again!");
      await signOut(auth);
    } catch (err) {
      toast.error("Failed to resend verification. Check your email and password.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-700 via-blue-700 to-emerald-600 p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 transition-all hover:shadow-indigo-200">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-indigo-700 tracking-tight">
            StockPro
          </h1>
          <p className="text-sm text-slate-500 mt-1">Smart Inventory System</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-6 border-b border-slate-200">
          {["login", "signup"].map((tab) => (
            <button
              key={tab}
              onClick={() => setMode(tab)}
              className={`flex-1 py-2 font-semibold transition-all ${
                mode === tab
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-slate-500 hover:text-slate-700"
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
              className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-600">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Confirm Password (Signup only) */}
          {mode === "signup" && (
            <>
              <div className="relative">
                <label className="block text-sm font-medium text-slate-600">
                  Confirm Password
                </label>
                <input
                  type={showConfirm ? "text" : "password"}
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none pr-10"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 flex items-center justify-between">
                  Admin Access Code{" "}
                  <span className="text-xs text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="Enter admin code if you have one"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
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

        {/* Footer */}
        <div className="text-sm text-center text-slate-500 mt-6 space-y-2">
          {mode === "login" ? (
            <>
              <p>
                Don’t have an account?{" "}
                <button
                  type="button"
                  className="text-indigo-600 font-medium hover:underline"
                  onClick={() => setMode("signup")}
                >
                  Sign Up
                </button>
              </p>
              <button
                onClick={handleResendVerification}
                className="text-indigo-500 font-medium hover:underline"
              >
                Resend verification email
              </button>
            </>
          ) : (
            <p>
              Already registered?{" "}
              <button
                type="button"
                className="text-indigo-600 font-medium hover:underline"
                onClick={() => setMode("login")}
              >
                Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
