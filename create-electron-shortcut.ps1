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

# Set target to npm run electron:dev
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoExit -Command `"cd '$ProjectPath'; npm run electron:dev`""
$Shortcut.WorkingDirectory = $ProjectPath
$Shortcut.Description = "Classroom Management System"

# Set icon (using education.ico)
$IconPath = Join-Path $ProjectPath "education.ico"
if (Test-Path $IconPath) {
    $Shortcut.IconLocation = $IconPath
}

# Save shortcut
$Shortcut.Save()

Write-Host "Success! Shortcut created on desktop!" -ForegroundColor Green
Write-Host "Path: $ShortcutPath" -ForegroundColor Cyan
Write-Host "Double-click the shortcut to launch the app" -ForegroundColor Yellow

# Pause to see the message
Read-Host "Press Enter to close"
