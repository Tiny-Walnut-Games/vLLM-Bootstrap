# 🔧 Troubleshooting: Admin Dashboard Not Responding

## Symptom
Clicking "Start" on a model → Click registers but nothing happens

## Root Cause Analysis

### Most Likely Issues

1. **Server Not Running** → No API to handle requests
2. **API Calls Failing Silently** → Errors being caught but not shown
3. **CORS Issues** → Browser blocking requests
4. **Port Mismatch** → Client calling wrong URL

## Step-by-Step Diagnosis

### ✅ Step 1: Verify Both Servers Running

**Check Client**:
```batch
netstat -ano | findstr :5173
```
Should show something. If not, start client:
```batch
cd client
npm run dev
```

**Check Server**:
```batch
netstat -ano | findstr :3001
```
Should show something. If not, start server:
```batch
cd server
npm run dev
```

---

### ✅ Step 2: Test Server Directly

**Open browser to**: `http://localhost:3001/health`

**Expected**:
```json
{"status":"healthy","timestamp":"..."}
```

**If 404**: Server not running
**If Connection Refused**: Server crashed or wrong port

---

### ✅ Step 3: Test Admin API

**Open browser to**: `http://localhost:3001/api/admin/health`

**Expected**:
```json
{"status":"ok","timestamp":"..."}
```

**If 404**: Admin routes not mounted
**If 500**: Server-side error

---

### ✅ Step 4: Check Browser Console

1. Open dashboard: `http://localhost:5173`
2. Press **F12** → Console tab
3. Click "Start" on QA model
4. Look for output:

**Good**:
```
Starting model for role: qa
Start model response: { name: "qa", ... }
```

**Bad**:
```
Start model error: Network Error
```

---

### ✅ Step 5: Check Network Tab

1. Press **F12** → Network tab
2. Click "Start" on model
3. Find: `POST /api/admin/models/qa/start`

**Check Status Code**:
- `200` → Success (server responded)
- `404` → Endpoint not found
- `500` → Server error
- `(failed)` → Network error (server down or CORS)

**Check Response**:
- Click the request
- Go to **Response** tab
- See what server returned

---

### ✅ Step 6: Check Server Logs

Look at the terminal running `server`:

**Expected when clicking Start**:
```
[Admin] POST /models/:role/start { role: 'qa', body: { modelName: 'qa' } }
[Admin] Starting model - role: qa, name: qa
[Admin] Model start result: {...}
```

**If no logs**: Request not reaching server (CORS, network, or wrong URL)

---

## Common Fixes

### Fix 1: Restart Both Servers

```batch
Ctrl+C in both terminal windows

Terminal 1:
cd server
npm run dev

Terminal 2:
cd client
npm run dev
```

### Fix 2: Hard Refresh Browser

```
Ctrl + Shift + R
```

Or clear cache and reload

### Fix 3: Check .env File

**File**: `server/.env`

Should have:
```
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173
```

### Fix 4: Verify Vite Proxy (if needed)

**File**: `client/vite.config.ts`

May need:
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
```

### Fix 5: Check Firewall

Ensure ports 3001 and 5173 are not blocked

---

## Quick Test Commands

### Test Admin Health
```bash
curl http://localhost:3001/api/admin/health
```

### Test System Status
```bash
curl http://localhost:3001/api/admin/system/status
```

### Test Model Start (manual)
```bash
curl -X POST http://localhost:3001/api/admin/models/qa/start \
  -H "Content-Type: application/json" \
  -d "{\"modelName\":\"qa\"}"
```

---

## Advanced Debugging

### Enable Verbose Logging

**Server** (`server/src/index.ts`):
```typescript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

### Check All Routes

```bash
# In server directory
npm run build
node -e "const app = require('./dist/app'); app.createApp().then(a => console.log(a._router.stack.map(r => r.route?.path || r.name)))"
```

---

## Still Not Working?

### Collect This Information:

1. **Browser Console** (F12 → Console) - Full output
2. **Network Tab** (F12 → Network) - Screenshot of failed request
3. **Server Logs** - Everything in terminal
4. **cURL Test Results** - Output of test commands above

### Check These Files:

1. `server/src/app.ts` - Is `adminRoutes` imported and mounted?
2. `server/src/admin/routes.ts` - Does it export default router?
3. `client/src/api/client.ts` - Does apiClient have `.get()` and `.post()` methods?
4. `client/src/pages/AdminDashboard.tsx` - Are error handlers logging?

---

## Expected Flow

```
User clicks "Start" button
    ↓
handleStartModel() called
    ↓
console.log("Starting model for role: qa")
    ↓
apiClient.post('/admin/models/qa/start', ...)
    ↓
HTTP POST to http://localhost:3001/api/admin/models/qa/start
    ↓
Server: [Admin] POST /models/:role/start
    ↓
ModelService.startModel('qa')
    ↓
Executes: wsl bash -c "tmux new-session ..."
    ↓
Response: { name: 'qa', status: 'starting', port: 8500 }
    ↓
console.log("Start model response:", response.data)
    ↓
alert("Model qa is starting...")
    ↓
loadDashboardData() (refresh status)
```

If ANY step fails, you should see error in console or logs.

---

## Emergency Test

Paste this in browser console (F12):

```javascript
// Test if apiClient exists
console.log('apiClient:', apiClient);

// Test manual API call
fetch('http://localhost:3001/api/admin/health')
  .then(r => r.json())
  .then(d => console.log('Health:', d))
  .catch(e => console.error('Error:', e));

// Test admin API
fetch('http://localhost:3001/api/admin/models/status')
  .then(r => r.json())
  .then(d => console.log('Models:', d))
  .catch(e => console.error('Error:', e));
```

Expected output:
```
apiClient: ApiClient {...}
Health: {status: "ok", timestamp: "..."}
Models: []
```

---

**If you see errors at any step above, that's where the problem is. Report what you see and we'll fix it.**
