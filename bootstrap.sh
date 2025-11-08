#!/usr/bin/env bash
set -e

DOCTRINE_VERSION="2025.11.07"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🏗️  Bootstrap GUI (v$DOCTRINE_VERSION): Preparing the temple..."
echo ""

LOG_FILE="/tmp/vllm-bootstrap-gui.log"
echo "Installation started at $(date)" > "$LOG_FILE"

_log() {
  echo "$1" | tee -a "$LOG_FILE"
}

_log "📦 [1/8] Installing system dependencies..."
sudo apt update 2>&1 | tail -n 3

# Check and install Node.js
if ! command -v node &>/dev/null; then
  _log "📦 Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - >/dev/null 2>&1
  sudo apt install -y nodejs >/dev/null 2>&1
  _log "✅ Node.js installed"
else
  NODE_VER=$(node -v)
  _log "✅ Node.js already installed: $NODE_VER"
fi

# Install other dependencies
if ! command -v python3 &>/dev/null; then
  sudo apt install -y python3 python3-venv python3-pip git curl tmux \
    netcat-openbsd 2>/dev/null || sudo apt install -y netcat-traditional
fi

_log "✅ System dependencies installed"

_log ""
_log "🐍 [2/8] Creating Python virtual environment..."
if [ ! -d ~/torch-env ]; then
  python3 -m venv ~/torch-env
  _log "✅ Virtual environment created at ~/torch-env"
else
  _log "✅ Virtual environment already exists"
fi
source ~/torch-env/bin/activate

pip install --upgrade pip -q

_log ""
_log "🎯 [3/8] Installing PyTorch..."
if nvidia-smi &>/dev/null; then
  _log "✅ NVIDIA GPU detected, installing CUDA-enabled PyTorch..."
  pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121 -q 2>/dev/null || \
    pip install torch torchvision torchaudio -q
else
  _log "⚠️  No NVIDIA GPU detected. Installing CPU-only PyTorch (performance will be limited)."
  pip install torch torchvision torchaudio -q
fi

_log ""
_log "📚 [4/8] Installing vLLM and dependencies..."
pip install vllm autoawq huggingface-hub -q

mkdir -p "$SCRIPT_DIR/models" "$SCRIPT_DIR/logs"

_log ""
_log "🔐 [5/8] HuggingFace Authentication Setup"
_log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if huggingface-cli whoami &>/dev/null; then
  _log "✅ Already authenticated with HuggingFace"
else
  _log "Some models (Llama, Gemma, etc.) require HuggingFace authentication."
  _log ""
  read -p "Do you want to configure HuggingFace authentication now? (y/n): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -sp "Paste your HuggingFace token (input will be hidden): " HF_TOKEN
    echo ""
    if [ -n "$HF_TOKEN" ]; then
      hf auth login --token "$HF_TOKEN" && _log "✅ HuggingFace authentication successful!" || \
        _log "⚠️  Authentication failed, you can retry later with: huggingface-cli login"
    else
      _log "⚠️  No token provided. You can authenticate later with: huggingface-cli login"
    fi
  else
    _log "⚠️  Skipping HuggingFace authentication. You can configure it later with: huggingface-cli login"
  fi
fi
_log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

write_if_missing_or_outdated() {
  local file=$1
  local content=$2
  if [ ! -f "$file" ] || ! grep -q "doctrine-version: $DOCTRINE_VERSION" "$file" 2>/dev/null; then
    if [ -f "$file" ]; then
      local backup="${file}.bak.$(date +%s)"
      cp "$file" "$backup" 2>/dev/null && _log "💾 Backed up existing $file to $backup"
    fi
    _log "📜 Updating $file"
    printf "%s" "$content" > "$file"
  else
    _log "✅ $file is up to date"
  fi
}

_log ""
_log "📝 [6/8] Creating configuration files..."

DAILY_CONTENT=$(cat <<'DAILY_EOF'
#!/usr/bin/env bash
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

mkdir -p ./logs

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
DAILY_EOF
)
write_if_missing_or_outdated "$SCRIPT_DIR/daily-bootstrap.sh" "$DAILY_CONTENT"
chmod +x "$SCRIPT_DIR/daily-bootstrap.sh"

MODELS_CONTENT=$(cat <<'MODELS_EOF'
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
MODELS_EOF
)
write_if_missing_or_outdated "$SCRIPT_DIR/models.conf" "$MODELS_CONTENT"

PORTS_CONTENT=$(cat <<'PORTS_EOF'
[ranges]
1B = 8100-8299
4B = 8300-8499
7B = 8500-8699
15B = 8700-8899
PORTS_EOF
)
write_if_missing_or_outdated "$SCRIPT_DIR/ports.conf" "$PORTS_CONTENT"

CHAT_TEMPLATES_CONTENT=$(cat <<'TEMPLATES_EOF'
meta-llama/Llama-3.2-1B = llama3
Qwen/Qwen2.5-0.5B-Instruct = chatml
HuggingFaceTB/SmolLM2-1.7B-Instruct = chatml
microsoft/phi-3.5-mini-instruct = phi3
google/gemma-3-4b = gemma
cerebras/Cerebras-GPT-2.7B = gpt2
mistralai/Mistral-7B-Instruct-v0.3 = mistral
teknium/OpenHermes-2.5-Mistral-7B = chatml
MaziyarPanahi/WizardLM-2-7B-GGUF = vicuna
bigcode/starcoder2-15b = starcoder
ServiceNow-AI/Apriel-1.5-15b-Thinker = chatml
mistralai/Codestral-15B = mistral
TEMPLATES_EOF
)
write_if_missing_or_outdated "$SCRIPT_DIR/chat-templates.conf" "$CHAT_TEMPLATES_CONTENT"

TEST_CONNECTION_CONTENT=$(cat <<'TEST_EOF'
#!/usr/bin/env bash
set -e

PORT=${1:-8100}

echo "🔍 Testing vLLM server on port $PORT..."
echo ""

echo "1️⃣ Health Check..."
if curl -s "http://localhost:$PORT/health" > /dev/null 2>&1; then
  echo "   ✅ Server is healthy"
else
  echo "   ❌ Server health check failed"
  echo "   💡 Make sure a model is running on port $PORT"
  exit 1
fi

echo ""
echo "2️⃣ Available Models..."
MODELS=$(curl -s "http://localhost:$PORT/v1/models" | python3 -c "import sys, json; data=json.load(sys.stdin); print('\n'.join(['   - ' + m['id'] for m in data.get('data', [])]))" 2>/dev/null)
if [ -n "$MODELS" ]; then
  echo "$MODELS"
else
  echo "   ⚠️  Could not retrieve model list"
fi

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
TEST_EOF
)
write_if_missing_or_outdated "$SCRIPT_DIR/test-connection.sh" "$TEST_CONNECTION_CONTENT"
chmod +x "$SCRIPT_DIR/test-connection.sh"

README_CONTENT=$(cat <<'README_EOF'
# Local LLM Ritual — Four-Scroll Doctrine

## Foreword
This bootstrap was created in response for my, @jmeyer1980, desire to quickly set up and distribute LLMs internally for use with Rider and other agentic IDE interfaces.

## Prerequisites
In order to run something within WSL, you must first set up WSL on your environment:

1. Open PowerShell as Administrator.  
2. Install Ubuntu (or your preferred distro):  
   wsl --install -d Ubuntu  
3. Restart if prompted, then launch WSL.

## Installation
Run bootstrap.sh or bootstrap.bat

## Usage
1. Change into the doctrine folder:  
   cd ~/.config/llm-doctrine  
2. Run the initial bootstrap once on the intended host system:  
   ./bootstrap.sh (or ./bootstrap.bat on Windows)
3. To summon a model:  
   source ~/torch-env/bin/activate  
   ./daily-bootstrap.sh {fast|edit|qa|plan}

## Roles
- fast → 1B model (autocomplete, boilerplate)
- edit → 4B model (light editing)
- qa   → 7B model (general assistant)
- plan → 15B model (deep planning)

## Config
- models.conf → model pantheon
- ports.conf  → port ranges
- chat-templates.conf → template mapping

## Port Ranges
- 1B → 8100–8299
- 4B → 8300–8499
- 7B → 8500–8699
- 15B → 8700–8899
README_EOF
)
write_if_missing_or_outdated "$SCRIPT_DIR/README.txt" "$README_CONTENT"

_log ""
_log "🎛️  [7/8] Installing Node.js dependencies for GUI..."
cd "$SCRIPT_DIR"

_log "🧹 Cleaning previous installations..."
rm -rf node_modules package-lock.json 2>/dev/null
rm -rf server/node_modules server/package-lock.json 2>/dev/null
rm -rf client/node_modules client/package-lock.json 2>/dev/null

_log "📦 Installing root dependencies..."
npm install --ignore-scripts 2>&1 | tail -n 5

_log "📦 Installing server dependencies..."
cd "$SCRIPT_DIR/server"
npm install --ignore-scripts 2>&1 | tail -n 5
cd "$SCRIPT_DIR"

_log "📦 Installing client dependencies..."
cd "$SCRIPT_DIR/client"
npm install --ignore-scripts 2>&1 | tail -n 5
cd "$SCRIPT_DIR"

_log ""
_log "🚀 [8/8] Starting Admin GUI..."
_log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
_log ""
_log "Admin GUI will launch in your browser."
_log "Use the GUI to complete vLLM setup and model management."
_log ""
_log "Starting servers..."
_log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$SCRIPT_DIR"

tmux new-session -d -s vllm-bootstrap-server -x 120 -y 40 -c "$SCRIPT_DIR/server"
tmux send-keys -t vllm-bootstrap-server "PORT=3001 npm run dev" Enter
sleep 3

tmux new-window -t vllm-bootstrap-server -n client -c "$SCRIPT_DIR/client"
tmux send-keys -t vllm-bootstrap-server:client "npm run dev" Enter
sleep 3

_log ""
_log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
_log "✅ Bootstrap Complete!"
_log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
_log ""
_log "Server running at: http://localhost:3001"
_log "Client running at: http://localhost:5173"
_log ""
_log "Opening admin panel in your browser in 5 seconds..."
sleep 5

if command -v xdg-open &>/dev/null; then
  xdg-open http://localhost:5173
elif command -v open &>/dev/null; then
  open http://localhost:5173
else
  _log "Please open http://localhost:5173 in your browser"
fi

_log ""
_log "Log file: $LOG_FILE"
_log ""
_log "To stop the servers, run:"
_log "  tmux kill-session -t vllm-bootstrap-server:0"
_log ""
_log "To view logs:"
_log "  tmux capture-pane -t vllm-bootstrap-server:0 -p -S -50"
_log ""

# Play a default system sound notification (if possible)
if command -v paplay &>/dev/null; then
  New-BurntToastNotification -Text "vLLM Bootstrap Complete" -Sound Default
elif command -v afplay &>/dev/null; then
  afplay /System/Library/Sounds/Glass.aiff
fi

_log "🎉 Enjoy your local LLM setup!🎉"
