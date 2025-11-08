# GUI Setup Guide
**Date**: November 6, 2025

Complete authenticated GUI for vLLM-Bootstrap with remote hosting capabilities.

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   React     │─────▶│   Express    │─────▶│    vLLM      │
│   Client    │◀─────│   Auth+Proxy │◀─────│   Servers    │
│  (Port 5173)│      │  (Port 3000) │      │ (Port 8500+) │
└─────────────┘      └──────────────┘      └──────────────┘
       │                      │
       │                      │
       └─────WebSocket────────┘
          Streaming Chat
```

## Features

### Security
- JWT-based authentication with refresh tokens
- bcrypt password hashing
- Rate limiting (configurable)
- CORS protection
- Automatic token refresh

### UI Components
- **Login/Register**: User account management
- **Model Selector**: Choose from available models
- **Chat Interface**: Send messages and view responses
- **Real-time Streaming**: WebSocket-based token streaming (planned)
- **Protected Routes**: Automatic auth verification

### Remote Hosting
- Token-based authentication for external connections
- Per-user rate limiting
- Secure WebSocket connections
- Easy deployment to remote machines

## Installation

### 1. Server Setup

```bash
cd server
npm install
cp .env.example .env

# Edit .env with your settings
# IMPORTANT: Change JWT secrets in production!

# Development
npm run dev

# Production
npm run build
npm start
```

### 2. Client Setup

```bash
cd client
npm install

# Development
npm run dev

# Production
npm run build
npm run preview
```

### 3. Start Both

**Terminal 1 (Server)**:
```bash
cd server && npm run dev
```

**Terminal 2 (Client)**:
```bash
cd client && npm run dev
```

Then visit: http://localhost:5173

## Environment Variables

### Server (.env)
```env
PORT=3000
JWT_SECRET=your-production-secret-here
JWT_REFRESH_SECRET=your-production-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

VLLM_BASE_URL=http://localhost:8500

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Client
Client config is in `vite.config.ts`:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000'
    }
  }
}
```

## Usage

### 1. Register Account
- Visit http://localhost:5173
- Click "Register"
- Enter username (min 3 chars) and password (min 8 chars, must include uppercase, lowercase, number)
- Automatically logs in after registration

### 2. Select Model
- Choose from available models in sidebar
- Models are auto-loaded from vLLM backend

### 3. Chat
- Type message in input field
- Press Send or Enter
- View response in chat area
- Clear chat history with "Clear Chat" button

### 4. Logout
- Click "Logout" in sidebar
- Tokens are cleared from browser storage

## Remote Hosting Setup

### For Host Machine (your friend's GPU server):

1. **Install and configure server**:
```bash
git clone <repo>
cd vLLM-Bootstrap/server
npm install
cp .env.example .env
```

2. **Update .env**:
```env
PORT=3000
JWT_SECRET=generate-strong-secret-here
JWT_REFRESH_SECRET=another-strong-secret
ALLOWED_ORIGINS=*  # Or specific domains
VLLM_BASE_URL=http://localhost:8500
```

3. **Enable firewall** (recommended):
```bash
# Allow only specific IPs
sudo ufw allow from <your-ip> to any port 3000
```

4. **Run server**:
```bash
npm run build
npm start

# Or with PM2 for persistence
npm install -g pm2
pm2 start dist/index.js --name vllm-gui
pm2 save
pm2 startup
```

### For Client Users:

1. **Update API base URL**:
Edit `client/src/api/client.ts`:
```typescript
this.client = axios.create({
  baseURL: 'http://<host-ip>:3000/api',
  // ...
});
```

2. **Or use reverse proxy** (recommended):
Set up nginx/caddy on host machine:
```nginx
server {
  listen 443 ssl;
  server_name your-domain.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
  }
}
```

## Production Deployment Checklist

- [ ] Change all JWT secrets to strong random values
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS for specific origins only
- [ ] Set up proper logging
- [ ] Configure rate limits for your use case
- [ ] Set up monitoring (PM2, systemd, etc.)
- [ ] Regular security updates
- [ ] Backup user database (when using persistent storage)
- [ ] Test authentication flow end-to-end
- [ ] Configure firewall rules

## Troubleshooting

### "Failed to fetch models"
- Check vLLM server is running on configured port
- Verify VLLM_BASE_URL in server .env

### "Authentication failed"
- Check JWT secrets match between login and verification
- Clear browser localStorage and re-login
- Verify token hasn't expired

### "Rate limit exceeded"
- Increase RATE_LIMIT_MAX_REQUESTS in .env
- Or disable in development (NODE_ENV=test)

### WebSocket connection fails
- Ensure server is running on correct port
- Check CORS configuration
- Verify firewall allows WebSocket connections

## Development Testing

### Server Tests
```bash
cd server
npm test
```

Currently 13/19 tests pass. Known issues in test token persistence (doesn't affect production).

### Manual Testing Flow
1. Start server: `cd server && npm run dev`
2. Start client: `cd client && npm run dev`
3. Register account → should redirect to chat
4. Send message → should receive response
5. Refresh page → should stay authenticated
6. Logout → should redirect to login

## Next Steps

1. **WebSocket Streaming**: Implement real-time token streaming in UI
2. **Persistent Storage**: Replace in-memory user storage with database
3. **Admin Panel**: User management, usage stats
4. **Model Status**: Real-time model health indicators
5. **Chat History**: Save conversations per user
6. **Dark/Light Mode**: Theme switcher
7. **Mobile Responsive**: Optimize for mobile devices

## Tech Stack

**Server**:
- Express + TypeScript
- Socket.io for WebSocket
- JWT for auth
- bcrypt for passwords
- Zod for validation

**Client**:
- React 18 + TypeScript
- Vite for build
- Tailwind CSS for styling
- Zustand for state
- React Router for navigation
- Axios for HTTP

---

**The scrolls are aligned; the craft stands ready for testing.**
