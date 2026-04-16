# 🛡️ AWS Account Creation: Step-by-Step Guide

Kyonki AWS account ke liye **Personal Details** aur **Payment Card** verification ki zaroorat hoti hai, ye steps aapko **security ke liye khud** karne honge. Main aapke saath hoon, bas ye instructions follow kijiye:

---

## 🏗️ Step 1: Account Setup (5 mins)

1.  **Open AWS Signup**: [https://portal.aws.amazon.com/gp/aws/developer/registration/index.html](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html) par jaaiye.
2.  **Email & Name**: Apna email `sepl65473@gmail.com` daaliye aur account name (e.g., `sepl-iot-admin`) rakhiye.
3.  **Password**: Ek strong password create kijiye.
4.  **Verification Code**: Aapke email par ek code aayega, use enter kijiye.

## 💳 Step 2: Contact Info & Payment (5-10 mins)

1.  **Account Type**: **"Personal"** select kijiye.
2.  **Contact Info**: Apna Phone number aur Address provide kijiye.
3.  **Credit/Debit Card**: Amazon aapke card ki details maangega. **Sirf ₹2** charge honge verification ke liye (jo baad mein refund ho jaate hain).
    - *Note: Don't worry, hum Free Tier use karenge toh koi extra charge nahi lagega.*
4.  **Identity Verification**: Apna phone number OTP se verify kijiye.

## 🎯 Step 3: Support Plan

1.  **Select Plan**: **"Basic Support - Free"** select kijiye.

---

## 🔑 Step 4: Generating Access Keys (VERY IMPORTANT)

Jab account active ho jaye (isne 24 hours lag sakte hain, par aksar turant ho jaata hai), tab ye kijiye:

1.  **Login to Console**: [https://console.aws.amazon.com/](https://console.aws.amazon.com/) par jaaiye.
2.  **Security Credentials**: Top right mein apne **username** par click kijiye aur **"Security credentials"** select kijiye.
3.  **Create Access Key**:
    - Niche scroll karke **"Access keys"** section dekhiye.
    - **"Create access key"** button click kijiye.
    - Use case mein **"Command Line Interface (CLI)"** select kijiye.
    - "I understand the above recommendation..." checkbox tick kijiye aur **"Next"** kijiye.
    - Description mein `Freelancer-Setup` likh kar **"Create access key"** click kijiye.

## 💾 Step 5: Save the Keys

Ab aapko do lambe codes dikhenge:
- **Access Key ID**: (e.g., `AKIA...`)
- **Secret Access Key**: (e.g., `vkX...`)

> [!CAUTION]
> In dono keys ko **Notepad mein save** kar lijiye. **Ye keys kabhi kisi ko mat batana (except mujhe setup ke waqt).**

---

**Jab aapke paas ye dono keys aa jayein, mujhe batana. Phir main aapka `aws configure` Step complete kar dunga!**
