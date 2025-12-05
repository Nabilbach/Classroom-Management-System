# Environment Management Script - Classroom Management System
# Compatible PowerShell script for managing development and production environments

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("production", "development", "status", "backup", "help")]
    [string]$Action,
    
    [string]$Component = "all"  # backend, frontend, all
)

# Project paths
$ProductionPath = "C:\Users\nabil\OneDrive\Documents\Classroom Management System"
$DevelopmentPath = "C:\Users\nabil\OneDrive\Documents\Classroom Management System - Development"

function Show-Help {
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "   Environment Management Script" -ForegroundColor Yellow
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Green
    Write-Host "  .\manage-environments.ps1 -Action <action> [-Component <component>]" -ForegroundColor White
    Write-Host ""
    Write-Host "Available Actions:" -ForegroundColor Green
    Write-Host "  production   - Run production environment" -ForegroundColor White
    Write-Host "  development  - Run development environment" -ForegroundColor White
    Write-Host "  status       - Show environment status" -ForegroundColor White
    Write-Host "  backup       - Create backup" -ForegroundColor White
    Write-Host "  help         - Show this help" -ForegroundColor White
    Write-Host ""
    Write-Host "Components:" -ForegroundColor Green
    Write-Host "  backend      - Run backend server only" -ForegroundColor White
    Write-Host "  frontend     - Run frontend only" -ForegroundColor White
    Write-Host "  all          - Run complete system (default)" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host "  .\manage-environments.ps1 -Action production" -ForegroundColor Cyan
    Write-Host "  .\manage-environments.ps1 -Action development -Component backend" -ForegroundColor Cyan
    Write-Host "  .\manage-environments.ps1 -Action status" -ForegroundColor Cyan
}

function Show-Status {
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "     Environment Status" -ForegroundColor Yellow
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Check production environment
    Write-Host "Production Environment:" -ForegroundColor Green
    Write-Host "  Path: $ProductionPath" -ForegroundColor White
    Write-Host "  Database: classroom.db" -ForegroundColor White
    Write-Host "  Ports: 3000 (Backend), 5173 (Frontend)" -ForegroundColor White
    if (Test-Path "$ProductionPath\classroom.db") {
        $dbSize = (Get-Item "$ProductionPath\classroom.db").Length
        Write-Host "  DB Size: $([math]::Round($dbSize/1MB, 2)) MB" -ForegroundColor White
    }
    Write-Host ""
    
    # Check development environment
    Write-Host "Development Environment:" -ForegroundColor Green
    Write-Host "  Path: $DevelopmentPath" -ForegroundColor White
    Write-Host "  Database: classroom_dev.db" -ForegroundColor White
    Write-Host "  Ports: 3001 (Backend), 5174 (Frontend)" -ForegroundColor White
    if (Test-Path "$DevelopmentPath\classroom_dev.db") {
        $dbSize = (Get-Item "$DevelopmentPath\classroom_dev.db").Length
        Write-Host "  DB Size: $([math]::Round($dbSize/1MB, 2)) MB" -ForegroundColor White
    }
    Write-Host ""
    
    # Check running processes
    Write-Host "Running Processes:" -ForegroundColor Green
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        foreach ($process in $nodeProcesses) {
            Write-Host "  Node.js Process: PID $($process.Id)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  No Node.js processes running" -ForegroundColor Gray
    }
}

function Start-Environment {
    param([string]$Environment, [string]$Component)
    
    if ($Environment -eq "production") {
        $WorkingPath = $ProductionPath
        $EnvName = "Production"
        $BackendPort = "3000"
        $FrontendPort = "5173"
    } else {
        $WorkingPath = $DevelopmentPath
        $EnvName = "Development"
        $BackendPort = "3001"
        $FrontendPort = "5174"
    }
    
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "    Starting $EnvName Environment" -ForegroundColor Yellow
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    
    Set-Location $WorkingPath
    
    if ($Component -eq "backend" -or $Component -eq "all") {
        Write-Host "Starting Backend Server on port $BackendPort..." -ForegroundColor Green
        if ($Environment -eq "production") {
            Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$WorkingPath'; npm run prod:backend"
        } else {
            Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$WorkingPath'; npm run dev:backend"
        }
        Start-Sleep 3
    }
    
    if ($Component -eq "frontend" -or $Component -eq "all") {
        Write-Host "Starting Frontend on port $FrontendPort..." -ForegroundColor Green
        if ($Environment -eq "production") {
            Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$WorkingPath'; npm run prod:frontend"
        } else {
            Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$WorkingPath'; npm run dev:frontend"
        }
    }
    
    Write-Host ""
    Write-Host "Environment $EnvName started successfully!" -ForegroundColor Green
    Write-Host "Backend: http://localhost:$BackendPort" -ForegroundColor Cyan
    Write-Host "Frontend: http://localhost:$FrontendPort" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To stop the system, close the opened PowerShell windows" -ForegroundColor Yellow
}

function Create-Backup {
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "      Creating Backup" -ForegroundColor Yellow
    Write-Host "======================================" -ForegroundColor Cyan
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupName = "classroom_backup_$timestamp.db"
    
    try {
        Copy-Item "$ProductionPath\classroom.db" "$ProductionPath\$backupName"
        Write-Host "Backup created successfully: $backupName" -ForegroundColor Green
    } catch {
        Write-Host "Backup failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Execute the requested action
switch ($Action) {
    "production" { Start-Environment -Environment "production" -Component $Component }
    "development" { Start-Environment -Environment "development" -Component $Component }
    "status" { Show-Status }
    "backup" { Create-Backup }
    "help" { Show-Help }
}