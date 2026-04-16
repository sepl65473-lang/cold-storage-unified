# 📱 Mobile Setup & Testing Guide

This guide will help you connect the Android application to your local development environment and verify the core features.

## 1. Prerequisites
- **Android Studio**: Installed on your machine.
- **Emulator or Physical Device**:
  - **Emulator**: Default `10.0.2.2` IP works out of the box.
  - **Physical Device**: Must be on the same Wi-Fi as your PC.

## 2. Connecting to Backend
The app is currently configured to look for the backend at `http://10.0.2.2:8000` (Standard Android Emulator alias for localhost).

### Testing on Physical Device
If you are using a real phone:
1. Find your PC's local IP (Run `ipconfig` in PowerShell). Example: `192.168.1.10`.
2. Open `android/app/src/main/java/com/coldstorage/app/api/ApiClient.kt`.
3. Change Line 13:
   ```kotlin
   private const val BASE_URL = "http://YOUR_PC_IP:8000/api/v1/"
   ```
4. Restart the app.

## 3. FCM Setup (Push Notifications)
To receive real alerts, you must link your own Firebase project:
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a new project: `cold-storage-mobile`.
3. Add an Android App with package name: `com.coldstorage.app`.
4. Download `google-services.json` and place it in `android/app/`.
5. In Firebase Settings > Cloud Messaging, copy the **Server Key** (or use V1 API credentials) and add it to `backend/.env` under `FCM_SERVER_KEY`.

## 4. Verification Steps
1. **Login**: Use `admin@example.com` / `password123!`.
2. **Dashboard**: Verify the "Devices" list loads.
3. **Local Alert Test**: 
   - Tap the **Notifications Icon** (🔔) on the App's Top Bar.
   - Verify a system notification appears instantly.
4. **Backend Alert Pipeline Test**:
   - Open `http://localhost:8000/docs`.
   - Use the `POST /api/v1/alerts/test` (if available) or trigger a manual threshold breach via MQTT.
   - Check Backend logs: `docker compose logs -f backend`.
   - Look for: `MOCK FCM SENT (Dev Mode)`.

## 5. Troubleshooting
- **Connection Refused**: Ensure the Backend Docker container is running (`docker compose ps`).
- **Network Error**: Check if your Windows Firewall is blocking Port 8000.
