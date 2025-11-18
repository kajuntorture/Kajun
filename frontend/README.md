# 🚢 Marine Navigation App

A full-featured mobile marine navigation application with Garmin-style interface, built with React Native/Expo and FastAPI.

## ✨ Features

- **Live GPS Tracking** - Real-time SOG/COG display
- **Route Navigation** - Active route with distance & live ETA
- **Track Recording** - Automatic trip statistics
- **Waypoint Management** - Create and manage waypoints
- **NOAA Tides** - US tide predictions with charts
- **Offline Maps** - Download tiles for offline use
- **Dark Garmin Theme** - Professional chartplotter UI

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Yarn
- Android Studio (for Android builds)
- Python 3.11+ (for backend)
- MongoDB

### Install & Run

```bash
# Frontend
cd frontend
yarn install
npx expo start

# Backend (separate terminal)
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

## 📱 Building Android APK

```bash
cd frontend
npx expo prebuild --platform android
cd android
./gradlew assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## 📚 Documentation

See `BUILD_INSTRUCTIONS.md` for detailed build guide.

## 🏗️ Tech Stack

- **Frontend:** React Native (Expo), react-native-maps, Zustand, React Query
- **Backend:** FastAPI, MongoDB, NOAA API
- **Navigation:** expo-router (file-based)

## 📄 License

MIT License
