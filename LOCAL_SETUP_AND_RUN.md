# 🚀 Local Development Runbook: Solar Cold Storage Platform

Yeh file specially aapke liye banai gayi hai taaki aap VS Code aake easily pura project run kar sakein. Isme saare steps serial wise diye gaye hain.

---

## 🛑 Step 1: Backend Services Start Karein (Docker)

Sabse pehle humein Database (PostgreSQL), MQTT (Mosquitto), aur Redis start karna hoga.

1. VS Code mein naya terminal open karein: `Terminal -> New Terminal` (Shortcut: `` Ctrl + ` ``)
2. Terminal mein yeh command run karein:
   ```powershell
   docker-compose up -d
   ```
3. Check karein ki saari services `Running` ya `Healthy` state mein hain.

---

## 🟢 Step 2: Frontend Website Start Karein

Ab hum React UI start karenge.

1. VS Code mein ek **naya terminal tab** open karein (taaki Step 1 wala terminal Docker ke liye rahe).
2. `web` folder ke andar jaayein aur dev server start karein:
   ```powershell
   cd web
   npm install      # (Yadi dependencies install nahi hain toh)
   npm run dev
   ```
3. Aapko terminal mein likha milega: `➜  Local:   http://localhost:3000/`

---

## 🌐 Step 3: Chrome Mein Website Open Karein

Baaki sab background mein chal raha hai. Ab Chrome/Edge browser open karein.

1. Browser address bar mein yeh link type karein aur Enter dabayein:
   **[http://localhost:3000](http://localhost:3000)**
2. **Login Credentials** (Jo testing ke liye banaye gaye hain):
   - **Email:** `admin@example.com`
   - **Password:** `password123!`
3. Sign In pe click karein! Aap seedha Dashboard pe pahuch jayenge.

---

## 🤖 Step 4 (Optional): Live Sensor Data Check (Hardware Simulation)

Agar aapko dashboard pe live devices test karne hain (temperature, humidity update hote huye dekhna hai):

1. VS Code mein ek aur **naya terminal tab** open karein.
2. Yeh command run karke hardware data simulation start karein:
   ```powershell
   docker exec cold_storage_backend python /app/simulate_device.py --device_id demo_thing_21a279cd
   ```
3. Ab wapas Chrome mein `http://localhost:3000/devices` par jaayein. Wahan aapko **Demo Device Alpha** "Online" dikhega aur real-time data update hota rahega!

---

### 💡 Troubleshooting (Agar kuch kaam na kare):

- **Error: "localhost refused to connect"** -> Iska matlab Frontend (Step 2) band ho gaya hai. Wapas `web` folder me jaake `npm run dev` chalayein.
- **Login pe "Failed to log in"** -> Backend start nai hua hai. Step 1 wapas run karein.
- **Docker services delete ya restart karni hain?**
  ```powershell
  docker-compose down
  docker-compose up -d
  ```

🎉 **Mubarak ho! Ab aap pura enterprise system apne laptop pe locally manage kar sakte hain!**
