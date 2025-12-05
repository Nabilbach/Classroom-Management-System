$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$bat = Join-Path $root 'start_auto_basic.bat'
$desktop = [Environment]::GetFolderPath('Desktop')
$lnk = Join-Path $desktop 'Classroom Auto Start.lnk'

if (-not (Test-Path $bat)) {
  Write-Host "ERROR: start_auto_basic.bat not found" -ForegroundColor Red
  exit 1
}

try {
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($lnk)
  $shortcut.TargetPath = $bat
  $shortcut.WorkingDirectory = $root
  $shortcut.IconLocation = 'C:\\Windows\\System32\\shell32.dll,220'
  $shortcut.Description = 'Start Classroom backend + frontend and open browser'
  $shortcut.WindowStyle = 1
  $shortcut.Save()
  Write-Host "Shortcut created: $lnk" -ForegroundColor Green
  Write-Host "Double-click it to launch the Classroom system." -ForegroundColor Yellow
} catch {
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
exit 0
