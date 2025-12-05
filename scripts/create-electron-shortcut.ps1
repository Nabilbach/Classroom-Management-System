# Create Desktop Shortcut for Electron App
# Create shortcut on desktop

$WshShell = New-Object -ComObject WScript.Shell

# Get desktop path
$DesktopPath = [Environment]::GetFolderPath("Desktop")

# Get project path
$ProjectPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Create shortcut
$ShortcutPath = Join-Path $DesktopPath "Classroom Management System.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)

# Set target to cmd.exe to run npm command
$Shortcut.TargetPath = "cmd.exe"
$Shortcut.Arguments = "/k `"cd /d `"$ProjectPath`" && npm run electron:dev`""
$Shortcut.WorkingDirectory = $ProjectPath
$Shortcut.Description = "Classroom Management System"

# Set icon (using education.ico)
$IconPath = Join-Path $ProjectPath "education.ico"
if (Test-Path $IconPath) {
    $Shortcut.IconLocation = "$IconPath,0"
}

# Window style (1 = Normal, 3 = Maximized, 7 = Minimized)
$Shortcut.WindowStyle = 7

# Save shortcut
$Shortcut.Save()

Write-Host "Success! Shortcut created on desktop!" -ForegroundColor Green
Write-Host "Path: $ShortcutPath" -ForegroundColor Cyan
Write-Host "Icon: $IconPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "The shortcut will:" -ForegroundColor White
Write-Host "  1. Start CMD window (minimized)" -ForegroundColor Gray
Write-Host "  2. Launch Electron app automatically" -ForegroundColor Gray
Write-Host "  3. Show the app window when ready" -ForegroundColor Gray

# Pause to see the message
Read-Host "Press Enter to close"
