param(
    [ValidateSet("Dev", "Production")]
    [string]$Environment = "Dev",
    [switch]$ApprovedForProduction,
    [switch]$SkipBackup,
    [switch]$SkipMigration,
    [switch]$FrontendOnly,
    [switch]$BackendOnly
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $Root "backend"
$AdminDir = Join-Path $Root "Cold storage admin panle"
$BackupDir = Join-Path $Root "scratch\db-backups"

$Targets = @{
    Dev = @{
        S3Uri = "s3://dev.smaatechengineering.com/panel/"
        CloudFrontDistributionId = "E10N7ZY00T5BAY"
        EcsCluster = ""
        EcsService = ""
    }
    Production = @{
        S3Uri = "s3://cold-storage-web-prod-288834682310/panel/"
        CloudFrontDistributionId = "E3NLYVTA27ZIXC"
        EcsCluster = "cold-storage-prod-cluster"
        EcsService = "backend"
    }
}

function Invoke-Step {
    param(
        [string]$Title,
        [scriptblock]$Command
    )

    Write-Host "`n--- $Title ---" -ForegroundColor Cyan
    & $Command
}

function Get-PythonCommand {
    $VenvPython = Join-Path $BackendDir ".venv\Scripts\python.exe"
    if (Test-Path $VenvPython) {
        try {
            & $VenvPython --version | Out-Null
            return $VenvPython
        } catch {
            Write-Host "Backend .venv python is not runnable; falling back to PATH python." -ForegroundColor Yellow
        }
    }
    return "python"
}

if ($Environment -eq "Production" -and -not $ApprovedForProduction) {
    throw "Production deploy is blocked. Run Dev first, get client approval, then rerun with -Environment Production -ApprovedForProduction."
}

$Target = $Targets[$Environment]
Write-Host "Deploy target: $Environment" -ForegroundColor Green

if (-not $SkipBackup -and -not $FrontendOnly) {
    Invoke-Step "Database backup before migration" {
        New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
        $Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
        $BackupFile = Join-Path $BackupDir "cold_storage_${Environment}_${Timestamp}.sql"
        $BackupFileGz = "$BackupFile.gz"

        if (-not $env:DATABASE_URL) {
            throw "DATABASE_URL is required for backup. Set it before deploying."
        }

        pg_dump "$env:DATABASE_URL" --clean --if-exists --file "$BackupFile"
        if (Get-Command gzip -ErrorAction SilentlyContinue) {
            gzip -f "$BackupFile"
            Write-Host "Backup created: $BackupFileGz"
        } else {
            Write-Host "Backup created: $BackupFile"
        }
    }
}

if (-not $SkipMigration -and -not $FrontendOnly) {
    Invoke-Step "Database migration after backup" {
        Push-Location $BackendDir
        try {
            $Python = Get-PythonCommand
            & $Python -m alembic upgrade head
        } finally {
            Pop-Location
        }
    }
}

if (-not $BackendOnly) {
    Invoke-Step "Frontend build" {
        Push-Location $AdminDir
        try {
            npm run build
        } finally {
            Pop-Location
        }
    }

    Invoke-Step "Frontend deploy to S3 ($Environment)" {
        $DistDir = Join-Path $AdminDir "dist"
        aws s3 sync "$DistDir" $Target.S3Uri --delete
    }
}

if (-not $FrontendOnly -and $Environment -eq "Production") {
    Invoke-Step "Backend image build and push" {
        aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 288834682310.dkr.ecr.us-east-1.amazonaws.com
        docker build -t cold-storage-backend "$BackendDir"
        docker tag cold-storage-backend:latest 288834682310.dkr.ecr.us-east-1.amazonaws.com/cold-storage-backend:latest
        docker push 288834682310.dkr.ecr.us-east-1.amazonaws.com/cold-storage-backend:latest
    }

    Invoke-Step "Production ECS redeploy" {
        aws ecs update-service --cluster $Target.EcsCluster --service $Target.EcsService --force-new-deployment --region us-east-1
    }
}

Invoke-Step "CloudFront invalidation after deploy" {
    aws cloudfront create-invalidation `
        --distribution-id $Target.CloudFrontDistributionId `
        --paths "/panel/*" "/panel/index.html" "/panel/assets/*" "/index.html" "/assets/*"
}

Write-Host "`nDeployment safety flow complete for $Environment." -ForegroundColor Green
if ($Environment -eq "Dev") {
    Write-Host "Client check required before Production deploy." -ForegroundColor Yellow
}
