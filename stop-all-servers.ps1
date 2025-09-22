# Stop Classroom Management System - All Environments
# This script safely stops all running servers

param(
    [switch]$Force,
    [switch]$Silent
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Write-ColoredText {
    param([string]$Text, [string]$Color = "White")
    if (-not $Silent) {
        Write-Host $Text -ForegroundColor $Color
    }
}

function Stop-ServerOnPort {
    param([int]$Port, [string]$Description)
    
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    
    if ($connections) {
        Write-ColoredText "[INFO] Stopping $Description on port $Port..." "Yellow"
        
        foreach ($conn in $connections) {
            try {
                $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
                if ($process) {
                    if ($Force) {
                        Stop-Process -Id $conn.OwningProcess -Force
                        Write-ColoredText "[✓] Forcefully stopped $Description (PID: $($conn.OwningProcess))" "Green"
                    } else {
                        # Try graceful shutdown first
                        $process.CloseMainWindow()
                        Start-Sleep 2
                        
                        if (-not $process.HasExited) {
                            Stop-Process -Id $conn.OwningProcess -Force
                        }
                        Write-ColoredText "[✓] Stopped $Description (PID: $($conn.OwningProcess))" "Green"
                    }
                }
            } catch {
                Write-ColoredText "[WARNING] Could not stop process on port $Port`: $($_.Exception.Message)" "Red"
            }
        }
    } else {
        Write-ColoredText "[INFO] No process running on port $Port ($Description)" "Gray"
    }
}

function Show-RunningServices {
    Write-ColoredText "`n============================================" "Cyan"
    Write-ColoredText "    Classroom Management System Status" "Yellow"
    Write-ColoredText "============================================" "Cyan"
    Write-Host ""
    
    # Check production environment
    Write-ColoredText "Production Environment:" "Green"
    $prod3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    $prod5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
    
    if ($prod3000) {
        Write-ColoredText "  [✓] Backend running on port 3000" "Green"
    } else {
        Write-ColoredText "  [✗] Backend not running on port 3000" "Gray"
    }
    
    if ($prod5173) {
        Write-ColoredText "  [✓] Frontend running on port 5173" "Green"
    } else {
        Write-ColoredText "  [✗] Frontend not running on port 5173" "Gray"
    }
    
    # Check development environment
    Write-ColoredText "`nDevelopment Environment:" "Green"
    $dev3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
    $dev5174 = Get-NetTCPConnection -LocalPort 5174 -ErrorAction SilentlyContinue
    
    if ($dev3001) {
        Write-ColoredText "  [✓] Backend running on port 3001" "Green"
    } else {
        Write-ColoredText "  [✗] Backend not running on port 3001" "Gray"
    }
    
    if ($dev5174) {
        Write-ColoredText "  [✓] Frontend running on port 5174" "Green"
    } else {
        Write-ColoredText "  [✗] Frontend not running on port 5174" "Gray"
    }
    Write-Host ""
}

# Main execution
try {
    if (-not $Silent) {
        Show-RunningServices
        
        if (-not $Force) {
            $confirm = Read-Host "Stop all Classroom Management System servers? (y/N)"
            if ($confirm -ne "y" -and $confirm -ne "Y" -and $confirm -ne "yes") {
                Write-ColoredText "[INFO] Operation cancelled." "Yellow"
                exit 0
            }
        }
        
        Write-ColoredText "`n[INFO] Stopping all Classroom Management System servers..." "Yellow"
    }
    
    # Stop all servers on known ports
    Stop-ServerOnPort 3000 "Production Backend"
    Stop-ServerOnPort 5173 "Production Frontend" 
    Stop-ServerOnPort 3001 "Development Backend"
    Stop-ServerOnPort 5174 "Development Frontend"
    
    # Wait a moment for processes to fully terminate
    Start-Sleep 2
    
    if (-not $Silent) {
        Write-ColoredText "`n============================================" "Green"
        Write-ColoredText "    All servers stopped successfully!" "Green"
        Write-ColoredText "============================================" "Green"
        Write-Host ""
        Write-ColoredText "You can now:" "Yellow"
        Write-ColoredText "- Restart production: Double-click desktop shortcut" "White"
        Write-ColoredText "- Start development: Use manage-environments.ps1" "White"
        Write-Host ""
    }
    
} catch {
    Write-ColoredText "[ERROR] An error occurred: $($_.Exception.Message)" "Red"
    exit 1
}