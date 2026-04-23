# Force Extension Reload - Fix Cached Version Issue

## Problem
The extension is showing "Preparing..." button text which doesn't exist in the current code. This means Chrome is loading a cached version of the extension files.

## Solution: Complete Extension Reload

### Method 1: Hard Reload Extension (Recommended)

1. **Open Chrome Extensions Page**:
   ```
   chrome://extensions/
   ```

2. **Remove the Extension**:
   - Find "BugScribe Reporter"
   - Click "Remove"
   - Confirm removal

3. **Close ALL Chrome Windows**:
   - Close every Chrome window completely
   - Wait 5 seconds

4. **Reopen Chrome**:
   - Open Chrome again
   - Go to `chrome://extensions/`

5. **Enable Developer Mode**:
   - Toggle "Developer mode" in top right

6. **Load Extension Again**:
   - Click "Load unpacked"
   - Select the `extension` folder
   - Extension will reload with fresh files

### Method 2: Clear Extension Cache (Alternative)

1. **Open Chrome Extensions Page**:
   ```
   chrome://extensions/
   ```

2. **Get Extension ID**:
   - Find "BugScribe Reporter"
   - Copy the ID (long string under the name)

3. **Clear Service Worker**:
   - Click "service worker" link (if shown)
   - In DevTools, go to Application tab
   - Click "Clear storage"
   - Check all boxes
   - Click "Clear site data"

4. **Reload Extension**:
   - Go back to `chrome://extensions/`
   - Click reload icon on BugScribe

5. **Hard Refresh Any Open Tabs**:
   - Press `Ctrl + Shift + R` (Windows/Linux)
   - Or `Cmd + Shift + R` (Mac)

### Method 3: Update Extension Version (Forces Cache Clear)

1. **Edit manifest.json**:
   ```json
   {
     "manifest_version": 3,
     "name": "BugScribe Reporter",
     "version": "2.2",  // ← Change from 2.1 to 2.2
     ...
   }
   ```

2. **Reload Extension**:
   - Go to `chrome://extensions/`
   - Click reload icon on BugScribe
   - Chrome will detect version change and clear cache

### Method 4: Add Cache Buster to Files

This is already done in content.js:
```javascript
iframe.src = chrome.runtime.getURL('popup.html?v=' + Date.now());
```

But you need to reload the extension for this to take effect.

## Verification Steps

After reloading:

1. **Check Extension Version**:
   - Go to `chrome://extensions/`
   - Expand BugScribe details
   - Verify version is 2.1 or higher

2. **Open Extension**:
   - Click the purple side tab
   - Or click extension icon

3. **Check Button Text**:
   - Should show "🚀 Submit Bug Report"
   - NOT "Preparing..."

4. **Test Submission**:
   - Fill in bug title
   - Click submit
   - Should show "📤 Sending..."
   - After success, should reset to "🚀 Submit Bug Report"

5. **Test Second Submission**:
   - Fill in another bug
   - Click submit again
   - Should work without getting stuck

## Why This Happens

Chrome aggressively caches extension files for performance:
- JavaScript files are cached
- HTML files are cached
- CSS files are cached
- Service workers are cached

When you update extension code, Chrome may not immediately load the new version.

## Prevention

To avoid this in the future:

1. **Always increment version** in manifest.json when making changes
2. **Use cache busters** in URLs (already implemented)
3. **Clear cache** before testing changes
4. **Use incognito mode** for testing (less caching)

## Quick Test Script

Run this in the browser console to check which version is loaded:

```javascript
// Check if new code is loaded
console.log('Testing button text...');
const btn = document.getElementById('submitBtn');
if (btn) {
  console.log('Button text:', btn.textContent);
  console.log('Expected: 🚀 Submit Bug Report');
  console.log('Match:', btn.textContent === '🚀 Submit Bug Report');
} else {
  console.log('Button not found - wrong view?');
}
```

## Still Not Working?

If the issue persists after trying all methods:

1. **Check if you're editing the right file**:
   ```bash
   # In extension folder
   grep -n "Preparing" *.js *.html
   # Should return no results
   ```

2. **Verify file timestamps**:
   - Check when popup.js was last modified
   - Should be recent (today's date)

3. **Check for multiple extension folders**:
   - You might have loaded the extension from a different folder
   - Remove all BugScribe extensions and reload from correct folder

4. **Try a different browser**:
   - Test in Edge (also Chromium-based)
   - If it works there, it's definitely a Chrome cache issue

## Emergency Fix: Rename Files

If nothing else works:

1. **Rename popup.js**:
   ```
   popup.js → popup-v2.js
   ```

2. **Update popup.html**:
   ```html
   <script src="popup-v2.js"></script>
   ```

3. **Reload extension**:
   - Chrome will see it as a new file
   - Forces fresh load

## Contact Support

If you've tried everything and it still shows "Preparing...":
1. Share screenshot of `chrome://extensions/` page
2. Share output of the test script above
3. Share file modification timestamps
4. We'll help debug further

---

**Remember**: Always reload the extension after making code changes!
