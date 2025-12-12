# 🦆 NaviGator - Android Studio Build Guide

## Prerequisites
- **Android Studio** (Latest version - Arctic Fox or newer)
  Download: https://developer.android.com/studio
- Java JDK 17 (included with Android Studio)

## Step-by-Step Build Instructions

### 1. Download/Clone the Project
- If using GitHub: `git clone <your-repo>`
- Or download the `/app/frontend` folder from Emergent

### 2. Install Node Dependencies
```bash
cd frontend
yarn install
```
⏱️ Takes ~2 minutes

### 3. Open Project in Android Studio

**Open the Android Folder:**
1. Launch Android Studio
2. File → Open
3. Navigate to `frontend/android/` folder
4. Click "OK"
[android](../../../../../OneDrive/Desktop/navigator/navigator-app/frontend/android)
⚠️ **Important:** Open the `android` folder, NOT the `frontend` folder!

### 4. Wait for Gradle Sync

Android Studio will automatically:
- Download Gradle dependencies
- Sync project files  
- Index the project

⏱️ First time: 5-10 minutes  
💡 Look for "Gradle sync finished" in the status bar

### 5. Configure SDK (If Needed)

If you see "SDK not found" error:
1. File → Settings (or Android Studio → Preferences on Mac)
2. Appearance & Behavior → System Settings → Android SDK
3. Install "Android 13.0 (Tiramisu)" or API 33+
4. Click "Apply"

### 6. Build the APK

**Method A: Using Menu**
1. Build → Build Bundle(s) / APK(s) → Build APK(s)
2. Wait for build (~3-5 minutes)
3. Notification appears: "APK(s) generated successfully"
4. Click "locate" to find your APK

**Method B: Using Gradle Panel**
1. View → Tool Windows → Gradle
2. Expand: navigator → app → Tasks → build
3. Double-click "assembleDebug"
4. Wait for "BUILD SUCCESSFUL"

**Method C: Terminal in Android Studio**
```bash
./gradlew assembleDebug
```

### 7. Locate Your APK

The built APK will be at:
```
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

File size: ~50-80 MB

### 8. Install on Device

**Option A: Direct Install**
1. Copy `app-debug.apk` to your Android phone
2. Open the file
3. Tap "Install" (enable "Unknown Sources" if needed)

**Option B: Using ADB**
```bash
adb devices  # Verify device connected
adb install app-debug.apk
```

## Troubleshooting

### "Failed to sync Gradle"
- File → Invalidate Caches → Invalidate and Restart
- Or delete `android/.gradle` folder and sync again

### "SDK not configured"
- Settings → Android SDK
- Install API 33 or 34
- Set ANDROID_HOME environment variable

### Build takes forever
- First build: 10-15 minutes (normal)
- Subsequent builds: 2-3 minutes
- Close other apps to free RAM

### "Module not found" errors
- Make sure you ran `yarn install` in frontend folder
- Make sure you opened the `android` folder, not `frontend`

## What You Get

Your **NaviGator** app with:
- 🎨 Full camo theme (olive green + hunter orange)
- 🗺️ Native maps (Apple Maps on iOS, Google Maps on Android)
- 🧭 Route navigation with orange polylines
- 📍 GPS tracking with SOG/COG
- 🌊 NOAA tide data
- 💾 Offline maps
- 📊 Trip statistics

## App Info

- **Name:** NaviGator
- **Package:** com.kajunboy90.navigator  
- **Version:** 1.0.0
- **Min SDK:** 23 (Android 6.0+)
- **Target SDK:** 34 (Android 14)

---

Build time: ~15 minutes first time, ~3 minutes after that.

Happy hunting! 🦆🏹
