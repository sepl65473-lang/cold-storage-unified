# 📘 Solar IoT Cold Storage - User & Setup Guide

This guide provides step-by-step instructions for managing, running, and deploying your project.

---

## 1. Switching Accounts or Starting Fresh (Start from where you left)
If you log in with a **New Email ID** in Antigravity or open a new chat:
- **Your Code is Local:** All the work we have done is safely stored in `d:\Cold storage web and app`. It does not disappear.
- **How to Resume:**
    1. Open a new chat with Antigravity.
    2. Tell Antigravity: *"I am working on the Solar Cold Storage project in `d:\Cold storage web and app`. Please scan the project and tell me the current status from the `PROJECT_TRACKER.md` file."*
    3. Antigravity will read your files, understand the progress (Phases 1-8), and pick up exactly where we stopped.
- **Persistence:** Even if you delete your Google account, the files stay on your D: drive. You can share this folder with any other developer.

---

## 2. Running the Project in IDEs (Visual Studio Code & Android Studio)

### A. Visual Studio Code (For Web, Backend, Firmware, and Infra)
1. **Open Folder:** Open `d:\Cold storage web and app` in VS Code.
2. **Recommended Extensions:**
    - `Python`: For Backend APIs.
    - `ESLint` & `Prettier`: For Frontend React code.
    - `Docker`: To manage your containers easily.
    - `ESP-IDF`: If you want to flash the ESP32 hardware.
3. **Execution (Backend):**
    - Go to `backend` folder.
    - Launch terminal: `docker compose up -d` (This starts everything).
    - API will be live at `http://localhost:8000/docs`.
4. **Execution (Web):**
    - Go to `web` folder.
    - Run `npm install` (first time only).
    - Run `npm run dev`.
    - Dashboard will be live at `http://localhost:3000`.

### B. Android Studio (For Mobile App)
1. **Open Project:** Open ONLY the `d:\Cold storage web and app\android` folder in Android Studio.
2. **Setup:**
    - Let Gradle sync finish (takes 2-5 minutes).
    - Go to **Device Manager** and start an **Emulator** (Pixel 5 or similar).
3. **Execution:**
    - Click the green **Run (Play)** button.
    - The app will install on your emulator.
4. **Important:** The app talks to `http://10.0.2.2:8000` (which is your local backend) during testing.

---

## 3. Hosting & Domain (Taking the Site Live)
To move from your computer to the real world:
- **Step 1: Buy a Domain:** Go to Namecheap, GoDaddy, or AWS Route53 and buy (e.g., `coldmonitoring.com`).
- **Step 2: AWS Setup (Cloud):** 
    - Use our **Phase 2 (Terraform)** code to create the infrastructure on AWS.
    - This creates an **ECS (Elastic Container Service)** to run our Docker images.
    - It creates an **RDS/Aurora** database for your data.
- **Step 3: Frontend Hosting:** Upload the `web/dist` folder (result of `npm run build`) to an **AWS S3 Bucket** with "Static Website Hosting" enabled.
- **Step 4: DNS:** Point your Domain to the S3 Bucket (for Web) and the Load Balancer (for Backend).
- **Step 5: SSL:** Generate a Free SSL certificate using **AWS Certificate Manager** so your site has the "lock" icon (HTTPS).

---

*Last Updated: March 12, 2026*
