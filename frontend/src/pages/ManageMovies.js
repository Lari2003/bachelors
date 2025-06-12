import React, { useEffect, useState } from "react";
import "../styles/adminDashboard.css";

function ManageMovies() {
  const [movies, setMovies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [moviesPerPage] = useState(50);
  const [modalMovie, setModalMovie] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/all-valid-movies")
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ fetched movies:", data);  // For debugging
  
        // FIX: Only set movies if the data is a valid array
        if (Array.isArray(data)) {
          setMovies(data);
        } else {
          console.error("❌ Unexpected response:", data);
          setMovies([]); // Prevent crash on .filter
        }
      })
      .catch((err) => {
        console.error("❌ Failed to load movies:", err);
        setMovies([]); // Prevent crash
      });
  }, []);  

  const handleDelete = async (movieId) => {
    try {
      const res = await fetch("http://localhost:5000/api/delete-movie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movie_id: movieId }),
      });

      const result = await res.json();
      if (result.success) {
        setMovies((prev) => prev.filter((m) => m.movie_id !== movieId));
        setModalMovie(null);
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (err) {
      console.error("Failed to delete movie:", err);
    }
  };

  const filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastMovie = currentPage * moviesPerPage;
  const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
  const currentMovies = filteredMovies.slice(indexOfFirstMovie, indexOfLastMovie);
  const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);

  return (
    <div className="admin-page">
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>🎬 Manage Movies</h2>

      <input
        type="text"
        placeholder="Search by title..."
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
            <th>Poster</th>
            <th>Title</th>
            <th>Genres</th>
            <th>Year</th>
            <th>Description</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {currentMovies.map((movie) => (
            <tr key={movie.movie_id}>
              <td>
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="admin-avatar"
                />
              </td>
              <td>{movie.title}</td>
              <td>{movie.genres}</td>
              <td>{movie.year}</td>
              <td>{movie.description?.slice(0, 200)}...</td>
              <td>
                <button
                  className="delete-btn"
                  onClick={() => setModalMovie(movie)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          ◀ Previous
        </button>
        <span style={{ margin: "0 15px" }}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Next ▶
        </button>
      </div>

      {modalMovie && (
        <div className="admin-modal">
          <div className="modal-content">
            <h3>Are you sure you want to delete:</h3>
            <p><strong>{modalMovie.title}</strong></p>
            <div className="modal-actions">
              <button
                className="confirm-btn"
                onClick={() => handleDelete(modalMovie.movie_id)}
              >
                Yes, delete
              </button>
              <button className="cancel-btn" onClick={() => setModalMovie(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageMovies;
