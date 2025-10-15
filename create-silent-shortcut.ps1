# Create Silent Desktop Shortcut for Electron App
# This creates a shortcut that launches the app without showing console

$WshShell = New-Object -ComObject WScript.Shell

# Get desktop path
$DesktopPath = [Environment]::GetFolderPath("Desktop")

# Get project path
$ProjectPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Create shortcut
$ShortcutPath = Join-Path $DesktopPath "Classroom Management.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)

# Point to the VBS script for silent launch
$VBSPath = Join-Path $ProjectPath "start-electron-silent.vbs"
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"$VBSPath`""
$Shortcut.WorkingDirectory = $ProjectPath
$Shortcut.Description = "Classroom Management System"

# Set icon
$IconPath = Join-Path $ProjectPath "education.ico"
if (Test-Path $IconPath) {
    $Shortcut.IconLocation = "$IconPath,0"
}

# Save shortcut
$Shortcut.Save()

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Desktop Shortcut Created!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Name: Classroom Management" -ForegroundColor Yellow
Write-Host "Location: $ShortcutPath" -ForegroundColor Gray
Write-Host ""
Write-Host "Features:" -ForegroundColor White
Write-Host "  - Custom education icon" -ForegroundColor Green
Write-Host "  - Silent launch (no console window)" -ForegroundColor Green
Write-Host "  - Automatic app startup" -ForegroundColor Green
Write-Host ""
Write-Host "Just double-click the icon to start!" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to close"
