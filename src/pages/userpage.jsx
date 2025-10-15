import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase"; // Make sure your firebase config exports 'db' for Firestore
import { collection, getDocs } from "firebase/firestore";
import Sidebar from "../component/sidebar";
import Topbar from "../component/topbar";
import { useNavigate } from "react-router-dom";

const UsersPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [profile, setProfile] = useState({}); // You can fetch profile details later

  // Get current logged-in user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        setProfile({ email: user.email }); // Basic profile; extend as needed
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCol = collection(db, "users"); // Make sure your collection is named 'users'
        const usersSnapshot = await getDocs(usersCol);
        const usersList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar (Desktop) */}
      <div className="hidden md:block md:fixed md:inset-y-0 md:w-72">
        <Sidebar
          open={true}
          onNavigate={(p) => navigate(p)}
          user={{ email: currentUser?.email, role: profile?.role }}
          active="stockOut"
          theme="dark"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-72 flex flex-col">
        {/* Topbar */}
        <Topbar
          title={`Add Product • ${profile.email?.split("@")[0]}`}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        {/* Sidebar (Mobile) */}
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNavigate={(p) => {
            setSidebarOpen(false);
            navigate(p);
          }}
          user={{ email: currentUser?.email, role: profile?.role }}
          active="stockOut"
          theme="dark"
        />

        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Users Management</h1>
          <p className="text-gray-600 mb-4">
            List of users who can access the system (admins, staff, etc.)
          </p>

          <ul className="space-y-2">
            {users.map((user) => (
              <li
                key={user.id}
                className={`p-4 rounded shadow ${
                  currentUser?.email === user.email
                    ? "bg-blue-100 text-blue-700"
                    : "bg-white text-gray-900"
                }`}
              >
                {user.role || "User"} – {user.email}
                {currentUser?.email === user.email && " (You)"}
              </li>
            ))}

            {!users.length && (
              <li className="p-4 rounded shadow bg-white text-gray-500">
                No users found.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
