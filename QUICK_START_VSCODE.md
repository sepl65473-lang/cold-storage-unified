# 🚀 Quick Start Guide: VS Code Setup

Agar aap is project ko apne VS Code mein run karna chahte hain, toh bas niche diye gaye steps step-by-step follow karein.

---

### 🟢 Pre-requisite: Docker start karein
Sabse pehle apne computer par **Docker Desktop** app open karein aur wait karein jab tak woh **"Running"** state mein na aa jaye. (Bina Docker ke Database start nahi hoga).

---

### 📂 VS Code mein Project Open karein
1. **VS Code** open karein.
2. `File > Open Folder` par click karein aur `d:\Cold storage web and app` folder select karein.

---

### 🛠️ Step 1: Backend Services Start karein
1. VS Code mein ek naya terminal open karein (Shortcut: `` Ctrl + ` ``).
2. Yeh command type karke Enter dabayein:
   ```powershell
   docker-compose up -d
   ```
3. Wait karein jab tak saare containers (DB, MQTT, Redis, API) start na ho jayein.

---

### 💻 Step 2: Web Dashboard Start karein
1. Terminal mein ek **naya tab (+ icon)** open karein.
2. Niche di gayi commands run karein:
   ```powershell
   cd web
   npm run dev -- --host
   ```
3. Dashboard ab `http://localhost:3000` par run ho raha hai.

---

### 🌐 Step 3: Marketing Landing Page Start karein
1. Terminal mein firse ek **naya tab (+ icon)** open karein.
2. Niche di gayi commands run karein:
   ```powershell
   cd marketing-site
   npm run dev -- --host
   ```
3. Marketing site ab `http://localhost:5173` par run ho raha hai.

---

### 🏁 Step 4: Chrome mein check karein
Ab Chrome browser open karein aur ye links check karein:
- **Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Marketing Site:** [http://localhost:5173](http://localhost:5173)

---

### 🔑 Login Credentials
- **Email:** `admin@example.com`
- **Password:** `password123!`

---

💡 **Tip:** Agar aapko network par kisi dusre phone ya laptop se check karna hai, toh `localhost` ki jagah apna IP `192.168.1.8` use karein.
