MIT License

Copyright (c) 2025 Jerimiah Michael Meyer (@jmeyer1980)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
THE SOFTWARE IS PROVIDED "AS IS"...
-------------------------------------------------------------------
**doctrine-version: 2025.10.08**

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
