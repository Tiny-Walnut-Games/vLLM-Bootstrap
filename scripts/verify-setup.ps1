#Requires -Version 5.0
<#
.SYNOPSIS
    vLLM-Doctrine Setup Verification Script (PowerShell Version)

.DESCRIPTION
    Validates that initial-bootstrap.sh completed successfully in WSL and all
    helper scripts were generated correctly.

.PARAMETER Verbose
    Display detailed output for each check

.EXAMPLE
    .\verify-setup.ps1
    .\verify-setup.ps1 -Verbose

.EXIT_CODES
    0 = All checks passed
    1 = One or more checks failed
#>

param(
    [switch]$Verbose = $false
)

# Color codes
$GREEN = "`e[32m"
$RED = "`e[31m"
$YELLOW = "`e[33m"
$BLUE = "`e[34m"
$NC = "`e[0m"

# Counters
$checksPass = 0
$checksFail = 0

function Check-Start {
    param([string]$Name)
    Write-Host -NoNewline "Checking: $Name... " -ForegroundColor Cyan
}

function Check-Pass {
    Write-Host "✅ PASS" -ForegroundColor Green
    $script:checksPass++
}

function Check-Fail {
    param([string]$Message)
    Write-Host "❌ FAIL" -ForegroundColor Red
    Write-Host "  Error: $Message" -ForegroundColor Red
    $script:checksFail++
}

function Check-Warn {
    param([string]$Message)
    Write-Host "⚠️  Warning: $Message" -ForegroundColor Yellow
}

function Fix-WSLScriptPermissions {
    param([string]$ScriptName)
    try {
        # Check if file is executable in WSL, and fix if needed
        $checkCmd = "test -x ~/.config/llm-doctrine/$ScriptName"
        $result = wsl bash -c $checkCmd 2>$null
        if ($LASTEXITCODE -ne 0) {
            # Not executable, try to fix it
            $fixCmd = "chmod +x ~/.config/llm-doctrine/$ScriptName"
            wsl bash -c $fixCmd 2>$null
            if ($LASTEXITCODE -eq 0) {
                return $true
            } else {
                return $false
            }
        }
        return $true
    } catch {
        return $false
    }
}

# Print header
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║   vLLM-Doctrine Setup Verification (PowerShell)        ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Get paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$doctrineDir = Split-Path -Parent $scriptDir

if ($Verbose) {
    Write-Host "Doctrine directory: $doctrineDir"
    Write-Host ""
}

# ============================================================================
# CHECK 1: Python Environment (in WSL)
# ============================================================================
Check-Start "Python environment in WSL"
try {
    $wslPython = wsl test -d ~/torch-env 2>$null
    if ($LASTEXITCODE -eq 0) {
        Check-Pass
    } else {
        Check-Fail "Python environment not found in WSL at ~/torch-env"
    }
} catch {
    Check-Fail "Could not check WSL - is WSL installed? (Error: $_)"
}

# ============================================================================
# CHECK 2: Configuration Files
# ============================================================================
Check-Start "models.conf configuration"
if (Test-Path "$doctrineDir\models.conf") {
    Check-Pass
} else {
    Check-Fail "models.conf not found in $doctrineDir"
}

Check-Start "ports.conf configuration"
if (Test-Path "$doctrineDir\ports.conf") {
    Check-Pass
} else {
    Check-Fail "ports.conf not found in $doctrineDir"
}

# ============================================================================
# CHECK 3: Repository Files
# ============================================================================
Check-Start "scripts directory"
if (Test-Path "$doctrineDir\scripts") {
    Check-Pass
} else {
    Check-Fail "scripts directory not found in $doctrineDir"
}

Check-Start "initial-bootstrap.sh script"
if (Test-Path "$doctrineDir\scripts\initial-bootstrap.sh") {
    Check-Pass
} else {
    Check-Fail "initial-bootstrap.sh not found"
}

# ============================================================================
# CHECK 4: WSL Setup Status
# ============================================================================
Check-Start "WSL installation"
try {
    $wslStatus = wsl --list --verbose 2>$null | Select-String "Ubuntu"
    if ($wslStatus) {
        Check-Pass
        if ($Verbose) {
            Write-Host "  $wslStatus" -ForegroundColor Gray
        }
    } else {
        Check-Fail "Ubuntu WSL distribution not found (run: wsl --install -d Ubuntu)"
    }
} catch {
    Check-Fail "Could not check WSL status (Error: $_)"
}

# ============================================================================
# CHECK 5: Helper Scripts in WSL (with auto-recovery)
# ============================================================================
if ($checksFail -eq 0) {  # Only check if WSL passed
    Check-Start "daily-bootstrap.sh helper script"
    if (Fix-WSLScriptPermissions "daily-bootstrap.sh") {
        Check-Pass
    } else {
        Check-Warn "Helper script not accessible - did you run initial-bootstrap.sh in WSL?"
        $script:checksFail++
    }
    
    Check-Start "test-connection.sh helper script"
    if (Fix-WSLScriptPermissions "test-connection.sh") {
        Check-Pass
    } else {
        Check-Warn "Helper script not accessible - did you run initial-bootstrap.sh in WSL?"
        $script:checksFail++
    }
}

# ============================================================================
# CHECK 6: GitHub Repository Files
# ============================================================================
Check-Start ".gitignore file"
if (Test-Path "$doctrineDir\.gitignore") {
    Check-Pass
    
    # Check if daily-bootstrap.sh is in .gitignore (it should be)
    $gitIgnoreContent = Get-Content "$doctrineDir\.gitignore" -ErrorAction SilentlyContinue
    if ($gitIgnoreContent -match "daily-bootstrap.sh") {
        if ($Verbose) {
            Write-Host "  (daily-bootstrap.sh is correctly listed as generated)" -ForegroundColor Gray
        }
    }
} else {
    Check-Fail ".gitignore not found"
}

# ============================================================================
# CHECK 7: Documentation Files
# ============================================================================
Check-Start "README.md documentation"
if (Test-Path "$doctrineDir\README.md") {
    Check-Pass
} else {
    Check-Fail "README.md not found"
}

Check-Start "Getting-Started.md guide"
if (Test-Path "$doctrineDir\wiki\Getting-Started.md") {
    Check-Pass
} else {
    Check-Warn "wiki\Getting-Started.md not found (documentation may be incomplete)"
    $script:checksPass++
}

# ============================================================================
# CHECK 8: Test Files
# ============================================================================
Check-Start "Test infrastructure"
if (Test-Path "$doctrineDir\tests\e2e") {
    Check-Pass
    $testCount = @(Get-ChildItem "$doctrineDir\tests\e2e\*.spec.ts" -ErrorAction SilentlyContinue).Count
    if ($Verbose -and $testCount -gt 0) {
        Write-Host "  Found $testCount test files" -ForegroundColor Gray
    }
} else {
    Check-Fail "tests\e2e directory not found"
}

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║                      SUMMARY                           ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Blue

$total = $checksPass + $checksFail
Write-Host "Total checks: $total"
Write-Host "  ✅ Passed: $checksPass" -ForegroundColor Green
Write-Host "  ❌ Failed: $checksFail" -ForegroundColor Red

Write-Host ""

if ($checksFail -eq 0) {
    Write-Host "✨ All checks passed! Your setup is ready." -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor Green
    Write-Host "  1. Open WSL/Ubuntu terminal"
    Write-Host "  2. Launch a model: cd ~/.config/llm-doctrine && ./daily-bootstrap.sh qa"
    Write-Host "  3. Test connection: ./test-connection.sh 8500"
    Write-Host ""
    exit 0
} else {
    Write-Host "❌ Some checks failed. Review the errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  - Run initial-bootstrap.sh in WSL: ./scripts/initial-bootstrap.sh"
    Write-Host "  - Check WSL installation: wsl --install -d Ubuntu"
    Write-Host "  - View WSL distributions: wsl --list --verbose"
    Write-Host ""
    exit 1
}