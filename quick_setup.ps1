# Quick Setup Script - Safe Backup System
# Implementing immediate recommendations from BACKUP_SYSTEM_REPORT.md

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Safe Backup System Setup" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

$rootPath = "C:\Users\nabil\OneDrive\Documents\Classroom Management System"
Set-Location $rootPath

# 1. Protect databases from Git
Write-Host "`n[1/4] Protecting databases from Git..." -ForegroundColor Green

$gitignorePath = Join-Path $rootPath ".gitignore"
$protectionRules = @"

# Local databases
classroom.db
classroom_*.db
backups/
auto_backups/
*.db-journal
*.db-shm
*.db-wal

"@

if (Test-Path $gitignorePath) {
    $existing = Get-Content $gitignorePath -Raw
    if (-not ($existing -match "classroom\.db")) {
        Add-Content -Path $gitignorePath -Value $protectionRules
        Write-Host "  Added protection rules to .gitignore" -ForegroundColor Green
    } else {
        Write-Host "  Rules already exist in .gitignore" -ForegroundColor Gray
    }
} else {
    Set-Content -Path $gitignorePath -Value $protectionRules
    Write-Host "  Created new .gitignore" -ForegroundColor Green
}

# 2. Create immediate backup
Write-Host "`n[2/4] Creating immediate backup..." -ForegroundColor Green

$backupScriptPath = Join-Path $rootPath "backend\scripts\prestart_backup.js"
if (Test-Path $backupScriptPath) {
    try {
        & node $backupScriptPath
        Write-Host "  Backup created successfully" -ForegroundColor Green
    } catch {
        Write-Host "  Warning: Could not create backup" -ForegroundColor Yellow
    }
}

# 3. Create service starter script
Write-Host "`n[3/4] Creating backup service starter..." -ForegroundColor Green

$serviceScript = @'
Write-Host "Starting Smart Backup Service..." -ForegroundColor Cyan

$scriptPath = Join-Path $PSScriptRoot "smart_backup_service.cjs"

if (Test-Path $scriptPath) {
    Start-Process node -ArgumentList $scriptPath -NoNewWindow
    Write-Host "Backup service started successfully" -ForegroundColor Green
} else {
    Write-Host "Error: smart_backup_service.cjs not found" -ForegroundColor Red
}
'@

$servicePath = Join-Path $rootPath "start_backup_service.ps1"
Set-Content -Path $servicePath -Value $serviceScript
Write-Host "  Created start_backup_service.ps1" -ForegroundColor Green

# 4. Summary
Write-Host "`n[4/4] Setup Summary..." -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Setup completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nWhat was done:" -ForegroundColor Yellow
Write-Host "  - Protected databases from Git" -ForegroundColor White
Write-Host "  - Created immediate backup" -ForegroundColor White
Write-Host "  - Created service starter script" -ForegroundColor White

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. To start backup service:" -ForegroundColor Cyan
Write-Host "     .\start_backup_service.ps1" -ForegroundColor White
Write-Host ""
Write-Host "  2. To start server with auto-backup:" -ForegroundColor Cyan
Write-Host "     cd backend" -ForegroundColor White
Write-Host "     npm run prestart-backup" -ForegroundColor White
Write-Host "     npm start" -ForegroundColor White
Write-Host ""
Write-Host "  3. For safe restore:" -ForegroundColor Cyan
Write-Host "     cd backend" -ForegroundColor White
Write-Host "     node emergency-restore.js --force --source path\to\backup.db" -ForegroundColor White

Write-Host "`nFor details, see: BACKUP_SYSTEM_REPORT.md" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan
