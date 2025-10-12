#!/usr/bin/env bash
# -------------------------------------------------------------------
# Complete New User Journey Test Script
# 
# This script walks through the entire vLLM-Doctrine setup process
# and validates each step, helping identify friction points.
# 
# Usage: ./test-complete-journey.sh [--with-hf-token TOKEN]
# -------------------------------------------------------------------

set -e

DOCTRINE_VERSION="2025.10.10"
TEST_LOG="./journey-test.log"
ERRORS=0
WARNINGS=0

echo "🧪 vLLM-Doctrine Complete Journey Test (v$DOCTRINE_VERSION)"
echo "============================================================"
echo ""

# Parse arguments
HF_TOKEN=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --with-hf-token)
      HF_TOKEN="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

log_step() {
  echo "[$1] $2" | tee -a "$TEST_LOG"
}

log_success() {
  echo "✅ $1" | tee -a "$TEST_LOG"
}

log_warning() {
  echo "⚠️ $1" | tee -a "$TEST_LOG"
  WARNINGS=$((WARNINGS + 1))
}

log_error() {
  echo "❌ $1" | tee -a "$TEST_LOG"
  ERRORS=$((ERRORS + 1))
}

# Initialize test log
echo "Journey Test Started: $(date)" > "$TEST_LOG"
echo "Arguments: HF_TOKEN=${HF_TOKEN:+PROVIDED}" >> "$TEST_LOG"
echo "" >> "$TEST_LOG"

# Phase 1: Environment Check
log_step "PHASE 1" "Environment Validation"
echo ""

# Check WSL environment
if [ -f /proc/version ] && grep -q Microsoft /proc/version; then
  log_success "Running in WSL environment"
else
  log_warning "Not running in WSL - may affect NVIDIA GPU detection"
fi

# Check Ubuntu version
if command -v lsb_release &>/dev/null; then
  UBUNTU_VERSION=$(lsb_release -rs)
  log_success "Ubuntu version: $UBUNTU_VERSION"
else
  log_warning "Cannot detect Ubuntu version"
fi

# Check initial Python state
if command -v python3 &>/dev/null; then
  PYTHON_VERSION=$(python3 --version)
  log_success "Python available: $PYTHON_VERSION"
else
  log_error "Python3 not found"
fi

# Check for existing virtual environments
if [ -d ~/torch-env ]; then
  log_warning "Virtual environment already exists at ~/torch-env"
else
  log_success "No existing torch-env found (clean slate)"
fi

# Check NVIDIA GPU
if command -v nvidia-smi &>/dev/null; then
  GPU_INFO=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null | head -n1)
  log_success "GPU detected: $GPU_INFO"
else
  log_warning "nvidia-smi not found - will use CPU mode"
fi

echo ""

# Phase 2: Initial Bootstrap Test
log_step "PHASE 2" "Initial Bootstrap Simulation"
echo ""

log_step "2.1" "Checking system dependencies"
REQUIRED_PACKAGES=("python3-venv" "python3-pip" "git" "curl" "tmux")
for PKG in "${REQUIRED_PACKAGES[@]}"; do
  if dpkg -l | grep -q "^ii  $PKG "; then
    log_success "$PKG is installed"
  else
    log_warning "$PKG is not installed (would be installed by bootstrap)"
  fi
done

# Check netcat variants
if command -v nc &>/dev/null; then
  NC_VERSION=$(nc -h 2>&1 | head -n1 || echo "netcat available")
  log_success "netcat available: $NC_VERSION"
else
  log_warning "netcat not found (would be installed by bootstrap)"
fi

log_step "2.2" "Testing virtual environment creation"
if ! python3 -m venv --help &>/dev/null; then
  log_error "python3-venv module not available"
else
  log_success "python3-venv module available"
fi

echo ""

# Phase 3: Configuration File Validation
log_step "PHASE 3" "Configuration Files Validation"
echo ""

CONFIG_FILES=(
  "models.conf:Model definitions"
  "ports.conf:Port range assignments"  
  "chat-templates.conf:Chat template mappings"
  "daily-bootstrap.sh:Daily launcher script"
  "test-connection.sh:Connection test script"
)

for CONFIG in "${CONFIG_FILES[@]}"; do
  FILE=$(echo "$CONFIG" | cut -d: -f1)
  DESC=$(echo "$CONFIG" | cut -d: -f2)
  
  if [ -f "./$FILE" ]; then
    log_success "$FILE exists ($DESC)"
    
    # Validate file content
    case "$FILE" in
      "models.conf")
        if grep -q "\[1B\]" "$FILE" && grep -q "default = " "$FILE"; then
          log_success "models.conf has valid structure"
        else
          log_error "models.conf structure invalid"
        fi
        ;;
      "ports.conf")
        if grep -q "1B = 8100-8299" "$FILE"; then
          log_success "ports.conf has valid port ranges"
        else
          log_error "ports.conf port ranges invalid"
        fi
        ;;
      "daily-bootstrap.sh")
        if [ -x "./$FILE" ]; then
          log_success "daily-bootstrap.sh is executable"
        else
          log_warning "daily-bootstrap.sh not executable"
        fi
        ;;
    esac
  else
    log_error "$FILE missing ($DESC)"
  fi
done

echo ""

# Phase 4: Model Download Simulation
log_step "PHASE 4" "Model Download Readiness"
echo ""

if [ -n "$HF_TOKEN" ]; then
  log_step "4.1" "Testing HuggingFace authentication"
  
  # This would normally test the actual authentication
  # For simulation, we just validate the token format
  if [[ ${#HF_TOKEN} -gt 20 ]]; then
    log_success "HuggingFace token provided and appears valid format"
  else
    log_warning "HuggingFace token seems too short"
  fi
else
  log_warning "No HuggingFace token provided - some models may fail"
fi

log_step "4.2" "Checking internet connectivity for model downloads"
if curl -s --connect-timeout 5 https://huggingface.co > /dev/null; then
  log_success "HuggingFace connectivity test passed"
else
  log_error "Cannot reach HuggingFace - model downloads will fail"
fi

# Check disk space
AVAILABLE_GB=$(df -BG . | tail -n1 | awk '{print $4}' | sed 's/G//')
log_success "Available disk space: ${AVAILABLE_GB}GB"
if [ "$AVAILABLE_GB" -lt 50 ]; then
  log_warning "Low disk space - models require 4-30GB each"
fi

echo ""

# Phase 5: Port Availability Check
log_step "PHASE 5" "Port Availability Check"
echo ""

PORT_RANGES=("8100-8299:1B models" "8300-8499:4B models" "8500-8699:7B models" "8700-8899:15B models")

for RANGE_INFO in "${PORT_RANGES[@]}"; do
  RANGE=$(echo "$RANGE_INFO" | cut -d: -f1)
  DESC=$(echo "$RANGE_INFO" | cut -d: -f2)
  START=$(echo "$RANGE" | cut -d- -f1)
  END=$(echo "$RANGE" | cut -d- -f2)
  
  # Test a few ports in each range
  CONFLICTS=0
  for PORT in $(seq "$START" $((START + 4))); do
    if nc -z localhost "$PORT" 2>/dev/null; then
      CONFLICTS=$((CONFLICTS + 1))
    fi
  done
  
  if [ $CONFLICTS -eq 0 ]; then
    log_success "Port range $RANGE available ($DESC)"
  else
    log_warning "Port range $RANGE has $CONFLICTS conflicts ($DESC)"
  fi
done

echo ""

# Phase 6: Performance Prediction
log_step "PHASE 6" "Performance Predictions"
echo ""

if command -v nvidia-smi &>/dev/null; then
  GPU_MEM=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>/dev/null | head -n1)
  
  if [ -n "$GPU_MEM" ]; then
    log_success "GPU VRAM: ${GPU_MEM}MB"
    
    if [ "$GPU_MEM" -ge 16384 ]; then
      log_success "Excellent VRAM - all model tiers will run well"
    elif [ "$GPU_MEM" -ge 12288 ]; then
      log_success "Good VRAM - all tiers supported, 15B may be slower"
    elif [ "$GPU_MEM" -ge 8192 ]; then
      log_warning "Moderate VRAM - stick to 1B/4B/7B tiers for best performance"
    elif [ "$GPU_MEM" -ge 6144 ]; then
      log_warning "Low VRAM - recommended to use 1B/4B tiers only"
    else
      log_warning "Very low VRAM - consider CPU mode or cloud alternatives"
    fi
  fi
else
  log_warning "CPU-only mode detected - expect very slow performance"
fi

echo ""

# Phase 7: Security and Firewall Check
log_step "PHASE 7" "Security Configuration"
echo ""

# Check if we're running as root
if [ "$EUID" -eq 0 ]; then
  log_warning "Running as root - not recommended for security"
else
  log_success "Running as non-root user"
fi

# Check for common firewall interference
if command -v ufw &>/dev/null && ufw status | grep -q "Status: active"; then
  log_warning "UFW firewall active - may need configuration for external access"
else
  log_success "No UFW firewall interference detected"
fi

echo ""

# Phase 8: Generate Test Plan
log_step "PHASE 8" "Generating Test Execution Plan"
echo ""

cat << 'EOF'
📋 RECOMMENDED TEST EXECUTION SEQUENCE
=====================================

1. Clean Environment Setup:
   cd ~/.config/llm-doctrine
   
2. Run Initial Bootstrap:
   ./initial-bootstrap.sh
   # When prompted for HF token, provide it if you have one
   
3. Validate Configuration:
   ./validate-config.sh
   
4. Activate Environment:
   source ~/torch-env/bin/activate
   
5. Test Small Model First:
   ./daily-bootstrap.sh fast
   # Wait for model to load (2-5 minutes)
   
6. Test Connection (in new terminal):
   cd ~/.config/llm-doctrine
   source ~/torch-env/bin/activate
   ./test-connection.sh 8100
   
7. If successful, try QA model:
   # Stop first model with Ctrl+C
   ./daily-bootstrap.sh qa
   ./test-connection.sh 8500
   
8. Configure Rider:
   # Settings → Tools → AI Assistant → Models
   # Add OpenAI Compatible provider
   # URL: http://localhost:8500/v1
   
9. Test Rider Integration:
   # Try AI suggestions with Alt+Enter
   # Use AI Assistant chat panel

EOF

echo ""

# Final Summary
log_step "SUMMARY" "Test Results"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Journey Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "🎉 Perfect Environment - Ready for full journey!"
  echo ""
  echo "💡 You can proceed with confidence through all setup steps."
  RESULT="EXCELLENT"
elif [ $ERRORS -eq 0 ]; then
  echo "✅ Good Environment - Minor issues noted"
  echo ""
  echo "⚠️  $WARNINGS warning(s) detected, but setup should succeed."
  echo "💡 Review warnings above and address if needed."
  RESULT="GOOD"  
else
  echo "❌ Issues Detected - Fix before proceeding"
  echo ""
  echo "🛑 $ERRORS error(s) and $WARNINGS warning(s) found."
  echo "💡 Address errors before running the actual setup."
  RESULT="NEEDS_FIXES"
fi

echo ""
echo "📝 Full test log: $TEST_LOG"
echo "🕒 Test completed: $(date)"
echo ""

# Add result to log
echo "" >> "$TEST_LOG"
echo "Final Result: $RESULT" >> "$TEST_LOG"
echo "Errors: $ERRORS, Warnings: $WARNINGS" >> "$TEST_LOG"
echo "Test completed: $(date)" >> "$TEST_LOG"

exit 0