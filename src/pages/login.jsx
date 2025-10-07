import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const uid = user.uid;

      // 🔥 Fetch user record
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        // 🧠 First user becomes admin
        const allUsers = await getDocs(collection(db, "users"));
        const isFirstUser = allUsers.empty;
        const role = isFirstUser ? "admin" : "staff";

        await setDoc(userRef, {
          uid,
          email: user.email,
          role,
          createdAt: new Date().toISOString(),
        });

        console.log(✅ Created new ${role} user);
        if (role === "admin") navigate("/adminDashboard");
        else navigate("/salesDashboard");
        return;
      }

      // ✅ If already exists, route by role
      const data = snap.data();
      if (data.role === "admin") navigate("/adminDashboard");
      else navigate("/salesDashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed: " + err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-2xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-blue-700">StockPro Login</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Login
          </button>
        </form>

        <p className="text-sm text-center text-gray-600">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-blue-600 hover:underline font-medium">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

