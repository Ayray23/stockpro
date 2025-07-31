// src/pages/MaterialPage.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const MaterialPage = () => {
  const [materials, setMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "materials"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMaterials(data);
      } catch (error) {
        console.error("Error fetching materials:", error);
      }
    };

    fetchMaterials();
  }, []);

  // Filter materials by name or category
  const filteredMaterials = materials.filter(
    (mat) =>
      mat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mat.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMaterials.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);

  return (
    <div className="p-4 pt-16 md:ml-64 ">
      <h2 className="text-2xl font-semibold mb-4 text-center">All Materials</h2>

      <input
        type="text"
        placeholder="Search by name or category..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 px-4 py-2 border rounded w-full md:w-1/2"
      />

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead className="bg-blue-100">
            <tr>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Code</th>
              <th className="px-4 py-2 border">Category</th>
              <th className="px-4 py-2 border">Quantity</th>
              <th className="px-4 py-2 border">Unit</th>
              <th className="px-4 py-2 border">Added At</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((mat) => (
              <tr key={mat.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{mat.name}</td>
                <td className="px-4 py-2 border">{mat.code || "-"}</td>
                <td className="px-4 py-2 border">{mat.category}</td>
                <td className="px-4 py-2 border">{mat.quantity}</td>
                <td className="px-4 py-2 border">{mat.unit}</td>
                <td className="px-4 py-2 border">
                  {mat.addedAt?.toDate?.().toLocaleString() || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredMaterials.length === 0 && (
          <p className="text-center text-gray-500 py-4">No materials found.</p>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          disabled={currentPage === 1}
        >
          ⬅ Prev
        </button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          disabled={currentPage === totalPages}
        >
          Next ➡
        </button>
      </div>
    </div>
  );
};

export default MaterialPage;
