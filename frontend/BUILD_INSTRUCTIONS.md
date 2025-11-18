# Marine Navigation App - Local Android Build Instructions

## Prerequisites
1. **Android Studio** (Latest version)
   - Download from: https://developer.android.com/studio
2. **Java JDK 17** (Android Studio includes this)
3. **Node.js 18+** and Yarn

## Step-by-Step Build Instructions

### 1. Extract the Project
Extract the downloaded `frontend.zip` to a folder on your computer.

### 2. Install Dependencies
```bash
cd frontend
yarn install
```

### 3. Open Android Studio
1. Launch Android Studio
2. Click "Open an existing project"
3. Navigate to `frontend/android` folder
4. Click "OK"

### 4. Wait for Gradle Sync
Android Studio will automatically:
- Download Gradle dependencies
- Sync the project
- Index files
This takes 5-10 minutes on first run.

### 5. Build the APK
**Option A: Using Android Studio GUI**
1. Click `Build` menu → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. Wait for build to complete (shows notification)
3. Click "locate" in notification to find APK

**Option B: Using Command Line**
```bash
cd frontend/android
./gradlew assembleDebug
```
(On Windows: `gradlew.bat assembleDebug`)

### 6. Find Your APK
The APK will be at:
```
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

### 7. Install on Your Device
**Option A: Direct Install**
- Copy `app-debug.apk` to your Android device
- Open the file and install (enable "Install from Unknown Sources")

**Option B: Using ADB**
```bash
adb install app-debug.apk
```

## Troubleshooting

### "SDK not found"
- Open Android Studio → File → Settings → Appearance & Behavior → System Settings → Android SDK
- Install Android 13 (API 34) or higher

### "Gradle build failed"
- Try: File → Invalidate Caches → Invalidate and Restart
- Or delete `frontend/android/.gradle` and sync again

### Build takes too long
- First build takes 10-15 minutes
- Subsequent builds: 2-3 minutes

## What You'll Get
- Development build with expo-dev-client
- Full react-native-maps support
- All route navigation features
- Live GPS tracking
- Route visualization with ETA

## Backend Connection
The app is configured to connect to your backend. Make sure backend is accessible or update the URL in:
`frontend/.env` → `EXPO_PUBLIC_BACKEND_URL`
