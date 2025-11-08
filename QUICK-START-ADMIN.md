# ⚡ Quick Start: Admin Bootstrap System

## For Fresh Windows Installation

### Step 1: Download and Run

```batch
bootstrap.bat
```

That's it! The script handles everything.

## What Happens

1. **Checks Node.js** → Installs via winget if missing
2. **Checks WSL** → Installs Ubuntu if missing
3. **Installs dependencies** → npm packages for server & client
4. **Builds apps** → Compiles TypeScript
5. **Launches GUI** → Opens http://localhost:5173 automatically

## Admin Dashboard Features

### 📊 System Status Panel
- ✅ Node.js version
- ✅ WSL installation  
- ✅ Python environment
- ✅ vLLM installation
- 🔵 One-click install buttons for missing components

### 🤖 Model Management
- **Start/Stop** vLLM models (qa, dev, prod roles)
- **Live logs** with auto-refresh
- **Port tracking** from ports.conf
- **Status monitoring** (running/stopped/starting)

### 🎛️ Mode Toggle
- **IDE Only**: Just vLLM server for IDE integration
- **GUI Chat**: vLLM + web chat interface

## First Time Setup

1. Run `bootstrap.bat`
2. Wait for GUI to open
3. Click **"Run vLLM Bootstrap"** (if vLLM not installed)
4. Wait 5-10 minutes for vLLM installation
5. Click **"Start"** on QA model
6. Navigate to **Chat** tab to use the model

## Directory Structure

```
vLLM-Bootstrap/
├── bootstrap.bat          ← Run this first
├── test-admin.bat         ← Validate TypeScript
├── BOOTSTRAP-README.md    ← Full documentation
└── QUICK-START-ADMIN.md   ← This file
```

## URLs

- **Admin Dashboard**: http://localhost:5173
- **Chat Interface**: http://localhost:5173/chat
- **API Server**: http://localhost:3001
- **vLLM API**: http://localhost:8500/v1

## Troubleshooting

### "Node.js not found"
```batch
winget install OpenJS.NodeJS.LTS
```

### "WSL not installed"
```batch
wsl --install -d Ubuntu
```

### "Port 5173 in use"
```batch
netstat -ano | findstr :5173
taskkill /PID <pid> /F
```

## Next Steps

1. **Install vLLM**: Click "Run vLLM Bootstrap" in GUI
2. **Start Model**: Click "Start" on any model role
3. **Use Chat**: Navigate to `/chat` tab
4. **IDE Integration**: Configure IDE to use http://localhost:8500/v1

## Development Mode

```batch
npm run dev
cd server && npm run dev
cd client && npm run dev
```

---

**Ready to start? Run `bootstrap.bat`**
