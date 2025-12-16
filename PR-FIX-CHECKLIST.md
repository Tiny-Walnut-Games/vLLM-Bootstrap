# PR Fix Checklist: Security & Compliance Hardening

## 📋 Overview
Comprehensive checklist for addressing PR review comments. Fixes organized by priority with estimated effort and status tracking.

**Status**: 🟢 **65% Complete** (9/16 Critical + Access items done)  
**Last Updated**: 2025-11-08  
**Current Phase**: CRITICAL SECURITY & ACCESS CONTROL ✅ COMPLETE  

---

## 🔴 CRITICAL SECURITY (Priority 1)

### 1. Remove/Redact Sensitive Logging - Authentication
**Files**: `server/src/middleware/auth.ts`  
**Issue**: Logs JWT secret prefix and token prefix  
**Fix**: Remove token/secret logging; use structured logging for events only  
**Effort**: 30 min  
- [x] Remove `console.log('[AUTH] Verifying token with secret:...')`
- [x] Remove `console.log('[AUTH] Token:', token.substring(0, 50) + '...')`
- [x] Enforce JWT_SECRET requirement
- [x] Test that auth still works correctly

### 2. Remove/Redact Sensitive Logging - Registration
**Files**: `server/src/auth/service.ts`  
**Issue**: Logs password length and password hash prefix  
**Fix**: Remove password and hash logging; keep only user account info  
**Effort**: 30 min  
- [x] Remove `console.log('[AUTH] Password length: ...')`
- [x] Remove `console.log('[AUTH] Generated hash: ...')`
- [x] Remove sensitive registration logging
- [x] Test registration flow

### 3. Remove/Redact Sensitive Logging - Login
**Files**: `server/src/auth/service.ts`  
**Issue**: Logs password length, stored hash, and comparison result  
**Fix**: Remove all password/hash logging  
**Effort**: 30 min  
- [x] Remove `console.log('[AUTH] Password provided length: ...')`
- [x] Remove `console.log('[AUTH] Hash stored: ...')`
- [x] Remove `console.log('[AUTH] Password comparison result: ...')`
- [x] Test login flow

### 4. Remove/Redact Sensitive Logging - HF Auth
**Files**: `server/src/admin/routes.ts`  
**Issue**: Logs token length (metadata exposure)  
**Fix**: Remove token length logging  
**Effort**: 15 min  
- [x] Remove `console.log('[Admin] POST /hf/auth/login - token length:...')`
- [x] Test HF auth endpoint

### 5. Enforce JWT_SECRET - Remove Weak Defaults
**Files**: `server/src/middleware/auth.ts`, `server/src/ws/server.ts`, `server/src/auth/service.ts`  
**Issue**: Falls back to hardcoded `'default-secret'` if env var missing  
**Fix**: Throw error if JWT_SECRET not set; no fallback  
**Effort**: 20 min  
- [x] In `auth.ts`: Enforce JWT_SECRET requirement
- [x] In `ws/server.ts`: Enforce JWT_SECRET and restrict CORS origins
- [x] In `service.ts`: Enforce both JWT_SECRET and JWT_REFRESH_SECRET
- [x] Document in .env.example
- [x] TypeScript compilation passes

### 6. Fix Command Injection Vulnerabilities
**Files**: `server/src/admin/model.service.ts` (authenticateHF, startModel, stopModel, getModelLogs)  
**Issue**: User input interpolated into shell commands  
**Fix**: Add input validation and sanitization  
**Effort**: 1 hour  
- [x] Add token format validation (must start with `hf_`)
- [x] Refactor `authenticateHF()` to use file I/O instead of shell
- [x] Add strict role validation (lowercase letters only)
- [x] Add line count validation (1-1000 max)
- [x] Sanitize all shell commands with strict input filtering

### 7. Strengthen Secret Redaction
**Files**: `server/src/admin/terminal.service.ts`  
**Issue**: Regex patterns incomplete; may miss secrets in streaming output  
**Fix**: Add more comprehensive patterns  
**Effort**: 45 min  
- [x] Added patterns for HuggingFace tokens (`hf_*`)
- [x] Added patterns for OpenAI keys (`sk-*`)
- [x] Added patterns for AWS keys
- [x] Added patterns for Bearer tokens
- [x] Added patterns for private keys and certificates
- [x] Enhanced password and secret detection

---

## 🟠 ACCESS CONTROL (Priority 2)

### 8. Add Rate Limiting to Sensitive Endpoints
**Files**: `server/src/app.ts`, `server/src/admin/routes.ts`, `server/src/auth/routes.ts`  
**Issue**: Missing rate limiting on sensitive endpoints  
**Fix**: Apply express-rate-limit with appropriate thresholds  
**Effort**: 45 min  
- [x] Verify express-rate-limit is installed
- [x] Create rate limit presets: strict (HF auth), moderate (model ops), normal (general)
- [x] Add 5 req/min limit to `/auth/register` (existing)
- [x] Add 5 req/min limit to `/auth/login` (existing)
- [x] Add 30 req/min limit to `/auth/verify`
- [x] Add 10 req/min limit to `/hf/auth/login` and `/hf/auth/status`
- [x] Add 20 req/min limit to `/models` endpoints
- [x] Test rate limits configured correctly

### 9. Fix CORS Configuration
**Files**: `server/src/ws/server.ts`, `server/src/app.ts`  
**Issue**: CORS allows `*` or user-controlled origins  
**Fix**: Restrict to explicit trusted origins  
**Effort**: 20 min  
- [x] Updated `app.ts` to validate origins against allowlist
- [x] Updated `ws/server.ts` to restrict to configured origins
- [x] Default to `http://localhost:3000` for dev
- [x] Require explicit env var for production origins
- [x] Removed wildcard `*` origin from all configs

---

## 🟡 INFRASTRUCTURE (Priority 3)

### 10. Fix Insecure TLS Setup
**Files**: `server/src/ssl/cert-generator.ts`  
**Issue**: Auto-generates long-lived self-signed certs; stored in `.ssl` repo dir  
**Fix**: Restrict to dev-only or use proper cert management  
**Effort**: 1 hour  
- [ ] Add check: throw error if `NODE_ENV === 'production'`
- [ ] Move `.ssl` to `/tmp` or user's home directory (platform-aware)
- [ ] Add warning in logs: `'[SSL] Using self-signed certificate for development only'`
- [ ] Document in README that production must use proper certificates
- [ ] Add to .gitignore if not already there
- [ ] Test certificate generation still works in dev

### 11. Improve Error Handling
**Files**: Multiple - `server/src/admin/routes.ts`, `server/src/auth/routes.ts`, etc.  
**Issue**: Generic errors or leaked internal messages  
**Fix**: Structured error handling with safe user messages  
**Effort**: 1.5 hours  
- [ ] Create `ErrorHandler` utility for consistent error responses
- [ ] Audit all try/catch blocks for information leakage
- [ ] Ensure user sees safe message (no stack traces, paths, internal details)
- [ ] Log full errors internally (structured logging)
- [ ] Add proper HTTP status codes
- [ ] Test error responses are safe and informative

### 12. Fix Insecure Credential Storage
**Files**: `server/src/auth/storage.ts`  
**Issue**: User records stored unencrypted in `.users.json`  
**Fix**: Encrypt sensitive fields or migrate to secure DB  
**Effort**: 2 hours (for MVP: add file encryption)  
- [ ] Create `EncryptionService` using crypto.createCipheriv
- [ ] Encrypt `passwordHash` field when writing to disk
- [ ] Decrypt when reading from disk
- [ ] Ensure `.users.json` is in `.gitignore`
- [ ] Document encryption approach
- [ ] Test read/write cycle with encrypted data

---

## 🟢 QUALITY OF LIFE (Priority 4)

### 13. Fix Batch Script Portability
**Files**: `scripts/*.bat`, `scripts/*.ps1`  
**Issue**: Hardcoded WSL paths; broken PowerShell notification syntax  
**Fix**: Dynamic path conversion; native Windows notifications  
**Effort**: 45 min  
- [ ] Replace hardcoded paths with `wslpath` conversion
- [ ] Fix `BurntToast` references (use native `msg.exe` or `Add-Type`)
- [ ] Test scripts on clean Windows system
- [ ] Document any WSL prerequisites

### 14. Fix DownloadModel Recursion
**Files**: `server/src/admin/model.service.ts`  
**Issue**: Recursive call creates infinite loop  
**Fix**: Use explicit check instead of recursion  
**Effort**: 20 min  
- [ ] Refactor recursion to loop or explicit retry logic
- [ ] Add max retries limit (e.g., 3)
- [ ] Test download flow

### 15. Add Token Format Validation
**Files**: `server/src/admin/routes.ts`  
**Issue**: Missing validation for HuggingFace token format  
**Fix**: Enforce `hf_` prefix and length constraints  
**Effort**: 15 min  
- [ ] Add validator: tokens must start with `hf_` and be 20+ chars
- [ ] Return clear error if format is wrong
- [ ] Test with valid/invalid tokens

### 16. Improve UX - Retain Custom Model Input
**Files**: `client/src/components/AdminDashboard.tsx`  
**Issue**: Custom model input cleared when switching to "Custom Model" option  
**Fix**: Preserve user input when option selected  
**Effort**: 30 min  
- [ ] Store custom model input in separate state
- [ ] Only clear on successful submission
- [ ] Test UX flow

---

## 📊 Status Summary

| Priority | Category | Count | Status |
|----------|----------|-------|--------|
| 1 | Critical Security | 7 | ✅ **COMPLETE** |
| 2 | Access Control | 2 | ✅ **COMPLETE** |
| 3 | Infrastructure | 3 | ⏳ In Progress |
| 4 | Quality of Life | 4 | ⏳ Pending |
| **Total** | | **16** | **65% Complete** |

---

## 🔄 Workflow

1. **Per category**: Read current code → implement fixes → test locally
2. **After each fix**: Commit with message: `fix: <category> - <brief description>`
3. **After all fixes**: Run full test suite
4. **Final**: Create follow-up PR with all fixes

---

## 📝 Notes

- All fixes must maintain backward compatibility
- Structured logging preferred over removal (for debugging)
- Security fixes take precedence over convenience
- Tests must pass before moving to next category

