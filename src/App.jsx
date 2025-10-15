// src/app.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AuthPage from "./pages/uthPage";
import AdminDashboard from "./pages/adminDashboard";
import SalesDashboard from "./pages/salesDashboard";
import MaterialsPage from "./pages/materialsPage";
import AddProduct from "./pages/addProduct";
import StockOutPage from "./pages/stockOutpage";
import StockTable from "./pages/stockTable";
import TransactionsTable from "./pages/transactionsTable";
import SummaryCards from "./pages/summaryCards";
import UserPage from "./pages/userPage";

import Layout from "./component/layout";
import PrivateRoute from "./component/privateroute";
import SplashScreen from "./component/splashscreen";

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const splashTimer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(splashTimer);
  }, []);

  if (loading) return <SplashScreen />;

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/auth" />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected Routes */}
        <Route
          path="/adminDashboard"
          element={
            <PrivateRoute>
              <Layout>
                <AdminDashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/salesDashboard"
          element={
            <PrivateRoute>
              <Layout>
                <SalesDashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/materials"
          element={
            <PrivateRoute>
              <Layout>
                <MaterialsPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/addProduct"
          element={
            <PrivateRoute>
              <Layout>
                <AddProduct />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/stockOut"
          element={
            <PrivateRoute>
              <Layout>
                <StockOutPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/stockTable"
          element={
            <PrivateRoute>
              <Layout>
                <StockTable />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <PrivateRoute>
              <Layout>
                <TransactionsTable />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/summary"
          element={
            <PrivateRoute>
              <Layout>
                <SummaryCards />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <Layout>
                <UserPage />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* 404 Fallback */}
        <Route
          path="*"
          element={
            <div className="flex flex-col items-center justify-center min-h-screen text-gray-500">
              <h2 className="text-xl font-semibold mb-2">404 - Page Not Found</h2>
              <p>Sorry, this route does not exist.</p>
            </div>
          }
        />
      </Routes>
    </>
  );
};

export default App;
