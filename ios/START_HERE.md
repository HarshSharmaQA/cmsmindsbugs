# 🚀 BugScribe iOS - START HERE

## ❓ What's Not Working?

You mentioned "ios app is not working" - let's fix it! Choose the scenario that matches your situation:

---

## 📋 **Scenario 1: Build Errors in Xcode**

### Symptoms:
- Red errors in Xcode
- "No such module 'PencilKit'" error
- Build fails (Cmd+B)

### Solution:

**Step 1: Add PencilKit Framework**
1. Open `ios/BugScribe/BugScribe.xcodeproj` in Xcode
2. Click on **BugScribe** (blue icon) in the Project Navigator
3. Select **BugScribe** under TARGETS
4. Click **Build Phases** tab
5. Expand **Link Binary With Libraries**
6. Click the **+** button
7. Search for "PencilKit"
8. Select **PencilKit.framework**
9. Click **Add**

**Step 2: Clean and Rebuild**
1. **Product > Clean Build Folder** (⇧⌘K)
2. **Product > Build** (⌘B)
3. Should now build successfully ✅

---

## 📋 **Scenario 2: App Builds But Crashes**

### Symptoms:
- App builds successfully
- App launches then crashes
- Black screen or immediate close

### Solution:

**Reset App Data:**
1. Delete the app from simulator/device
2. In Xcode: **Product > Clean Build Folder** (⇧⌘K)
3. Rebuild and run (⌘R)

**Check Console:**
1. In Xcode, open **View > Debug Area > Activate Console** (⇧⌘C)
2. Run the app again
3. Look for crash messages
4. Share the error for specific help

---

## 📋 **Scenario 3: App Runs But Can't Submit Bugs**

### Symptoms:
- App launches fine
- Can navigate between tabs
- Error when trying to submit: "No active project selected" or "Please set your name"

### Solution:

**Step 1: Add a Project**
1. Launch the app
2. You should see the **Projects** tab
3. Tap the **+** button (top right corner)
4. Fill in the form:
   - **Project Name**: Any name (e.g., "My App")
   - **Project ID**: Get this from your BugScribe web dashboard
   - **API Key**: Get this from your BugScribe web dashboard
   - **Connection Key**: Leave empty (optional)
5. Tap **Add Project**
6. You should see a green checkmark next to your project ✅

**Step 2: Set Your Name**
1. Go to the **Settings** tab (gear icon)
2. Enter your **Name** (required)
3. Enter your **Email** (optional)
4. Tap **Save User Information**
5. You should see "User information saved successfully" ✅

**Step 3: Submit a Test Bug**
1. Go to **Report Bug** tab (ladybug icon)
2. Fill in:
   - **Title**: "Test Bug"
   - **Type**: Select any (e.g., General)
   - **Priority**: Select any (e.g., Medium)
   - **Description**: "Testing the app"
3. Optionally add a screenshot
4. Tap **Submit Bug Report**
5. Should see "Bug report submitted successfully!" ✅

---

## 📋 **Scenario 4: Camera/Photos Not Working**

### Symptoms:
- Can't take screenshots
- Can't select photos from library
- Permission errors

### Solution:

**For Simulator:**
1. Drag an image file onto the simulator
2. It will be saved to the Photos app
3. Try selecting from library again

**For Physical Device:**
1. Go to iOS **Settings** app
2. Scroll down to **BugScribe**
3. Enable **Camera** permission
4. Enable **Photos** permission
5. Return to BugScribe app
6. Try again

---

## 📋 **Scenario 5: Network/API Errors**

### Symptoms:
- "Server error: 401" or "Server error: 403"
- "Invalid response from server"
- Submission fails

### Solution:

**Check Your Credentials:**
1. Go to **Projects** tab
2. Your Project ID and API Key might be wrong
3. Delete the project (swipe left > Delete)
4. Add it again with correct credentials from your dashboard

**Check Internet:**
1. Make sure you're connected to WiFi or cellular
2. Try opening Safari and loading a website
3. Try submitting again

**Check Backend:**
1. The app connects to: `https://cmsmindsqa.vercel.app`
2. Try opening this URL in Safari
3. If it doesn't load, the server might be down
4. Wait a few minutes and try again

---

## 📋 **Scenario 6: Can't Open in Xcode**

### Symptoms:
- Double-clicking .xcodeproj doesn't work
- Xcode not installed
- Wrong Xcode version

### Solution:

**Install/Update Xcode:**
1. Open **App Store** on your Mac
2. Search for "Xcode"
3. Install or Update to latest version (15.0+)
4. Wait for installation (it's large, ~10GB)
5. Open Xcode once to accept license agreement

**Open the Project:**
1. Launch Xcode
2. **File > Open**
3. Navigate to: `ios/BugScribe/BugScribe.xcodeproj`
4. Click **Open**

---

## 🎯 **Quick Start (If Everything Works)**

If you just want to get started quickly:

1. **Open Project**
   ```bash
   cd ios/BugScribe
   open BugScribe.xcodeproj
   ```

2. **Select Simulator**
   - Click the device dropdown (top left)
   - Choose "iPhone 15 Pro" or any iPhone simulator

3. **Run**
   - Press **⌘R** (Cmd+R)
   - Wait for build and launch

4. **Add Project**
   - Tap **+** button
   - Enter your project details
   - Tap **Add Project**

5. **Set Name**
   - Go to **Settings** tab
   - Enter your name
   - Tap **Save**

6. **Report Bug**
   - Go to **Report Bug** tab
   - Fill in details
   - Tap **Submit**

---

## 🔍 **Still Not Working?**

### Get More Help:

1. **Run Diagnostic** (macOS/Linux only):
   ```bash
   bash ios/QUICK_FIX.sh
   ```

2. **Read Detailed Guides:**
   - [FIX_COMMON_ISSUES.md](FIX_COMMON_ISSUES.md) - Quick fixes
   - [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Detailed troubleshooting
   - [SETUP_GUIDE.md](SETUP_GUIDE.md) - Complete setup guide
   - [FAQ.md](FAQ.md) - Frequently asked questions

3. **Check Requirements:**
   - macOS Ventura (13.0) or later
   - Xcode 15.0 or later
   - iOS 16.0+ device/simulator

4. **Get Support:**
   - Create a GitHub issue with:
     - What's not working (be specific)
     - Error messages (screenshots)
     - Your Xcode version
     - Your macOS version
   - Email: harshsharmaqa@gmail.com

---

## ✅ **Success Checklist**

You'll know it's working when:

- [ ] Project builds without errors (⌘B)
- [ ] App launches and shows 3 tabs
- [ ] Can add a project
- [ ] Can set your name in Settings
- [ ] Can fill in bug report form
- [ ] Can submit a bug successfully
- [ ] See "Bug report submitted successfully!" message

---

## 📚 **Documentation Index**

- **START_HERE.md** ← You are here
- [README.md](README.md) - Complete feature documentation
- [QUICK_START.md](QUICK_START.md) - 5-minute quick start
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed setup instructions
- [FIX_COMMON_ISSUES.md](FIX_COMMON_ISSUES.md) - Quick fixes
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Detailed troubleshooting
- [FAQ.md](FAQ.md) - Frequently asked questions
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical architecture
- [CHECKLIST.md](CHECKLIST.md) - Testing checklist

---

## 💡 **Pro Tips**

1. **Use iPhone 15 Pro Simulator** - Best compatibility
2. **Enable Keyboard** - Simulator > I/O > Keyboard > Connect Hardware Keyboard
3. **Take Screenshots** - Simulator > File > Save Screen
4. **Debug Console** - View > Debug Area > Activate Console (⇧⌘C)
5. **Clean Often** - Product > Clean Build Folder (⇧⌘K) fixes many issues

---

**Last Updated:** April 16, 2026

**Need immediate help?** Tell me specifically:
1. What step are you on?
2. What error do you see?
3. What have you tried?

I'll provide a targeted solution! 🚀
