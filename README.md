MIT License

Copyright (c) 2025 Jerimiah Michael Meyer (@jmeyer1980)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
THE SOFTWARE IS PROVIDED "AS IS"...
-------------------------------------------------------------------
**doctrine-version: 2025.10.10**

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
