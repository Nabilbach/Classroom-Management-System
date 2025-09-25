# Create a simple and reliable desktop shortcut

$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")

# Remove old shortcut if exists
$OldShortcut = "$DesktopPath\Classroom Management System.lnk"
if (Test-Path $OldShortcut) {
    Remove-Item $OldShortcut -Force
}

# Create new shortcut
$ShortcutPath = "$DesktopPath\تشغيل نظام إدارة الصف.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "C:\Users\nabil\OneDrive\Documents\Classroom Management System\تشغيل_سريع.bat"
$Shortcut.WorkingDirectory = "C:\Users\nabil\OneDrive\Documents\Classroom Management System"
$Shortcut.IconLocation = "C:\Windows\System32\shell32.dll,21"
$Shortcut.Description = "تشغيل نظام إدارة الصف الدراسي"
$Shortcut.Save()

Write-Host "تم إنشاء الاختصار الجديد: $ShortcutPath" -ForegroundColor Green