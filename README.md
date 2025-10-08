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
