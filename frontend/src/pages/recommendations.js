import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import "../styles/recommendations.css";
import backgroundImage from "../components/background1.webp";

const Recommendations = () => {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("recommendations");
    if (data) {
      setMovies(JSON.parse(data));
    }
  }, []);

  const getColumns = () => {
    if (window.innerWidth >= 1200) return 6;
    if (window.innerWidth >= 900) return 4;
    if (window.innerWidth >= 600) return 3;
    return 2;
  };

  const columns = getColumns();
  const rows = Math.ceil(movies.length / columns);

  return (
    <div
      className="recommendations-page"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <Navbar />
      <div className="header-container">
        <h2 className="page-title">Movie Recommendations</h2>
        <p className="instruction-text">✨ Click on any movie to see details ✨</p>
      </div>

      {movies.length === 0 ? (
        <p className="no-movies-message">⚠️ No recommendations available. Please go back and select preferences.</p>
      ) : (
        <div className="movies-grid">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="movie-row">
              {movies
                .slice(rowIndex * columns, rowIndex * columns + columns)
                .map((movie, index) => (
                  <div
                    key={index}
                    className="movie-card"
                    onClick={() => {
                      setSelectedMovie(movie);
                      setShowModal(true);
                    }}
                  >
                    <img
                      src={movie.poster || "https://via.placeholder.com/200x300?text=No+Image"}
                      alt={movie.title}
                      className="movie-poster"
                    />
                    <h3 className="movie-title">{movie.title}</h3>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

      {showModal && selectedMovie && (
        <div className="movie-modal">
          <div className="modal-content">
            <button className="close-button" onClick={() => setShowModal(false)}>
              ×
            </button>
            <div className="modal-poster">
              <img
                src={selectedMovie.poster || "https://via.placeholder.com/200x300?text=No+Image"}
                alt={selectedMovie.title}
              />
            </div>

            <div className="action-buttons">
              <button className="like-button">Like 💖</button>
              <button className="dislike-button">Dislike 💔</button>
              <button className="seen-button">Seen 👀</button>
            </div>

            <div className="modal-details">
              <h2>{selectedMovie.title}</h2>
              <div className="meta">
                <span>{selectedMovie.year}</span>
                <span>•</span>
                <span>{selectedMovie.genres || selectedMovie.genre}</span>
              </div>
              <p className="description">{selectedMovie.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recommendations;
