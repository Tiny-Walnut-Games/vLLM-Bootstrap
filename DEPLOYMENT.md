# Deployment Guide
**Date**: November 6, 2025

Step-by-step guide for deploying vLLM-Bootstrap GUI to production.

## Quick Start (Development)

```bash
# Terminal 1: Start server
cd server
npm install
cp .env.example .env
npm run dev

# Terminal 2: Start client
cd client
npm install
npm run dev

# Access at http://localhost:5173
```

## Production Deployment

### Option 1: Single Machine (Local Network)

**Scenario**: Host everything on one machine, access from local network

1. **Build both server and client**:
```bash
# Server
cd server
npm install
npm run build

# Client
cd client
npm install
npm run build
```

2. **Configure environment**:
```bash
cd server
cp .env.example .env
# Edit PORT, JWT_SECRET, JWT_REFRESH_SECRET, VLLM_BASE_URL
```

3. **Start server with PM2**:
```bash
npm install -g pm2
pm2 start dist/index.js --name vllm-server
pm2 save
pm2 startup  # Follow instructions
```

4. **Serve client with nginx**:
```nginx
server {
  listen 80;
  server_name localhost;

  root /path/to/vLLM-Bootstrap/client/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
  }
}
```

### Option 2: Remote GPU Server

**Scenario**: Server on friend's GPU machine, you access remotely

#### On GPU Machine:

1. **Clone and setup**:
```bash
git clone <your-repo>
cd vLLM-Bootstrap/server
npm install
npm run build
```

2. **Configure .env**:
```env
PORT=3000
JWT_SECRET=<generate-strong-64-char-secret>
JWT_REFRESH_SECRET=<another-strong-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

VLLM_BASE_URL=http://localhost:8500
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Allow your IP or domain
ALLOWED_ORIGINS=http://your-client-domain.com,https://your-client-domain.com

NODE_ENV=production
```

3. **Security setup**:
```bash
# Firewall: Allow only specific IPs (optional but recommended)
sudo ufw allow from <your-ip> to any port 3000

# Or allow all (less secure)
sudo ufw allow 3000
```

4. **Start with PM2**:
```bash
pm2 start dist/index.js --name vllm-server
pm2 save
pm2 startup
```

5. **Setup TLS (HTTPS) with Caddy** (recommended for remote):
```bash
# Install Caddy
sudo apt install caddy

# Create Caddyfile
cat > /etc/caddy/Caddyfile <<EOF
your-domain.com {
  reverse_proxy /api/* localhost:3000
  reverse_proxy /socket.io/* localhost:3000
}
EOF

sudo systemctl restart caddy
```

#### On Your Client Machine:

1. **Build client pointing to remote server**:

Edit `client/src/api/client.ts`:
```typescript
this.client = axios.create({
  baseURL: 'https://your-domain.com/api',  // Or http://gpu-machine-ip:3000/api
  // ...
});
```

2. **Build and deploy**:
```bash
cd client
npm run build
# Upload dist/ to your hosting (Vercel, Netlify, etc.)
```

### Option 3: Full Remote (Both Server + Client Hosted)

**Best for**: Production deployment accessible from anywhere

1. **Use a VPS** (DigitalOcean, AWS, etc.)
2. **Setup Docker Compose**:

```yaml
# docker-compose.yml
version: '3.8'
services:
  server:
    build: ./server
    ports:
      - "3000:3000"
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - VLLM_BASE_URL=http://vllm:8500
    restart: unless-stopped

  client:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - server
    restart: unless-stopped

  vllm:
    image: vllm/vllm-openai:latest
    ports:
      - "8500:8500"
    volumes:
      - ./models:/models
    command: --model /models/your-model
    restart: unless-stopped
```

3. **Deploy**:
```bash
docker-compose up -d
```

## Security Checklist

### Critical (Do Before Production)
- [ ] Generate strong JWT secrets (use `openssl rand -hex 64`)
- [ ] Enable HTTPS/TLS (use Caddy or Let's Encrypt)
- [ ] Set specific CORS origins (no wildcards)
- [ ] Configure firewall rules
- [ ] Change default ports if exposed publicly

### Recommended
- [ ] Implement IP whitelisting for admin users
- [ ] Set up logging and monitoring
- [ ] Regular security updates
- [ ] Rate limit tuning based on usage
- [ ] Backup strategy for user data
- [ ] Setup reverse proxy (nginx/caddy)

### Optional
- [ ] Add 2FA for sensitive accounts
- [ ] Implement session management
- [ ] Add intrusion detection
- [ ] Setup VPN for remote access

## Monitoring

### Check Server Status
```bash
pm2 status
pm2 logs vllm-server
```

### Check Client Status
```bash
# If using nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

### Health Checks
```bash
# Server health
curl http://localhost:3000/health

# vLLM health
curl http://localhost:8500/health
```

## Troubleshooting

### Server won't start
```bash
# Check logs
pm2 logs vllm-server

# Common issues:
# - Port already in use: change PORT in .env
# - Missing .env: copy from .env.example
# - Wrong Node version: need >= 16
```

### Client can't reach server
```bash
# Test server directly
curl http://server-ip:3000/health

# Check firewall
sudo ufw status

# Verify CORS settings in server .env
```

### Authentication fails
```bash
# Check JWT secrets are set
cat server/.env | grep JWT

# Verify tokens aren't expired
# Clear browser localStorage and re-login
```

## Performance Tuning

### For High Traffic
```env
# Increase rate limits
RATE_LIMIT_MAX_REQUESTS=1000

# Shorter token expiry
JWT_EXPIRES_IN=5m

# Load balancing (use nginx upstream)
```

### For Low Latency
```env
# Longer token expiry (fewer refreshes)
JWT_EXPIRES_IN=1h

# Disable rate limiting for trusted IPs
```

## Backup and Recovery

### Backup User Data
```bash
# Currently in-memory only
# Future: backup database
# pg_dump / mongodump / etc.
```

### Recovery
```bash
# Restore from backup
# Restart services
pm2 restart vllm-server
```

## Updates and Maintenance

```bash
# Update codebase
git pull origin main

# Rebuild
cd server && npm run build
cd client && npm run build

# Restart
pm2 restart vllm-server
sudo systemctl reload nginx
```

---

**The forge stands ready; deploy with confidence.**
