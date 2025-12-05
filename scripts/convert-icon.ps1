# PowerShell Script to convert PNG to ICO using .NET

Add-Type -AssemblyName System.Drawing

$pngPath = "ClassroomAppicon.png"
$icoPath = "build/icon.ico"

Write-Host "Converting PNG to ICO..." -ForegroundColor Cyan

try {
    # Load the PNG image
    $img = [System.Drawing.Image]::FromFile((Resolve-Path $pngPath))
    
    # Create icon from image
    $bitmap = New-Object System.Drawing.Bitmap $img
    
    # Save as ICO
    $icon = [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())
    $fileStream = [System.IO.File]::OpenWrite((Join-Path (Get-Location) $icoPath))
    $icon.Save($fileStream)
    $fileStream.Close()
    
    # Cleanup
    $icon.Dispose()
    $bitmap.Dispose()
    $img.Dispose()
    
    Write-Host "Success! Icon converted and saved to: $icoPath" -ForegroundColor Green
    
} catch {
    Write-Host "Error converting icon: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Use online converter like:" -ForegroundColor Yellow
    Write-Host "  - https://convertio.co/png-ico/" -ForegroundColor White
    Write-Host "  - https://www.icoconverter.com/" -ForegroundColor White
    Write-Host ""
    Write-Host "Then save the .ico file to: build/icon.ico" -ForegroundColor Yellow
}
