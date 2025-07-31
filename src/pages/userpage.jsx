import React, { useEffect, useState } from "react";
import { auth } from "../firebase"; // Make sure this points to your Firebase config

const UsersPage = () => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  return (
    <div className="pt-16 md:ml-64 p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Users Management</h1>
      <p className="text-gray-600">List of users who can access the system (admins, staff, etc.)</p>

      <ul className="mt-4 space-y-2">
        <li className="bg-white p-4 rounded shadow">Admin – admin@stockpro.com</li>
        <li className="bg-white p-4 rounded shadow">Manager – manager@stockpro.com</li>
        {currentUser && (
          <li className="bg-blue-100 p-4 rounded shadow text-blue-700">
            Logged in as: {currentUser.email}
          </li>
        )}
      </ul>
    </div>
  );
};

export default UsersPage;
