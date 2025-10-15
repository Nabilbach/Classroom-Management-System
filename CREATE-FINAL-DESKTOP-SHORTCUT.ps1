# PowerShell Script لإنشاء اختصار تطبيق سطح المكتب

$WScriptShell = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop "Classroom Desktop App.lnk"

# إنشاء الاختصار
$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "C:\Users\nabil\Projects\Classroom-Management-System\START-DESKTOP-APP-SAFE.bat"
$Shortcut.WorkingDirectory = "C:\Users\nabil\Projects\Classroom-Management-System"
$Shortcut.Description = "Classroom Management System - Desktop Application"
$Shortcut.IconLocation = "C:\Users\nabil\Projects\Classroom-Management-System\build\icon.ico,0"
$Shortcut.Save()

Write-Host "Success! Desktop shortcut created!" -ForegroundColor Green
Write-Host "Path: $ShortcutPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now you can:" -ForegroundColor Yellow
Write-Host "1. Double-click 'Classroom Desktop App' on your Desktop" -ForegroundColor White
Write-Host "2. Application will run as standalone desktop app (NOT in browser)" -ForegroundColor White
Write-Host ""
Write-Host "Wait 10-15 seconds for Backend and Vite to start, then window will appear" -ForegroundColor Magenta
