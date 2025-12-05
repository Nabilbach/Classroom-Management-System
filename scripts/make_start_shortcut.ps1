Write-Host "Creating START shortcut..."
$project = "C:\Users\nabil\OneDrive\Documents\Classroom Management System"
$bat = Join-Path $project 'start_cms.bat'
$desktop = [Environment]::GetFolderPath('Desktop')
$lnk = Join-Path $desktop 'Start Classroom.lnk'

if (-not (Test-Path $bat)) { Write-Host "ERROR: start_cms.bat missing" -ForegroundColor Red; exit 1 }

$w = New-Object -ComObject WScript.Shell
$s = $w.CreateShortcut($lnk)
$s.TargetPath = $bat
$s.WorkingDirectory = $project
$s.IconLocation = 'C:\\Windows\\System32\\shell32.dll,220'
$s.Description = 'Start Classroom Management System'
$s.WindowStyle = 1
$s.Save()

Write-Host "Shortcut created: $lnk" -ForegroundColor Green
Write-Host "Double-click it: opens Backend + Frontend" -ForegroundColor Yellow
Write-Host "Open http://localhost:5173 after frontend builds" -ForegroundColor Cyan
exit 0