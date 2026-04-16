# 🛡️ Safe Deployment Resolve Guide (smaatechengineering.com)

Aapka main domain safe rahe, isliye hum **Subdomain Strategy** use kar rahe hain. 

### ✅ Current Status:
1. Maine local configuration update kar di hai: Ab hum `dev.smaatechengineering.com` par kaam kar rahe hain.
2. Terraform infrastructure setup kar raha hai.
3. **Important:** Ye process aapke main `smaatechengineering.com` site ko touch bhi nahi karega.

---

### Step 1: DNS Validation (Only for Subdomain)
Hostinger (ya aapka domain provider) ke panel mein jayein aur ye **ek naya record** add karein:

| Type | Name (Host) | Value (Target) |
| :--- | :--- | :--- |
| **CNAME** | `_b7e90c885da8129e1c3a6477c77c6677.dev` | `_0e1c26b56e6d97c5555677c77c66777b.mzlghqyxwv.acm-validations.aws.` |

> [!NOTE]
> Agar aapka panel full domain maangta hai toh Name mein ye daalein: `_b7e90c885da8129e1c3a6477c77c6677.dev.smaatechengineering.com.`

---

### Step 2: Traffic Verification
Jaise hi CNAME validate ho jayega:
1. Hum website files AWS S3 bucket mein upload karenge.
2. Hum CloudFront (CDN) link check karenge.
3. Aap `https://dev.smaatechengineering.com` par ja kar apni nayi site dekh payenge.

---

### Step 3: Final Production Switch (Only after your approval)
Jab aap `dev.` link se 100% happy honge, tab hum:
1. Terraform mein sirf 1 line change karenge (dev -> production).
2. ACM certificate main domain ke liye mangvayenge.
3. Main domain ke DNS records update karenge.

**Result:** Aapka main business site kabhi band nahi hoga (Zero Downtime).

---

### 🛑 What to do now?
Sirf **Step 1** (Upar di gayi table wala record) apne Hostinger panel mein add kardein. Baaki sab main sambhal lunga.
