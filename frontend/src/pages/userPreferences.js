import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import "../styles/userPreferences.css";
import cinemaRoom from "../components/cinema_room.webp";
import { db } from "../firebase";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { auth } from "../firebase";

const UserPreferences = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [genreBasedMovies, setGenreBasedMovies] = useState([]);
  const [yearPreference, setYearPreference] = useState("");
  const [ageRating, setAgeRating] = useState("");
  const [plotDescription, setPlotDescription] = useState("");
  const [ratingThreshold, setRatingThreshold] = useState("");
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showMovieDropdown, setShowMovieDropdown] = useState(false);
  const [isButtonAnimated, setIsButtonAnimated] = useState(false);
  const [userMovieLists, setUserMovieLists] = useState({ liked: [], disliked: [] });

  const genres = ["Adventure", "Action", "Animation", "Comedy", "Crime", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller", "Western"];
  const years = ["Last year", "Last 5 years", "Last 10 years", "Older"];
  const ageRatings = ["Teens(13+)", "Mature(16+)", "Adults(18+)", "All ages"];
  const ratingThresholds = ["1 star", "2 stars", "3 stars", "4 stars", "5 stars"];

  // Fetch user's liked and disliked movies
  const fetchUserMovieLists = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const [likedSnapshot, dislikedSnapshot] = await Promise.all([
        getDocs(collection(db, "users", user.uid, "liked_movies")),
        getDocs(collection(db, "users", user.uid, "disliked_movies"))
      ]);

      const liked = likedSnapshot.docs.map(doc => doc.data().movie_id);
      const disliked = dislikedSnapshot.docs.map(doc => doc.data().movie_id);

      setUserMovieLists({ liked, disliked });
    } catch (error) {
      console.error("Failed to fetch user movie lists:", error);
    }
  };

  // Load user movie lists on component mount
  useEffect(() => {
    fetchUserMovieLists();
  }, []);

  const handleRating = (index) => {
    setRating(index + 1);
  };

  const handleHoverRating = (index) => {
    setHoverRating(index + 1);
  };

  const toggleGenre = (genre, e) => {
    if (e) e.stopPropagation();
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else if (selectedGenres.length < 5) {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const toggleMovie = (movie, e) => {
    if (e) e.stopPropagation();
    if (selectedMovies.includes(movie)) {
      setSelectedMovies(selectedMovies.filter(m => m !== movie));
    } else if (selectedMovies.length < 10) {
      setSelectedMovies([...selectedMovies, movie]);
    }
  };

  const handleRecommendClick = async () => {
    setIsButtonAnimated(true);
    setTimeout(() => setIsButtonAnimated(false), 500);

    const payload = {
      plot: plotDescription,
      genres: selectedGenres,
      years: yearPreference,
      age_rating: ageRating,
      rating_threshold: ratingThreshold,
      selected_movies: selectedMovies,
      // Include user's liked and disliked movies to exclude from recommendations
      exclude_movies: {
        liked: userMovieLists.liked,
        disliked: userMovieLists.disliked
      }
    };

    const user = auth.currentUser;

    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid, "preferences", "latest"), {
          ...payload,
          timestamp: new Date()
        });
      } catch (err) {
        console.error("❌ Failed to save preferences to Firestore:", err);
      }
    }

    try {
      const res = await fetch("http://localhost:5000/api/recommend-by-plot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (user) {
        try {
          const timestamp = Date.now().toString();
          await setDoc(doc(db, "users", user.uid, "history", timestamp), {
            preferences: payload,
            recommendations: data.recommendations,
            timestamp: new Date()
          });
        } catch (err) {
          console.error("❌ Failed to save recommendation history:", err);
        }
      }

      localStorage.setItem("recommendations", JSON.stringify(data.recommendations));
      window.location.href = "/recommendations";
    } catch (err) {
      console.error("❌ Failed to fetch recommendations:", err);
    }
  };

  useEffect(() => {
    if (selectedGenres.length > 0) {
      fetch(`http://localhost:5000/api/popular-movies?${selectedGenres.map(g => `genres=${encodeURIComponent(g)}`).join("&")}`)
        .then(res => res.json())
        .then(data => {
          setGenreBasedMovies(data.movies || []);
          setSelectedMovies([]);
        })
        .catch(err => console.error("Failed to fetch genre-based movies", err));
    } else {
      setGenreBasedMovies([]);
      setSelectedMovies([]);
    }
  }, [selectedGenres]);

  return (
    <div className="page user-preferences">
      <Navbar />

      <div className="preferences-container">
        {/* Left Section */}
        <div className="left-section">
          <div className="cinema-image-container">
            <img src={cinemaRoom} alt="Cinema Room" className="cinema-image" />
          </div>
          
          <div className="review-box">
            <p className="rating-text">Rate us like a blockbuster movie!</p>
            <div className="stars">
              {[...Array(5)].map((_, index) => (
                <span
                  key={index}
                  className={`star ${index < (hoverRating || rating) ? "selected" : ""}`}
                  onClick={() => handleRating(index)}
                  onMouseEnter={() => handleHoverRating(index)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  ★
                </span>
              ))}
            </div>
            {rating > 0 && (
              <p className="rating-feedback">
                {rating === 5 ? "Amazing! Thank you!" : 
                 rating === 4 ? "Great! We appreciate it!" :
                 rating === 3 ? "Thanks for your feedback!" :
                 rating === 2 ? "We'll try to improve!" :
                 "We'll work harder to impress you!"}
              </p>
            )}
          </div>

          <button 
            className={`recommend-button ${isButtonAnimated ? 'pulse' : ''} ${selectedGenres.length > 0 ? 'active' : ''}`}
            onClick={handleRecommendClick}
          >
            Recommend Movies
          </button>
        </div>

        {/* Right Section */}
        <div className="preferences-right-section">
          <div className="preferences-title-section">
            <h2>WELCOME TO BINGE VIBE</h2>
            <p>Get ready to discover your next favorite movies</p>
          </div>

          <div className="preferences-options-container">
            {/* Genres Dropdown */}
            <div className="input-group" style={{ position: "relative", zIndex: showGenreDropdown ? 300 : "auto" }}>
              <label>Select up to five preferred genres</label>
              <div 
                className={`custom-dropdown genre-dropdown ${showGenreDropdown ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGenreDropdown(!showGenreDropdown);
                  setShowMovieDropdown(false);
                }}
              >
                <button className="dropdown-btn">
                  {selectedGenres.length > 0 
                    ? `${selectedGenres.length} genre${selectedGenres.length > 1 ? 's' : ''} selected` 
                    : "Choose genres"}
                </button>
                {showGenreDropdown && (
                  <div className="dropdown-content">
                    {genres.map((genre, index) => (
                      <div 
                        key={index} 
                        className={`dropdown-item ${selectedGenres.includes(genre) ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGenre(genre, e);
                        }}
                      >
                        {genre}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedGenres.length > 0 && (
              <div className="selected-items">
                {selectedGenres.map((genre, index) => (
                  <span key={index} className="selected-tag">
                    {genre}
                    <button onClick={(e) => {
                      e.stopPropagation();
                      toggleGenre(genre);
                    }}>×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Movies Dropdown */}
            <div className="input-group" 
            style={{ position: "relative", zIndex: showGenreDropdown ? 100 : "auto" }}>
              <label>Choose up to ten movies you have watched and enjoyed</label>
              <div 
                className={`custom-dropdown movie-dropdown ${showMovieDropdown ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMovieDropdown(!showMovieDropdown);
                  setShowGenreDropdown(false);
                }}
              >
                <button className="dropdown-btn">
                  {selectedMovies.length > 0 
                    ? `${selectedMovies.length} movie${selectedMovies.length > 1 ? 's' : ''} selected` 
                    : "Choose movies"}
                </button>
                {showMovieDropdown && (
                <div className="dropdown-content">
                  {genreBasedMovies.length === 0 && (
                    <p style={{ color: "white", padding: "10px" }}>⚠️ No movies loaded</p>
                  )}
                  {genreBasedMovies.map((movie, index) => (
                    <div 
                      key={index} 
                      className={`dropdown-item ${selectedMovies.includes(movie) ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMovie(movie, e);
                      }}
                    >
                      {movie}
                    </div>
                  ))}
                </div>
              )}

              </div>
            </div>

            {selectedMovies.length > 0 && (
              <div className="selected-items">
                {selectedMovies.map((movie, index) => (
                  <span key={index} className="selected-tag">
                    {movie}
                    <button onClick={(e) => {
                      e.stopPropagation();
                      toggleMovie(movie);
                    }}>×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Other form elements */}
            <div className="input-group">
              <label>Specify the release years</label>
              <select 
                value={yearPreference}
                onChange={(e) => setYearPreference(e.target.value)}
                className="select-input"
              >
                <option value="">Choose option</option>
                {years.map((year, index) => (
                  <option key={index} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Set an age rating preference</label>
              <select 
                value={ageRating}
                onChange={(e) => setAgeRating(e.target.value)}
                className="select-input"
              >
                <option value="">Choose option</option>
                {ageRatings.map((rating, index) => (
                  <option key={index} value={rating}>{rating}</option>
                ))}
              </select>
            </div>

            <div className="textarea-group">
              <label>Describe your ideal movie plot in a few sentences</label>
              <textarea 
                placeholder="For example: An unlikely hero embarks on an adventure..."
                value={plotDescription}
                onChange={(e) => setPlotDescription(e.target.value)}
                maxLength="200"
              ></textarea>
              <div className="character-count">
                {plotDescription.length}/200 characters
              </div>
            </div>

            <div className="input-group">
              <label>Set a minimum rating threshold</label>
              <select 
                value={ratingThreshold}
                onChange={(e) => setRatingThreshold(e.target.value)}
                className="select-input"
              >
                <option value="">Choose option</option>
                {ratingThresholds.map((threshold, index) => (
                  <option key={index} value={threshold}>{threshold}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPreferences;