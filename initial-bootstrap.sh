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

DOCTRINE_VERSION="2025.10.08"
echo "🏗️ Initial Bootstrap (v$DOCTRINE_VERSION): preparing the temple..."

# --- System prep ---
sudo apt update && sudo apt install -y python3 python3-venv python3-pip git curl tmux netcat

# --- Virtual environment ---
if [ ! -d ~/torch-env ]; then
  python3 -m venv ~/torch-env
fi
source ~/torch-env/bin/activate
pip install --upgrade pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install vllm autoawq huggingface_hub

# --- Ensure models directory ---
mkdir -p ./models

# --- Artifact writer ---
write_if_missing_or_outdated() {
  local file=$1
  local content=$2
  if [ ! -f "$file" ] || ! grep -q "doctrine-version: $DOCTRINE_VERSION" "$file"; then
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
# doctrine-version: 2025.10.08

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

RANGE=$(awk -F"=" -v tier="$TIER" '
  $1 ~ tier {gsub(/ /,"",$2); print $2; exit}
' "$PORTS_CONF")

if [ -z "$RANGE" ]; then
  echo "❌ No port range found for tier $TIER in $PORTS_CONF"
  exit 1
fi

START=$(echo "$RANGE" | cut -d"-" -f1)
END=$(echo "$RANGE" | cut -d"-" -f2)

# --- Dynamic GPU memory utilization ---
TOTAL_MEM=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>/dev/null | head -n1)

if [ -z "$TOTAL_MEM" ]; then
  case "$TIER" in
    1B) UTIL=0.2 ;;
    4B) UTIL=0.3 ;;
    7B) UTIL=0.5 ;;
    15B) UTIL=0.6 ;;
  esac
else
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
    echo "🚀 Launching $MODEL_ROLE ($MODEL) on port $PORT with GPU util $UTIL"
    exec python3 -m vllm.entrypoints.openai.api_server --model "$MODEL" --port "$PORT" --gpu-memory-utilization "$UTIL"
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
# doctrine-version: 2025.10.08

[1B]
default = meta-llama/Llama-3.2-1B
alt1 = Qwen/Qwen2.5-0.5B-Instruct
alt2 = HuggingFaceTB/SmolLM2-1.7B-Instruct

[4B]
default = microsoft/phi-3.5-mini-3.8b-instruct
alt1 = google/gemma-3-4b
alt2 = cerebras/Cerebras-GPT-2.7B

[7B]
default = mistralai/Mistral-7B-Instruct-v0.3
alt1 = teknium/OpenHermes-2.5-Mistral-7B
alt2 = WizardLM/WizardLM-2-7B

[15B]
default = bigcode/starcoder2-15b
alt1 = deepseek-ai/DeepSeek-Coder-V2
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
# doctrine-version: 2025.10.08

[ranges]
1B = 8100-8299
4B = 8300-8499
7B = 8500-8699
15B = 8700-8899
EOF
)
write_if_missing_or_outdated "./ports.conf" "$PORTS_CONTENT"

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
# doctrine-version: 2025.10.08

# Local LLM Ritual — Four-Scroll Doctrine

## Foreword
This bootstrap was created in response for my, @jmeyer1980, desire to quickly set up and distribute LLMs internally for use with Rider and other agentic IDE interfaces.
It was developed for myself and a friend who recently grabbed a 16GB VRAM card and plans on self-hosting as well. I cannot claim usability of this script for every system.
Feel free to comment with suggested updates. Please stick to those HuggingFace hosted models that can be easily pulled and served using this workflow.
Collaborators should keep the overall mental model in consideration when recommending updates.

## Files
- initial-bootstrap.sh — Run once on a fresh machine. Installs dependencies, sets up venv, caches models, and writes the daily scroll + this README.
- daily-bootstrap.sh — Run every day to summon a model by role.
- models.conf — Created/updated by the bootstrap.
- ports.conf — Created/updated by the bootstrap.
- README.txt — This file.

## Installation
1. Download the gist zip.
2. Open and extract the scripts themselves into a folder within your WSL venv's ~/.config/ directory
   - I use `~/.config/llm-doctrine` which lives in the following UNC path: `\\wsl.localhost\Ubuntu\home\jerio\.config\llm-doctrine` on my machine.

## Usage
1. Open your WSL terminal.
   - Note that the bootstrap will create the Pytorch sub-environment for you.
3. Run ./initial-bootstrap.sh once on the intended host system.
4. After that, use ./daily-bootstrap.sh {fast|edit|qa|plan} to awaken a model.

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

echo "🎉 Ritual complete. All scrolls verified or created."
