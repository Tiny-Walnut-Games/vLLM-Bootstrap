# GitHub Advanced Security Fixes

This document summarizes all security vulnerabilities fixed in response to GHAS findings.

## Issues Addressed

### 1. Command Injection Vulnerabilities

**Problem**: User input was passed directly to shell commands without proper sanitization, enabling command injection attacks.

**Files Affected**:
- `server/src/admin/terminal.service.ts`
- `server/src/admin/model.service.ts`

**Fixes Applied**:

#### terminal.service.ts
- Added allowlist of safe commands (pwd, ls, cat, tail, grep, etc.)
- Command validation rejects pipes (`|`), semicolons (`;`), subshells (`$()`), backticks, and newlines
- All user input escaped using proper shell escaping (`escapeShellArg`)
- Command length validation and whitelisting prevents arbitrary code execution

#### model.service.ts
- Role name sanitization: only lowercase letters, numbers, hyphens, underscores allowed
- Model name validation: strict format validation (org/model-name)
- Session names properly quoted in shell commands to prevent injection
- Added explicit `shell: '/bin/bash'` parameter for predictable shell behavior

**Example Unsafe Code (Before)**:
```typescript
// VULNERABLE: User input directly in template string
`tmux send-keys -t ${sessionName} "${command}" Enter`
```

**Example Safe Code (After)**:
```typescript
// SAFE: Input validated, escaped, and whitelisted
const escapedCommand = escapeShellArg(trimmedCommand);
const tmuxCmd = `tmux send-keys -t ${this.tmuxSession}:${this.tmuxWindow} ${escapedCommand} Enter`;
```

### 2. Missing Input Validation

**Problem**: API endpoints accepted user input without validation, allowing invalid or malicious data.

**Files Modified**:
- `server/src/utils/security.ts` (NEW)

**Fixes Applied**:

Created centralized sanitization functions:
- `sanitizeRoleName()` - Validates role format and length (1-50 chars, alphanumeric + hyphens/underscores)
- `sanitizeModelName()` - Validates HuggingFace model format (org/model-name)
- `sanitizeToken()` - Validates token format and length (10-500 chars)
- `escapeShellArg()` - Properly escapes shell arguments to prevent injection

All sanitization functions throw descriptive errors preventing data further processing.

### 3. Missing Rate Limiting

**Problem**: No rate limiting on authentication or sensitive API endpoints, enabling brute-force and DoS attacks.

**Files Modified**:
- `server/src/middleware/rateLimit.ts` - Enhanced with additional limiters
- `server/src/app.ts` - Integrated rate limiting middleware
- `server/src/admin/routes.ts` - Applied stricter limits to sensitive endpoints

**Fixes Applied**:

Implemented tiered rate limiting:
- **authLimiter**: 5 requests per 15 minutes on `/api/auth/*` endpoints
- **apiLimiter**: 100 requests per 15 minutes on general `/api/*` endpoints
- **strictLimiter**: 10 requests per 15 minutes on sensitive operations (HF auth)
- **commandLimiter**: 20 requests per 1 minute on model start/stop operations

Rate limiters skip health check endpoints and track by IP address.

### 4. Enhanced Security Headers

**Problem**: Weak security headers left application vulnerable to common web attacks.

**File Modified**: `server/src/app.ts`

**Fixes Applied**:

Enhanced helmet.js configuration:
- **Content Security Policy**: Restricts script/style sources to same-origin
- **HSTS**: Enforces HTTPS with 1-year max-age and preload flag
- **Frameguard**: Prevents clickjacking by denying framing
- **X-Content-Type-Options**: Prevents MIME-type sniffing
- **X-XSS-Protection**: Enables browser XSS protection

Example:
```typescript
app.use(helmet({
  contentSecurityPolicy: {...},
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
}));
```

### 5. Request Size Limits

**Problem**: Unbounded request sizes could enable resource exhaustion attacks.

**File Modified**: `server/src/app.ts`

**Fixes Applied**:

- JSON payload limited to 1MB: `express.json({ limit: '1mb' })`
- URL-encoded data limited to 1MB: `express.urlencoded({ extended: true, limit: '1mb' })`

Prevents attackers from sending oversized payloads that consume memory or disk space.

### 6. CORS Hardening

**Problem**: Overly permissive CORS configuration could enable cross-origin attacks.

**File Modified**: `server/src/app.ts`

**Fixes Applied**:

Restricted CORS to:
- Whitelisted origins (or single origin in production)
- Explicit HTTP methods: GET, POST, PUT, DELETE, OPTIONS
- Explicit headers: Content-Type, Authorization
- Credentials explicitly allowed only for same-origin

```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 7. Sensitive Data Redaction

**Existing Feature Preserved**: Terminal output already redacts:
- HuggingFace tokens (`hf_*`)
- API keys
- Passwords
- Bearer tokens
- Authorization headers

Pattern-based regex redaction prevents accidental credential leaks in logs and terminal output.

## Testing Recommendations

### Command Injection Tests
```bash
# Should be rejected (contains pipe)
curl -X POST http://localhost:3001/api/admin/terminal/command -d '{"command":"ls | cat"}'

# Should be rejected (contains semicolon)
curl -X POST http://localhost:3001/api/admin/terminal/command -d '{"command":"pwd; rm -rf /"}'

# Should succeed (whitelisted command)
curl -X POST http://localhost:3001/api/admin/terminal/command -d '{"command":"pwd"}'
```

### Rate Limiting Tests
```bash
# Send 6 rapid auth requests (5th succeeds, 6th rate-limited)
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/login -d '...' -i
done
# 6th request should return 429 Too Many Requests
```

### Model Start/Stop Tests
```bash
# Should be rejected (invalid role format)
curl -X POST http://localhost:3001/api/admin/models/invalid\$role/start

# Should be rejected (invalid model name format)
curl -X POST http://localhost:3001/api/admin/models/qa/start \
  -d '{"modelName":"invalid_model"}'

# Should succeed (valid format)
curl -X POST http://localhost:3001/api/admin/models/qa/start \
  -d '{"modelName":"meta-llama/Llama-3.2-1B"}'
```

## Deployment Notes

### Required Environment Variables
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS
- `NODE_ENV`: Set to "production" to enable all security features

### Rate Limiting Considerations
- Limits are per IP address
- Connections through reverse proxies should set X-Forwarded-For header
- For distributed deployments, consider using Redis-backed rate limiter (express-rate-limit supports this)

### WebSocket Security
- WebSocket connections inherit HTTP authentication
- Consider adding connection rate limiting at reverse proxy level
- Monitor for abnormal connection patterns in logs

## References

- [OWASP Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- [OWASP Rate Limiting Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html#rate-limiting)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [express-rate-limit Documentation](https://github.com/nfriedly/express-rate-limit)
