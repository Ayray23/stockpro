import React, { useState } from "react";
import {
  FaHome,
  FaBoxOpen,
  FaPlusSquare,
  FaMinusSquare,
  FaExchangeAlt,
  FaUsers,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";



const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();

const handleLogout = async () => {
  try {
    await signOut(auth);
    navigate("/"); // Redirect to login
    window.location.reload(); // Reload the page
  } catch (err) {
    console.error("Logout failed:", err);
  }
};


  const baseClass =
    "flex items-center px-4 py-3 text-sm font-medium transition-all";
  const activeClass = "bg-blue-700 font-semibold border-l-4 border-white pl-3";
  const inactiveClass = "text-white hover:bg-blue-700";
  const linkClass = ({ isActive }) =>
    `${baseClass} ${isActive ? activeClass : inactiveClass}`;

  return (
    <>
      {/* Mobile Navbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-blue-800 text-white flex items-center justify-between p-4 z-40">
        <h2 className="text-lg font-bold">StockPro</h2>
        <button onClick={() => setIsOpen(true)}>
          <FaBars size={24} />
        </button>
      </div>

      {/* Mobile Sidebar (full screen when toggled) */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-blue-800 text-white z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:hidden`}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-blue-700">
          <h2 className="text-xl font-bold">StockPro</h2>
          <button onClick={() => setIsOpen(false)}>
            <FaTimes size={22} />
          </button>
        </div>
        <nav className="flex flex-col p-4 space-y-1">
          <NavLink to="/dashboard" className={linkClass} onClick={() => setIsOpen(false)}>
            <FaHome className="mr-3" /> Dashboard
          </NavLink>
          <NavLink to="/materials" className={linkClass} onClick={() => setIsOpen(false)}>
            <FaBoxOpen className="mr-3" /> Materials
          </NavLink>
          <NavLink to="/stock-in" className={linkClass} onClick={() => setIsOpen(false)}>
            <FaPlusSquare className="mr-3" /> Stock In
          </NavLink>
          <NavLink to="/stock-out" className={linkClass} onClick={() => setIsOpen(false)}>
            <FaMinusSquare className="mr-3" /> Stock Out
          </NavLink>
          <NavLink to="/transactions" className={linkClass} onClick={() => setIsOpen(false)}>
            <FaExchangeAlt className="mr-3" /> Transactions
          </NavLink>
          <NavLink to="/users" className={linkClass} onClick={() => setIsOpen(false)}>
            <FaUsers className="mr-3" /> Users
          </NavLink>
          <button className="flex items-center px-4 py-3 mt-4 text-sm font-medium text-white transition-all hover:bg-red-600">
            <FaSignOutAlt className="mr-3" /> Logout
          </button>
        </nav>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 md:h-screen md:fixed md:top-0 md:left-0 bg-blue-800 text-white shadow-lg z-10">
        <div className="px-6 py-5 text-2xl font-bold border-b border-blue-700">
          StockPro
        </div>
        <nav className="flex flex-col p-4 space-y-1">
          <NavLink to="/dashboard" className={linkClass}>
            <FaHome className="mr-3" /> Dashboard
          </NavLink>
          <NavLink to="/materials" className={linkClass}>
            <FaBoxOpen className="mr-3" /> Materials
          </NavLink>
          <NavLink to="/stock-in" className={linkClass}>
            <FaPlusSquare className="mr-3" /> Stock In
          </NavLink>
          <NavLink to="/stock-out" className={linkClass}>
            <FaMinusSquare className="mr-3" /> Stock Out
          </NavLink>
          <NavLink to="/transactions" className={linkClass}>
            <FaExchangeAlt className="mr-3" /> Transactions
          </NavLink>
          <NavLink to="/users" className={linkClass}>
            <FaUsers className="mr-3" /> Users
          </NavLink>
          <button
              onClick={handleLogout}
              className="flex items-center px-4 py-3 mt-4 text-sm font-medium text-white transition-all hover:bg-red-600"
            >
              <FaSignOutAlt className="mr-3" /> Logout
          </button>

        </nav>
      </div>
    </>
  );
};

export default Sidebar;
