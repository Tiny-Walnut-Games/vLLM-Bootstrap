# Bootstrap Implementation Guide

## Overview

**Two complementary bootstrap systems have been implemented:**

### 1. **`bootstrap.bat`** (Windows Entry Point)

- Runs on Windows Command Prompt
- **Checks Windows prerequisites:**
  - Node.js installation (installs via winget if needed)
  - WSL installation (installs if needed)
- **Launches WSL** and executes `bootstrap.sh` inside the Linux environment
- All Python, PyTorch, vLLM, and Node.js servers run **within WSL**, not Windows

### 2. **`bootstrap.sh`** (Complete Setup in WSL)

- Runs entirely within WSL/Linux environment
- **Performs all tasks from `initial-bootstrap.sh`:**
  - System package installation
  - Python virtual environment creation
  - PyTorch installation (GPU-aware)
  - vLLM and dependencies installation
  - HuggingFace authentication (interactive prompt)
  - Creates all configuration files:
    - `daily-bootstrap.sh` — Model launcher script
    - `models.conf` — Model definitions for 4 tiers
    - `ports.conf` — Port range mapping
    - `chat-templates.conf` — Model to template mapping
    - `test-connection.sh` — API verification script
    - `README.txt` — Documentation

- **Additionally handles GUI startup:**
  - Installs Node.js dependencies (root, server, client)
  - Launches server and client in tmux sessions
  - Opens browser to `http://localhost:5173`

## Architecture

```flowchart
Windows                          WSL/Linux
─────────────────────────────────────────────────────────────
User runs: bootstrap.bat
    ↓
Check Node.js on Windows
Check WSL installation
    ↓
wsl bash bootstrap.sh ────────→ bootstrap.sh executes in WSL
                                    ↓
                            System package setup
                            Python venv creation
                            PyTorch installation
                            vLLM installation
                            HF auth setup
                            Config file creation
                            npm install (Node in WSL)
                            GUI server startup (npm run dev)
                            GUI client startup (npm run dev)
                            tmux sessions created
                                    ↓
                            Browser opens to localhost:5173
```

## Key Differences from Original

| Aspect | Old `bootstrap.bat` | New Implementation |
|--------|--------------------|--------------------|
| Node.js execution | Windows only | WSL only |
| Python/PyTorch | N/A | WSL (proper environment) |
| GUI servers | Windows cmd.exe spawning | WSL tmux sessions |
| Environment | Mixed (Windows + WSL) | Pure WSL (except Windows wrapper) |
| HuggingFace setup | Deferred to initial-bootstrap.sh | Integrated in bootstrap.sh |
| OS agnostic | No | Yes (works on any OS with WSL) |

## Usage

### On Windows

```batch
bootstrap.bat
```

This will:

1. Install/check Node.js
2. Install/check WSL
3. Launch `bootstrap.sh` inside WSL
4. All setup happens in Linux environment
5. GUI opens automatically in browser

### On Linux/WSL (standalone)

```bash
./bootstrap.sh
```

Same behavior, runs entirely in Linux.

## Configuration Files Created

### `daily-bootstrap.sh`

Launches a model with role-based sizing:

```bash
./daily-bootstrap.sh {fast|edit|qa|plan}
```

- `fast` → 1B model (8100-8299)
- `edit` → 4B model (8300-8499)
- `qa` → 7B model (8500-8699)
- `plan` → 15B model (8700-8899)

### `models.conf`

Model definitions for each tier (editable):

```ini
[1B]
default = meta-llama/Llama-3.2-1B
alt1 = Qwen/Qwen2.5-0.5B-Instruct
alt2 = HuggingFaceTB/SmolLM2-1.7B-Instruct
```

### `ports.conf`

Port range allocations (editable):

```ini
[ranges]
1B = 8100-8299
4B = 8300-8499
7B = 8500-8699
15B = 8700-8899
```

### `chat-templates.conf`

Maps model IDs to vLLM chat templates (editable):

```ini
meta-llama/Llama-3.2-1B = llama3
microsoft/phi-3.5-mini-instruct = phi3
```

### `test-connection.sh`

Validates a running model:

```bash
./test-connection.sh 8500
```

Tests: health, models list, chat completion.

## Dependencies

### Windows Requirements

- Node.js (auto-installed if missing)
- WSL 2 (auto-installed if missing)

### WSL Requirements (installed by `bootstrap.sh`)

- Python 3
- PyTorch (GPU-aware)
- vLLM
- huggingface-hub
- Node.js (for GUI)
- tmux (for session management)

## Server Startup

The GUI runs in tmux sessions within WSL:

```bash
tmux list-sessions
tmux capture-pane -t vllm-bootstrap-server -p
```

To stop:

```bash
tmux kill-session -t vllm-bootstrap-server
```

## First Run Flow

1. User runs `bootstrap.bat` (Windows) or `bootstrap.sh` (Linux/WSL)
2. System dependencies installed
3. HuggingFace authentication (optional, interactive)
4. Config files created
5. Node.js dependencies installed
6. GUI servers launched in tmux
7. Browser opens to admin panel

## Next Steps (via GUI)

Users configure:

- Model selection per tier
- Port ranges
- GPU memory utilization
- Model preloading
- Rider AI integration

## Security Notes

- HuggingFace tokens handled securely (CLI login only, no plain text storage)
- Configuration files created with user ownership
- Logs saved to `/tmp/` (Linux) or `%TEMP%` (Windows)

## Testing

After bootstrap completes:

```bash
# Validate configuration
./validate-config.sh

# Test a running model (in new terminal)
source ~/torch-env/bin/activate
./test-connection.sh 8500

# Check server logs
tmux capture-pane -t vllm-bootstrap-server:server -p
```

---

**Both files follow the same DOCTRINE VERSION tracking** and use the same configuration schema.
