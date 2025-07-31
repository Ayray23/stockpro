// src/component/Layout.jsx
import React from "react";
import Sidebar from "./sidebar";

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 bg-gray-100 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
