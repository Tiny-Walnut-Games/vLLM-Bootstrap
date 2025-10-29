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
    return 0
  fi

  print_header "Launching 1B Model"

  # Check if already running
  if check_port_available; then
    print_info "Reusing existing model on port $PORT"
    return 0
  fi

  # Kill any existing processes
  print_info "Cleaning up any existing processes..."
  pkill -f "vllm.*$PORT" || true
  sleep 2

  # Check bootstrap exists
  if [ ! -d "$HOME/.config/llm-doctrine" ]; then
    print_error "Bootstrap directory not found: ~/.config/llm-doctrine"
    print_error "Run initial-bootstrap.sh first"
    exit 1
  fi

  # Launch model
  print_info "Launching $MODEL_ROLE model on port $PORT..."
  cd "$HOME/.config/llm-doctrine"
  
  source ~/torch-env/bin/activate
  nohup python3 -m vllm.entrypoints.openai.api_server \
    --model Qwen/Qwen2.5-0.5B-Instruct \
    --port $PORT \
    --gpu-memory-utilization 0.7 \
    > logs/fast_${PORT}.log 2>&1 &

  MODEL_PID=$!
  print_info "Model process started (PID: $MODEL_PID)"

  # Wait for model to be ready
  print_info "Waiting up to ${TIMEOUT}s for model to become ready..."
  ELAPSED=0
  while [ $ELAPSED -lt $TIMEOUT ]; do
    if check_port_available; then
      print_success "Model is ready on port $PORT!"
      return 0
    fi
    sleep 5
    ELAPSED=$((ELAPSED + 5))
    echo -n "."
  done

  print_error "Timeout waiting for model to start after ${TIMEOUT}s"
  print_warning "Last 20 lines of log:"
  tail -20 logs/fast_${PORT}.log || true
  exit 1
}

verify_model() {
  print_header "Verifying Model Connection"

  if ! check_port_available; then
    print_error "Model not responding on port $PORT"
    exit 1
  fi

  # Test health endpoint
  print_info "Testing health endpoint..."
  if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
    print_success "Health endpoint OK"
  else
    print_error "Health endpoint failed"
    exit 1
  fi

  # Test models endpoint
  print_info "Testing models endpoint..."
  if curl -s http://localhost:$PORT/v1/models | grep -q "default"; then
    print_success "Models endpoint OK"
  else
    print_error "Models endpoint failed"
    exit 1
  fi
}

run_tests() {
  print_header "Running 1B Tier Tests"

  print_info "Starting Playwright tests..."
  print_info "Test file: tests/e2e/cli-chat-1b.spec.ts"

  # Run tests with detailed output
  npm run test:1b -- \
    --reporter=list \
    --reporter=html \
    --reporter=json

  TEST_EXIT=$?

  if [ $TEST_EXIT -eq 0 ]; then
    print_success "All tests passed!"
  else
    print_error "Some tests failed (exit code: $TEST_EXIT)"
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
    print_success "Model stopped"
  else
    print_info "Model left running. Stop with: pkill -f vllm"
  fi
}

###############################################################################
# Main
###############################################################################

main() {
  print_header "1B Tier Test Runner"
  print_info "Testing vLLM-Doctrine 1B model on port $PORT"
  print_info "Platform: $(uname -s)"

  check_prerequisites
  install_dependencies

  if [ "$LAUNCH_MODEL" = true ]; then
    launch_model
    verify_model
  else
    print_warning "Skipping model launch and verification"
    print_info "Tests will attempt to connect to existing model on port $PORT"
  fi

  # Run tests
  run_tests
  TEST_RESULT=$?

  # Show report
  show_report

  # Cleanup if requested
  cleanup

  # Exit with test result
  exit $TEST_RESULT
}

# Run main
main "$@"