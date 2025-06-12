import React, { useEffect, useState } from "react";
import "../styles/adminDashboard.css";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const userList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Delete user handler
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await deleteDoc(doc(db, "users", selectedUser.id));
      setUsers(users.filter(user => user.id !== selectedUser.id));
      setShowModal(false);
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  // Filter users by name
  const filteredUsers = users.filter(user =>
    (user.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-page">
      <h2>👥 Manage Users</h2>

      {/* Search bar */}
      <input
        type="text"
        placeholder="Search by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          marginBottom: "20px",
          fontSize: "1rem",
        }}
      />

      <table className="admin-table">
        <thead>
          <tr>
            <th>Avatar</th>
            <th>Name</th>
            <th>Email</th>
            <th>Admin</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user, idx) => (
            <tr key={idx}>
              <td>
                <img
                  src={user.avatar || "/person_icon.svg"}
                  alt="Avatar"
                  className="admin-avatar"
                />
              </td>
              <td>{user.name || "Unnamed"}</td>
              <td>{user.email}</td>
              <td>{user.isAdmin ? "✔️" : "❌"}</td>
              <td>
                <button
                  className="delete-btn"
                  onClick={() => {
                    setSelectedUser(user);
                    setShowModal(true);
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Delete Confirmation Modal */}
      {showModal && selectedUser && (
        <div className="admin-modal">
          <div className="modal-content">
            <p>
              Are you sure you want to delete user <strong>{selectedUser.email}</strong>?
            </p>
            <div className="modal-actions">
              <button className="confirm-btn" onClick={handleDeleteUser}>Yes</button>
              <button className="cancel-btn" onClick={() => setShowModal(false)}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsers;
