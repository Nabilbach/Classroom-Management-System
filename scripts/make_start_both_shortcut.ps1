$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$bat = Join-Path $root 'start_both_open.bat'
$desktop = [Environment]::GetFolderPath('Desktop')
$lnk = Join-Path $desktop 'Classroom Start (Full).lnk'

if (-not (Test-Path $bat)) { Write-Host "ERROR: start_both_open.bat not found" -ForegroundColor Red; exit 1 }

try {
  $w = New-Object -ComObject WScript.Shell
  $s = $w.CreateShortcut($lnk)
  $s.TargetPath = $bat
  $s.WorkingDirectory = $root
  $s.IconLocation = 'C:\\Windows\\System32\\shell32.dll,220'
  $s.Description = 'Start Backend + Frontend + Auto Open Browser'
  $s.WindowStyle = 1
  $s.Save()
  Write-Host "Shortcut created: $lnk" -ForegroundColor Green
  Write-Host "Double-click it to launch everything." -ForegroundColor Yellow
} catch {
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
exit 0