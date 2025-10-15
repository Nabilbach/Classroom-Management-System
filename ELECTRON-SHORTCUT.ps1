# Create Electron Desktop Shortcut (Standalone Window)
$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ProjectPath = (Get-Location).Path

# Create shortcut
$ShortcutPath = Join-Path $DesktopPath "ClassroomElectron.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)

# Target: Run npm electron:dev
$Shortcut.TargetPath = "cmd.exe"
$Shortcut.Arguments = "/c `"cd /d `"$ProjectPath`" && npm run electron:dev`""
$Shortcut.WorkingDirectory = $ProjectPath
$Shortcut.Description = "Classroom Management - Electron App"

# Icon
$IconPath = Join-Path $ProjectPath "education.ico"
if (Test-Path $IconPath) {
    $Shortcut.IconLocation = "$IconPath,0"
}

$Shortcut.Save()

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  Electron Desktop App Ready!" -ForegroundColor Green  
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Shortcut: $ShortcutPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "This opens a STANDALONE WINDOW" -ForegroundColor Yellow
Write-Host "NOT in browser!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Double-click to launch!" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter"
