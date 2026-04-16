Add-Type -AssemblyName System.Drawing

$brainDir = "C:\Users\DELL\.gemini\antigravity\brain\f782eb05-7eb9-4911-967a-a2f752b2b5d4"
$latestFile = (Get-ChildItem -Path "$brainDir\media__*.png" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName

Write-Host "Processing file: $latestFile"

$img = [System.Drawing.Image]::FromFile($latestFile)

# Define the circle we want to keep
$minDim = if ($img.Width -lt $img.Height) { $img.Width } else { $img.Height }

# The logo sometimes has tiny white padding at the top/bottom 
# We'll make the circle radius just slightly smaller than minDim to cut out all white corners
$padding = 2 # cut 2 pixels inward
$circleSize = $minDim - ($padding * 2)
$x = ($img.Width - $circleSize) / 2
$y = ($img.Height - $circleSize) / 2

$bmp = New-Object System.Drawing.Bitmap($circleSize, $circleSize)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)

# We are drawing onto the new square bitmap (0,0 to circleSize), so the ellipse is at (0,0) with size circleSize
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse(0, 0, $circleSize, $circleSize)
$g.SetClip($path)

# Draw the corresponding part of the original image into our new bitmap
# We need to shift the original image drawing by -x, -y because we are centering it
$destRect = New-Object System.Drawing.Rectangle(0, 0, $circleSize, $circleSize)
$srcRect = New-Object System.Drawing.Rectangle([int]$x, [int]$y, $circleSize, $circleSize)
$g.DrawImage($img, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$g.Dispose()

$outFile = "$brainDir\sepl_round_logo.png"
$bmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$img.Dispose()

Write-Host "Success! Saved perfectly round logo to: $outFile"
