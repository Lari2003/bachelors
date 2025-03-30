import React, { useState } from "react";
import Navbar from "../components/navbar";
import "../styles/userPreferences.css";
import cinemaRoom from "../components/cinema_room.webp"; // Import the image

const UserPreferences = () => {
  const [rating, setRating] = useState(0);

  // Dropdown options
  const genres = ["Adventure", "Action", "Animation", "Comedy", "Crime", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller", "Western"];
  const years = ["Last year", "Last 5 years", "Last 10 years", "Older"];
  const ageRatings = ["Teens(13+)", "Mature(16+)", "Adults(18+)", "All ages"];
  const ratingThresholds = ["1 star", "2 stars", "3 stars", "4 stars", "5 stars"];

  const handleRating = (index) => {
    setRating(index + 1);
  };

  return (
    <div className="page user-preferences">
      <Navbar />

      {/* Pink Container */}
      <div className="preferences-container">
        
        {/* 🔹 Left Section: Image, Review Box, Button */}
        <div className="left-section">
          <img src={cinemaRoom} alt="Cinema Room" className="cinema-image" />
          
          {/* 🔹 Only the review text and stars inside faded box */}
          <div className="review-box">
            <p className="rating-text">Rate us like a blockbuster movie - 5 stars, please!</p>
            <div className="stars">
              {[...Array(5)].map((_, index) => (
                <span
                  key={index}
                  className={`star ${index < rating ? "selected" : ""}`}
                  onClick={() => handleRating(index)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <button className="recommend-button">Recommend Movies</button>
        </div>

        {/* 🔹 Right Section */}
        <div className="preferences-right-section">
          
          {/* 🔹 Title Section */}
          <div className="preferences-title-section">
            <h2>WELCOME TO BINGE VIBE</h2>
            <p>Get ready to be recommended the best movies</p>
          </div>

          {/* 🔹 Options Section inside a faded black box */}
          <div className="preferences-options-container">

            {/* 🔹 Select up to five preferred genres */}
            <div className="input-group">
              <label>Select up to five preferred genres</label>
              <select>
                <option>Choose options</option>
                {genres.map((genre, index) => (
                  <option key={index} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            {/* 🔹 Choose up to ten movies you have watched and enjoyed (Generated later) */}
            <div className="input-group">
              <label>Choose up to ten movies you have watched and enjoyed</label>
              <select>
                <option>Choose options</option>
                {/* Future dynamically generated options */}
              </select>
            </div>

            {/* 🔹 Specify the release years */}
            <div className="input-group">
              <label>Specify the release years</label>
              <select>
                <option>Choose options</option>
                {years.map((year, index) => (
                  <option key={index} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* 🔹 Set an age rating preference */}
            <div className="input-group">
              <label>Set an age rating preference</label>
              <select>
                <option>Choose options</option>
                {ageRatings.map((rating, index) => (
                  <option key={index} value={rating}>{rating}</option>
                ))}
              </select>
            </div>

            {/* 🔹 Describe your ideal movie plot */}
            <div className="textarea-group">
              <label>Describe your ideal movie plot in a few sentences</label>
              <textarea placeholder="Enter text"></textarea>
            </div>

            {/* 🔹 Set a minimum rating threshold */}
            <div className="input-group">
              <label>Set a minimum rating threshold</label>
              <select>
                <option>Choose options</option>
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