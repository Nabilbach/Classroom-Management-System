# Classroom Management System - Simple Auto Start
param([switch]$Silent, [switch]$OpenBrowser)

$ProjectPath = "C:\Users\nabil\OneDrive\Documents\Classroom Management System"
$BackendPort = 3000
$FrontendPort = 5173

function Stop-PortProcess {
    param([int]$Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        try {
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            if (-not $Silent) { Write-Host "[INFO] Stopped process on port $Port" -ForegroundColor Yellow }
        } catch {
            if (-not $Silent) { Write-Host "[WARNING] Could not stop process on port $Port" -ForegroundColor Red }
        }
    }
}

function Test-Port {
    param([int]$Port)
    return $null -ne (Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue)
}

try {
    Set-Location $ProjectPath
    
    if (-not $Silent) {
        Write-Host "============================================" -ForegroundColor Cyan
        Write-Host "     Classroom Management System" -ForegroundColor Yellow
        Write-Host "        Production Environment" -ForegroundColor Yellow
        Write-Host "============================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "[INFO] Starting production environment..." -ForegroundColor Green
    }
    
    # Stop any existing processes
    if (Test-Port $BackendPort) {
        if (-not $Silent) { Write-Host "[WARNING] Port $BackendPort is in use. Stopping..." -ForegroundColor Yellow }
        Stop-PortProcess $BackendPort
        Start-Sleep 2
    }
    
    if (Test-Port $FrontendPort) {
        if (-not $Silent) { Write-Host "[WARNING] Port $FrontendPort is in use. Stopping..." -ForegroundColor Yellow }
        Stop-PortProcess $FrontendPort
        Start-Sleep 2
    }
    
    # Start backend
    if (-not $Silent) { Write-Host "[INFO] Starting Backend Server..." -ForegroundColor Green }
    $backendPath = Join-Path $ProjectPath "backend"
    Start-Process PowerShell -ArgumentList "-NoProfile", "-WindowStyle", "Minimized", "-Command", "cd '$backendPath'; node index.js; Read-Host 'Press Enter to close'" -WindowStyle Minimized
    
    # Wait for backend
    $timeout = 30
    $elapsed = 0
    while (-not (Test-Port $BackendPort) -and $elapsed -lt $timeout) {
        Start-Sleep 1
        $elapsed++
    }
    
    if (Test-Port $BackendPort) {
        if (-not $Silent) { Write-Host "[SUCCESS] Backend started on port $BackendPort" -ForegroundColor Green }
    } else {
        if (-not $Silent) { Write-Host "[ERROR] Backend failed to start" -ForegroundColor Red }
        exit 1
    }
    
    # Start frontend
    if (-not $Silent) { Write-Host "[INFO] Starting Frontend Server..." -ForegroundColor Green }
    Start-Process PowerShell -ArgumentList "-NoProfile", "-WindowStyle", "Minimized", "-Command", "cd '$ProjectPath'; npm run dev; Read-Host 'Press Enter to close'" -WindowStyle Minimized
    
    # Wait for frontend
    $timeout = 45
    $elapsed = 0
    while (-not (Test-Port $FrontendPort) -and $elapsed -lt $timeout) {
        Start-Sleep 1
        $elapsed++
    }
    
    if (Test-Port $FrontendPort) {
        if (-not $Silent) { 
            Write-Host "[SUCCESS] Frontend started on port $FrontendPort" -ForegroundColor Green
            Write-Host ""
            Write-Host "============================================" -ForegroundColor Green
            Write-Host "    Application Started Successfully!" -ForegroundColor Green
            Write-Host "============================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "Backend:  http://localhost:$BackendPort" -ForegroundColor Cyan
            Write-Host "Frontend: http://localhost:$FrontendPort" -ForegroundColor Cyan
        }
        
        if ($OpenBrowser) {
            Start-Process "http://localhost:$FrontendPort"
        }
        
        if (-not $Silent) {
            Write-Host ""
            Write-Host "Press any key to open control panel..." -ForegroundColor Yellow
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            
            # Simple menu
            do {
                Clear-Host
                Write-Host "============================================" -ForegroundColor Cyan
                Write-Host "     Classroom Management System" -ForegroundColor Yellow
                Write-Host "         Control Panel" -ForegroundColor Yellow
                Write-Host "============================================" -ForegroundColor Cyan
                Write-Host ""
                Write-Host "1. Open Application"
                Write-Host "2. Open Backend API"
                Write-Host "3. Check Status"
                Write-Host "4. Stop All Servers"
                Write-Host "5. Exit (Keep Running)"
                Write-Host ""
                $choice = Read-Host "Choose option (1-5)"
                
                switch ($choice) {
                    "1" { Start-Process "http://localhost:$FrontendPort" }
                    "2" { Start-Process "http://localhost:$BackendPort" }
                    "3" { 
                        Write-Host ""
                        if (Test-Port $BackendPort) { Write-Host "[OK] Backend running" -ForegroundColor Green }
                        else { Write-Host "[ERROR] Backend not running" -ForegroundColor Red }
                        if (Test-Port $FrontendPort) { Write-Host "[OK] Frontend running" -ForegroundColor Green }
                        else { Write-Host "[ERROR] Frontend not running" -ForegroundColor Red }
                        Write-Host ""
                        Read-Host "Press Enter to continue"
                    }
                    "4" { 
                        Write-Host "Stopping servers..." -ForegroundColor Yellow
                        Stop-PortProcess $BackendPort
                        Stop-PortProcess $FrontendPort
                        Write-Host "All servers stopped." -ForegroundColor Green
                        Start-Sleep 2
                        exit
                    }
                    "5" { exit }
                }
            } while ($choice -ne "4" -and $choice -ne "5")
        }
    } else {
        if (-not $Silent) { Write-Host "[ERROR] Frontend failed to start" -ForegroundColor Red }
        exit 1
    }
    
} catch {
    if (-not $Silent) { Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red }
    exit 1
}