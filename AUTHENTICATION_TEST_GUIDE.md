# 🧪 Authentication System - Testing & Verification Guide

## Quick Start - Test in 5 Minutes

### Prerequisites
- ✅ Backend running on http://localhost:8000
- ✅ Frontend running on http://localhost:3001
- ✅ PostgreSQL database connected
- ✅ Chrome DevTools available (F12)

---

## Test 1: Basic Login (2 min)

### Steps
1. Open http://localhost:3001 in browser
2. You should see landing page or redirect to /login
3. Select **"🏨 Hotel / Partner"** tab
4. Enter:
   - Hotel Name: `Hotel Paradise`
   - Password: `password123`
5. Click "Sign in"

### Expected Result
- ✅ No error messages in console
- ✅ Redirects to dashboard within 1 second
- ✅ Shows hotel dashboard
- ✅ Console shows `[Auth] ✅ Login successful`

### If It Fails
- Check console: `F12 → Console`
- Look for error messages
- Verify backend is running
- Verify database has seed data

---

## Test 2: Session Persistence (2 min)

### Steps
1. Login successfully (from Test 1)
2. Open DevTools: `F12`
3. Go to: **Application → Storage → Cookies**
4. Verify two entries exist:
   - `foodconnect_token` (long JWT string starting with "eyJ")
   - `foodconnect_session` (JSON object with user data)
5. Refresh page: `F5` or `Ctrl+R`

### Expected Result
- ✅ Still logged in after refresh
- ✅ No redirect to login
- ✅ Dashboard loads immediately
- ✅ Console shows `[Auth] ✅ Session restored`

### Debug Checklist
```javascript
// Paste in browser console:
localStorage.getItem('foodconnect_token')       // Should return JWT
localStorage.getItem('foodconnect_session')    // Should return JSON
```

---

## Test 3: API Authorization Header (2 min)

### Steps
1. Login (from Test 1)
2. Open DevTools: `F12 → Network`
3. Navigate to a page that makes API calls (e.g., Donations list)
4. Click on any API request in Network tab
5. Go to: **Headers → Request Headers**
6. Look for: `Authorization: Bearer eyJ...`

### Expected Result
- ✅ Authorization header is present
- ✅ Starts with "Bearer "
- ✅ Has JWT token value

### Format Check
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                      ↑
                      Must have "Bearer " prefix
```

---

## Test 4: Volunteer Login (1 min)

### Steps
1. Logout or open incognito window
2. Go to http://localhost:3001/login
3. Select **"🤝 Volunteer"** tab
4. Enter:
   - Phone Number: `9876543210` (or from seed data)
   - Password: `password123`
5. Click "Sign in"

### Expected Result
- ✅ Redirects to volunteer dashboard
- ✅ Different layout than hotel dashboard
- ✅ Shows map or donation list

---

## Test 5: Logout and Session Clear (1 min)

### Steps
1. Login (from Test 1)
2. Find and click "Logout" button (usually in top menu)
3. Check DevTools: **Application → Storage**
4. Verify entries are DELETED:
   - `foodconnect_token` ✅ GONE
   - `foodconnect_session` ✅ GONE
5. Verify redirected to `/login`

### Expected Result
- ✅ Immediately logged out
- ✅ Redirected to login page
- ✅ localStorage is completely cleared
- ✅ Console shows `[Auth] 🚪 Logging out user`

### Verification
```javascript
// In console after logout:
localStorage.getItem('foodconnect_token')    // Should return null
localStorage.getItem('foodconnect_session')  // Should return null
```

---

## Test 6: Try Invalid Login (1 min)

### Steps
1. Go to http://localhost:3001/login
2. Enter:
   - Hotel Name: `NonExistentHotel`
   - Password: `wrongpassword`
3. Click "Sign in"

### Expected Result
- ✅ Shows error message (not generic "Something went wrong")
- ✅ Error is specific (e.g., "Hotel not found" or "Invalid credentials")
- ✅ Stays on login page
- ✅ Can try again

### Debug
- Check console for error message
- Verify backend is returning meaningful error

---

## Test 7: Navigation Without Logout (2 min)

### Steps
1. Login successfully
2. Navigate between pages:
   - `/app` → `/app/dashboard` → `/app/donate` → etc.
3. Watch console for logs
4. Open DevTools: **Application → Storage**
5. Verify token is still there after each navigation

### Expected Result
- ✅ Token doesn't disappear
- ✅ No automatic logout
- ✅ No `[Auth] 🚪 Logging out` message in console
- ✅ No redirect to login

---

## Test 8: Refresh on Different Pages (2 min)

### Steps
1. Login
2. Go to a dashboard page (e.g., `/app/dashboard`)
3. Refresh: `F5`
4. Go to another page (e.g., `/app/profile`)
5. Refresh: `F5`
6. Repeat 2-3 times

### Expected Result
- ✅ Stays logged in all times
- ✅ No flicker or loading loop
- ✅ Session restores within 1 second
- ✅ No 401 errors

---

## Test 9: Registration (2 min)

### Steps
1. Go to http://localhost:3001/login
2. Toggle to **"Register now"**
3. Select **"🏨 Hotel"**
4. Fill in all required fields:
   - Hotel Name: `New Test Hotel` (must be unique)
   - Address: `123 Main St, Mumbai`
   - Manager Phone: `9876543210`
   - License No: `FSSAI-12345`
   - Password: `TestPass123!`
5. Click "Create Account"

### Expected Result
- ✅ Redirects to dashboard
- ✅ New account is created
- ✅ Logged in immediately
- ✅ Token is stored

---

## Test 10: Token in Multiple Windows (2 min)

### Steps
1. Login in Window 1 (Chrome Tab 1)
2. Open another window/tab with same URL
3. In Window 2, check localStorage:
   ```javascript
   localStorage.getItem('foodconnect_token')
   ```
4. Should be able to see Window 1's token in Window 2's storage

### Expected Result
- ✅ Same token in both windows (localStorage is shared)
- ✅ Both windows show as logged in
- ✅ Can make API calls from both

---

## Error Scenarios - What Should Happen

### Scenario 1: Backend is Down
```
User tries to login
    ↓
Error: "Network error" or "Connection refused"
    ↓
User sees error message
    ↓
Stays on login page
    ↓
Can retry when backend recovers
```

### Scenario 2: Invalid Token
```
User has old/corrupted token in localStorage
    ↓
Makes API request
    ↓
Backend returns 401
    ↓
apiRequest() dispatches auth:unauthorized event
    ↓
AuthContext logs out
    ↓
User is redirected to login
```

### Scenario 3: Missing Required Fields
```
User tries to login without entering password
    ↓
Form validation shows error
    ↓
User doesn't submit form
```

---

## Console Log Guide

### What You Should See

**On Login:**
```
[Auth] 🔑 Attempting login as hotel: Hotel Paradise
[API] 🚀 POST /auth/login
[API] 🔑 Token present (eyJhbGc...)
[API] ✅ POST /auth/login - Success
[Auth] ✅ Login successful: hotelparadise@hotel.foodconnect.com
[Auth] 💾 Session persisted: {email, role, hasToken}
```

**On Refresh:**
```
[Auth] 🔄 Attempting to restore session from localStorage...
[Auth] ✅ Session restored: {email, role, tokenLength}
[Router] Path: /app/dashboard, Auth: true, Role: hotel
```

**On Logout:**
```
[Auth] 🚪 Logging out user...
[Auth] ✅ Logout complete - user state cleared
```

### Red Flags (Don't Want to See)

```
❌ "demoLogin is not a function"
❌ "useAuth must be used within AuthProvider"
❌ "Cannot read property 'user' of undefined"
❌ Multiple "[Auth] 🚪 Logging out" messages
❌ "401 Unauthorized" followed by retry loop
❌ Missing Authorization header
```

---

## Performance Checks

### Login Should Complete In
- **1-2 seconds** - From "Sign in" click to dashboard visible
- If slower → Check backend/network latency
- If faster → Great! Good performance

### Refresh Should Restore Session In
- **< 500ms** - Session restored from localStorage
- **No flicker** - Loading spinner briefly, then dashboard
- **No blank page** - Should maintain layout

---

## Security Checks

### ✅ What Should Be True
- Token is stored in localStorage (accessible to JavaScript)
- Token is sent in Authorization header
- Token is NOT visible in URL
- Token is NOT in cookies (unless explicitly set)
- Token is cleared on logout

### ⚠️ Security Notes
- localStorage can be read by any JavaScript (XSS vulnerability)
- This is acceptable for web apps, not for highly sensitive data
- For production, consider HTTP-only cookies (requires backend changes)

---

## Troubleshooting

### Issue: "Login sometimes works, sometimes doesn't"
**Solutions:**
1. Check backend connection: Backend should show logs
2. Check error message: Click error to see details
3. Verify credentials: Use seed data (Hotel Paradise / password123)
4. Clear localStorage: `localStorage.clear()` then retry

### Issue: "Session doesn't persist after refresh"
**Solutions:**
1. Check localStorage has tokens:
   ```javascript
   localStorage.getItem('foodconnect_token') != null  // Should be true
   localStorage.getItem('foodconnect_session') != null // Should be true
   ```
2. Check if tokens are valid:
   ```javascript
   JSON.parse(localStorage.getItem('foodconnect_session')).user.email
   ```
3. Check network tab: Any 401 errors?

### Issue: "API calls fail with 401"
**Solutions:**
1. Check Authorization header exists:
   - DevTools → Network → Click request → Headers
2. Check token format:
   - Should start with "Bearer "
3. Check token is valid:
   - May have expired
   - Login again to get fresh token

### Issue: "Stuck in login redirect loop"
**Solutions:**
1. Clear localStorage: `localStorage.clear()`
2. Clear cookies: `document.cookie = ""`
3. Reload page
4. Login again fresh

---

## Final Verification Checklist

- [ ] Login works without errors
- [ ] Session persists after refresh
- [ ] Token appears in API requests
- [ ] Logout clears all data
- [ ] Error messages are specific
- [ ] Console shows no red flags
- [ ] Navigation doesn't logout
- [ ] Registration works
- [ ] 401 responses redirect to login
- [ ] No infinite loops or flicker

---

## Success Criteria

When all 10 tests pass + all checklist items are checked:

✅ **AUTHENTICATION SYSTEM IS PRODUCTION READY**

Date Tested: ___________  
Tested By: ___________  
Status: ✅ PASS / ❌ FAIL

---

For more details, see: `AUTH_SYSTEM_FIX_REPORT.md`
