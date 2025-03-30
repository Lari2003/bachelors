import React, { useState } from "react";
import Navbar from "../components/navbar";
import "../styles/recommendations.css";
import backgroundImage from "../components/background1.webp"; // ✅ Import background

// Sample movie data (14 movies for layout preview)
const movies = [
  {
    id: 1,
    title: "Inception",
    poster: "https://image.tmdb.org/t/p/w200/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg", // New image
    description: "A thief who enters people's dreams and steals secrets.",
    genre: "Sci-Fi, Action",
    year: 2010,
  },
  {
    id: 2,
    title: "Interstellar",
    poster: "https://image.tmdb.org/t/p/w200/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    description: "Explorers travel through a wormhole in space.",
    genre: "Sci-Fi, Drama",
    year: 2014,
  },
  {
    id: 3,
    title: "The Dark Knight",
    poster: "https://image.tmdb.org/t/p/w200/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    description: "Batman faces his greatest foe, The Joker.",
    genre: "Action, Crime",
    year: 2008,
  },
  {
    id: 4,
    title: "The Matrix",
    poster: "https://image.tmdb.org/t/p/w200/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    description: "A hacker discovers a mind-bending reality.",
    genre: "Sci-Fi, Action",
    year: 1999,
  },
  {
    id: 5,
    title: "Gladiator",
    poster: "https://image.tmdb.org/t/p/w200/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg",
    description: "A betrayed general seeks vengeance in Rome.",
    genre: "Action, Drama",
    year: 2000,
  },
  {
    id: 6,
    title: "Avatar",
    poster: "https://image.tmdb.org/t/p/w200/kyeqWdyUXW608qlYkRqosgbbJyK.jpg",
    description: "A Marine on an alien planet must choose a side.",
    genre: "Sci-Fi, Adventure",
    year: 2009,
  },
  {
    id: 8,
    title: "The Lion King",
    poster: "https://upload.wikimedia.org/wikipedia/en/3/3d/The_Lion_King_poster.jpg", // ✅ Working Image
    description: "A lion cub’s journey to reclaim his throne.",
    genre: "Animation, Drama, Adventure",
    year: 1994,
  },
  {
    id: 7,
    title: "The Matrix",
    poster: "https://m.media-amazon.com/images/I/51EG732BV3L._AC_.jpg", // ✅ Working Image
    description: "A hacker discovers the truth about his reality.",
    genre: "Sci-Fi, Action",
    year: 1999,
  },
  {
    id: 9,
    title: "The Godfather",
    poster: "https://image.tmdb.org/t/p/w200/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    description: "The aging patriarch of a crime family transfers control.",
    genre: "Crime, Drama",
    year: 1972,
  },
  {
    id: 10,
    title: "Fight Club",
    poster: "https://image.tmdb.org/t/p/w200/bptfVGEQuv6vDTIMVCHjJ9Dz8PX.jpg",
    description: "An underground fight club turns chaotic.",
    genre: "Drama, Thriller",
    year: 1999,
  },
  {
    id: 11,
    title: "The Lord of the Rings",
    poster: "https://image.tmdb.org/t/p/w200/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
    description: "A young hobbit embarks on an epic quest.",
    genre: "Fantasy, Adventure",
    year: 2001,
  },
  {
    id: 12,
    title: "The Shawshank Redemption",
    poster: "https://image.tmdb.org/t/p/w200/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    description: "A banker is sentenced to life in Shawshank prison.",
    genre: "Drama, Crime",
    year: 1994,
  },
];

const Recommendations = () => {
  const [hoveredMovie, setHoveredMovie] = useState(null);

  return (
    <div
      className="recommendations-page"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <Navbar />
      <h2 className="page-title">Movie Recommendations</h2>

      <div className="movies-container">
        {movies.map((movie) => (
          <div
            key={movie.id}
            className={`movie-card ${hoveredMovie === movie.id ? "hovered" : ""}`}
            onMouseEnter={() => setHoveredMovie(movie.id)}
            onMouseLeave={() => setHoveredMovie(null)}
          >
            <img src={movie.poster} alt={movie.title} className="movie-poster" />
            <h3 className="movie-title">{movie.title}</h3>

            {hoveredMovie === movie.id && (
              <div className="movie-details">
                <p><strong>Genre:</strong> {movie.genre}</p>
                <p><strong>Year:</strong> {movie.year}</p>
                <p><strong>Description:</strong> {movie.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendations;
