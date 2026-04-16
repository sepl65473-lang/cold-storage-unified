$Url = "https://smaatechengineering.com/"
$OutputDir = "backup_live_site"

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir
}

Write-Host "Downloading index.html..."
$Response = Invoke-WebRequest -Uri $Url -SessionVariable session -UseBasicParsing
$Response.Content | Out-File -FilePath "$OutputDir\index.html" -Encoding utf8

$BaseUri = [System.Uri]$Url

# Parse HTML for links (Basic Parsing doesn't have .AllElements as easily, so we use regex or just simple parsing)
# Actually, let's keep it simple for a backup.
$Content = $Response.Content
$AssetUrls = [regex]::Matches($Content, '(?:src|href)="([^"]+)"').Value | ForEach-Object { $_ -replace '^(?:src|href)="', '' -replace '"$', '' }

foreach ($AssetUrl in $AssetUrls) {
    if ($AssetUrl -and ($AssetUrl.StartsWith("/") -or $AssetUrl.Contains($BaseUri.Host))) {
        try {
            $FullUrl = New-Object System.Uri($BaseUri, $AssetUrl)
            if ($FullUrl.Host -eq $BaseUri.Host) {
                $RelativePath = $FullUrl.AbsolutePath.TrimStart('/')
                if ([string]::IsNullOrWhiteSpace($RelativePath) -or $RelativePath -eq "/") { continue }
                
                $DestPath = Join-Path $OutputDir $RelativePath
                $ParentDir = Split-Path $DestPath
                
                if (-not (Test-Path $ParentDir)) {
                    New-Item -ItemType Directory -Force -Path $ParentDir
                }

                Write-Host "Downloading: $RelativePath"
                Invoke-WebRequest -Uri $FullUrl.AbsoluteUri -OutFile $DestPath -UseBasicParsing
            }
        } catch {
            # Skip failures
        }
    }
}

Write-Host "Backup process finished."
