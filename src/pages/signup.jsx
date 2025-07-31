import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";

const SignUpPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [active, setActive] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminID, setAdminID] = useState("");

  const navigate = useNavigate();

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    match: password === confirmPassword && confirmPassword.length > 0
  };

  const isValidPassword = Object.values(passwordChecks).every(Boolean);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!isValidPassword) {
      setError("Please meet all password requirements.");
      return;
    }

    if (isAdmin && !adminID.trim()) {
      setError("Admin ID is required for admin registration.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);

      // Store user role and optional Admin ID in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        role: isAdmin ? "admin" : "sales",
        adminID: isAdmin ? adminID : null
      });

      setMessage("Verification email sent. Please check your inbox.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setAdminID("");

      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        alert("An account with this email already exists. Please login.");
      } else {
        alert(`Signup failed: ${err.message}`);
      }
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="w-full max-w-sm p-8 bg-white rounded-2xl shadow-2xl space-y-6">
        <h2 className="text-3xl font-bold text-center text-blue-700">Create StockPro Account</h2>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setActive(true)}
                onBlur={() => setActive(false)}
                className="w-full px-4 py-2 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-sm text-blue-600"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {active && (
              <ul className="mt-2 text-xs text-gray-600 space-y-1">
                <li className={passwordChecks.length ? "text-green-600" : ""}>• At least 8 characters</li>
                <li className={passwordChecks.uppercase ? "text-green-600" : ""}>• One uppercase letter</li>
                <li className={passwordChecks.lowercase ? "text-green-600" : ""}>• One lowercase letter</li>
                <li className={passwordChecks.number ? "text-green-600" : ""}>• One number</li>
                <li className={passwordChecks.special ? "text-green-600" : ""}>• One special character</li>
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {!passwordChecks.match && confirmPassword.length > 0 && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isAdmin"
              checked={isAdmin}
              onChange={() => setIsAdmin(!isAdmin)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isAdmin" className="text-sm text-gray-700">Register as Admin</label>
          </div>

          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Admin ID</label>
              <input
                type="text"
                value={adminID}
                onChange={(e) => setAdminID(e.target.value)}
                className="w-full px-4 py-2 mt-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your unique admin ID"
              />
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-2 font-semibold text-white rounded-lg transition ${
              isValidPassword ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
            }`}
            disabled={!isValidPassword}
          >
            Sign Up
          </button>
        </form>

        <p className="text-sm text-center text-gray-600">
          Already have an account?{" "}
          <Link to="/" className="text-blue-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
