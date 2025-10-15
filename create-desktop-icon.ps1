# Create Desktop Shortcut pointing to BAT file
# This is the most reliable method

$WshShell = New-Object -ComObject WScript.Shell

# Get desktop path
$DesktopPath = [Environment]::GetFolderPath("Desktop")

# Get project path
$ProjectPath = (Get-Location).Path

# Create shortcut
$ShortcutPath = Join-Path $DesktopPath "ClassroomApp.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)

# Point directly to the BAT file
$BatPath = Join-Path $ProjectPath "launch-app.bat"
$Shortcut.TargetPath = $BatPath
$Shortcut.WorkingDirectory = $ProjectPath
$Shortcut.Description = "Classroom Management System"

# Set icon
$IconPath = Join-Path $ProjectPath "education.ico"
if (Test-Path $IconPath) {
    $Shortcut.IconLocation = "$IconPath,0"
} else {
    Write-Host "Warning: Icon file not found at $IconPath" -ForegroundColor Yellow
}

# Save shortcut
$Shortcut.Save()

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "     Shortcut Created Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Shortcut Location: " -NoNewline
Write-Host "$ShortcutPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "What happens when you click it:" -ForegroundColor Yellow
Write-Host "  1. Launches npm electron:dev" -ForegroundColor White
Write-Host "  2. Starts Vite development server" -ForegroundColor White
Write-Host "  3. Opens Electron window" -ForegroundColor White
Write-Host ""
Write-Host "Note: First launch may take 10-30 seconds" -ForegroundColor Gray
Write-Host ""
Write-Host "Try it now by double-clicking the icon on your desktop!" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to close"
