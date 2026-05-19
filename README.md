# Fake Profile Detection System

A modern full-stack AI-powered website for detecting fake social media profiles.

## Stack
- React.js + Tailwind CSS + Framer Motion + Chart.js
- Node.js + Express.js + MongoDB + JWT authentication
- Python FastAPI + Scikit-learn AI service

## Project Layout
- `client/` React frontend
- `server/` Express API
- `ai-model/` Python ML service

## Setup
1. Install dependencies for the Node projects:
   - `npm install`
   - `npm install --prefix client`
   - `npm install --prefix server`
2. Create environment files:
   - `server/.env`
   - `client/.env`
   - `ai-model/.env` if needed
3. Start the app:
   - `npm run dev`

## Environment Variables
### server/.env
- `PORT=5000`
- `MONGO_URI=mongodb://127.0.0.1:27017/fake-profile-detection`
- `JWT_SECRET=change_this_secret`
- `AI_SERVICE_URL=http://127.0.0.1:8000`
- `CLIENT_ORIGIN=http://localhost:5173`

### client/.env
- `VITE_API_URL=http://localhost:5000`

## Notes
- The backend falls back to in-memory storage if MongoDB is unavailable so the demo remains usable.
- The AI service trains lightweight scikit-learn models on startup and returns a prediction, confidence score, and risk level.
