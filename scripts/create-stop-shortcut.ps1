$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Stop Classroom System.lnk"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "PowerShell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"C:\Users\nabil\OneDrive\Documents\Classroom Management System\stop-all-servers.ps1`""
$Shortcut.WorkingDirectory = "C:\Users\nabil\OneDrive\Documents\Classroom Management System"
$Shortcut.IconLocation = "C:\Windows\System32\imageres.dll,100"
$Shortcut.Description = "Stop All Classroom Management System Servers"
$Shortcut.Save()

Write-Host "Stop shortcut created successfully!" -ForegroundColor Green
Write-Host "Shortcut location: $ShortcutPath" -ForegroundColor Cyan