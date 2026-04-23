# BugScribe iOS - Setup Guide

Complete guide to setting up and running the BugScribe iOS application.

## Prerequisites

Before you begin, ensure you have:

1. **macOS** (Ventura 13.0 or later recommended)
2. **Xcode 15.0+** installed from the Mac App Store
3. **Apple Developer Account** (free or paid)
4. **iOS Device or Simulator** running iOS 16.0+

## Step 1: Install Xcode

1. Open the **Mac App Store**
2. Search for "Xcode"
3. Click "Get" or "Install"
4. Wait for the installation to complete (this may take a while)

## Step 2: Open the Project

```bash
# Navigate to the iOS project directory
cd ios/BugScribe

# Open the Xcode project
open BugScribe.xcodeproj
```

Alternatively, you can:
- Double-click `BugScribe.xcodeproj` in Finder
- Open Xcode and select "Open a project or file"

## Step 3: Configure Code Signing

1. In Xcode, select the **BugScribe** project in the navigator
2. Select the **BugScribe** target
3. Go to the **Signing & Capabilities** tab
4. Under "Team", select your Apple Developer account
   - If you don't see your account, click "Add Account..." and sign in
5. Xcode will automatically manage provisioning profiles

## Step 4: Select a Destination

Choose where to run the app:

### Option A: iOS Simulator (Recommended for Testing)

1. In the Xcode toolbar, click the device selector (next to the scheme)
2. Choose any iPhone simulator (e.g., "iPhone 15 Pro")
3. Click the **Play** button (▶️) or press `Cmd + R`

### Option B: Physical iOS Device

1. Connect your iPhone or iPad via USB
2. Unlock your device and trust the computer if prompted
3. In Xcode, select your device from the device selector
4. Click the **Play** button (▶️) or press `Cmd + R`

**Note**: For physical devices, you may need to:
- Enable "Developer Mode" on your device (Settings > Privacy & Security)
- Trust the developer certificate (Settings > General > VPN & Device Management)

## Step 5: First Launch

When the app launches for the first time:

1. You'll see an empty Projects screen
2. Tap the **"+"** button to add your first project

## Step 6: Add a BugScribe Project

### Get Your Project Credentials

First, you need to get your project ID and API key from the BugScribe web dashboard:

1. Open your browser and go to `http://localhost:3000` (or your BugScribe server URL)
2. Sign in to your account
3. Create a new project or select an existing one
4. Copy the **Project ID** and **API Key**

### Add Project to iOS App

1. In the iOS app, tap the **"+"** button
2. Fill in the form:
   - **Project Name**: A friendly name (e.g., "My App")
   - **Project ID**: Paste the ID from the dashboard
   - **API Key**: Paste the API key from the dashboard
   - **Connection Key**: (Optional) Leave blank unless required
3. Tap **"Add Project"**

## Step 7: Configure User Information

1. Go to the **Settings** tab (gear icon)
2. Enter your **Name** (required)
3. Enter your **Email** (optional but recommended)
4. Tap **"Save User Information"**

## Step 8: Test Bug Reporting

### Create Your First Bug Report

1. Go to the **"Report Bug"** tab (ladybug icon)
2. Fill in the bug details:
   - **Title**: "Test bug report"
   - **Type**: Select "General"
   - **Priority**: Select "Medium"
   - **Description**: "This is a test bug report from iOS"
3. Add a screenshot:
   - Tap **"Take Screenshot"** to use the camera
   - Or tap **"Choose from Library"** to select an existing image
4. (Optional) Tap **"Annotate"** to draw on the screenshot
5. Tap **"Submit Bug Report"**

### Verify Submission

1. Wait for the success message
2. Open the BugScribe web dashboard
3. Navigate to your project
4. You should see the new bug report in the "New Issues" column

## Troubleshooting

### Build Errors

**"No signing certificate found"**
- Solution: Add your Apple ID in Xcode > Settings > Accounts
- Select your team in the project's Signing & Capabilities

**"Module not found"**
- Solution: Clean the build folder (Product > Clean Build Folder)
- Rebuild the project (Cmd + B)

### Runtime Errors

**"No active project selected"**
- Solution: Add a project in the Projects tab
- Make sure a project is selected (green checkmark)

**"Please set your name in Settings"**
- Solution: Go to Settings and enter your name
- Tap "Save User Information"

**Network request failed**
- Solution: Check your internet connection
- Verify the project ID and API key are correct
- Ensure the BugScribe backend server is running

### Permission Issues

**Camera not working**
- Solution: Go to iOS Settings > BugScribe > Camera
- Enable camera access

**Can't save to photo library**
- Solution: Go to iOS Settings > BugScribe > Photos
- Enable photo library access

## Advanced Configuration

### Changing the Backend URL

If you're running BugScribe on a different server:

1. Open `ios/BugScribe/BugScribe/Services/NetworkManager.swift`
2. Find the line:
   ```swift
   private let baseURL = "https://cmsmindsqa.vercel.app"
   ```
3. Change it to your server URL:
   ```swift
   private let baseURL = "https://your-server.com"
   ```
4. Rebuild the app

### Custom Bundle Identifier

To use your own bundle identifier:

1. In Xcode, select the BugScribe target
2. Go to the **General** tab
3. Change the **Bundle Identifier** (e.g., `com.yourcompany.bugscribe`)
4. Update code signing if needed

## Building for Distribution

### TestFlight (Beta Testing)

1. Archive the app: Product > Archive
2. In the Organizer, click "Distribute App"
3. Select "App Store Connect"
4. Follow the prompts to upload to TestFlight
5. Invite beta testers via App Store Connect

### App Store Release

1. Prepare app metadata in App Store Connect
2. Archive the app in Xcode
3. Upload to App Store Connect
4. Submit for review
5. Wait for Apple's approval

## Development Tips

### Using SwiftUI Previews

Xcode provides live previews for faster development:

1. Open any View file (e.g., `ContentView.swift`)
2. Click the **Resume** button in the preview pane
3. Interact with the preview in real-time
4. Changes to code update the preview automatically

### Debugging

- Set breakpoints by clicking the line numbers
- Use `print()` statements for logging
- View console output in the Debug area (Cmd + Shift + Y)

### Hot Reload

SwiftUI supports hot reload for many changes:
- UI modifications update automatically
- Logic changes may require a rebuild
- Press `Cmd + R` to rebuild and run

## Next Steps

Now that you have the iOS app running:

1. **Explore Features**: Try all the annotation tools and bug types
2. **Customize**: Modify the UI to match your brand
3. **Integrate**: Connect with your existing bug tracking workflow
4. **Extend**: Add new features like screen recording or offline mode

## Resources

- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [SwiftUI Tutorials](https://developer.apple.com/tutorials/swiftui)
- [Xcode Help](https://help.apple.com/xcode/)
- [BugScribe Main Documentation](../README.md)

## Support

Need help? Contact:
- Email: harshsharmaqa@gmail.com
- GitHub Issues: [Create an issue](https://github.com/yourusername/bugscribe/issues)

---

**Happy Bug Hunting! 🐛**
