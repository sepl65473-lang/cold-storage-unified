# 🛠️ Master IT Freelancer Setup Tracker (Granular Mode)

## 📌 Part 1: Tools Install Karna

### Step 1: Git Install
- [x] Browse to https://git-scm.com/download/win
- [x] Download the installer
- [x] Run Git .exe installer
- [x] Follow "Next" prompts (Default settings)
- [x] Ensure "Git Bash Here" is enabled
- [x] Finish Installation

### Step 2: GitHub Account
- [x] Browse to https://github.com
- [x] Click Sign up
- [x] Enter Email, Password, and Username (sepl65473@gmail.com)
- [x] Complete Human Verification
- [x] Select Free Plan
- [x] Verify Email

### Step 3: Docker Desktop
- [x] Browse to https://www.docker.com/products/docker-desktop/
- [x] Download Docker Desktop for Windows
- [x] Run Docker Desktop Installer.exe
- [x] Select "Use WSL 2 instead of Hyper-V"
- [x] Restart Laptop after installation
- [x] Open Docker Desktop and wait for whale icon to stabilize
- [x] Verify version: `docker --version` (Currently 29.2.1)

### Step 4: AWS Account & Access Keys
- [x] Browse to https://aws.amazon.com
- [x] Click "Create an AWS Account"
- [x] Enter Email (sepl65473@gmail.com) and Account Name
- [x] Select "Personal" account type
- [x] Provide Credit/Debit card details (₹2 verification charge)
- [x] Complete Identity Verification (OTP)
- [x] Select "Basic Support - Free" plan
- [x] Login to AWS Console
- [x] Go to "Security credentials" in user menu
- [x] Save Access Key ID ([REDACTED_STORED_IN_GITHUB_SECRETS])
- [x] Save Secret Access Key ([REDACTED_STORED_IN_GITHUB_SECRETS])

### Step 5: AWS CLI Install
- [x] Download AWS CLI MSI for Windows
- [x] Run MSI installer and follow prompts
- [x] Open Command Prompt
- [x] Verify version: `aws --version` (Installed)

### Step 6: AWS CLI Configure
- [x] Open Command Prompt
- [x] Run `aws configure`
- [x] Enter Access Key ID
- [x] Enter Secret Access Key
- [x] Set default region to `ap-south-1` (Mumbai)
- [x] Set default output format to `json`

### Step 7: Terraform Install
- [x] Download Terraform ZIP (AMD64)
- [x] Extract ZIP file
- [x] Copy `terraform.exe` to `C:\Windows\System32` (or set PATH)
- [x] Verify version: `terraform -version` (Currently 1.11.0)

### Step 8: VS Code Extensions
- [x] Download and Install VS Code from https://code.visualstudio.com/
- [x] Install "GitHub Actions" Extension
- [x] Install "HashiCorp Terraform" Extension
- [x] Install "Docker" Extension

---

## 🧱 Part 2: Template Repository Banana

### Step 9: Template Folder structure
- [x] Create folder `it-freelancer-template` (D:\project\Cold storage web and app\it-freelancer-template)
- [x] Create subfolder `frontend`
- [x] Create subfolder `terraform`
- [x] Create subfolder `.github/workflows`

### Step 10: Copy Website Files
- [x] Copy original website code to `it-freelancer-template/frontend`

### Step 11: Create Dockerfile
- [x] Create folder `docker`
- [x] Create file `Dockerfile` in `docker/` folder
- [x] Add content: `FROM nginx:alpine`, `COPY ../frontend /usr/share/nginx/html`, `EXPOSE 80`

### Step 12: Create docker-compose.yml
- [x] Create file `docker-compose.yml` in `docker/` folder
- [x] Configure Build Context and Port 8080 mapping

### Step 13: Create Terraform Files
- [x] Create `terraform/main.tf` (S3 + CDN + SSL + ACM)
- [x] Create `terraform/variables.tf` (domain_name variable)
- [x] Create `terraform/outputs.tf` (cloudfront_domain and s3_bucket_name)

### Step 14: GitHub Actions Workflow
- [x] Create `.github/workflows/deploy.yml`
- [x] Configure S3 sync and CloudFront invalidation steps

### Step 15: README.md
- [x] Create documentation file `README.md`

### Step 16: Git Init and Push to GitHub
- [x] Initialize Git: `git init` (Done)
- [x] Add files: `git add .` (Done)
- [x] Create initial commit
- [x] Login to GitHub and Create "it-freelancer-template" repository
- [x] Add remote: `git remote add origin ...` (Verified)
- [x] Push code: `git push -u origin main` (SUCCESSFUL - Repository: [it-freelancer-template](https://github.com/sepl65473-lang/it-freelancer-template))

---

## 🚀 Part 3: First Client Deploy (SAFE PATH - Subdomain)

### Step 17: Project Preparation
- [x] Create folder `smaatechengineering-website`
- [x] Copy template files for this specific client
- [x] Update `frontend/` with actual website content

### Step 18: Infrastructure Setup (Subdomain Mode)
- [x] Create `terraform/terraform.tfvars`
- [x] Set `domain_name = "dev.smaatechengineering.com"` (SAFE - No impact on main site)
- [x] Run `terraform init` & `terraform apply`
- [/] **WAITING FOR DNS VALIDATION (CNAME Record):**
    - **Host:** `_b7e90c885da8129e1c3a6477c77c6677.dev`
    - **Value:** `_0e1c26b56e6d97c5555677c77c66777b.mzlghqyxwv.acm-validations.aws.`
- [x] Monitor validation status (ISSUED - SSL Ready ✅)

### Step 19: Content Sync & Testing
- [x] Run S3 sync to upload website files (Completed: Site live at http://dev.smaatechengineering.com.s3-website.ap-south-1.amazonaws.com)
- [/] Verify SSL (HTTPS) on `dev.smaatechengineering.com` (Waiting for ACM)
- [ ] Share final link with the user for approval

---

### 📅 Status: 05-Apr-2026 (Staging Deploy Progress)
- **Current Position**: We are at **Step 18/19**.
- **Marketing Site Status**: ✅ **S3 DEPLOYED**. Files are live and serving.
- **SSL Status**: ⏳ **VALIDATING**. Terraform is waiting for the DNS record to propagate.
- **Action Required**: User to double-check the CNAME record in GoDaddy.
- **Next Step**: Once ACM validates, I will provide the final CloudFront URL.

---

### Step 24: GitHub Actions Secrets
- [ ] Add `AWS_ACCESS_KEY_ID` in GitHub Settings
- [ ] Add `AWS_SECRET_ACCESS_KEY` in GitHub Settings
- [ ] Add `S3_BUCKET` in GitHub Settings
- [ ] Add `CLOUDFRONT_DIST_ID` in GitHub Settings

### Step 25: First Deploy
- [x] Run `git add .`, `git commit`, `git push origin main` (SUCCESSFUL - 18/04/2026 ✅)
- [ ] Verify GitHub Actions "Green Tick"
- [ ] Visit `https://dev.smaatechengineering.com`

---

## 🏁 End of Session Sync (05-Apr-2026)
- **Repo Pushed**: [it-freelancer-template](https://github.com/sepl65473-lang/it-freelancer-template)
- **Local Servers**: Restarted and verified.
- **Infrastructure**: Terraform is active but paused for SSL.
- **Next Step**: Once GoDaddy CNAME is added, the deployment will complete automatically.

---

> [!NOTE]
> Main har step ko ek-ek karke perform karunga aur syntax healing aur reliability ensure karunga.
