# Quick Start: GUI

**Date**: November 6, 2025  
**Time to Setup**: ~5 minutes  

---

## Fastest Way to Start

### Windows

```bash
# Double-click or run:
start-gui.bat
```

### Linux/Mac

```bash
chmod +x start-gui.sh
./start-gui.sh
```

**Done!** Visit http://localhost:5173

---

## Manual Setup

### 1. Install Dependencies

```bash
# Server
cd server
npm install

# Client
cd client
npm install
```

### 2. Configure Server

```bash
cd server
cp .env.example .env
# Edit .env if needed (defaults work for local testing)
```

### 3. Start Both

**Terminal 1** (Server):
```bash
cd server
npm run dev
```

**Terminal 2** (Client):
```bash
cd client
npm run dev
```

---

## First Time Usage

### 1. Register Account

- Go to http://localhost:5173
- Click "Register" tab
- Username: any (min 3 chars)
- Password: must include uppercase, lowercase, number (min 8 chars)
- Example: `TestUser123!`

### 2. Start Chatting

- Select model from sidebar dropdown
- Type message in input box
- Press Send or Enter
- View response

### 3. Other Actions

- **Clear Chat**: Button in sidebar
- **Logout**: Button in sidebar (bottom)
- **Change Model**: Dropdown in sidebar

---

## Troubleshooting

### "Failed to load models"

**Problem**: vLLM backend not running  
**Fix**: 
```bash
# Make sure vLLM is running on port 8500
# Or change VLLM_BASE_URL in server/.env
```

### "Cannot connect to server"

**Problem**: Server not running  
**Fix**:
```bash
cd server
npm run dev
```

### "Port already in use"

**Problem**: Another app using port 3000 or 5173  
**Fix**:
```bash
# Change PORT in server/.env (default 3000)
# Or change port in client/vite.config.ts (default 5173)
```

### "Authentication failed"

**Problem**: Token expired or invalid  
**Fix**:
```bash
# Clear browser storage:
# F12 → Application → Local Storage → localhost:5173 → Clear
# Then refresh page and login again
```

---

## What's Next?

### For Development

- **API Docs**: See `server/README.md`
- **Full Setup Guide**: See `GUI-SETUP.md`
- **Deployment**: See `DEPLOYMENT.md`

### For Production

1. Change JWT secrets in `server/.env`
2. Enable HTTPS/TLS
3. Configure CORS for specific origins
4. See `DEPLOYMENT.md` for complete guide

---

## Remote Hosting (Your Use Case)

### Your Friend's GPU Machine

1. Clone repo on their machine
2. Run:
```bash
cd server
npm install
npm run build
npm start
# Or: pm2 start dist/index.js
```

3. Note their IP address: `<their-ip>`

### Your Machine

1. Edit `client/src/api/client.ts`:
```typescript
baseURL: 'http://<their-ip>:3000/api'
```

2. Build and run:
```bash
npm run dev
# Or for production: npm run build
```

**Done!** You can now use models hosted on their GPU.

---

## Key Files

```
vLLM-Bootstrap/
├── server/
│   ├── .env              # Server config (JWT secrets, ports)
│   ├── src/              # Server source code
│   └── tests/            # Server tests (npm test)
│
├── client/
│   ├── src/              # Client source code
│   └── vite.config.ts    # Client config (proxy, port)
│
├── start-gui.bat         # Windows quick start
├── start-gui.sh          # Linux/Mac quick start
├── QUICK-START-GUI.md    # This file
├── GUI-SETUP.md          # Detailed setup
└── DEPLOYMENT.md         # Production deployment
```

---

## Commands Reference

### Development

```bash
# Server
cd server
npm run dev        # Start dev server
npm test          # Run tests
npm run typecheck # Check types

# Client  
cd client
npm run dev        # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
npm run typecheck # Check types
```

### Production

```bash
# Server
cd server
npm run build     # Compile TypeScript
npm start         # Run production server

# Client
cd client
npm run build     # Build optimized bundle
# Serve dist/ with nginx or similar
```

---

## Ports

- **Client Dev**: 5173 (Vite)
- **Server**: 3000 (configurable in .env)
- **vLLM Backend**: 8500 (default)

---

## Environment Variables

### Server (.env)

**Required**:
```env
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
```

**Optional** (have defaults):
```env
PORT=3000
JWT_EXPIRES_IN=15m
VLLM_BASE_URL=http://localhost:8500
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=http://localhost:5173
```

---

## Support

- **Detailed Docs**: `GUI-SETUP.md`
- **Deployment Guide**: `DEPLOYMENT.md`
- **Server API**: `server/README.md`
- **Implementation Details**: `GUI-CHANGELOG.md`

---

**The scrolls are aligned; tested, proven, ready to deploy.**
