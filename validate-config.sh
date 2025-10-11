#!/usr/bin/env bash
# -------------------------------------------------------------------
# MIT License
#
# Copyright (c) 2025 Jerimiah Michael Meyer (@jmeyer1980)
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
# -------------------------------------------------------------------
# doctrine-version: 2025.10.10

echo "🔍 Configuration Validator — Checking system readiness"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ERRORS=0
WARNINGS=0

# Check 1: Configuration files exist
echo "1️⃣ Checking configuration files..."
for FILE in models.conf ports.conf chat-templates.conf; do
  if [ -f "./$FILE" ]; then
    echo "   ✅ $FILE exists"
  else
    echo "   ❌ $FILE missing"
    ERRORS=$((ERRORS + 1))
  fi
done
echo ""

# Check 2: Virtual environment
echo "2️⃣ Checking Python virtual environment..."
if [ -d ~/torch-env ]; then
  echo "   ✅ Virtual environment exists at ~/torch-env"
  
  if [ -f ~/torch-env/bin/activate ]; then
    echo "   ✅ Activation script found"
  else
    echo "   ❌ Activation script missing"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "   ❌ Virtual environment not found at ~/torch-env"
  echo "   💡 Run: ./initial-bootstrap.sh"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 3: Python packages (if venv is activated)
echo "3️⃣ Checking Python packages..."
if [ -n "$VIRTUAL_ENV" ]; then
  for PKG in vllm torch huggingface_hub; do
    if python3 -c "import $PKG" 2>/dev/null; then
      echo "   ✅ $PKG installed"
    else
      echo "   ❌ $PKG not installed"
      ERRORS=$((ERRORS + 1))
    fi
  done
else
  echo "   ⚠️  Virtual environment not activated"
  echo "   💡 Run: source ~/torch-env/bin/activate"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 4: HuggingFace authentication
echo "4️⃣ Checking HuggingFace authentication..."
if command -v huggingface-cli &>/dev/null; then
  if huggingface-cli whoami &>/dev/null; then
    USERNAME=$(huggingface-cli whoami 2>/dev/null | head -n1)
    echo "   ✅ Authenticated as: $USERNAME"
  else
    echo "   ⚠️  Not authenticated with HuggingFace"
    echo "   💡 Some models require authentication"
    echo "   💡 Run: huggingface-cli login"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo "   ❌ huggingface-cli not found"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 5: GPU availability
echo "5️⃣ Checking GPU availability..."
if command -v nvidia-smi &>/dev/null; then
  if nvidia-smi &>/dev/null; then
    GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | head -n1)
    GPU_MEM=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>/dev/null | head -n1)
    echo "   ✅ GPU detected: $GPU_NAME"
    echo "   ✅ VRAM: ${GPU_MEM}MB"
    
    if [ "$GPU_MEM" -lt 6144 ]; then
      echo "   ⚠️  Low VRAM detected (< 6GB)"
      echo "   💡 Recommended: Use 'fast' or 'edit' tiers only"
      WARNINGS=$((WARNINGS + 1))
    fi
  else
    echo "   ❌ nvidia-smi failed to run"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "   ⚠️  nvidia-smi not found"
  echo "   💡 CPU-only mode will be used (very slow)"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 6: models.conf syntax
echo "6️⃣ Validating models.conf..."
if [ -f "./models.conf" ]; then
  TIERS=("1B" "4B" "7B" "15B")
  for TIER in "${TIERS[@]}"; do
    if grep -q "^\[$TIER\]" ./models.conf; then
      DEFAULT=$(awk -F"=" -v tier="[$TIER]" '$0==tier {found=1} found && $1 ~ /default/ {gsub(/ /,"",$2); print $2; exit}' ./models.conf)
      if [ -n "$DEFAULT" ]; then
        echo "   ✅ [$TIER] tier has default model: $DEFAULT"
      else
        echo "   ❌ [$TIER] tier missing default model"
        ERRORS=$((ERRORS + 1))
      fi
    else
      echo "   ❌ [$TIER] tier section missing"
      ERRORS=$((ERRORS + 1))
    fi
  done
else
  echo "   ❌ models.conf not found"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 7: ports.conf syntax
echo "7️⃣ Validating ports.conf..."
if [ -f "./ports.conf" ]; then
  TIERS=("1B" "4B" "7B" "15B")
  for TIER in "${TIERS[@]}"; do
    RANGE=$(awk -F"=" -v tier="$TIER" '$1 ~ tier {gsub(/ /,"",$2); print $2; exit}' ./ports.conf)
    if [ -n "$RANGE" ]; then
      START=$(echo "$RANGE" | cut -d"-" -f1)
      END=$(echo "$RANGE" | cut -d"-" -f2)
      if [ "$START" -lt "$END" ] && [ "$START" -gt 1024 ] && [ "$END" -lt 65536 ]; then
        echo "   ✅ $TIER port range: $RANGE"
      else
        echo "   ❌ $TIER port range invalid: $RANGE"
        ERRORS=$((ERRORS + 1))
      fi
    else
      echo "   ❌ $TIER port range missing"
      ERRORS=$((ERRORS + 1))
    fi
  done
else
  echo "   ❌ ports.conf not found"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 8: System dependencies
echo "8️⃣ Checking system dependencies..."
for CMD in python3 curl tmux; do
  if command -v $CMD &>/dev/null; then
    echo "   ✅ $CMD installed"
  else
    echo "   ❌ $CMD not installed"
    ERRORS=$((ERRORS + 1))
  fi
done

# Check for netcat (either variant)
if command -v nc &>/dev/null; then
  echo "   ✅ netcat installed"
else
  echo "   ❌ netcat not installed"
  echo "   💡 Run: sudo apt install netcat-openbsd"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 9: Directories
echo "9️⃣ Checking directories..."
for DIR in ./models ./logs; do
  if [ -d "$DIR" ]; then
    echo "   ✅ $DIR exists"
  else
    echo "   ⚠️  $DIR missing (will be created on first launch)"
    WARNINGS=$((WARNINGS + 1))
  fi
done
echo ""

# Check 10: Scripts executable
echo "🔟 Checking script permissions..."
for SCRIPT in daily-bootstrap.sh test-connection.sh; do
  if [ -f "./$SCRIPT" ]; then
    if [ -x "./$SCRIPT" ]; then
      echo "   ✅ $SCRIPT is executable"
    else
      echo "   ⚠️  $SCRIPT not executable"
      echo "   💡 Run: chmod +x ./$SCRIPT"
      WARNINGS=$((WARNINGS + 1))
    fi
  else
    echo "   ❌ $SCRIPT not found"
    ERRORS=$((ERRORS + 1))
  fi
done
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Validation Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "🎉 All checks passed! System is ready."
  echo ""
  echo "Next steps:"
  echo "  1. source ~/torch-env/bin/activate"
  echo "  2. ./daily-bootstrap.sh {fast|edit|qa|plan}"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo "⚠️  $WARNINGS warning(s) found, but system should work."
  echo ""
  echo "Review warnings above and address if needed."
  exit 0
else
  echo "❌ $ERRORS error(s) and $WARNINGS warning(s) found."
  echo ""
  echo "Please fix errors before launching models."
  echo "Review the output above for specific issues."
  exit 1
fi