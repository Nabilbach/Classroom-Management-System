$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$batFile = Join-Path $scriptPath "START_SYSTEM.bat"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Classroom System.lnk"

if (-not (Test-Path $batFile)) {
    Write-Host "File not found" -ForegroundColor Red
    exit 1
}

try {
    $WScriptShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WScriptShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = $batFile
    $Shortcut.WorkingDirectory = $scriptPath
    $Shortcut.WindowStyle = 1
    $Shortcut.IconLocation = "C:\Windows\System32\shell32.dll,220"
    $Shortcut.Description = "Start Classroom Management System"
    $Shortcut.Save()
    
    Write-Host "Shortcut created successfully!" -ForegroundColor Green
    Write-Host "Location: $shortcutPath" -ForegroundColor Yellow
    
} catch {
    Write-Host "Error creating shortcut" -ForegroundColor Red
    exit 1
}

exit 0