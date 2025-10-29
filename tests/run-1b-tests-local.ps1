#!/usr/bin/env pwsh

<#
.SYNOPSIS
Run 1B Tier (Fast) Local Tests on Windows via WSL

.DESCRIPTION
This script:
1. Checks prerequisites (Node.js, WSL, Python)
2. Launches the 1B model in WSL if not running
3. Runs Playwright tests
4. Generates HTML report

.PARAMETER NoModel
Skip model launch and just run connectivity tests

.PARAMETER Cleanup
Kill the model after tests complete

.EXAMPLE
.\tests\run-1b-tests-local.ps1
.\tests\run-1b-tests-local.ps1 -NoModel
.\tests\run-1b-tests-local.ps1 -Cleanup
#>

param(
    [switch]$NoModel,
    [switch]$Cleanup
)

# Configuration
$PORT = 8100
$TIMEOUT = 180
$MODEL_ROLE = "fast"

# Colors
$Green = @{ ForegroundColor = "Green" }
$Red = @{ ForegroundColor = "Red" }
$Yellow = @{ ForegroundColor = "Yellow" }
$Blue = @{ ForegroundColor = "Cyan" }
$Info = @{ ForegroundColor = "Cyan" }

function Print-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "════════════════════════════════════════" @Blue
    Write-Host $Message @Blue
    Write-Host "════════════════════════════════════════" @Blue
    Write-Host ""
}

function Print-Success {
    param([string]$Message)
    Write-Host "✅ $Message" @Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "❌ $Message" @Red
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" @Yellow
}

function Print-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" @Info
}

function Check-Prerequisites {
    Print-Header "Checking Prerequisites"

    # Check Node.js
    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) {
        Print-Error "Node.js not found. Please install Node.js 18+"
        exit 1
    }
    $nodeVersion = & node --version
    Print-Success "Node.js: $nodeVersion"

    # Check npm
    $npm = Get-Command npm -ErrorAction SilentlyContinue
    if (-not $npm) {
        Print-Error "npm not found"
        exit 1
    }
    $npmVersion = & npm --version
    Print-Success "npm: $npmVersion"

    # Check WSL
    $wsl = Get-Command wsl -ErrorAction SilentlyContinue
    if (-not $wsl) {
        Print-Warning "WSL not found - may not be able to launch models"
    }
    else {
        Print-Success "WSL found"
    }

    # Check Python in WSL
    $pythonCheck = & wsl bash -c "python3 --version 2>&1" -ErrorAction SilentlyContinue
    if ($LASTEXITCODE -eq 0) {
        Print-Success "Python in WSL: $pythonCheck"
    }
    else {
        Print-Warning "Python3 not available in WSL (needed for model launch)"
    }
}

function Install-Dependencies {
    Print-Header "Installing Test Dependencies"

    if (-not (Test-Path "node_modules")) {
        Print-Info "Running: npm ci"
        & npm ci
        Print-Success "npm dependencies installed"
    }
    else {
        Print-Info "npm dependencies already installed"
    }

    $playwrightVersion = & npx playwright --version 2>&1 -ErrorAction SilentlyContinue
    if ($LASTEXITCODE -ne 0) {
        Print-Info "Installing Playwright browsers..."
        & npx playwright install
    }
    Print-Success "Playwright ready"
}

function Check-Port-Available {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$PORT/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Print-Success "Port $PORT already has a model running (can reuse)"
            return $true
        }
    }
    catch {
        # Port not available
    }
    return $false
}

function Launch-Model {
    if ($NoModel) {
        Print-Warning "Skipping model launch (--no-model flag)"
        return $true
    }

    Print-Header "Launching 1B Model"

    # Check if already running
    if (Check-Port-Available) {
        Print-Info "Reusing existing model on port $PORT"
        return $true
    }

    # Kill any existing processes
    Print-Info "Cleaning up any existing processes..."
    & wsl bash -c "pkill -f 'vllm.*$PORT' || true" | Out-Null
    Start-Sleep -Seconds 2

    # Check if bootstrap directory exists
    $bootstrapPath = "$env:USERPROFILE\.config\llm-doctrine"
    $bootstrapPathLinux = "/home/$env:USERNAME/.config/llm-doctrine"

    if (-not (Test-Path $bootstrapPath)) {
        Print-Error "Bootstrap directory not found"
        Print-Error "Run initial-bootstrap.sh first"
        exit 1
    }

    # Launch model via WSL
    Print-Info "Launching $MODEL_ROLE model on port $PORT via WSL..."

    $launchCmd = @"
cd ~/.config/llm-doctrine
source ~/torch-env/bin/activate
nohup python3 -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-0.5B-Instruct \
  --port $PORT \
  --gpu-memory-utilization 0.7 \
  > logs/fast_${PORT}.log 2>&1 &
echo "Model launched"
"@

    & wsl bash -c $launchCmd | Out-Null

    Print-Info "Model process launched"
    Print-Info "Waiting up to ${TIMEOUT}s for model to become ready..."

    # Wait for model to be ready
    $elapsed = 0
    while ($elapsed -lt $TIMEOUT) {
        if (Check-Port-Available) {
            Print-Success "Model is ready on port $PORT!"
            return $true
        }
        Start-Sleep -Seconds 5
        $elapsed += 5
        Write-Host "." -NoNewline
    }

    Write-Host ""
    Print-Error "Timeout waiting for model to start after ${TIMEOUT}s"
    Print-Warning "Checking logs..."
    & wsl bash -c "tail -20 ~/.config/llm-doctrine/logs/fast_${PORT}.log 2>/dev/null || echo 'No logs found'" | Out-Null

    exit 1
}

function Verify-Model {
    Print-Header "Verifying Model Connection"

    if (-not (Check-Port-Available)) {
        Print-Error "Model not responding on port $PORT"
        Print-Info "Try: npm run test:1b -- --no-model"
        exit 1
    }

    # Test health endpoint
    Print-Info "Testing health endpoint..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$PORT/health" -TimeoutSec 5
        Print-Success "Health endpoint OK"
    }
    catch {
        Print-Error "Health endpoint failed: $_"
        exit 1
    }

    # Test models endpoint
    Print-Info "Testing models endpoint..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$PORT/v1/models" -TimeoutSec 5
        $content = $response.Content
        if ($content -like "*default*") {
            Print-Success "Models endpoint OK"
        }
        else {
            Print-Error "Models endpoint returned unexpected response"
            exit 1
        }
    }
    catch {
        Print-Error "Models endpoint failed: $_"
        exit 1
    }
}

function Run-Tests {
    Print-Header "Running 1B Tier Tests"

    Print-Info "Starting Playwright tests..."
    Print-Info "Test file: tests/e2e/cli-chat-1b.spec.ts"

    # Run tests
    & npm run test:1b -- `
        --reporter=list `
        --reporter=html `
        --reporter=json

    return $LASTEXITCODE
}

function Show-Report {
    Print-Header "Test Report"

    $reportPath = "test-reports/html/index.html"
    if (Test-Path $reportPath) {
        Print-Success "HTML report generated at: $reportPath"

        # Try to open in browser
        try {
            Start-Process $reportPath
            Print-Info "Opening report in browser..."
        }
        catch {
            Print-Info "Could not auto-open browser. Open manually: $reportPath"
        }
    }

    $jsonPath = "test-reports/results.json"
    if (Test-Path $jsonPath) {
        Print-Info "JSON results at: $jsonPath"
    }
}

function Cleanup {
    if ($Cleanup) {
        Print-Header "Cleanup"
        Print-Info "Stopping model on port $PORT..."
        & wsl bash -c "pkill -f 'vllm.*$PORT' || true" | Out-Null
        Print-Success "Model stopped"
    }
    else {
        Print-Info "Model left running. Stop with: wsl pkill -f vllm"
    }
}

# Main execution
function Main {
    Print-Header "1B Tier Test Runner (Windows + WSL)"
    Print-Info "Testing vLLM-Doctrine 1B model on port $PORT"
    Print-Info "OS: Windows"

    Check-Prerequisites
    Install-Dependencies

    if (-not $NoModel) {
        Launch-Model
        Verify-Model
    }
    else {
        Print-Warning "Skipping model launch and verification"
        Print-Info "Tests will attempt to connect to existing model on port $PORT"
    }

    # Run tests
    Run-Tests
    $testResult = $LASTEXITCODE

    # Show report
    Show-Report

    # Cleanup if requested
    Cleanup

    # Exit with test result
    exit $testResult
}

# Run main
Main