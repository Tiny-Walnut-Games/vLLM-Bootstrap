#!/bin/bash

###############################################################################
# Run 1B Tier (Fast) Local Tests
#
# Usage:
#   ./tests/run-1b-tests-local.sh
#   ./tests/run-1b-tests-local.sh --no-model  # Test API connectivity only
#   ./tests/run-1b-tests-local.sh --cleanup    # Kill running models after tests
#
# This script:
# 1. Checks prerequisites
# 2. Sets up the test environment
# 3. Launches the 1B model (if not already running)
# 4. Runs all 1B tier Playwright tests
# 5. Generates HTML report
#
###############################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PORT=8100
TIMEOUT=180
MODEL_ROLE="fast"
LAUNCH_MODEL=true
CLEANUP_AFTER=false

# Audit logging
AUDIT_LOG="${HOME}/.config/llm-doctrine/test-audit.log"
mkdir -p "$(dirname "$AUDIT_LOG")" 2>/dev/null || true

audit_log() {
  local action="$1"
  local status="$2"
  local details="${3:-}"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "$timestamp [${status}] [${action}] ${details}" >> "$AUDIT_LOG" 2>/dev/null || true
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --no-model)
      LAUNCH_MODEL=false
      shift
      ;;
    --cleanup)
      CLEANUP_AFTER=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

###############################################################################
# Functions
###############################################################################

print_header() {
  echo -e "\n${BLUE}════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}════════════════════════════════════════${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

check_prerequisites() {
  print_header "Checking Prerequisites"

  # Check Node.js
  if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install Node.js 18+"
    exit 1
  fi
  print_success "Node.js: $(node --version)"

  # Check npm
  if ! command -v npm &> /dev/null; then
    print_error "npm not found"
    exit 1
  fi
  print_success "npm: $(npm --version)"

  # Check if we're on Windows (in WSL)
  if grep -qi microsoft /proc/version 2>/dev/null; then
    print_warning "Running in WSL"
  fi

  # Check Python
  if ! command -v python3 &> /dev/null; then
    print_warning "Python3 not found (needed for model launch)"
  else
    print_success "Python: $(python3 --version)"
  fi

  # Check if torch-env exists (for model launch)
  if [ "$LAUNCH_MODEL" = true ] && [ ! -d "$HOME/torch-env" ]; then
    print_warning "Virtual environment ~/torch-env not found"
    print_info "Run: ~/.config/llm-doctrine/initial-bootstrap.sh first"
    LAUNCH_MODEL=false
  fi
}

install_dependencies() {
  print_header "Installing Test Dependencies"

  if [ ! -d "node_modules" ]; then
    print_info "Running: npm ci"
    npm ci
    print_success "npm dependencies installed"
  else
    print_info "npm dependencies already installed"
  fi

  if ! npx playwright --version &> /dev/null; then
    print_info "Installing Playwright browsers..."
    npx playwright install
  fi
  print_success "Playwright ready"
}

check_port_available() {
  if command -v nc &> /dev/null; then
    if nc -z localhost $PORT 2>/dev/null; then
      print_success "Port $PORT already has a model running (can reuse)"
      return 0
    fi
  fi
  return 1
}

launch_model() {
  if [ "$LAUNCH_MODEL" = false ]; then
    print_warning "Skipping model launch (--no-model flag)"
    audit_log "MODEL_LAUNCH" "SKIPPED" "Launch disabled via --no-model flag"
    return 0
  fi

  print_header "Launching 1B Model"

  # Check if already running
  if check_port_available; then
    print_info "Reusing existing model on port $PORT"
    audit_log "MODEL_LAUNCH" "REUSED" "Port $PORT already in use"
    return 0
  fi

  # Kill any existing processes
  print_info "Cleaning up any existing processes..."
  pkill -f "vllm.*$PORT" || true
  pkill -f "fallback-openai-server.py.*$PORT" || true
  sleep 2

  # Check bootstrap exists
  if [ ! -d "$HOME/.config/llm-doctrine" ]; then
    print_error "Bootstrap directory not found: ~/.config/llm-doctrine"
    print_error "Please run: ~/.config/llm-doctrine/initial-bootstrap.sh"
    audit_log "MODEL_LAUNCH" "FAILED" "Bootstrap directory missing"
    exit 1
  fi

  # Check logs directory exists and is writable
  if [ ! -d "$HOME/.config/llm-doctrine/logs" ]; then
    if ! mkdir -p "$HOME/.config/llm-doctrine/logs" 2>/dev/null; then
      print_error "Failed to create logs directory"
      audit_log "MODEL_LAUNCH" "FAILED" "Cannot create logs directory"
      exit 1
    fi
  fi

  # Check torch-env exists
  if [ ! -d "$HOME/torch-env" ]; then
    print_error "Virtual environment not found: ~/torch-env"
    print_error "Please run: ~/.config/llm-doctrine/initial-bootstrap.sh"
    audit_log "MODEL_LAUNCH" "FAILED" "Virtual environment missing"
    exit 1
  fi

  # Launch model
  print_info "Launching $MODEL_ROLE model on port $PORT..."
  audit_log "MODEL_LAUNCH" "STARTED" "Model: $MODEL_ROLE, Port: $PORT"
  
  cd "$HOME/.config/llm-doctrine" || {
    print_error "Failed to change to bootstrap directory"
    audit_log "MODEL_LAUNCH" "FAILED" "Cannot cd to bootstrap directory"
    exit 1
  }
  
  # Source activation and start with proper error handling
  if ! source "$HOME/torch-env/bin/activate" 2>&1; then
    print_error "Failed to activate virtual environment"
    audit_log "MODEL_LAUNCH" "FAILED" "Virtual environment activation failed"
    exit 1
  fi

  nohup python3 -m vllm.entrypoints.openai.api_server \
    --model Qwen/Qwen2.5-0.5B-Instruct \
    --port $PORT \
    --gpu-memory-utilization 0.7 \
    > logs/fast_${PORT}.log 2>&1 &

  MODEL_PID=$!
  print_info "Model process started (PID: $MODEL_PID)"
  audit_log "MODEL_LAUNCH" "PROCESS_STARTED" "PID: $MODEL_PID"

  # Wait for model to be ready
  print_info "Waiting up to ${TIMEOUT}s for model to become ready..."
  ELAPSED=0
  while [ $ELAPSED -lt $TIMEOUT ]; do
    # Check if process still exists
    if ! kill -0 "$MODEL_PID" 2>/dev/null; then
      print_error "Model process exited prematurely (PID: $MODEL_PID)"
      print_warning "Last 30 lines of log:"
      tail -30 logs/fast_${PORT}.log || true
      audit_log "MODEL_LAUNCH" "FAILED" "Process exited prematurely"
      exit 1
    fi

    if check_port_available; then
      print_success "Model is ready on port $PORT!"
      audit_log "MODEL_LAUNCH" "SUCCESS" "Model ready on port $PORT (PID: $MODEL_PID)"
      return 0
    fi
    sleep 5
    ELAPSED=$((ELAPSED + 5))
    echo -n "."
  done

  print_error "Timeout waiting for model to start after ${TIMEOUT}s"
  print_warning "Model process may still be initializing. Last 30 lines of log:"
  tail -30 logs/fast_${PORT}.log || true
  audit_log "MODEL_LAUNCH" "FAILED" "Timeout after ${TIMEOUT}s"
  exit 1
}

verify_model() {
  print_header "Verifying Model Connection"

  if ! check_port_available; then
    print_error "Model not responding on port $PORT"
    print_error "This could mean:"
    print_error "  - Model failed to start (check logs with: tail logs/fast_${PORT}.log)"
    print_error "  - Model is still loading (wait longer and retry)"
    print_error "  - Port $PORT is already in use by another process"
    exit 1
  fi

  # Test health endpoint
  print_info "Testing health endpoint..."
  HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:$PORT/health 2>&1)
  HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
  HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)
  
  if [ "$HEALTH_CODE" = "200" ]; then
    print_success "Health endpoint OK (HTTP 200)"
  else
    print_error "Health endpoint failed (HTTP $HEALTH_CODE)"
    print_error "Response: $HEALTH_BODY"
    exit 1
  fi

  # Test models endpoint (with authentication)
  print_info "Testing models endpoint with authentication..."
  AUTH_TOKEN="fallback-token-12345"
  MODELS_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    http://localhost:$PORT/v1/models 2>&1)
  MODELS_CODE=$(echo "$MODELS_RESPONSE" | tail -n1)
  MODELS_BODY=$(echo "$MODELS_RESPONSE" | head -n-1)
  
  if [ "$MODELS_CODE" = "200" ]; then
    if echo "$MODELS_BODY" | grep -q "default"; then
      print_success "Models endpoint OK (returned 'default' model)"
    else
      print_error "Models endpoint returned invalid response"
      print_error "Response: $MODELS_BODY"
      exit 1
    fi
  else
    print_error "Models endpoint failed (HTTP $MODELS_CODE)"
    print_error "Response: $MODELS_BODY"
    print_error "Hint: The server may require authentication (Bearer token)"
    exit 1
  fi
}

run_tests() {
  print_header "Running 1B Tier Tests"

  print_info "Starting Playwright tests..."
  print_info "Test file: tests/e2e/cli-chat-1b.spec.ts"
  
  audit_log "TEST_RUN" "STARTED" "CLI chat 1B tier tests started"

  # Run tests with detailed output
  npm run test:1b -- \
    --reporter=list \
    --reporter=html \
    --reporter=json

  TEST_EXIT=$?

  if [ $TEST_EXIT -eq 0 ]; then
    print_success "All tests passed!"
    audit_log "TEST_RUN" "SUCCESS" "All tests passed"
  else
    print_error "Some tests failed (exit code: $TEST_EXIT)"
    audit_log "TEST_RUN" "FAILED" "Tests failed with exit code: $TEST_EXIT"
  fi

  return $TEST_EXIT
}

show_report() {
  print_header "Test Report"

  if [ -d "test-reports/html" ]; then
    print_success "HTML report generated at: test-reports/html/index.html"
    
    # Try to open in browser (Linux/macOS)
    if command -v xdg-open &> /dev/null; then
      print_info "Opening report in browser..."
      xdg-open test-reports/html/index.html
    elif command -v open &> /dev/null; then
      open test-reports/html/index.html
    fi
  fi

  if [ -f "test-reports/results.json" ]; then
    print_info "JSON results at: test-reports/results.json"
  fi
}

cleanup() {
  if [ "$CLEANUP_AFTER" = true ]; then
    print_header "Cleanup"
    print_info "Stopping model on port $PORT..."
    pkill -f "vllm.*$PORT" || true
    pkill -f "fallback-openai-server.py.*$PORT" || true
    sleep 1
    print_success "Model stopped"
    audit_log "CLEANUP" "SUCCESS" "Model processes terminated"
  else
    print_info "Model left running. Stop with: pkill -f 'vllm.*$PORT' || pkill -f 'fallback-openai.*$PORT'"
    audit_log "CLEANUP" "SKIPPED" "Cleanup disabled"
  fi
}

###############################################################################
# Main
###############################################################################

main() {
  print_header "1B Tier Test Runner"
  print_info "Testing vLLM-Doctrine 1B model on port $PORT"
  print_info "Platform: $(uname -s)"
  
  START_TIME=$(date '+%Y-%m-%d %H:%M:%S')
  audit_log "TEST_SESSION" "STARTED" "Platform: $(uname -s), Port: $PORT, Time: $START_TIME"

  check_prerequisites
  install_dependencies

  if [ "$LAUNCH_MODEL" = true ]; then
    launch_model
    verify_model
  else
    print_warning "Skipping model launch and verification"
    print_info "Tests will attempt to connect to existing model on port $PORT"
    audit_log "MODEL_VERIFICATION" "SKIPPED" "Model verification disabled"
  fi

  # Run tests
  run_tests
  TEST_RESULT=$?

  # Show report
  show_report

  # Cleanup if requested
  cleanup

  # Final audit log
  END_TIME=$(date '+%Y-%m-%d %H:%M:%S')
  if [ $TEST_RESULT -eq 0 ]; then
    audit_log "TEST_SESSION" "COMPLETED" "Time: $END_TIME, Status: SUCCESS, Exit Code: 0"
  else
    audit_log "TEST_SESSION" "COMPLETED" "Time: $END_TIME, Status: FAILED, Exit Code: $TEST_RESULT"
  fi

  # Exit with test result
  exit $TEST_RESULT
}

# Run main
main "$@"