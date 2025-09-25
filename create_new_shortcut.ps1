Write-Host "Creating desktop shortcut (no Unicode mode)..."
$project = "C:\Users\nabil\OneDrive\Documents\Classroom Management System"
$launcher = Join-Path $project 'launch_classroom_system.bat'
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop 'Classroom System NEW.lnk'

if (-not (Test-Path $launcher)) {
  Write-Host "ERROR: Launcher not found: $launcher" -ForegroundColor Red
  exit 1
}

try {
  $wsh = New-Object -ComObject WScript.Shell
  $sc = $wsh.CreateShortcut($shortcutPath)
  $sc.TargetPath = $launcher
  $sc.WorkingDirectory = $project
  $sc.Description = 'Start Classroom Management System (Stable)'
  $sc.IconLocation = 'C:\\Windows\\System32\\shell32.dll,21'
  $sc.WindowStyle = 1
  $sc.Save()
  Write-Host "SUCCESS: Shortcut created: $shortcutPath" -ForegroundColor Green
  Write-Host "Double-click it to start the system." -ForegroundColor Cyan
} catch {
  Write-Host "ERROR: Failed to create shortcut: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

exit 0
