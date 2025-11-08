# 🐛 Debug: Button Clicks Not Working

## Current Issue
Clicking "Start" on a model registers the click but nothing happens - no feedback, no errors visible.

## Improvements Made

### 1. Added Extensive Console Logging

**Client Side** (`AdminDashboard.tsx`):
- Logs before every API call
- Logs response data
- Logs errors with full details
- Shows error banner on page

**Server Side** (`admin/routes.ts`):
- Logs every incoming request
- Logs request params and body
- Logs operation results
- Logs errors

### 2. Added Visual Feedback

**Error Display**: Red banner appears at top of dashboard
**Success Alerts**: Alert dialogs show after successful operations
**Console Output**: Check browser console (F12) and server terminal

## How to Debug

### Step 1: Open Browser Console
1. Press `F12` in browser
2. Go to **Console** tab
3. Click "Start" on a model
4. Look for:
   ```
   Starting model for role: qa
   Start model response: {...}
   ```

### Step 2: Check Network Tab
1. Press `F12` → **Network** tab
2. Click "Start" on a model
3. Look for request: `POST /api/admin/models/qa/start`
4. Check:
   - **Status Code** (should be 200 or 500)
   - **Response** tab (see server response)
   - **Preview** tab (formatted JSON)

### Step 3: Check Server Terminal
1. Look at the terminal running `server`
2. Should see:
   ```
   [Admin] POST /models/:role/start { role: 'qa', body: { modelName: 'qa' } }
   [Admin] Starting model - role: qa, name: qa
   [Admin] Model start result: {...}
   ```

### Step 4: Test Health Endpoint
Open browser to: `http://localhost:3001/api/admin/health`

Expected:
```json
{
  "status": "ok",
  "timestamp": "2025-11-07T00:15:00.000Z"
}
```

If this fails → Server not running or admin routes not mounted

## Common Issues & Fixes

### Issue: No logs in browser console
**Cause**: Client app not reloaded after changes
**Fix**: Hard refresh (Ctrl+Shift+R) or restart Vite dev server

### Issue: No logs in server terminal
**Cause**: Server not restarted after code changes
**Fix**: Restart server
```batch
cd server
npm run dev
```

### Issue: Network shows 404
**Cause**: Admin routes not mounted properly
**Fix**: Check `server/src/app.ts` has:
```typescript
app.use('/api/admin', adminRoutes);
```

### Issue: Network shows 500 Error
**Cause**: Server-side error (likely WSL command failing)
**Fix**: Check server console for error details

### Issue: Network shows CORS error
**Cause**: Client and server ports mismatch
**Fix**: Ensure:
- Client: `http://localhost:5173`
- Server: `http://localhost:3001`

### Issue: Button click but no network request
**Cause**: JavaScript error preventing API call
**Fix**: Check browser console for errors

## Testing Checklist

Run through this checklist:

1. **Server Running**
   ```batch
   cd server
   npm run dev
   ```
   Should see: `Server running on port 3001`

2. **Client Running**
   ```batch
   cd client
   npm run dev
   ```
   Should see: `Local: http://localhost:5173/`

3. **Health Check**
   Open: `http://localhost:3001/api/admin/health`
   Should see: `{"status":"ok","timestamp":"..."}`

4. **Admin Dashboard Loads**
   Open: `http://localhost:5173`
   Should see: System Status, Model Management panels

5. **Click Start Button**
   - Click "Start" on QA model
   - Browser console should log: `Starting model for role: qa`
   - Server console should log: `[Admin] POST /models/:role/start`
   - Alert should show: "Model qa is starting..."

6. **Check Network**
   - F12 → Network tab
   - Should see: POST request to `/api/admin/models/qa/start`
   - Status should be 200 (success) or 500 (error)

## What to Report

If still not working, provide:

1. **Browser Console Output** (F12 → Console)
2. **Network Tab** (F12 → Network → select the failed request)
3. **Server Terminal Output**
4. **Screenshots** of error messages

## Quick Test Script

```javascript
// Paste in browser console (F12)
apiClient.post('/admin/models/qa/start', { modelName: 'qa' })
  .then(r => console.log('SUCCESS:', r.data))
  .catch(e => console.error('ERROR:', e.response?.data || e.message));
```

Expected success:
```
SUCCESS: { name: "qa", role: "qa", status: "starting", port: 8500 }
```

---

**Next**: Follow the debugging steps above and check what you see in console/network/server logs.
