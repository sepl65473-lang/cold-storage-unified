# Final Deployment Script for Smaateech Engineering
# This script builds the backend, pushes to ECR, and applies Terraform infrastructure.

Write-Host "--- Stage 1: Authenticating with AWS ECR ---" -ForegroundColor Cyan
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 288834682310.dkr.ecr.us-east-1.amazonaws.com

Write-Host "`n--- Stage 2: Building Backend Docker Image (SES + DB Fixes) ---" -ForegroundColor Cyan
docker build -t cold-storage-backend ./backend
docker tag cold-storage-backend:latest 288834682310.dkr.ecr.us-east-1.amazonaws.com/cold-storage-backend:latest

Write-Host "`n--- Stage 3: Pushing Image to Production Registry ---" -ForegroundColor Cyan
docker push 288834682310.dkr.ecr.us-east-1.amazonaws.com/cold-storage-backend:latest

Write-Host "`n--- Stage 4: Applying Infrastructure (ALB + CloudFront Routing) ---" -ForegroundColor Cyan
Set-Location "infra/terraform/envs/prod"
& "../../../terraform.exe" apply -auto-approve

Write-Host "`n--- Stage 5: Forcing ECS Service Redeployment ---" -ForegroundColor Cyan
aws ecs update-service --cluster cold-storage-prod-cluster --service backend --force-new-deployment --region us-east-1

Write-Host "`n--- MISSION COMPLETE: Inquiries are now LIVE! ---" -ForegroundColor Green
Write-Host "Visit https://smaatechengineering.com/api/v1/health to verify."
