$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Classroom Management System.lnk"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "PowerShell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"C:\Users\nabil\OneDrive\Documents\Classroom Management System\start-classroom-app.ps1`" -OpenBrowser"
$Shortcut.WorkingDirectory = "C:\Users\nabil\OneDrive\Documents\Classroom Management System"
$Shortcut.IconLocation = "C:\Windows\System32\imageres.dll,1"
$Shortcut.Description = "Start Classroom Management System - Production Environment"
$Shortcut.Save()

Write-Host "Desktop shortcut created successfully!" -ForegroundColor Green
Write-Host "Shortcut location: $ShortcutPath" -ForegroundColor Cyan