$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Classroom-Management-System-Production.lnk")
$Shortcut.TargetPath = "c:\Users\nabil\Projects\Classroom-Management-System\START-DESKTOP-APP-PROD.bat"
$Shortcut.IconLocation = "c:\Users\nabil\Projects\Classroom-Management-System\build\icon.ico"
$Shortcut.Save()