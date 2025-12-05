Write-Host "Creating simple shortcut..."
$project = "C:\Users\nabil\OneDrive\Documents\Classroom Management System"
$launcher = Join-Path $project 'run_cms_simple.bat'
$desktop = [Environment]::GetFolderPath('Desktop')
$short = Join-Path $desktop 'Classroom Simple.lnk'

if (-not (Test-Path $launcher)) { Write-Host "ERROR: Missing run_cms_simple.bat" -ForegroundColor Red; exit 1 }

$w = New-Object -ComObject WScript.Shell
$s = $w.CreateShortcut($short)
$s.TargetPath = $launcher
$s.WorkingDirectory = $project
$s.IconLocation = 'C:\\Windows\\System32\\shell32.dll,220'
$s.Description = 'Start Classroom Backend (manual frontend)'
$s.Save()

Write-Host "Shortcut created: $short" -ForegroundColor Green
Write-Host "Double-click it, backend stays open. Then run run_frontend_only.bat or press Y." -ForegroundColor Yellow