# vLLM-Bootstrap Server

**Date**: November 6, 2025

Authenticated proxy server for vLLM model hosting with WebSocket streaming support.

## Architecture

### Core Components

- **Express REST API**: Authentication and model proxy
- **Socket.io WebSocket**: Real-time streaming completions
- **JWT Authentication**: Stateless token-based security
- **Rate Limiting**: Configurable per-endpoint protection
- **In-Memory Storage**: User data persistence

### Security Features

- bcrypt password hashing (10 rounds)
- JWT access tokens (15min default)
- JWT refresh tokens (7 days default)
- Password strength validation
- Rate limiting (disabled in test env)
- CORS protection
- Helmet security headers

## API Endpoints

### Authentication (`/api/auth`)

**POST /register**
```json
{
  "username": "user123",
  "password": "SecurePass123!",
  "role": "user|admin"
}
```

**POST /login**
```json
{
  "username": "user123",
  "password": "SecurePass123!"
}
```

**POST /refresh**
```json
{
  "refreshToken": "..."
}
```

**GET /verify** (requires Bearer token)

### Model Proxy (`/api`)

**GET /models** (requires auth)
- Lists available vLLM models

**POST /chat/completions** (requires auth)
```json
{
  "model": "model-name",
  "messages": [{"role": "user", "content": "Hello"}],
  "stream": false,
  "temperature": 0.7,
  "max_tokens": 100
}
```

### Health

**GET /health**
- Server health check

## WebSocket Events

### Client → Server
- `stream_completion`: Start streaming completion

### Server → Client
- `completion_token`: Token chunk
- `completion_done`: Stream complete
- `completion_error`: Error occurred

## Environment Variables

See `.env.example` for all options:
- `JWT_SECRET`: Token signing secret
- `JWT_REFRESH_SECRET`: Refresh token secret
- `VLLM_BASE_URL`: Backend vLLM server URL
- `PORT`: Server port (default 3000)
- `ALLOWED_ORIGINS`: CORS origins

## Development

```bash
# Install dependencies
npm install

# Development with hot reload
npm run dev

# Build
npm run build

# Production
npm start

# Tests
npm test

# Type check
npm run typecheck
```

## Test Status

**13/19 tests passing** (November 6, 2025)

Passing:
- User registration (3/3)
- Login/logout (2/2)
- Refresh tokens (2/2)
- Unauthenticated request rejection (3/3)
- Rate limiting bypass in test mode (1/1)
- Basic auth middleware (2/2)

Known Issues:
- Token persistence between test suites (6 tests)
  - Affects cross-suite token validation
  - Does not affect production functionality

## Production Considerations

1. **Change JWT secrets** in production
2. **Enable TLS/HTTPS** for remote deployment
3. **Configure CORS** for specific origins
4. **Set up persistent storage** (replace in-memory)
5. **Monitor rate limits** and adjust per use case
6. **Log authentication events** for security auditing

## Next Steps

1. Implement React client UI
2. Add persistent user database
3. Enhance WebSocket reconnection logic
4. Add user management admin panel
5. Implement usage tracking/quotas
