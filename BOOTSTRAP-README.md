# 🚀 vLLM-Bootstrap: One-Click Installation

---**Single-file bootstrap for virgin Windows machines**

## Quick Start

### For Fresh Windows Installation

1. **Download** `bootstrap.bat` to your machine
2. **Right-click** → Run as Administrator
3. **Follow** the on-screen instructions
4. **Done!** Admin GUI opens automatically

```batch
.\bootstrap.bat
```

## What It Does

### Automated Installation

The bootstrap script automatically:

1. ✅ Detects and installs **Node.js** (if missing)
2. ✅ Detects and installs **WSL + Ubuntu** (if missing)
3. ✅ Installs all **npm dependencies**
4. ✅ Builds **server** and **client**
5. ✅ Launches **Admin GUI** in browser

### System Requirements

- **OS**: Windows 10/11 (64-bit)
- **RAM**: 8GB minimum, 16GB recommended
- **Disk**: 20GB free space
- **GPU**: NVIDIA GPU with CUDA support (optional but recommended)
- **Admin**: Administrator privileges required

## Admin GUI Features

### 🔧 System Management

- **Status Dashboard**: Real-time system health monitoring
  - Node.js version check
  - WSL installation status
  - Python environment verification
  - vLLM installation status

- **One-Click Installation**: Install missing prerequisites with single button clicks

### 🤖 Model Lifecycle

- **Start/Stop Models**: Launch and terminate vLLM models
- **Port Management**: Automatic port assignment from `ports.conf`
- **Log Viewer**: Real-time log streaming with auto-refresh
- **Model Status**: See running models, ports, uptime, GPU usage

### 🎛️ Operation Modes

-**IDE Mode**

- Runs vLLM server only
- OpenAI-compatible API at `http://localhost:8500/v1`
- Minimal overhead
- Perfect for JetBrains Rider, VS Code, etc.

-**GUI Chat Mode**

- Runs vLLM server + web chat interface
- Full authentication system
- Browser-based interaction
- All IDE features + chat UI

## Architecture

```flowchart LR
bootstrap.bat  (Entry point)
     ↓
[Installs Prerequisites]
     ↓
Admin GUI (React + Express)
     ↓
WSL (Ubuntu)
     ↓
vLLM (Running in tmux)
```

## API Endpoints

### System Management

```http
GET  /api/admin/system/status     - Get installation status
POST /api/admin/wsl/install       - Install WSL + Ubuntu
POST /api/admin/vllm/bootstrap    - Run initial vLLM setup
```

### Model Management

```http
GET  /api/admin/models/status     - List all models
POST /api/admin/models/:role/start - Start model by role
POST /api/admin/models/:role/stop  - Stop running model
GET  /api/admin/logs/:model        - Stream model logs
```

### Mode Management

```http
GET  /api/admin/mode              - Get current mode
POST /api/admin/mode/toggle       - Toggle IDE/GUI mode
```

## Manual Setup (Advanced)

If you prefer manual installation:

```batch
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

npm run dev
```

Server: `http://localhost:3001`  
Client: `http://localhost:5173`

## Troubleshooting

### Node.js Installation Fails

```batch
winget install OpenJS.NodeJS.LTS
```

Then re-run `bootstrap.bat`

### WSL Installation Fails

```batch
wsl --install -d Ubuntu
```

Restart Windows, then re-run `bootstrap.bat`

### Port Already in Use

Check running processes:

```batch
netstat -ano | findstr :8500
taskkill /PID <process_id> /F
```

### vLLM Bootstrap Fails

Check WSL environment:

```batch
wsl bash -c "python3 --version"
wsl bash -c "which pip"
```

## Development

### Run Tests

```bash
cd server
npm test
```

### Build Production

```bash
cd server && npm run build
cd client && npm run build
```

### Start Production

```bash
cd server && npm start
```

## File Structure

```text
vLLM-Bootstrap/
├── bootstrap.bat           # Single-file installer
├── server/                 # Express API
│   ├── src/
│   │   ├── admin/         # Admin endpoints
│   │   ├── auth/          # Authentication
│   │   └── proxy/         # vLLM proxy
│   └── tests/             # API tests
├── client/                 # React UI
│   └── src/
│       ├── pages/
│       │   ├── AdminDashboard.tsx
│       │   └── ChatPage.tsx
│       └── components/
│           └── admin/     # Admin UI components
└── scripts/               # WSL bootstrap scripts
```

## Support

- **Issues**: [GitHub Issues](https://github.com/tiny-walnut-games/vLLM-Bootstrap/issues)
- **Docs**: See `/docs` directory
- **Logs**: Check `%TEMP%\vllm-bootstrap-install.log`

## License

MIT © Tiny Walnut Games
