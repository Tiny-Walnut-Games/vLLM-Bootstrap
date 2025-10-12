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

set -e

echo "📦 Model Preloader — Downloading models for offline use"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
  echo "⚠️  Virtual environment not activated"
  echo "Please run: source ~/torch-env/bin/activate"
  exit 1
fi

# Check HuggingFace authentication
echo "🔐 Checking HuggingFace authentication..."
if ! huggingface-cli whoami &>/dev/null; then
  echo "❌ Not authenticated with HuggingFace"
  echo "Please run: huggingface-cli login"
  exit 1
fi
echo "✅ Authenticated as: $(huggingface-cli whoami | head -n1)"
echo ""

MODELS_CONF="./models.conf"

if [ ! -f "$MODELS_CONF" ]; then
  echo "❌ models.conf not found"
  echo "Please run ./initial-bootstrap.sh first"
  exit 1
fi

# Extract all default models
echo "📋 Reading models from $MODELS_CONF..."
MODELS=$(awk -F"=" '/^default/ {gsub(/ /,"",$2); print $2}' "$MODELS_CONF")

if [ -z "$MODELS" ]; then
  echo "❌ No models found in $MODELS_CONF"
  exit 1
fi

echo "Found models:"
echo "$MODELS" | sed 's/^/  - /'
echo ""

# Download each model
TOTAL=$(echo "$MODELS" | wc -l)
CURRENT=0

for MODEL in $MODELS; do
  CURRENT=$((CURRENT + 1))
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "[$CURRENT/$TOTAL] Downloading: $MODEL"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Use `hf download` instead of the deprecated `huggingface-cli download` to download the models
  # https://github.com/huggingface/cli/issues/463
  if hf download "$MODEL" --quiet 2>&1 | grep -v "^Fetching"; then
    echo "✅ Downloaded: $MODEL"
  else
    echo "⚠️  Download may have failed for: $MODEL"
    echo "   Check your HuggingFace access and model availability"
  fi
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Preload complete!"
echo ""
echo "All default models have been downloaded to HuggingFace cache."
echo "Future launches will be much faster."
echo ""
echo "💡 To launch a model: ./daily-bootstrap.sh {fast|edit|qa|plan}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"