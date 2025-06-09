# 🎬 BingeVibe – AI Movie Recommender System

**BingeVibe** is a full-stack web application that recommends movies based on your genre preferences and custom plot descriptions. It uses AI models (like BERT and TF-IDF), Firebase for user authentication and data storage, and a Flask backend for recommendation logic.

---

## 🚀 Features

- 🔐 Firebase Authentication (login, register)
- 👤 User avatars via Firebase Storage
- 🎯 Select up to 5 genres and 10 favorite movies
- 🧠 Custom plot-based movie recommendations using AI (TF-IDF/BERT)
- 💾 Stores user preferences and recommendation history in Firestore
- 🎬 Displays top recommendations with plot alignment
- 🌐 Full React frontend and Python backend integration

---

## 🧠 Tech Stack

### Frontend:
- React.js
- Firebase Authentication
- Firebase Firestore
- Firebase Storage

### Backend:
- Python 3.10+
- Flask
- pandas, scikit-learn, numpy
- BERT or TF-IDF recommendation models

---

## 📁 Project Structure

```
BINGEVIBE/
├── backend/
│   ├── app.py                # Flask app with recommendation logic
│   ├── models/
│   │   └── content_based/    # TF-IDF / BERT / hybrid models
│   ├── data/
│   │   └── processed/        # Cleaned datasets, embeddings, cache
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, sidebar, avatar
│   │   ├── pages/            # Register, login, profile, userPreferences
│   │   ├── styles/           # All CSS styles
│   │   └── firebase.js       # Firebase config
├── requirements.txt
├── README.md
```

---

## 🔧 Setup Instructions

### 1. Firebase Setup
- Go to [Firebase Console](https://console.firebase.google.com/)
- Create a project (e.g. `movierecommender-4cd88`)
- Enable **Authentication** > Email/Password
- Enable **Firestore Database**
- Enable **Storage**
- Copy the config to `frontend/src/firebase.js`

Example:
```js
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

---

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Visit: `http://localhost:3000`

---

### 3. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

API is served at: `http://localhost:5000`

---

## 🔒 Firebase Security Rules (Recommended)

### Firestore:
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Storage:
```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🧪 Example Features to Extend

- 🧾 View recommendation history (per user)
- ⭐ Like/Dislike feedback system
- 📊 Analytics dashboard (admin only)
- 🌍 Deploy frontend on Firebase Hosting, backend on Render or Railway

---

## 👩‍💻 Author

**Larisa** – Computer Science Bachelor's Thesis @ West University of Timișoara

---

## 📄 License

MIT License
