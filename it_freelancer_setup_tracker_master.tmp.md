# 🛠️ IT Freelancer: Project PRO Setup Tracker (Master Copy)

Niche di gayi list ke mutabiq hum project ko setup karenge. Har step complete hone par main use `[x]` mark karunga aur aapko update dunga.

---

### 🛑 Current Blocker (Need Action in GoDaddy):
Aapko GoDaddy mein ye record add karna hai taaki AWS verify kar sake ki aap original owner hain:

| Type | Name (Host) | Value (Target) |
| :--- | :--- | :--- |
| **CNAME** | `_b7e90c885da8129e1c3a6477c77c6677.dev` | `_0e1c26b56e6d97c5555677c77c66777b.mzlghqyxwv.acm-validations.aws.` |

---

### 📅 Current Status (05-Apr-2026):
- **Marketing Site**: ✅ **Running** locally at `http://localhost:5173`
- **Admin Panel**: ✅ **Running** locally at `http://localhost:3001` (Port 3000 was in use)
- **Staging Infrastructure**: ⏳ **Blocked (Waiting for DNS)**. The `terraform apply` is waiting for the CNAME record in GoDaddy.
- **Action Required**: Add the CNAME record (details above) to GoDaddy to complete scaling.

---

## 📌 Part 1: Tools Install Karna (Pehle ek baar karna hai)

[x] **Step 1: Git Install** (Installed: version 2.53.0)
[x] **Step 2: GitHub Account** (Confirmed: `sepl65473@gmail.com` via Google)
[x] **Step 3: Docker Desktop** (Installed: version 29.2.1)
[x] **Step 4: AWS Account & Access Keys** (Keys provided: `AKIA...GQUJDJ` / `WgP...8lEF`)
[x] **Step 5: AWS CLI Install** (Installed: version 2.22.x)
[x] **Step 6: AWS CLI Configure** (Credentials manually set for `ap-south-1` region)
[x] **Step 7: Terraform Install** (Installed: version 1.11.0)
[ ] **Step 8: VS Code Extensions** (Pending: Terraform, Docker, GitHub Actions extensions)

---

## 🧱 Part 2: Template Repository Banana (Ek baar karna hai)

[x] **Step 9: Template Folder Banana** (`it-freelancer-template` created with `frontend`, `terraform`, `docker`, `.github/workflows`)
[x] **Step 10: Existing Website Copy Karna** (`frontend/` populated with website files)
[x] **Step 11: Dockerfile Banana** (Created in `docker/Dockerfile` with `nginx:alpine`)
[x] **Step 12: docker-compose.yml Banana** (Created in `docker/docker-compose.yml` for local port 8080)
[x] **Step 13: Terraform Files Banana** (Infrastructure as Code ready)
    [x] **13.1 main.tf** (S3 + Website config + Public Access + Policy + CloudFront + ACM)
    [x] **13.2 variables.tf** (`domain_name` input)
    [x] **13.3 outputs.tf** (`cloudfront_domain` and `s3_bucket_name`)
[x] **Step 14: GitHub Actions Workflow Banana** (`deploy.yml` with S3 sync and CloudFront invalidation)
[x] **Step 15: README.md** (Step-by-step notes for future use)
[x] **Step 16: Git Init and Push to GitHub** (SUCCESSFUL - Repository: [it-freelancer-template](https://github.com/sepl65473-lang/it-freelancer-template))

---

## 🚀 Part 3: First Client Deploy (SAFE SUBDOMAIN MODE)

[x] **Step 17: Naya Repository Setup (Client Ke Liye)** (`smaatechengineering-website` folder created)
[x] **Step 18: Local Mein Files Tayyar Karna** (Marketing site content copied to `frontend/`)
[x] **Step 19: Terraform Variables Set Karna** (`domain_name = "dev.smaatechengineering.com"`)
[/] **Step 20: Infrastructure Deploy Karna (IN PROGRESS)** (`terraform apply` running)
[/] **Step 21: SSL Certificate Validate Karna (WAITING FOR USER)**
    - Aapko GoDaddy mein **CNAME record** add karna hai (Details `RESOLVE_SAFE_PATH.md` mein hain).
[x] **Step 22: Content Sync & Testing (S3 Link Live)**
    - Site serving at: http://dev.smaatechengineering.com.s3-website.ap-south-1.amazonaws.com
[/] **Step 23: Final Domain Cutover (Pending SSL/CloudFront)**

---

## 📡 Part 4: Real-Time / IoT Setup (Future Clients)

[ ] **Future Module: ECS + API Gateway + Lambda** (For dynamic/IoT clients)

---

## 🏁 End of Session Sync (05-Apr-2026)
- **Repo Pushed**: [it-freelancer-template](https://github.com/sepl65473-lang/it-freelancer-template)
- **Local Servers**: Restarted and verified.
- **Infrastructure**: Terraform is active but paused for SSL.
- **Next Step**: Once GoDaddy CNAME is added, the deployment will complete automatically.

---

> [!NOTE]
> Main har step ko ek-ek karke perform karunga aur syntax healing aur reliability ensure karunga.
