import React, { useState } from "react";
import Navbar from "../components/navbar";
import "../styles/recommendations.css";
import backgroundImage from "../components/background1.webp";

const movies = [
  {
    id: 1,
    title: "Inception",
    poster: "https://image.tmdb.org/t/p/w200/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg",
    description: "A thief who enters people's dreams and steals secrets.",
    genre: "Sci-Fi, Action",
    year: 2010,
    rating: 8.8
  },
  {
    id: 2,
    title: "Interstellar",
    poster: "https://image.tmdb.org/t/p/w200/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    description: "Explorers travel through a wormhole in space.",
    genre: "Sci-Fi, Drama",
    year: 2014,
    rating: 8.6
  },
  {
    id: 3,
    title: "The Dark Knight",
    poster: "https://image.tmdb.org/t/p/w200/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    description: "Batman faces his greatest foe, The Joker.",
    genre: "Action, Crime",
    year: 2008,
    rating: 9.0
  },
  {
    id: 4,
    title: "The Matrix",
    poster: "https://image.tmdb.org/t/p/w200/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    description: "A hacker discovers a mind-bending reality.",
    genre: "Sci-Fi, Action",
    year: 1999,
    rating: 8.7
  },
  {
    id: 5,
    title: "Gladiator",
    poster: "https://image.tmdb.org/t/p/w200/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg",
    description: "A betrayed general seeks vengeance in Rome.",
    genre: "Action, Drama",
    year: 2000,
    rating: 8.5
  },
  {
    id: 6,
    title: "Avatar",
    poster: "https://image.tmdb.org/t/p/w200/kyeqWdyUXW608qlYkRqosgbbJyK.jpg",
    description: "A Marine on an alien planet must choose a side.",
    genre: "Sci-Fi, Adventure",
    year: 2009,
    rating: 7.8
  },
  {
    id: 7,
    title: "The Matrix (Alt)",
    poster: "https://m.media-amazon.com/images/I/51EG732BV3L._AC_.jpg",
    description: "A hacker discovers the truth about his reality.",
    genre: "Sci-Fi, Action",
    year: 1999,
    rating: 8.7
  },
  {
    id: 8,
    title: "The Lion King",
    poster: "https://upload.wikimedia.org/wikipedia/en/3/3d/The_Lion_King_poster.jpg",
    description: "A lion cub's journey to reclaim his throne.",
    genre: "Animation, Drama, Adventure",
    year: 1994,
    rating: 8.5
  },
  {
    id: 9,
    title: "The Godfather",
    poster: "https://image.tmdb.org/t/p/w200/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    description: "The aging patriarch of a crime family transfers control.",
    genre: "Crime, Drama",
    year: 1972,
    rating: 9.2
  },
  {
    id: 10,
    title: "Fight Club",
    poster: "https://image.tmdb.org/t/p/w200/bptfVGEQuv6vDTIMVCHjJ9Dz8PX.jpg",
    description: "An underground fight club turns chaotic.",
    genre: "Drama, Thriller",
    year: 1999,
    rating: 8.8
  },
  {
    id: 11,
    title: "The Lord of the Rings",
    poster: "https://image.tmdb.org/t/p/w200/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
    description: "A young hobbit embarks on an epic quest.",
    genre: "Fantasy, Adventure",
    year: 2001,
    rating: 8.9
  },
  {
    id: 12,
    title: "The Shawshank Redemption",
    poster: "https://image.tmdb.org/t/p/w200/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    description: "A banker is sentenced to life in Shawshank prison.",
    genre: "Drama, Crime",
    year: 1994,
    rating: 9.3
  },
];

const Recommendations = () => {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Calculate number of columns based on screen width
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

      <div className="movies-grid">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="movie-row">
            {movies
              .slice(rowIndex * columns, rowIndex * columns + columns)
              .map((movie) => (
                <div
                  key={movie.id}
                  className="movie-card"
                  onClick={() => {
                    setSelectedMovie(movie);
                    setShowModal(true);
                  }}
                >
                  <img src={movie.poster} alt={movie.title} className="movie-poster" />
                  <h3 className="movie-title">{movie.title}</h3>
                </div>
              ))}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && selectedMovie && (
        <div className="movie-modal">
          <div className="modal-content">
            <button className="close-button" onClick={() => setShowModal(false)}>
              ×
            </button>
            <div className="modal-poster">
              <img src={selectedMovie.poster} alt={selectedMovie.title} />
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
                <span>{selectedMovie.genre}</span>
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