# 🚀 Quick Fix Guide - Extension Not Submitting

## ⚡ Instant Fix (Most Common)

### 1. Make Sure Server is Running
```bash
npm run dev
```
**Expected:** Server running at http://localhost:3000

### 2. Reload Extension
1. Go to `chrome://extensions/`
2. Find "BugScribe Reporter"
3. Click the reload icon 🔄

### 3. Test Submission
- Click extension icon
- Take screenshot
- Fill title
- Click "Submit Bug Report"

---

## 🔍 If Still Not Working

### Check #1: Is Server Running?
```bash
# Test if server responds
curl http://localhost:3000

# Should return HTML or JSON, not "Connection refused"
```

**Fix if not running:**
```bash
npm run dev
```

### Check #2: Are Credentials Set?
1. Click extension icon
2. Look for "Connection Key" field
3. If visible, you need to connect

**Fix:**
1. Open http://localhost:3000/dashboard
2. Go to your project
3. Find "Integrations" or "API" section
4. Copy connection key
5. Paste in extension

### Check #3: Is API Endpoint Correct?
1. Right-click extension icon
2. Click "Options"
3. Check "API Endpoint" field
4. Should be: `http://localhost:3000/api/reports`

**Fix if wrong:**
- Update to correct URL
- Click "Save Settings"
- Reload extension

### Check #4: Check Console for Errors
1. Click extension icon
2. Right-click popup
3. Click "Inspect"
4. Look at Console tab

**Common errors and fixes:**

❌ `Failed to fetch`
→ Server not running. Run `npm run dev`

❌ `401` or `403`
→ Wrong credentials. Get new connection key

❌ `404`
→ Wrong API endpoint. Check settings

❌ `500`
→ Server error. Check server terminal

---

## 🛠️ Complete Reset (Nuclear Option)

If nothing works, do a complete reset:

### Step 1: Clear Extension Storage
```javascript
// In extension popup console (right-click → Inspect)
chrome.storage.local.clear(() => console.log('Cleared'));
```

### Step 2: Reload Extension
1. Go to `chrome://extensions/`
2. Click reload on BugScribe

### Step 3: Reconfigure
1. Get fresh connection key from dashboard
2. Paste in extension
3. Test submission

---

## 📋 Quick Checklist

Before asking for help, verify:

- [ ] Server is running (`npm run dev`)
- [ ] Extension is loaded and enabled
- [ ] Extension is reloaded after any changes
- [ ] Connection key is configured
- [ ] API endpoint is correct (http://localhost:3000/api/reports)
- [ ] Browser console shows no errors
- [ ] Server terminal shows no errors

---

## 🎯 Test API Directly

Test if API works without extension:

```bash
# Test CORS
curl -X OPTIONS http://localhost:3000/api/reports -v

# Should see:
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Methods: POST, OPTIONS
```

---

## 💡 Pro Tips

### Tip 1: Use Diagnostic Tool
1. Open `extension/diagnostic.html` in browser
2. Run all tests
3. See exactly what's wrong

### Tip 2: Enable Debug Mode
```javascript
// In extension popup console
await BugScribeConfig.set('enableDebugMode', true);
```

### Tip 3: Watch Server Logs
Keep terminal visible while testing to see:
- Incoming requests
- Errors
- Response codes

### Tip 4: Check Network Tab
1. Open extension popup
2. Right-click → Inspect
3. Go to Network tab
4. Submit bug report
5. Look for POST to `/api/reports`
6. Check status code and response

---

## 🆘 Still Stuck?

### Gather Debug Info

1. **Extension Console Logs**
   - Right-click extension icon → Inspect
   - Copy all console output

2. **Server Terminal Output**
   - Copy last 20 lines from terminal

3. **Configuration**
   ```javascript
   // In extension popup console
   BugScribeConfig.getAll().then(c => console.log(JSON.stringify(c, null, 2)));
   ```

4. **Test Results**
   ```bash
   curl -X OPTIONS http://localhost:3000/api/reports -v
   ```

### Share This Info
- Extension console logs
- Server terminal output
- Configuration JSON
- CURL test results
- Browser version
- OS version

---

## 📞 Quick Commands Reference

```bash
# Start server
npm run dev

# Test server
curl http://localhost:3000

# Test API endpoint
curl -X OPTIONS http://localhost:3000/api/reports

# Check if port is in use
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill process on port (if needed)
kill -9 $(lsof -t -i:3000)  # Mac/Linux
```

---

## ✅ Success Indicators

You'll know it's working when you see:

**In Extension Console:**
```
🔍 Submitting bug report...
✅ Environment data collected
📸 Converting canvas to blob...
✅ Media attached: screenshot.webp Size: 245 KB
🌐 Sending to: http://localhost:3000/api/reports
📡 Response status: 200
✅ Bug report submitted successfully
```

**In Server Terminal:**
```
POST /api/reports 200 in 1234ms
```

**In Extension:**
- Success view appears
- "Report Sent!" message
- Auto-resets after 3 seconds

**In Dashboard:**
- New bug appears in list
- Screenshot is visible
- All details are saved

---

## 🎉 That's It!

If you followed this guide and it's still not working:
1. Check `EXTENSION_FIXES_SUMMARY.md` for detailed fixes
2. Use `EXTENSION_LOCALHOST_SETUP.md` for complete setup
3. Open `extension/diagnostic.html` for automated testing

**Most issues are solved by:**
1. Making sure server is running
2. Reloading the extension
3. Using correct API endpoint

Good luck! 🚀
