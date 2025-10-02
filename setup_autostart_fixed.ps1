# Auto-start Setup for Classroom Management System
# This script creates a shortcut in Windows Startup folder

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Auto-Start Setup" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\ClassroomSystem.lnk")
$Shortcut.TargetPath = "C:\Users\nabil\OneDrive\Documents\Classroom Management System\START_ALL_SERVICES.bat"
$Shortcut.WorkingDirectory = "C:\Users\nabil\OneDrive\Documents\Classroom Management System"
$Shortcut.WindowStyle = 7
$Shortcut.Description = "Classroom Management System Auto-Start"
$Shortcut.Save()

Write-Host "Success! Auto-start shortcut created!" -ForegroundColor Green
Write-Host ""
Write-Host "Location:" -ForegroundColor Yellow
Write-Host "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\ClassroomSystem.lnk"
Write-Host ""
Write-Host "What happens next:" -ForegroundColor Cyan
Write-Host "  - When Windows starts, the system will run automatically" -ForegroundColor White
Write-Host "  - Backend, Backup Service, and Frontend will start" -ForegroundColor White
Write-Host "  - The indicator will always be green" -ForegroundColor Green
Write-Host ""
Write-Host "To disable auto-start, delete the shortcut from:" -ForegroundColor Gray
Write-Host "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
