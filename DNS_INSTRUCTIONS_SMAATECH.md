# 🚀 Step-by-Step: SSL Activation for smaatechengineering.com

Aapki website ko secure (HTTPS) banane ke liye AWS ko ye confirm karna hai ki aap is domain ke owner hain. Iske liye aapko niche diye gaye 2 records apne Domain Registrar (GoDaddy, Namecheap, etc.) mein add karne honge.

---

### Step 1: Login to your Domain Provider
Sabse pehle wahan login karein jahan se aapne **smaatechengineering.com** kharida hai (e.g., Godaddy, Hostinger, Namecheap).

### Step 2: Find "DNS Management"
Apne domain ki settings mein jayein aur **"Manage DNS"** ya **"DNS Settings"** ka option dhundein.

### Step 3: Add These 2 CNAME Records
Wahan "Add New Record" par click karein aur ye do records bharein:

#### **Record #1**
*   **Type:** `CNAME`
*   **Name (Host):** `_3365ce8d4615370d06117565b90623ed`
*   **Value (Points to):** `_0e1c26b56e6d97c5555677c77c66777b.mzlghqyxwv.acm-validations.aws.`
*   **TTL:** `1 Hour` (ya Default)

#### **Record #2**
*   **Type:** `CNAME`
*   **Name (Host):** `_9b72013898fd609f307049448833446c.www`
*   **Value (Points to):** `_8a5c43236e7d97c5555677c77c66777b.mzlghqyxwv.acm-validations.aws.`
*   **TTL:** `1 Hour` (ya Default)

---

### Step 4: Wait for Validation
*   Jaise hi aap ye save karenge, AWS automatically isse detect kar lega.
*   Isme **5 se 10 minute** lag sakte hain.
*   Aapka Terminal (VS Code mein) abhi "Still creating..." dikha raha hai, wo khud hi update ho jayega.

---

### 💡 Pro-Tip for GoDaddy/Namecheap:
Agar aapka provider automatically aapka domain name add kar deta hai, toh Name (Host) field mein sirf ye part dalein:
1. `_3365ce8d4615370d06117565b90623ed`
2. `_9b72013898fd609f307049448833446c.www`

**Action Required:** Ye records add karne ke baad mujhe yahan batayein. Main check karunga ki validation complete hui ya nahi.
