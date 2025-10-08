#!/usr/bin/env bash
set -e

echo "🏗️ Initial Bootstrap: preparing the temple..."

# --- System prep ---
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-venv python3-pip build-essential git curl netcat tmux

# --- Virtual environment ---
python3 -m venv ~/torch-env
source ~/torch-env/bin/activate
pip install --upgrade pip

# --- Core libraries ---
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install vllm autoawq huggingface_hub

# --- Pre-cache pantheon models (optional but recommended) ---
huggingface-cli download meta-llama/Llama-3.2-1B --local-dir ./models/llama-1b
huggingface-cli download microsoft/phi-3.5-mini-3.8b-instruct --local-dir ./models/phi-3.5
huggingface-cli download mistralai/Mistral-7B-Instruct-v0.3 --local-dir ./models/mistral-7b
huggingface-cli download bigcode/starcoder2-15b --local-dir ./models/starcoder2-15b

# --- Write daily-bootstrap.sh ---
cat > ./daily-bootstrap.sh <<'DAILY'
#!/usr/bin/env bash
set -e
source ~/torch-env/bin/activate

# --- Pantheon (comment-swap as desired) ---
MODEL_1B="meta-llama/Llama-3.2-1B"
# MODEL_1B="Qwen/Qwen2.5-0.5B-Instruct"
# MODEL_1B="HuggingFaceTB/SmolLM2-1.7B-Instruct"

MODEL_4B="microsoft/phi-3.5-mini-3.8b-instruct"
# MODEL_4B="google/gemma-3-4b"
# MODEL_4B="cerebras/Cerebras-GPT-2.7B"

MODEL_7B="mistralai/Mistral-7B-Instruct-v0.3"
# MODEL_7B="teknium/OpenHermes-2.5-Mistral-7B"
# MODEL_7B="WizardLM/WizardLM-2-7B"

MODEL_15B="bigcode/starcoder2-15b"
# MODEL_15B="deepseek-ai/DeepSeek-Coder-V2"
# MODEL_15B="mistralai/Codestral-15B"

# --- Port ranges ---
RANGE_1B_START=8100
RANGE_4B_START=8300
RANGE_7B_START=8500
RANGE_15B_START=8700
RANGE_SIZE=200

# Helper: find next free port
next_free_port() {
  local start=$1
  local end=$((start + RANGE_SIZE - 1))
  for port in $(seq $start $end); do
    if ! nc -z localhost $port 2>/dev/null; then
      echo $port
      return
    fi
  done
  echo "No free port in range $start-$end" >&2
  exit 1
}

# Dispatcher
case "$1" in
  fast|1b)
    PORT=$(next_free_port $RANGE_1B_START)
    echo "⚡ Summoning 1B model on port $PORT"
    vllm serve $MODEL_1B --port $PORT --host 0.0.0.0 --gpu-memory-utilization 0.2
    ;;
  edit|4b)
    PORT=$(next_free_port $RANGE_4B_START)
    echo "📝 Summoning 4B model on port $PORT"
    vllm serve $MODEL_4B --port $PORT --host 0.0.0.0 --gpu-memory-utilization 0.3
    ;;
  qa|7b)
    PORT=$(next_free_port $RANGE_7B_START)
    echo "❓ Summoning 7B model on port $PORT"
    vllm serve $MODEL_7B --port $PORT --host 0.0.0.0 --gpu-memory-utilization 0.5
    ;;
  plan|15b)
    PORT=$(next_free_port $RANGE_15B_START)
    echo "📐 Summoning 15B model on port $PORT"
    vllm serve $MODEL_15B --port $PORT --host 0.0.0.0 --gpu-memory-utilization 0.6
    ;;
  *)
    echo "Usage: $0 {fast|edit|qa|plan}"
    exit 1
    ;;
esac
DAILY

chmod +x ./daily-bootstrap.sh

# --- Write README.txt ---
cat > ./README.txt <<'README'
# Local LLM Ritual — Three-Scroll Doctrine

## Foreword

This bootstrap was created in response for my, @jmeyer1980's, desire to quickly set up and distribute LLMs internally for use with Rider and other agentic IDE interfaces.
It was developed for myself and a friend who recently grabbed a 16gig VRAM card and plans on self-hosting as well. I cannot claim usability of this script for every system.
Feel free to comment with suggested updates. Please stick to those HuggingFace hosted models that can be easily pulled and served using this workflow.
Collaborators should keep the overall mental model in consideration when recommending updates.

## Files

- `initial-bootstrap.sh` — Run once on a fresh machine. Installs dependencies, sets up venv, caches models, and writes the daily scroll + this README.
- `daily-bootstrap.sh` — Run every day to summon a model by role.
- `README.txt` — This file. Instructions and reference.

## Usage

1. Run `./initial-bootstrap.sh` once on a new system.
2. After that, use `./daily-bootstrap.sh {fast|edit|qa|plan}` to awaken a model:
   - `fast` → 1B model (autocomplete, boilerplate)
   - `edit` → 4B model (light editing)
   - `qa`   → 7B model (general assistant)
   - `plan` → 15B model (deep planning)

## Comment-Swap

Each tier has 2–3 models defined. To switch, open `daily-bootstrap.sh` and comment/uncomment the one you want.

## Solo vs Indi-Team

- Default: Solo-dev mode (safe for 8GB VRAM).
- Indi-team mode: On 16GB+, you can modify `daily-bootstrap.sh` to spawn multiple tmux sessions per tier across port ranges.

## Port Ranges

- 1B → 8100–8299
- 4B → 8300–8499
- 7B → 8500–8699
- 15B → 8700–8899

Each invocation picks the next free port in its tier’s range.

README

echo "✅ Ritual complete. You now have:"
echo "  - initial-bootstrap.sh"
echo "  - daily-bootstrap.sh"
echo "  - README.txt"
echo "Run ./daily-bootstrap.sh {fast|edit|qa|plan} to begin."
