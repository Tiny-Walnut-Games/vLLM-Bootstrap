# 🔧 Hotfix: API Client Export Issue

**Issue**: White page, console error: "The requested module '/src/api/client.ts' does not provide an export named 'api'"

**Root Cause**: Components were importing `{ api }` but the export was `{ apiClient }`

## ✅ Changes Made

### 1. Added Public HTTP Methods to ApiClient
**File**: `client/src/api/client.ts`

```typescript
async get<T = any>(url: string, config?: any): Promise<{ data: T }> {
  return this.client.get<T>(url, config);
}

async post<T = any>(url: string, data?: any, config?: any): Promise<{ data: T }> {
  return this.client.post<T>(url, data, config);
}

async put<T = any>(url: string, data?: any, config?: any): Promise<{ data: T }> {
  return this.client.put<T>(url, data, config);
}

async delete<T = any>(url: string, config?: any): Promise<{ data: T }> {
  return this.client.delete<T>(url, config);
}
```

### 2. Fixed Import Statements
**Files Updated**:
- `client/src/pages/AdminDashboard.tsx`
- `client/src/components/admin/LogViewerPanel.tsx`

**Before**:
```typescript
import { api } from '../api/client';
api.get('/admin/system/status')
```

**After**:
```typescript
import { apiClient } from '../api/client';
apiClient.get('/admin/system/status')
```

### 3. Removed Unused Import
**File**: `client/src/App.tsx`

Removed `Navigate` from react-router-dom imports

## ✅ Validation

### TypeScript Compilation
```bash
cd server && npm run typecheck  ✅ PASS
cd client && npm run typecheck  ✅ PASS
```

## 🚀 Ready to Test

**Restart the development servers**:

```batch
Ctrl+C in both terminal windows
bootstrap.bat
```

Or manually:
```batch
cd server && npm run dev
cd client && npm run dev
```

**Expected Result**:
- Admin dashboard loads at http://localhost:5173
- System status panel shows
- Model management panel shows
- Mode toggle panel shows
- No console errors

## 📝 Technical Notes

The `apiClient` instance:
- Uses axios internally
- Has authentication interceptors for JWT tokens
- Now exposes public `get`, `post`, `put`, `delete` methods
- Admin endpoints don't require authentication initially
- Maintains backward compatibility with auth methods

## 🔍 Verification Steps

1. Open browser to http://localhost:5173
2. Check console (F12) - should be clean
3. Verify System Status panel loads
4. Check Network tab - API calls should work
5. Try clicking a button (e.g., "Install WSL") - should trigger API call

---

**Status**: ✅ Fixed and validated  
**Date**: November 7, 2025  
**Impact**: Critical - Blocks admin dashboard from loading
