# Create Simple Desktop Shortcut (Browser-based)
# This launches the app in your default browser

$WshShell = New-Object -ComObject WScript.Shell

# Get desktop and project paths
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ProjectPath = (Get-Location).Path

# Create shortcut on desktop
$ShortcutPath = Join-Path $DesktopPath "Classroom-App.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)

# Point to START-APP.bat
$BatPath = Join-Path $ProjectPath "START-APP.bat"
$Shortcut.TargetPath = $BatPath
$Shortcut.WorkingDirectory = $ProjectPath
$Shortcut.Description = "Classroom Management System"

# Set icon
$IconPath = Join-Path $ProjectPath "education.ico"
if (Test-Path $IconPath) {
    $Shortcut.IconLocation = "$IconPath,0"
}

# Save
$Shortcut.Save()

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ✅ Desktop Shortcut Created!  ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Location: $ShortcutPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎯 How to use:" -ForegroundColor White
Write-Host "   1. Double-click the desktop icon" -ForegroundColor Gray
Write-Host "   2. Wait 10-20 seconds" -ForegroundColor Gray
Write-Host "   3. Browser will open automatically!" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 The app runs in your default browser" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to close"
