# Classroom Management System - Auto Start Script
# This script automatically starts the production environment

param(
    [switch]$Silent,
    [switch]$OpenBrowser
)

# Set console encoding for Arabic support
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Colors and styling
$Host.UI.RawUI.WindowTitle = "Classroom Management System - Production"

# Production environment paths and ports
$ProjectPath = "C:\Users\nabil\OneDrive\Documents\Classroom Management System"
$BackendPort = 3000
$FrontendPort = 5173

function Write-ColoredText {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Show-Header {
    Clear-Host
    Write-ColoredText "============================================" "Cyan"
    Write-ColoredText "     Classroom Management System" "Yellow"
    Write-ColoredText "        Production Environment" "Yellow"
    Write-ColoredText "============================================" "Cyan"
    Write-Host ""
}

function Test-Port {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $connection
}

function Stop-PortProcess {
    param([int]$Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        try {
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-ColoredText "[INFO] Stopped process on port $Port" "Yellow"
        } catch {
            Write-ColoredText "[WARNING] Could not stop process on port $Port" "Red"
        }
    }
}

function Start-BackendServer {
    if (Test-Port $BackendPort) {
        Write-ColoredText "[WARNING] Port $BackendPort is in use. Stopping existing process..." "Yellow"
        Stop-PortProcess $BackendPort
        Start-Sleep 2
    }
    
    Write-ColoredText "[INFO] Starting Backend Server on port $BackendPort..." "Green"
    
    # Start backend in a new minimized window
    $backendPath = Join-Path $ProjectPath "backend"
    Start-Process PowerShell -ArgumentList "-NoProfile", "-WindowStyle", "Minimized", "-Command", "cd '$backendPath'; node index.js; Read-Host 'Backend stopped. Press Enter to close'" -WindowStyle Minimized
    
    # Wait for backend to start
    $timeout = 30
    $elapsed = 0
    while (-not (Test-Port $BackendPort) -and $elapsed -lt $timeout) {
        Start-Sleep 1
        $elapsed++
        Write-Progress -Activity "Starting Backend" -Status "Waiting for server..." -PercentComplete (($elapsed / $timeout) * 100)
    }
    Write-Progress -Activity "Starting Backend" -Completed
    
    if (Test-Port $BackendPort) {
        Write-ColoredText "[✓] Backend Server started successfully!" "Green"
        return $true
    } else {
        Write-ColoredText "[✗] Backend Server failed to start!" "Red"
        return $false
    }
}

function Start-FrontendServer {
    if (Test-Port $FrontendPort) {
        Write-ColoredText "[WARNING] Port $FrontendPort is in use. Stopping existing process..." "Yellow"
        Stop-PortProcess $FrontendPort
        Start-Sleep 2
    }
    
    Write-ColoredText "[INFO] Starting Frontend Server on port $FrontendPort..." "Green"
    
    # Start frontend in a new minimized window
    Start-Process PowerShell -ArgumentList "-NoProfile", "-WindowStyle", "Minimized", "-Command", "cd '$ProjectPath'; npm run dev; Read-Host 'Frontend stopped. Press Enter to close'" -WindowStyle Minimized
    
    # Wait for frontend to start
    $timeout = 45
    $elapsed = 0
    while (-not (Test-Port $FrontendPort) -and $elapsed -lt $timeout) {
        Start-Sleep 1
        $elapsed++
        Write-Progress -Activity "Starting Frontend" -Status "Building and starting..." -PercentComplete (($elapsed / $timeout) * 100)
    }
    Write-Progress -Activity "Starting Frontend" -Completed
    
    if (Test-Port $FrontendPort) {
        Write-ColoredText "[✓] Frontend Server started successfully!" "Green"
        return $true
    } else {
        Write-ColoredText "[✗] Frontend Server failed to start!" "Red"
        return $false
    }
}

function Show-Status {
    Write-Host ""
    Write-ColoredText "============================================" "Cyan"
    Write-ColoredText "           System Status" "Yellow"
    Write-ColoredText "============================================" "Cyan"
    Write-Host ""
    
    if (Test-Port $BackendPort) {
        Write-ColoredText "[✓] Backend:  http://localhost:$BackendPort" "Green"
    } else {
        Write-ColoredText "[✗] Backend:  Not Running" "Red"
    }
    
    if (Test-Port $FrontendPort) {
        Write-ColoredText "[✓] Frontend: http://localhost:$FrontendPort" "Green"
    } else {
        Write-ColoredText "[✗] Frontend: Not Running" "Red"
    }
    Write-Host ""
}

function Show-Menu {
    while ($true) {
        Show-Header
        Show-Status
        
        Write-ColoredText "Available Actions:" "Yellow"
        Write-Host "1. Open Application"
        Write-Host "2. Open Backend API"
        Write-Host "3. Restart Backend"
        Write-Host "4. Restart Frontend"
        Write-Host "5. Stop All Servers"
        Write-Host "6. Exit (Keep Servers Running)"
        Write-Host ""
        
        $choice = Read-Host "Choose an option (1-6)"
        
        switch ($choice) {
            "1" {
                if (Test-Port $FrontendPort) {
                    Start-Process "http://localhost:$FrontendPort"
                } else {
                    Write-ColoredText "[ERROR] Frontend is not running!" "Red"
                    Start-Sleep 2
                }
            }
            "2" {
                if (Test-Port $BackendPort) {
                    Start-Process "http://localhost:$BackendPort"
                } else {
                    Write-ColoredText "[ERROR] Backend is not running!" "Red"
                    Start-Sleep 2
                }
            }
            "3" {
                Write-ColoredText "[INFO] Restarting Backend..." "Yellow"
                Stop-PortProcess $BackendPort
                Start-Sleep 2
                Start-BackendServer
            }
            "4" {
                Write-ColoredText "[INFO] Restarting Frontend..." "Yellow"
                Stop-PortProcess $FrontendPort
                Start-Sleep 2
                Start-FrontendServer
            }
            "5" {
                Write-ColoredText "[INFO] Stopping all servers..." "Yellow"
                Stop-PortProcess $BackendPort
                Stop-PortProcess $FrontendPort
                Write-ColoredText "[INFO] All servers stopped." "Green"
                Start-Sleep 2
                return
            }
            "6" {
                Write-ColoredText "[INFO] Servers will continue running in background." "Green"
                return
            }
            default {
                Write-ColoredText "[ERROR] Invalid option!" "Red"
                Start-Sleep 1
            }
        }
    }
}

# Main execution
try {
    Set-Location $ProjectPath
    
    if (-not $Silent) {
        Show-Header
        Write-ColoredText "[INFO] Initializing Production Environment..." "Green"
        Write-Host ""
    }
    
    # Start servers
    $backendSuccess = Start-BackendServer
    if ($backendSuccess) {
        $frontendSuccess = Start-FrontendServer
        
        if ($frontendSuccess) {
            if (-not $Silent) {
                Write-Host ""
                Write-ColoredText "============================================" "Green"
                Write-ColoredText "    Application Started Successfully!" "Green"
                Write-ColoredText "============================================" "Green"
                Write-Host ""
                Write-ColoredText "Backend:  http://localhost:$BackendPort" "Cyan"
                Write-ColoredText "Frontend: http://localhost:$FrontendPort" "Cyan"
                Write-Host ""
            }
            
            if ($OpenBrowser) {
                Start-Process "http://localhost:$FrontendPort"
            }
            
            if (-not $Silent) {
                Write-ColoredText "[INFO] Both servers are running. Opening control panel..." "Green"
                Start-Sleep 3
                Show-Menu
            }
        } else {
            Write-ColoredText "[ERROR] Failed to start frontend server!" "Red"
            exit 1
        }
    } else {
        Write-ColoredText "[ERROR] Failed to start backend server!" "Red"
        exit 1
    }
    
} catch {
    Write-ColoredText "[ERROR] An unexpected error occurred: $($_.Exception.Message)" "Red"
    exit 1
}