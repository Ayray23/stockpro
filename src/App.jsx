// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/login";
import SignUpPage from "./pages/signup";
import Dashboard from "./component/dashboard";
import PrivateRoute from "./component/privateroute";
import AdminDashboard from "./pages/adminDashboard";
import SalesDashboard from "./pages/salesDashboard";
import MaterialsPage from "./pages/materialsPage";
import StockInPage from "./pages/stockInPage";
import StockOutPage from "./pages/stockOutpage";
import StockTable from "./pages/stockTable";
import TransactionsTable from "./pages/transactionsTable";
import SummaryCards from "./pages/summaryCards";
import UserPage from "./pages/userpage";
import Layout from "./component/layout";
import SplashScreen from "./component/splashscreen";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setLoading(false);
    }, 40000); // Show splash for 3 seconds

    return () => clearTimeout(splashTimer);
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />
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
          path="/stock-in"
          element={
            <PrivateRoute>
              <Layout>
                <StockInPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/stock-out"
          element={
            <PrivateRoute>
              <Layout>
                <StockOutPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/stock-table"
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
      </Routes>
    </>
  );
};

export default App;
