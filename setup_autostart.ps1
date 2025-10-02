# تشغيل تلقائي عند بدء الويندوز
# Auto-start on Windows Startup

$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\ClassroomSystem.lnk")
$Shortcut.TargetPath = "C:\Users\nabil\OneDrive\Documents\Classroom Management System\START_ALL_SERVICES.bat"
$Shortcut.WorkingDirectory = "C:\Users\nabil\OneDrive\Documents\Classroom Management System"
$Shortcut.WindowStyle = 7  # Minimized
$Shortcut.Description = "Classroom Management System Auto-Start"
$Shortcut.Save()

Write-Host "✅ تم إنشاء اختصار التشغيل التلقائي بنجاح!" -ForegroundColor Green
Write-Host ""
Write-Host "سيتم تشغيل النظام تلقائياً عند بدء الويندوز" -ForegroundColor Cyan
Write-Host ""
Write-Host "الموقع:" -ForegroundColor Yellow
Write-Host "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\ClassroomSystem.lnk"
Write-Host ""
Write-Host "لإلغاء التشغيل التلقائي، احذف الملف من مجلد Startup" -ForegroundColor Gray
