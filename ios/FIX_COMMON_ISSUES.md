# Quick Fix Guide for BugScribe iOS

## 🚀 Most Common Issue: PencilKit Framework Missing

### The Problem
The app uses `PencilKit` for annotations but the framework might not be linked in the Xcode project.

### The Fix (2 minutes)

**Option 1: Add PencilKit Framework (Recommended)**

1. Open `ios/BugScribe/BugScribe.xcodeproj` in Xcode
2. Click on **BugScribe** project in the navigator (blue icon at top)
3. Select the **BugScribe** target (under TARGETS)
4. Click the **Build Phases** tab
5. Expand **Link Binary With Libraries**
6. Click the **+** button at the bottom
7. Type "PencilKit" in the search box
8. Select **PencilKit.framework**
9. Click **Add**
10. Clean: **Product > Clean Build Folder** (⇧⌘K)
11. Build: **Product > Build** (⌘B)

**Option 2: Import PencilKit Explicitly**

The framework is already imported in `AnnotationView.swift`:
```swift
import PencilKit
```

This should work automatically on iOS 13+. If it doesn't, use Option 1.

---

## 🔧 Other Quick Fixes

### Fix #1: Build Errors

```bash
# In Terminal, navigate to the iOS project:
cd ios/BugScribe

# Clean derived data:
rm -rf ~/Library/Developer/Xcode/DerivedData/BugScribe-*

# Then in Xcode:
# Product > Clean Build Folder (⇧⌘K)
# Product > Build (⌘B)
```

### Fix #2: Simulator Not Working

1. In Xcode, go to **Window > Devices and Simulators**
2. Click the **Simulators** tab
3. Click **+** to add a new simulator
4. Choose **iPhone 15 Pro** with **iOS 17.0+**
5. Click **Create**
6. Select this simulator as your target
7. Run the app (⌘R)

### Fix #3: Can't Run on Physical Device

1. Connect your iPhone/iPad via USB
2. Trust the computer on your device
3. In Xcode, select your device from the target dropdown
4. Go to **Signing & Capabilities** tab
5. Check **Automatically manage signing**
6. Select your Apple ID team
7. Change Bundle Identifier to: `com.yourname.bugscribe`
8. Run (⌘R)

### Fix #4: App Runs But Can't Submit Bugs

**Step 1: Add a Project**
1. Launch the app
2. Tap **+** button (top right)
3. Enter:
   - **Project Name**: "My Test Project"
   - **Project ID**: Get from your BugScribe dashboard
   - **API Key**: Get from your BugScribe dashboard
4. Tap **Add Project**

**Step 2: Set Your Name**
1. Go to **Settings** tab
2. Enter your name
3. Tap **Save User Information**

**Step 3: Try Submitting**
1. Go to **Report Bug** tab
2. Fill in title and description
3. Tap **Submit Bug Report**

### Fix #5: Camera/Photos Not Working

Run this in Terminal:
```bash
# Reset simulator permissions:
xcrun simctl privacy booted reset all com.bugscribe.BugScribe

# Then relaunch the app
```

For physical devices:
1. Settings > BugScribe
2. Enable Camera and Photos
3. Restart the app

---

## 🎯 Verify Everything Works

### Quick Test Checklist

1. **Build Test**
   ```
   ⌘B (Build)
   Should complete with "Build Succeeded"
   ```

2. **Launch Test**
   ```
   ⌘R (Run)
   App should launch and show 3 tabs
   ```

3. **Project Test**
   ```
   - Tap "+" button
   - Add a test project
   - Should see green checkmark
   ```

4. **Settings Test**
   ```
   - Go to Settings tab
   - Enter your name
   - Tap Save
   - Should see success alert
   ```

5. **Bug Report Test**
   ```
   - Go to Report Bug tab
   - Fill in title: "Test Bug"
   - Fill in description: "Testing the app"
   - Tap Submit
   - Should see success message
   ```

---

## 📋 Pre-Flight Checklist

Before running the app, ensure:

- [ ] **Xcode Version**: 15.0 or later
  - Check: Xcode > About Xcode
  
- [ ] **macOS Version**: Ventura (13.0) or later
  - Check: Apple menu > About This Mac
  
- [ ] **iOS Target**: 16.0 or later
  - Check: Project settings > Deployment Info
  
- [ ] **All Files Present**:
  ```bash
  cd ios/BugScribe/BugScribe
  ls -la Views/
  # Should see: AnnotationView.swift, BugReportView.swift, ContentView.swift, etc.
  ```

- [ ] **No Syntax Errors**:
  - Open project in Xcode
  - Look for red error indicators
  - Fix any shown errors

---

## 🔍 Diagnostic Commands

Run these in Terminal to check your setup:

```bash
# Check Xcode version
xcodebuild -version

# Check available simulators
xcrun simctl list devices available

# Check if project builds from command line
cd ios/BugScribe
xcodebuild -project BugScribe.xcodeproj -scheme BugScribe -destination 'platform=iOS Simulator,name=iPhone 15 Pro' clean build

# Check for Swift errors
cd BugScribe
find . -name "*.swift" -exec swiftc -typecheck {} \;
```

---

## 🆘 Emergency Reset

If nothing works, nuclear option:

```bash
# 1. Close Xcode completely

# 2. Clean everything
cd ios/BugScribe
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ~/Library/Caches/com.apple.dt.Xcode

# 3. Reopen Xcode
open BugScribe.xcodeproj

# 4. Clean and rebuild
# Product > Clean Build Folder (⇧⌘K)
# Product > Build (⌘B)
```

---

## 📞 Still Not Working?

Please provide this information:

1. **What specific error do you see?**
   - Screenshot of the error
   - Full error message text

2. **What step fails?**
   - Building the project?
   - Running the app?
   - Submitting a bug?
   - Something else?

3. **Your environment:**
   ```bash
   # Run this and share the output:
   echo "Xcode: $(xcodebuild -version)"
   echo "macOS: $(sw_vers -productVersion)"
   echo "Swift: $(swift --version)"
   ```

4. **Console logs:**
   - In Xcode, open the Console (⇧⌘C)
   - Copy any error messages
   - Share them

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Build succeeds without errors
2. ✅ App launches and shows 3 tabs
3. ✅ Can add a project
4. ✅ Can enter bug details
5. ✅ Can submit a bug report
6. ✅ See "Bug report submitted successfully!" message

---

**Need more help?** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions.
