# Admin Setup and User Role Management

## HTTPS Certificate Issue

### Why is HTTPS showing as "Not Secure"?

Self-signed certificates always show as "not secure" in browsers because the browser doesn't trust the certificate authority.
*This is normal and expected.*
However, The connection IS encrypted and secure—the browser simply can't verify the certificate's legitimacy.

### How to Proceed (Development)

**Chrome/Edge:**

1. Click the padlock icon showing "Not secure"
2. Look for "Certificate is not valid"
3. Click "Proceed anyway" or type `thisisunsafe` when focus is on the security warning

**Firefox:**

1. Click the padlock → "Not secure" → "Advanced"
2. Click "Accept the Risk and Continue"

### For Production

Replace the self-signed certificate with a CA-signed certificate from:

- **Let's Encrypt** (free)
- **Certbot** (ACME client)
- Your organization's certificate authority

The cert files are located at: `server/.ssl/server.crt` and `server/.ssl/server.key`

---

## Admin User Management

### Overview

Users have two roles:

- **`admin`**: Full access to admin panel, user management, system controls
- **`user`**: Regular user access only

### Methods to Assign Admin Roles

#### Method 1: CLI Tool (Easiest for Setup)

From the server directory, use the management tool:

```bash
# List all users
npm run manage-users list

# Create new user (interactive)
npm run manage-users create

# Make existing user an admin
npm run manage-users make-admin <username>

# Revert admin to regular user
npm run manage-users make-user <username>

# Delete a user
npm run manage-users delete <username>
```

**Example:**

```bash
npm run manage-users make-admin jerry
# Output: ✓ "jerry" is now an admin.
```

#### Method 2: Admin API Endpoints (Programmatic)

Once logged in as an admin, use these endpoints:

**List all users:**

```bash
curl -X GET https://localhost:3001/api/admin/users \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>"
```

**Change user role:**

```bash
curl -X POST https://localhost:3001/api/admin/users/{userId}/role \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

**Delete user:**

```bash
curl -X DELETE https://localhost:3001/api/admin/users/{userId} \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>"
```

#### Method 3: User Registration with Admin Role

When registering a new user via API, you can specify the role:

```bash
curl -X POST https://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newadmin",
    "password": "SecurePass123",
    "role": "admin"
  }'
```

**Important:** In production, this should be restricted or removed to prevent unauthorized admin creation.

---

## Initial Admin Setup Workflow

### Scenario: Fresh Installation

1. **Create first admin user:**

   ```bash
   cd server
   npm run manage-users create
   # Enter username: admin
   # Enter password: YourSecurePassword123
   # Enter role: admin
   ```

2. **Start the server:**

   ```bash
   npm run dev
   ```

3. **Login in frontend:**
   - Navigate to `https://localhost:5173/login`
   - Click through the self-signed certificate warning
   - Enter your admin credentials
   - Access admin dashboard with the terminal and controls

4. **Create additional users:**

   ```bash
   npm run manage-users create
   # Or via admin panel API endpoints
   ```

---

## Admin Permissions

Admins can access:

- ✅ System status and health checks
- ✅ Model management (download, start, stop)
- ✅ User management (list, promote, demote, delete)
- ✅ HuggingFace authentication
- ✅ Live server terminal with credential redaction
- ✅ vLLM bootstrap process
- ✅ Model configuration per role

Regular users can access:

- ✅ Login/logout
- ❌ Admin panel
- ❌ System controls
- ❌ User management
- ❌ Terminal access

---

## Security Considerations

### Best Practices

1. **Strong passwords required:**
   - Minimum 8 characters
   - At least 1 uppercase letter
   - At least 1 lowercase letter
   - At least 1 number

2. **JWT tokens:**
   - Access tokens expire after 15 minutes
   - Refresh tokens expire after 7 days
   - Keep secrets in `.env` file (never commit)

3. **Protected endpoints:**
   - All `/api/admin/*` routes require JWT + admin role
   - Token validation on every request
   - Rate limiting on auth endpoints

4. **Audit logging:**
   - Admin actions are logged with timestamp and actor
   - Check console logs for `[Admin]` prefixed messages

### Environment Variables

Create or update `.env` in `server/` directory:

```env
JWT_SECRET=your-very-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
USE_HTTPS=true
```

---

## Troubleshooting

### "User not found"

- Verify username spelling exactly
- Check user list: `npm run manage-users list`

### "Invalid password"

- Password must be 8+ characters with uppercase, lowercase, and number
- Example: `AdminPass123`

### "Certificate is not valid"

- Expected for self-signed certs
- Click "Proceed anyway" to continue
- For production, install proper CA-signed certificate

### Token expired

- Frontend will redirect to login automatically
- Tokens refresh automatically after login
- Check token expiry in `.env` file

---

## API Response Examples

### User List Response

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "jerry",
    "role": "admin",
    "createdAt": "2025-11-07T17:00:00Z"
  }
]
```

### Change Role Response

```json
{
  "success": true,
  "message": "User jerry is now admin",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "jerry",
    "role": "admin"
  }
}
```

---

## Next Steps

- Review `SECURITY-AUDIT.md` for security architecture details
- Check `QUICK-START-ADMIN.md` for admin panel features
- See `server/src/admin/routes.ts` for API endpoint implementations
