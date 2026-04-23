# BugScribe iOS - Troubleshooting Guide

## 🚨 Common Issues and Solutions

### Issue #1: App Won't Build - "No such module 'PencilKit'"

**Symptoms:**
- Build fails with error: `No such module 'PencilKit'`
- AnnotationView.swift shows compilation errors

**Solution:**
1. Open `BugScribe.xcodeproj` in Xcode
2. Select the **BugScribe** target in the project navigator
3. Go to **Build Phases** tab
4. Expand **Link Binary With Libraries**
5. Click the **+** button
6. Search for **PencilKit.framework**
7. Click **Add**
8. Clean build folder: **Product > Clean Build Folder** (Cmd+Shift+K)
9. Build again: **Product > Build** (Cmd+B)

**Alternative Solution:**
PencilKit is available by default on iOS 13+, but if you're targeting iOS 16+, it should work automatically. Make sure your deployment target is set correctly:
1. Select the BugScribe target
2. Go to **Build Settings**
3. Search for "iOS Deployment Target"
4. Ensure it's set to **iOS 16.0** or later

---

### Issue #2: "No Active Project Selected" Error

**Symptoms:**
- Can't submit bug reports
- Error message: "No active project selected"

**Solution:**
1. Go to the **Projects** tab
2. Tap the **+** button (top right)
3. Fill in your project details:
   - Project Name: Any friendly name
   - Project ID: From your BugScribe dashboard
   - API Key: From your BugScribe dashboard
4. Tap **Add Project**
5. The project should now have a green checkmark
6. Go back to **Report Bug** tab

---

### Issue #3: "Please Set Your Name in Settings" Error

**Symptoms:**
- Can't submit bug reports
- Error message: "Please set your name in Settings"

**Solution:**
1. Go to the **Settings** tab
2. Enter your name in the **Name** field
3. Optionally enter your email
4. Tap **Save User Information**
5. Go back to **Report Bug** tab

---

### Issue #4: Camera/Photo Library Not Working

**Symptoms:**
- Camera button doesn't work
- Can't select photos from library
- Permission denied errors

**Solution:**
1. Go to iOS **Settings** app
2. Scroll down to **BugScribe**
3. Enable **Camera** permission
4. Enable **Photos** permission
5. Return to BugScribe app
6. Try again

**If permissions are already enabled:**
1. Force quit the BugScribe app
2. Reopen it
3. Try again

---

### Issue #5: Network/Submission Errors

**Symptoms:**
- Bug submission fails
- Error: "Server error: 401" or "Server error: 403"
- Error: "Invalid response from server"

**Solution:**

**Check Project Credentials:**
1. Go to **Projects** tab
2. Verify your Project ID and API Key are correct
3. If wrong, delete the project and add it again with correct credentials

**Check Internet Connection:**
1. Open Safari and try loading a website
2. Check if you're connected to WiFi or cellular data
3. Try submitting again

**Check Backend Server:**
1. The app connects to: `https://cmsmindsqa.vercel.app`
2. Try opening this URL in Safari to verify it's accessible
3. If the server is down, wait and try again later

---

### Issue #6: App Crashes on Launch

**Symptoms:**
- App opens then immediately closes
- Black screen then crash

**Solution:**

**Reset App Data:**
1. Delete the app from your device/simulator
2. In Xcode, clean build folder: **Product > Clean Build Folder**
3. Rebuild and reinstall the app

**Check Console Logs:**
1. In Xcode, open **Window > Devices and Simulators**
2. Select your device
3. Click **Open Console**
4. Look for crash logs related to BugScribe
5. Share the error message for further help

---

### Issue #7: Annotations Not Saving

**Symptoms:**
- Draw on screenshot but annotations disappear
- "Done" button doesn't save changes

**Solution:**
1. Make sure you tap **Done** (not Cancel) after annotating
2. Check that you have enough storage space on your device
3. Try with a smaller image
4. If issue persists, try restarting the app

---

### Issue #8: Screenshot Preview Not Showing

**Symptoms:**
- Selected image doesn't appear in bug report
- Image preview is blank

**Solution:**
1. Try selecting a different image
2. Make sure the image is not corrupted
3. Try taking a new screenshot with the camera
4. Check photo library permissions (see Issue #4)

---

### Issue #9: Code Signing Issues

**Symptoms:**
- "No signing certificate found"
- "Provisioning profile doesn't match"
- Can't run on physical device

**Solution:**

**For Simulator (No Apple ID needed):**
1. Select any iOS Simulator as the target
2. Build and run (Cmd+R)

**For Physical Device:**
1. Go to **Xcode > Settings > Accounts**
2. Click **+** and add your Apple ID
3. Select the BugScribe target
4. Go to **Signing & Capabilities**
5. Check **Automatically manage signing**
6. Select your team from the dropdown
7. Change the bundle identifier to something unique:
   - Example: `com.yourname.bugscribe`
8. Build and run

---

### Issue #10: Tab Bar Not Showing "Report Bug" Tab

**Symptoms:**
- Only see Projects and Settings tabs
- Report Bug tab is missing

**Solution:**
This is **expected behavior**! The Report Bug tab only appears after you add a project.

1. Go to **Projects** tab
2. Add at least one project
3. The **Report Bug** tab will appear automatically

---

## 🔧 Advanced Troubleshooting

### Reset All App Data

If nothing else works, reset all app data:

```swift
// Run this in Xcode's Debug Console while app is running:
UserDefaults.standard.removePersistentDomain(forName: Bundle.main.bundleIdentifier!)
```

Or simply delete and reinstall the app.

---

### Enable Debug Logging

To see detailed network logs, add this to `NetworkManager.swift`:

```swift
private init() {
    // Add this for debugging
    URLSession.shared.configuration.timeoutIntervalForRequest = 30
    print("NetworkManager initialized with baseURL: \(baseURL)")
}
```

---

### Check Backend API Manually

Test the API endpoint manually:

```bash
curl -X POST https://cmsmindsqa.vercel.app/api/submit-bug \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "YOUR_PROJECT_ID",
    "apiKey": "YOUR_API_KEY",
    "title": "Test Bug",
    "description": "Testing from curl",
    "type": "general",
    "priority": "medium",
    "reporterName": "Test User",
    "reporterEmail": "test@example.com",
    "screenshot": "",
    "deviceInfo": {
      "deviceModel": "iPhone",
      "osVersion": "16.0",
      "appVersion": "1.0",
      "screenSize": "390x844",
      "platform": "iOS"
    },
    "createdAt": "2026-04-16T00:00:00Z"
  }'
```

---

## 📱 Device-Specific Issues

### iPhone SE (Small Screen)
- Some UI elements might be cramped
- Scroll to see all content
- Rotate to landscape for more space

### iPad
- App works but is not optimized for iPad
- Use in portrait mode for best experience
- iPad-specific UI is planned for future release

### iOS 16.0 (Minimum Version)
- Make sure your device is running iOS 16.0 or later
- Check: Settings > General > About > Software Version
- Update iOS if needed

---

## 🆘 Still Having Issues?

If none of these solutions work:

1. **Check the documentation:**
   - [README.md](README.md) - Complete feature guide
   - [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed setup
   - [FAQ.md](FAQ.md) - Common questions

2. **Gather information:**
   - What exactly is not working?
   - What error messages do you see?
   - What steps did you take before the issue?
   - Device model and iOS version
   - Screenshots of the error

3. **Get help:**
   - Create a GitHub issue with the information above
   - Email: harshsharmaqa@gmail.com
   - Include Xcode console logs if available

---

## ✅ Quick Checklist

Before asking for help, verify:

- [ ] Xcode 15.0+ is installed
- [ ] iOS 16.0+ device/simulator
- [ ] Project builds without errors
- [ ] At least one project is added
- [ ] User name is set in Settings
- [ ] Internet connection is working
- [ ] Camera/Photos permissions are granted
- [ ] Project ID and API Key are correct

---

**Last Updated:** April 16, 2026
