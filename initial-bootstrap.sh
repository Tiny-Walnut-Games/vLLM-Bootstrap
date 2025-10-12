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

set -e

DOCTRINE_VERSION="2025.10.12"
echo "🏗️ Initial Bootstrap (v$DOCTRINE_VERSION): preparing the temple..."

# --- System prep ---
echo "📦 Installing system dependencies..."
sudo apt update
sudo apt install -y python3 python3-venv python3-pip git curl tmux \
  netcat-openbsd || sudo apt install -y netcat-traditional

# --- Virtual environment ---
if [ ! -d ~/torch-env ]; then
  echo "🐍 Creating Python virtual environment..."
  python3 -m venv ~/torch-env
fi
source ~/torch-env/bin/activate
pip install --upgrade pip

# --- Check for NVIDIA GPU ---
if nvidia-smi &>/dev/null; then
  echo "✅ NVIDIA GPU detected, installing CUDA-enabled PyTorch..."
  pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121 || \
    pip install torch torchvision torchaudio
else
  echo "⚠️  No NVIDIA GPU detected. Installing CPU-only PyTorch (performance will be limited)."
  pip install torch torchvision torchaudio
fi

echo "📚 Installing vLLM and dependencies..."
pip install vllm autoawq huggingface_hub

# --- Ensure models and logs directories ---
mkdir -p ./models ./logs

# --- HuggingFace Authentication ---
echo ""
echo "🔐 HuggingFace Authentication Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Some models (Llama, Gemma, etc.) require HuggingFace authentication."
echo ""
echo "To get your token:"
echo "  1. Visit: https://huggingface.co/settings/tokens"
echo "  2. Create a new token (read access is sufficient)"
echo "  3. Copy the token"
echo ""
read -p "Do you want to configure HuggingFace authentication now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Paste your HuggingFace token (input will be hidden):"
  read -s HF_TOKEN
  if [ -n "$HF_TOKEN" ]; then
    hf auth login --token "$HF_TOKEN" && echo "✅ HuggingFace authentication successful!" || echo "⚠️  Authentication failed, you can retry later with: huggingface-cli login"
  else
    echo "⚠️  No token provided. You can authenticate later with: huggingface-cli login"
  fi
else
  echo "⚠️  Skipping HuggingFace authentication. You can configure it later with: huggingface-cli login"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# --- Artifact writer ---
write_if_missing_or_outdated() {
  local file=$1
  local content=$2
  if [ ! -f "$file" ] || ! grep -q "doctrine-version: $DOCTRINE_VERSION" "$file"; then
    # Backup existing file before overwriting
    if [ -f "$file" ]; then
      local backup="${file}.bak.$(date +%s)"
      cp "$file" "$backup" 2>/dev/null && echo "💾 Backed up existing $file to $backup"
    fi
    echo "📜 Updating $file"
    printf "%s" "$content" > "$file"
  else
    echo "✅ $file is up to date"
  fi
}

# --- daily-bootstrap.sh ---
DAILY_CONTENT=$(cat <<'EOF'
#!/usr/bin/env bash
# -------------------------------------------------------------------
# MIT License
#
# Copyright (c) 2025 Jeremiah Michael Cole Meyer (@jmeyer1980)
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction...
# THE SOFTWARE IS PROVIDED "AS IS"...
# -------------------------------------------------------------------
# doctrine-version: 2025.10.12

set -e
source ~/torch-env/bin/activate

MODEL_ROLE=$1
MODELS_CONF="./models.conf"
PORTS_CONF="./ports.conf"

if [ -z "$MODEL_ROLE" ]; then
  echo "Usage: ./daily-bootstrap.sh {fast|edit|qa|plan}"
  exit 1
fi

case "$MODEL_ROLE" in
  fast)  TIER="1B" ;;
  edit)  TIER="4B" ;;
  qa)    TIER="7B" ;;
  plan)  TIER="15B" ;;
  *) echo "Unknown role: $MODEL_ROLE"; exit 1 ;;
esac

MODEL=$(awk -F"=" -v tier="[$TIER]" '
  $0==tier {found=1}
  found && $1 ~ /default/ {gsub(/ /,"",$2); print $2; exit}
' "$MODELS_CONF")

if [ -z "$MODEL" ]; then
  echo "❌ No model found for tier $TIER in $MODELS_CONF"
  exit 1
fi

# --- Determine chat template ---
CHAT_TEMPLATE=""
TEMPLATES_CONF="./chat-templates.conf"
if [ -f "$TEMPLATES_CONF" ]; then
  TEMPLATE_TYPE=$(awk -F"=" -v model="$MODEL" '
    $1 ~ model {gsub(/ /,"",$2); print $2; exit}
  ' "$TEMPLATES_CONF")
  
  if [ -n "$TEMPLATE_TYPE" ]; then
    echo "📋 Using chat template: $TEMPLATE_TYPE"
    CHAT_TEMPLATE="--chat-template $TEMPLATE_TYPE"
  fi
fi

RANGE=$(awk -F"=" -v tier="$TIER" '
  $1 ~ tier {gsub(/ /,"",$2); print $2; exit}
' "$PORTS_CONF")

if [ -z "$RANGE" ]; then
  echo "❌ No port range found for tier $TIER in $PORTS_CONF"
  exit 1
fi

START=$(echo "$RANGE" | cut -d"-" -f1)
END=$(echo "$RANGE" | cut -d"-" -f2)

# --- Ensure logs directory ---
mkdir -p ./logs

# --- Dynamic GPU memory utilization ---
TOTAL_MEM=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>/dev/null | head -n1)

if [ -z "$TOTAL_MEM" ]; then
  echo "⚠️  No NVIDIA GPU detected. Using CPU fallback (performance will be limited)."
  case "$TIER" in
    1B) UTIL=0.2 ;;
    4B) UTIL=0.3 ;;
    7B) UTIL=0.5 ;;
    15B) UTIL=0.6 ;;
  esac
else
  echo "✅ GPU detected: ${TOTAL_MEM}MB VRAM"
  if [ "$TOTAL_MEM" -le 8192 ]; then
    case "$TIER" in
      1B) UTIL=0.25 ;;
      4B) UTIL=0.35 ;;
      7B) UTIL=0.55 ;;
      15B) UTIL=0.65 ;;
    esac
  else
    case "$TIER" in
      1B) UTIL=0.15 ;;
      4B) UTIL=0.25 ;;
      7B) UTIL=0.45 ;;
      15B) UTIL=0.55 ;;
    esac
  fi
fi

for PORT in $(seq "$START" "$END"); do
  if ! nc -z localhost "$PORT" 2>/dev/null; then
    LOG_FILE="./logs/${MODEL_ROLE}_${PORT}.log"
    echo "🚀 Launching $MODEL_ROLE ($MODEL) on port $PORT with GPU util $UTIL"
    echo "📝 Logs: $LOG_FILE"
    echo ""
    echo "💡 After launch, test with: ./test-connection.sh $PORT"
    echo ""
    exec python3 -m vllm.entrypoints.openai.api_server \
      --model "$MODEL" \
      --port "$PORT" \
      --gpu-memory-utilization "$UTIL" \
      $CHAT_TEMPLATE \
      > "$LOG_FILE" 2>&1
  fi
done

echo "❌ No free ports in range $RANGE"
exit 1
EOF
)
write_if_missing_or_outdated "./daily-bootstrap.sh" "$DAILY_CONTENT"
chmod +x ./daily-bootstrap.sh

# --- models.conf ---
MODELS_CONTENT=$(cat <<'EOF'
# -------------------------------------------------------------------
# MIT License
#
# Copyright (c) 2025 Jeremiah Michael Cole Meyer (@jmeyer1980)
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction...
# THE SOFTWARE IS PROVIDED "AS IS"...
# -------------------------------------------------------------------
# doctrine-version: 2025.10.12
# Remarks: Some models require preauthorization or acceptance of terms of service.
# Access may remain gated until such conditions are met.
# Please ensure compliance with the respective licenses and usage policies.

[1B]
default = meta-llama/Llama-3.2-1B
alt1 = Qwen/Qwen2.5-0.5B-Instruct
alt2 = HuggingFaceTB/SmolLM2-1.7B-Instruct

[4B]
default = microsoft/phi-3.5-mini-instruct
alt1 = google/gemma-3-4b
alt2 = cerebras/Cerebras-GPT-2.7B

[7B]
default = mistralai/Mistral-7B-Instruct-v0.3
alt1 = teknium/OpenHermes-2.5-Mistral-7B
alt2 = MaziyarPanahi/WizardLM-2-7B-GGUF

[15B]
default = bigcode/starcoder2-15b
alt1 = ServiceNow-AI/Apriel-1.5-15b-Thinker
alt2 = mistralai/Codestral-15B
EOF
)
write_if_missing_or_outdated "./models.conf" "$MODELS_CONTENT"

# --- ports.conf ---
PORTS_CONTENT=$(cat <<'EOF'
# -------------------------------------------------------------------
# MIT License
#
# Copyright (c) 2025 Jeremiah Michael Cole Meyer (@jmeyer1980)
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction...
# THE SOFTWARE IS PROVIDED "AS IS"...
# -------------------------------------------------------------------
# doctrine-version: 2025.10.12

[ranges]
1B = 8100-8299
4B = 8300-8499
7B = 8500-8699
15B = 8700-8899
EOF
)
write_if_missing_or_outdated "./ports.conf" "$PORTS_CONTENT"

# --- chat-templates.conf ---
CHAT_TEMPLATES_CONTENT=$(cat <<'EOF'
# -------------------------------------------------------------------
# MIT License
#
# Copyright (c) 2025 Jeremiah Michael Cole Meyer (@jmeyer1980)
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction...
# THE SOFTWARE IS PROVIDED "AS IS"...
# -------------------------------------------------------------------
# doctrine-version: 2025.10.12

# Chat Template Configuration
# Maps model identifiers to their appropriate chat templates

# 1B Tier
meta-llama/Llama-3.2-1B = llama3
Qwen/Qwen2.5-0.5B-Instruct = chatml
HuggingFaceTB/SmolLM2-1.7B-Instruct = chatml

# 4B Tier
microsoft/phi-3.5-mini-instruct = phi3
google/gemma-3-4b = gemma
cerebras/Cerebras-GPT-2.7B = gpt2

# 7B Tier
mistralai/Mistral-7B-Instruct-v0.3 = mistral
teknium/OpenHermes-2.5-Mistral-7B = chatml
MaziyarPanahi/WizardLM-2-7B-GGUF = vicuna

# 15B Tier
bigcode/starcoder2-15b = starcoder
ServiceNow-AI/Apriel-1.5-15b-Thinker = chatml
mistralai/Codestral-15B = mistral
EOF
)
write_if_missing_or_outdated "./chat-templates.conf" "$CHAT_TEMPLATES_CONTENT"

# --- test-connection.sh ---
TEST_CONNECTION_CONTENT=$(cat <<'EOF'
#!/usr/bin/env bash
# -------------------------------------------------------------------
# MIT License
#
# Copyright (c) 2025 Jeremiah Michael Cole Meyer (@jmeyer1980)
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction...
# THE SOFTWARE IS PROVIDED "AS IS"...
# -------------------------------------------------------------------
# doctrine-version: 2025.10.10

set -e

PORT=${1:-8100}

echo "🔍 Testing vLLM server on port $PORT..."
echo ""

# Test 1: Health check
echo "1️⃣ Health Check..."
if curl -s "http://localhost:$PORT/health" > /dev/null 2>&1; then
  echo "   ✅ Server is healthy"
else
  echo "   ❌ Server health check failed"
  echo "   💡 Make sure a model is running on port $PORT"
  exit 1
fi

# Test 2: Models endpoint
echo ""
echo "2️⃣ Available Models..."
MODELS=$(curl -s "http://localhost:$PORT/v1/models" | python3 -c "import sys, json; data=json.load(sys.stdin); print('\n'.join(['   - ' + m['id'] for m in data.get('data', [])]))" 2>/dev/null)
if [ -n "$MODELS" ]; then
  echo "$MODELS"
else
  echo "   ⚠️  Could not retrieve model list"
fi

# Test 3: Chat completion
echo ""
echo "3️⃣ Chat Completion Test..."
RESPONSE=$(curl -s "http://localhost:$PORT/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "default",
    "messages": [
      {"role": "user", "content": "Say hello in exactly 3 words."}
    ],
    "max_tokens": 20,
    "temperature": 0.7
  }' 2>/dev/null)

if echo "$RESPONSE" | grep -q "choices"; then
  MESSAGE=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['choices'][0]['message']['content'])" 2>/dev/null)
  echo "   ✅ Chat completion successful"
  echo "   📝 Response: $MESSAGE"
else
  echo "   ❌ Chat completion failed"
  echo "   📋 Raw response: $RESPONSE"
  exit 1
fi

echo ""
echo "🎉 All tests passed! Server is ready for Rider integration."
echo ""
echo "📌 Connection details for Rider:"
echo "   URL: http://localhost:$PORT/v1"
echo "   Format: OpenAI Compatible"
EOF
)
write_if_missing_or_outdated "./test-connection.sh" "$TEST_CONNECTION_CONTENT"
chmod +x ./test-connection.sh

# --- README.txt ---
README_CONTENT=$(cat <<'EOF'
# -------------------------------------------------------------------
# MIT License
#
# Copyright (c) 2025 Jeremiah Michael Cole Meyer (@jmeyer1980)
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction...
# THE SOFTWARE IS PROVIDED "AS IS"...
# -------------------------------------------------------------------
# doctrine-version: 2025.10.10

# Local LLM Ritual — Four-Scroll Doctrine

## Foreword
This bootstrap was created in response for my, @jmeyer1980, desire to quickly set up and distribute LLMs internally for use with Rider and other agentic IDE interfaces.
It was developed for myself and a friend who recently grabbed a 16GB VRAM card and plans on self-hosting as well. I cannot claim usability of this script for every system.
Feel free to comment with suggested updates. Please stick to those HuggingFace hosted models that can be easily pulled and served using this workflow.
Collaborators should keep the overall mental model in consideration when recommending updates.

## Prerequisites
In order to run something within WSL, you must first set up WSL on your environment:

1. Open PowerShell as Administrator.  
2. Install Ubuntu (or your preferred distro):  
   wsl --install -d Ubuntu  
   - If WSL is already installed:  
     wsl --update  
3. Restart if prompted, then launch WSL via any of these:
   - Start menu: Press Windows key, type “Ubuntu,” press Enter.
   - Windows Terminal: Open Terminal, select “Ubuntu” from the dropdown.
   - Run box: Win+R → wsl → Enter.
4. On first launch, create your Linux username and password.  
   - Important: The password field shows no feedback (no dots/asterisks).  
     Type carefully and press Enter.

## Installation
1. Download the gist zip.  
2. Extract the scripts into a folder within your WSL user’s ~/.config/ directory.  
   - Example: ~/.config/llm-doctrine  
   - Windows UNC path: \\wsl.localhost\Ubuntu\home\jerio\.config\llm-doctrine

## Usage
1. Open your WSL terminal (Start → type “Ubuntu”).  
2. Change into the doctrine folder:  
   cd ~/.config/llm-doctrine  
3. Run the initial bootstrap once on the intended host system:  
   ./initial-bootstrap.sh  
   - This will create the Pytorch sub‑environment for you (default: ~/torch-env).  
4. To summon a model, first activate the venv:  
   source ~/torch-env/bin/activate  
   *(or ~/.config/llm-doctrine/envs/torch-env/bin/activate if you relocate it)*  
5. Then run the daily scroll with your chosen role:  
   ./daily-bootstrap.sh {fast|edit|qa|plan}

## Roles
- fast → 1B model (autocomplete, boilerplate)
- edit → 4B model (light editing)
- qa   → 7B model (general assistant)
- plan → 15B model (deep planning)

## Config
- models.conf → model pantheon
- ports.conf  → port ranges

## Comment-Swap
Each tier has 2–3 models defined. To switch, edit models.conf.

## Solo vs Indi-Team
- Default: Solo-dev mode (safe for 8GB VRAM).
- Indi-team mode: On 16GB+, you can modify daily-bootstrap.sh to spawn multiple tmux sessions per tier across port ranges.

## Port Ranges
- 1B → 8100–8299
- 4B → 8300–8499
- 7B → 8500–8699
- 15B → 8700–8899

Each invocation picks the next free port in its tier’s range.
EOF
)
write_if_missing_or_outdated "./README.txt" "$README_CONTENT"

# --- preload-models.sh ---
PRELOAD_CONTENT=$(cat <<'EOF'
#!/usr/bin/env bash
# -------------------------------------------------------------------
# MIT License
#
# Copyright (c) 2025 Jeremiah Michael Cole Meyer (@jmeyer1980)
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction...
# THE SOFTWARE IS PROVIDED "AS IS"...
# -------------------------------------------------------------------
# doctrine-version: 2025.10.10

set -e

echo "📦 Model Preloader — Downloading models for offline use"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -z "$VIRTUAL_ENV" ]; then
  echo "⚠️  Virtual environment not activated"
  echo "Please run: source ~/torch-env/bin/activate"
  exit 1
fi

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

echo "📋 Reading models from $MODELS_CONF..."
MODELS=$(awk -F"=" '/^default/ {gsub(/ /,"",$2); print $2}' "$MODELS_CONF")

if [ -z "$MODELS" ]; then
  echo "❌ No models found in $MODELS_CONF"
  exit 1
fi

echo "Found models:"
echo "$MODELS" | sed 's/^/  - /'
echo ""

TOTAL=$(echo "$MODELS" | wc -l)
CURRENT=0

for MODEL in $MODELS; do
  CURRENT=$((CURRENT + 1))
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "[$CURRENT/$TOTAL] Downloading: $MODEL"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
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
EOF
)
write_if_missing_or_outdated "./preload-models.sh" "$PRELOAD_CONTENT"
chmod +x ./preload-models.sh

# --- validate-config.sh ---
VALIDATE_CONTENT=$(cat <<'EOF'
#!/usr/bin/env bash
# -------------------------------------------------------------------
# MIT License
#
# Copyright (c) 2025 Jeremiah Michael Cole Meyer (@jmeyer1980)
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction...
# THE SOFTWARE IS PROVIDED "AS IS"...
# -------------------------------------------------------------------
# doctrine-version: 2025.10.10

echo "🔍 Configuration Validator — Checking system readiness"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ERRORS=0
WARNINGS=0

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

echo "8️⃣ Checking system dependencies..."
for CMD in python3 curl tmux; do
  if command -v $CMD &>/dev/null; then
    echo "   ✅ $CMD installed"
  else
    echo "   ❌ $CMD not installed"
    ERRORS=$((ERRORS + 1))
  fi
done

if command -v nc &>/dev/null; then
  echo "   ✅ netcat installed"
else
  echo "   ❌ netcat not installed"
  echo "   💡 Run: sudo apt install netcat-openbsd"
  ERRORS=$((ERRORS + 1))
fi
echo ""

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
EOF
)
write_if_missing_or_outdated "./validate-config.sh" "$VALIDATE_CONTENT"
chmod +x ./validate-config.sh

echo ""
echo "🎉 Ritual complete. All scrolls verified or created."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣ Validate your configuration:"
echo "   ./validate-config.sh"
echo ""
echo "2️⃣ (Optional) Preload all models for offline use:"
echo "   source ~/torch-env/bin/activate"
echo "   ./preload-models.sh"
echo ""
echo "3️⃣ Launch your first model:"
echo "   source ~/torch-env/bin/activate"
echo "   ./daily-bootstrap.sh qa"
echo ""
echo "4️⃣ Test the connection (in a new terminal):"
echo "   cd ~/.config/llm-doctrine"
echo "   source ~/torch-env/bin/activate"
echo "   ./test-connection.sh 8500"
echo ""
echo "5️⃣ Configure Rider AI Assistant:"
echo "   - Open Rider → Settings → Tools → AI Assistant → Models"
echo "   - Add provider: OpenAI Compatible"
echo "   - URL: http://localhost:8500/v1"
echo "   - Test connection and start chatting!"
echo ""
echo "📖 For complete guide, see: COMPLETE-GUIDE.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
