import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import "../styles/recommendations.css";
import backgroundImage from "../components/background1.webp";
import { auth, db } from "../firebase";
import { doc, setDoc, deleteDoc, getDoc, collection, getDocs } from "firebase/firestore";

const Recommendations = () => {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [userFeedback, setUserFeedback] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load user feedback and filter recommendations
  useEffect(() => {
    const loadRecommendationsWithFiltering = async () => {
      try {
        setInitialLoading(true);
        
        // Get recommendations from localStorage
        const storedRecommendations = localStorage.getItem("recommendations");
        if (!storedRecommendations) {
          console.log("No recommendations found in localStorage");
          setInitialLoading(false);
          return;
        }

        let recommendedMovies = JSON.parse(storedRecommendations);
        console.log(`📥 Found ${recommendedMovies.length} stored recommendations`);

        // If user is logged in, filter out previously rated movies
        if (auth.currentUser) {
          console.log("👤 User logged in, filtering based on feedback...");
          
          // Get all user feedback
          const userFeedbackIds = await getUserFeedbackIds();
          console.log(`🚫 User has rated ${userFeedbackIds.length} movies previously`);
          
          // Filter out movies user has already rated
          if (userFeedbackIds.length > 0) {
            const originalCount = recommendedMovies.length;
            recommendedMovies = recommendedMovies.filter(movie => 
              !userFeedbackIds.includes(movie.movie_id)
            );
            console.log(`✅ Filtered from ${originalCount} to ${recommendedMovies.length} movies`);
            
            // If we filtered out too many movies, get fresh recommendations
            if (recommendedMovies.length < 15) {
              console.log(`🔄 Only ${recommendedMovies.length} movies left, fetching fresh recommendations...`);
              recommendedMovies = await getFreshRecommendations(userFeedbackIds);
            }
          }
          
          // Load existing feedback for remaining movies
          await loadUserFeedback(recommendedMovies);
        } else {
          console.log("👤 User not logged in, showing all recommendations");
        }

        setMovies(recommendedMovies);
        
      } catch (error) {
        console.error("Error loading recommendations:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadRecommendationsWithFiltering();
  }, []);

  // Get all movie IDs that user has previously rated
  const getUserFeedbackIds = async () => {
    if (!auth.currentUser) return [];
    
    try {
      const feedbackRef = collection(db, "users", auth.currentUser.uid, "feedback");
      const feedbackSnapshot = await getDocs(feedbackRef);
      
      const feedbackIds = [];
      feedbackSnapshot.forEach(doc => {
        feedbackIds.push(doc.id); // doc.id is the movie_id
      });
      
      return feedbackIds;
    } catch (error) {
      console.error("Error getting user feedback:", error);
      return [];
    }
  };

  // Get fresh recommendations from backend, excluding user's rated movies
  const getFreshRecommendations = async (excludeIds = []) => {
    try {
      // Get user preferences from localStorage
      const preferences = localStorage.getItem("userPreferences");
      if (!preferences) {
        console.log("No user preferences found");
        return [];
      }

      const { selectedGenres } = JSON.parse(preferences);
      
      // Call backend API with exclusions
      const response = await fetch("http://localhost:5000/api/filtered-movies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          genres: selectedGenres,
          user_feedback: excludeIds,
          limit: 15 // Always get 15 movies
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch fresh recommendations");
      }

      const data = await response.json();
      console.log(`✅ Got ${data.movies.length} fresh recommendations from backend`);
      
      // Update localStorage with new recommendations
      localStorage.setItem("recommendations", JSON.stringify(data.movies));
      
      return data.movies;
    } catch (error) {
      console.error("Error fetching fresh recommendations:", error);
      return [];
    }
  };

  // Load existing feedback for movies
  const loadUserFeedback = async (movieList) => {
    if (!auth.currentUser || movieList.length === 0) return;
    
    const feedback = {};
    for (const movie of movieList) {
      try {
        const feedbackRef = doc(db, "users", auth.currentUser.uid, "feedback", movie.movie_id);
        const feedbackDoc = await getDoc(feedbackRef);
        if (feedbackDoc.exists()) {
          feedback[movie.movie_id] = feedbackDoc.data().status;
        }
      } catch (error) {
        console.error("Error loading feedback for movie:", movie.movie_id, error);
      }
    }
    setUserFeedback(feedback);
  };

  const handleFeedback = async (movie, status) => {
    if (!auth.currentUser) {
      alert("Please log in to like/dislike movies");
      return;
    }

    setLoading(true);
    try {
      const feedbackRef = doc(db, "users", auth.currentUser.uid, "feedback", movie.movie_id);
      
      // If the user is clicking the same status again, remove the feedback
      if (userFeedback[movie.movie_id] === status) {
        await deleteDoc(feedbackRef);
        setUserFeedback(prev => {
          const updated = { ...prev };
          delete updated[movie.movie_id];
          return updated;
        });
        console.log(`🗑️ Removed ${status} for ${movie.title}`);
      } else {
        // Add or update feedback
        await setDoc(feedbackRef, {
          title: movie.title,
          poster: movie.poster_url || movie.poster,
          year: movie.year,
          genres: movie.genres || movie.genre,
          description: movie.description,
          movie_id: movie.movie_id,
          status,
          timestamp: new Date()
        });
        
        setUserFeedback(prev => ({
          ...prev,
          [movie.movie_id]: status
        }));
        
        console.log(`✅ Saved ${status} for ${movie.title}`);
        
        // Replace this movie with a new one to maintain list size
        await replaceRatedMovie(movie.movie_id);
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error saving feedback:", error);
      alert("Failed to save your preference. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Replace movie when user rates it to maintain 15 movies
  const replaceRatedMovie = async (ratedMovieId) => {
    try {
      // Get user's all rated movies (including the one just rated)
      const userFeedbackIds = await getUserFeedbackIds();
      
      // Get a single fresh movie to replace the rated one
      const response = await fetch("http://localhost:5000/api/filtered-movies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          genres: JSON.parse(localStorage.getItem("userPreferences") || '{}').selectedGenres || [],
          user_feedback: [...userFeedbackIds, ratedMovieId], // Include the just-rated movie
          limit: 1 // Only get 1 replacement movie
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.movies && data.movies.length > 0) {
          const newMovie = data.movies[0];
          
          // Replace the rated movie with the new one
          setMovies(prev => {
            const filtered = prev.filter(m => m.movie_id !== ratedMovieId);
            return [...filtered, newMovie];
          });
          
          console.log(`✅ Replaced rated movie with: ${newMovie.title}`);
        } else {
          console.log("No replacement movie available");
          // Just remove the rated movie if no replacement found
          setMovies(prev => prev.filter(m => m.movie_id !== ratedMovieId));
        }
      }
    } catch (error) {
      console.error("Error replacing movie:", error);
      // Fallback: just remove the rated movie
      setMovies(prev => prev.filter(m => m.movie_id !== ratedMovieId));
    }
  };

  if (initialLoading) {
    return (
      <div className="recommendations-page" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <Navbar />
        <div className="header-container">
          <h2 className="page-title">Loading Recommendations...</h2>
          <p className="instruction-text">⏳ Please wait while we personalize your movie list</p>
        </div>
      </div>
    );
  }

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
        <div className="no-movies-container">
          <p className="no-movies-message">
            {auth.currentUser 
              ? "🎉 You've rated all our recommendations! Please refresh the page for fresh picks."
              : "⚠️ No recommendations available. Please go back and select preferences."
            }
          </p>
        </div>
      ) : (
        <div className="movies-grid">
          {movies.map((movie, index) => (
            <div
              key={`${movie.movie_id}-${index}`}
              className={`movie-card ${userFeedback[movie.movie_id] ? 'has-feedback' : ''}`}
              onClick={() => {
                setSelectedMovie(movie);
                setShowModal(true);
              }}
            >
              <img
                src={movie.poster_url || movie.poster || "https://via.placeholder.com/200x300?text=No+Image"}
                alt={movie.title}
                className="movie-poster"
              />
              <h3 className="movie-title">{movie.title}</h3>
              {userFeedback[movie.movie_id] && (
                <div className={`feedback-indicator ${userFeedback[movie.movie_id]}`}>
                  {userFeedback[movie.movie_id] === 'liked' ? '💖' : '💔'}
                </div>
              )}
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
                src={selectedMovie.poster_url || selectedMovie.poster || "https://via.placeholder.com/200x300?text=No+Image"}
                alt={selectedMovie.title}
              />
            </div>
            <div className="action-buttons">
              <button 
                className={`like-button ${userFeedback[selectedMovie.movie_id] === 'liked' ? 'active' : ''}`}
                onClick={() => handleFeedback(selectedMovie, 'liked')}
                disabled={loading}
              >
                {userFeedback[selectedMovie.movie_id] === 'liked' ? 'Liked 💖' : 'Like 💖'}
              </button>
              <button 
                className={`dislike-button ${userFeedback[selectedMovie.movie_id] === 'disliked' ? 'active' : ''}`}
                onClick={() => handleFeedback(selectedMovie, 'disliked')}
                disabled={loading}
              >
                {userFeedback[selectedMovie.movie_id] === 'disliked' ? 'Disliked 💔' : 'Dislike 💔'}
              </button>
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