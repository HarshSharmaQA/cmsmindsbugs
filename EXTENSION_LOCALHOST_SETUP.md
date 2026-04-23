# BugScribe Extension - Localhost Setup Guide

## Quick Setup for Development

### 1. Start Your Local Server

```bash
# Make sure your Next.js app is running
npm run dev

# Default: http://localhost:3000
```

### 2. Configure Extension for Localhost

The extension is now pre-configured to use `http://localhost:3000/api/reports` by default.

#### Option A: Use Default (Recommended for Development)
No configuration needed! The extension will automatically use localhost.

#### Option B: Change API Endpoint
1. Right-click the extension icon
2. Click "Options" or "Settings"
3. Go to "Connection" tab
4. Update "API Endpoint" to your local URL:
   - `http://localhost:3000/api/reports` (default)
   - `http://localhost:3001/api/reports` (if using different port)
   - `http://127.0.0.1:3000/api/reports` (alternative)

### 3. Get Your Connection Key

1. Open your local dashboard: `http://localhost:3000/dashboard`
2. Go to your project
3. Navigate to "Integrations" or "API" section
4. Copy the connection key
5. Paste it in the extension popup

### 4. Test the Extension

1. Click the extension icon
2. Take a screenshot or record
3. Fill in bug details
4. Click "Submit Bug Report"
5. Check your local dashboard for the new bug

---

## Troubleshooting

### Error: "Network error. Make sure your server is running."

**Solution:**
1. Verify your server is running: `npm run dev`
2. Check the console for the port number
3. Update extension settings if using a different port
4. Make sure no firewall is blocking localhost

### Error: "Failed to fetch"

**Causes:**
- Server not running
- Wrong port number
- CORS issues (should be fixed now)

**Solution:**
```bash
# Restart your development server
npm run dev

# Check if API is accessible
curl http://localhost:3000/api/reports
```

### Error: "Authentication failed"

**Solution:**
1. Get a fresh connection key from your dashboard
2. Reconnect the extension
3. Make sure you're using the correct project

### Error: "Could not establish connection"

This warning is normal and can be ignored. It occurs when:
- Content script tries to communicate before page is ready
- Extension popup closes before response arrives

### Canvas Warning

The warning about `willReadFrequently` is now fixed. If you still see it:
1. Reload the extension
2. Clear browser cache
3. Restart browser

---

## Development Workflow

### 1. Make Changes to Extension

```bash
# Edit files in extension/ directory
extension/popup.js
extension/config.js
extension/manifest.json
```

### 2. Reload Extension

1. Go to `chrome://extensions/`
2. Find "BugScribe Reporter"
3. Click the reload icon 🔄
4. Test your changes

### 3. Debug Extension

#### View Console Logs
```javascript
// In popup.js - logs appear in popup console
console.log("Debug info:", data);

// In content.js - logs appear in page console
console.log("Content script:", data);

// In background.js - logs appear in service worker console
console.log("Background:", data);
```

#### Access Consoles
- **Popup Console**: Right-click extension icon → Inspect popup
- **Background Console**: chrome://extensions/ → Service Worker → Inspect
- **Content Console**: F12 on any webpage

### 4. Test API Endpoint

```bash
# Test with curl
curl -X POST http://localhost:3000/api/reports \
  -F "projectId=YOUR_PROJECT_ID" \
  -F "apiKey=YOUR_API_KEY" \
  -F "title=Test Bug" \
  -F "description=Testing from curl" \
  -F "priority=medium"
```

---

## Configuration Options

### Default Configuration (config.js)

```javascript
{
    apiEndpoint: 'http://localhost:3000/api/reports',
    apiTimeout: 30000,
    screenshotQuality: 60,
    screenshotFormat: 'jpeg',
    // ... more options
}
```

### Change Configuration

#### Via Settings Page
1. Right-click extension → Options
2. Modify settings
3. Click "Save Settings"

#### Via Code
```javascript
// In browser console (popup)
await BugScribeConfig.set('apiEndpoint', 'http://localhost:3001/api/reports');
```

#### Via Import
1. Export current config
2. Edit JSON file
3. Import back

---

## Multiple Environments

### Switch Between Localhost and Production

#### Method 1: Settings Page
1. Open extension settings
2. Change API endpoint
3. Save

#### Method 2: Configuration Profiles

Create config files:

**localhost-config.json**
```json
{
    "version": "2.0",
    "timestamp": 1234567890,
    "config": {
        "apiEndpoint": "http://localhost:3000/api/reports",
        "enableDebugMode": true
    }
}
```

**production-config.json**
```json
{
    "version": "2.0",
    "timestamp": 1234567890,
    "config": {
        "apiEndpoint": "https://bug-higt.vercel.app/api/reports",
        "enableDebugMode": false
    }
}
```

Import as needed via Settings → Advanced → Import Config

---

## Debugging Tips

### 1. Enable Debug Mode

```javascript
// In extension settings
await BugScribeConfig.set('enableDebugMode', true);
```

### 2. Check Network Requests

1. Open popup
2. Right-click → Inspect
3. Go to Network tab
4. Submit a bug report
5. Check the POST request to `/api/reports`

### 3. View FormData

```javascript
// In popup.js, before fetch
for (let [key, value] of formData.entries()) {
    console.log(key, value);
}
```

### 4. Test Connection

```javascript
// In popup console
fetch('http://localhost:3000/api/reports', {
    method: 'OPTIONS'
}).then(r => console.log('CORS OK:', r.status));
```

---

## Common Issues & Solutions

### Issue: Extension can't connect to localhost

**Solution:**
1. Check manifest.json has localhost permission:
```json
"host_permissions": [
    "http://localhost:*/*"
]
```

2. Reload extension after changes

### Issue: CORS errors

**Solution:**
Already fixed in `app/api/reports/route.ts`:
```typescript
const ALLOWED_ORIGINS = [
    "chrome-extension://",
    "http://localhost",
    // ...
];
```

### Issue: Screenshot not uploading

**Solution:**
1. Check file size (should be < 10MB)
2. Verify Convex storage is configured
3. Check console for upload errors

### Issue: Environment data not collected

**Solution:**
This is normal if:
- Page just loaded
- Content script not injected yet
- Page has CSP restrictions

The extension will still work without environment data.

---

## Production Deployment

### 1. Update Configuration

```javascript
// Change default in config.js
apiEndpoint: 'https://your-production-domain.com/api/reports'
```

### 2. Update Manifest

```json
{
    "version": "2.2",
    "host_permissions": [
        "https://your-production-domain.com/*"
    ]
}
```

### 3. Build & Package

```bash
# Zip extension folder
cd extension
zip -r bugscribe-extension-v2.2.zip .

# Upload to Chrome Web Store
```

---

## Environment Variables

### Required for Server

```env
# .env.local
NEXT_PUBLIC_CONVEX_URL=https://your-convex-url.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=http://localhost:3000
```

### Optional for Extension

Extension doesn't need environment variables - all config is in:
- `extension/config.js` (defaults)
- Chrome storage (user settings)

---

## Testing Checklist

- [ ] Server running on localhost
- [ ] Extension loaded and enabled
- [ ] Connection key configured
- [ ] Screenshot capture works
- [ ] Video recording works
- [ ] Annotation tools work
- [ ] Form submission succeeds
- [ ] Bug appears in dashboard
- [ ] Console shows no errors
- [ ] Network tab shows 200 response

---

## Quick Commands

```bash
# Start development server
npm run dev

# Check if server is running
curl http://localhost:3000

# Test API endpoint
curl -X OPTIONS http://localhost:3000/api/reports

# View extension logs
# chrome://extensions/ → Service Worker → Inspect

# Reload extension
# chrome://extensions/ → Reload button
```

---

## Support

### Check Logs
1. Extension popup console
2. Background service worker console
3. Page console (F12)
4. Server terminal output

### Common Log Messages

✅ **Success:**
```
🔍 Submitting bug report...
✅ Environment data collected
📸 Converting canvas to blob...
✅ Media attached: screenshot.webp Size: 245 KB
🌐 Sending to: http://localhost:3000/api/reports
📡 Response status: 200
✅ Bug report submitted successfully
```

❌ **Errors:**
```
❌ Failed to submit bug report: Network error
⚠️ Server error. Please try again in a moment.
🔒 Authentication failed. Please reconnect your extension.
```

---

## Advanced Configuration

### Custom API Endpoint with Auth

```javascript
// If your API needs custom headers
// Modify popup.js fetch call:
const response = await fetch(apiEndpoint, {
    method: "POST",
    body: formData,
    headers: {
        'X-Custom-Auth': 'your-token'
    }
});
```

### Proxy Configuration

If using a proxy:

```javascript
// In config.js
apiEndpoint: 'http://localhost:8080/proxy/api/reports'
```

### Multiple Projects

1. Export config for each project
2. Name files: `project-a-config.json`, `project-b-config.json`
3. Import as needed when switching projects

---

## Version History

### v2.1 (Current)
- ✅ Localhost support added
- ✅ Better error handling
- ✅ Improved CORS configuration
- ✅ Canvas performance fix
- ✅ Timeout handling

### v2.0
- Initial release with basic functionality

---

**Need Help?**
1. Check console logs
2. Verify server is running
3. Test API endpoint directly
4. Check configuration settings
5. Review this guide

**Still stuck?**
- Check GitHub issues
- Contact support with logs
- Include browser version and OS
