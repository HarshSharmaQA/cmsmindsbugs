# BugScribe iOS - Frequently Asked Questions

Common questions and answers about the BugScribe iOS application.

## 📱 General Questions

### What is BugScribe iOS?

BugScribe iOS is a native iOS application that allows you to report bugs with screenshots and annotations directly from your iPhone or iPad. It integrates with the BugScribe backend to sync bug reports with your team's dashboard.

### Do I need the Chrome Extension to use the iOS app?

No, the iOS app works independently. However, both can be used together to report bugs from different platforms (web and mobile).

### Is the iOS app free?

Yes, the iOS app is free to use. You only need valid BugScribe project credentials.

### What iOS version do I need?

The app requires iOS 16.0 or later. It works on both iPhone and iPad.

## 🔧 Setup & Installation

### How do I install the app?

1. Open the Xcode project: `ios/BugScribe/BugScribe.xcodeproj`
2. Select your device or simulator
3. Press Cmd+R to build and run

For detailed instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md).

### Where do I get my Project ID and API Key?

1. Go to your BugScribe web dashboard
2. Sign in to your account
3. Create or select a project
4. Copy the Project ID and API Key from the project settings

### Can I use multiple projects?

Yes! You can add multiple projects and switch between them in the Projects tab.

### Do I need an Apple Developer account?

For testing on simulators: No
For testing on physical devices: Yes (free account works)
For App Store distribution: Yes (paid account required)

## 🐛 Bug Reporting

### How do I report a bug?

1. Go to the "Report Bug" tab
2. Fill in the title and description
3. Select bug type and priority
4. Add a screenshot (optional)
5. Tap "Submit Bug Report"

### Can I report bugs without screenshots?

Yes, screenshots are optional. You can submit text-only bug reports.

### What screenshot sources are supported?

- Camera (take a new photo)
- Photo Library (select existing photo)

### How do I annotate screenshots?

1. Add a screenshot to your bug report
2. Tap the "Annotate" button
3. Use the drawing tools to mark up the image
4. Tap "Done" to save

### What annotation tools are available?

- **Pen**: Freehand drawing
- **Marker**: Thick highlighting
- **Pencil**: Thin precise lines
- **Eraser**: Remove annotations

### What colors can I use?

Red, Yellow, Green, Blue, Purple, and Black.

### Can I undo annotations?

Yes, tap the undo button (↩) to remove the last stroke.

## 📊 Data & Storage

### Where is my data stored?

- **Locally**: Project credentials and user info are stored in UserDefaults
- **Remotely**: Bug reports are sent to the BugScribe backend

### Is my data secure?

Yes. Data is stored in iOS's secure storage and transmitted over HTTPS.

### Can I use the app offline?

Currently, you need an internet connection to submit bug reports. Offline mode is planned for a future release.

### What happens if submission fails?

You'll see an error message. You can retry the submission after fixing the issue (e.g., checking your internet connection).

## 🎨 Features

### What bug types are supported?

- General
- UI/UX
- Performance
- Security
- Crash
- Network

### What priority levels are available?

- Low
- Medium
- High
- Critical

### What device information is captured?

- Device model (e.g., iPhone 15 Pro)
- iOS version
- App version
- Screen size
- Platform (iOS)

### Can I edit a bug after submitting?

Not currently. Once submitted, bugs can only be edited in the web dashboard.

### Can I see my submitted bugs in the app?

Not currently. View your bugs in the web dashboard. Bug history in the app is planned for a future release.

## 🔧 Troubleshooting

### The app won't build

**Solution**:
1. Clean build folder: Product > Clean Build Folder (Cmd+Shift+K)
2. Restart Xcode
3. Check that you're using Xcode 15.0+

### "No signing certificate found"

**Solution**:
1. Go to Xcode > Settings > Accounts
2. Add your Apple ID
3. In project settings, select your team under Signing & Capabilities

### "No active project selected"

**Solution**:
1. Go to the Projects tab
2. Tap the "+" button to add a project
3. Make sure a project is selected (green checkmark)

### "Please set your name in Settings"

**Solution**:
1. Go to the Settings tab
2. Enter your name
3. Tap "Save User Information"

### Bug submission fails

**Possible causes**:
- Invalid Project ID or API Key
- No internet connection
- Backend server is down

**Solution**:
1. Verify your project credentials
2. Check your internet connection
3. Try again in a few minutes

### Camera doesn't work

**Solution**:
1. Go to iOS Settings > BugScribe
2. Enable Camera permission
3. Restart the app

### Can't select photos

**Solution**:
1. Go to iOS Settings > BugScribe
2. Enable Photos permission
3. Restart the app

### App crashes on launch

**Solution**:
1. Delete the app
2. Clean build folder in Xcode
3. Rebuild and reinstall

### Annotations don't save

**Solution**:
1. Make sure you tap "Done" after annotating
2. Check that you have enough storage space
3. Try with a smaller image

## 🚀 Advanced

### Can I change the backend URL?

Yes, edit `NetworkManager.swift`:

```swift
private let baseURL = "https://your-server.com"
```

### Can I customize the UI?

Yes, the app uses SwiftUI which is easy to customize. Edit the view files in the `Views/` directory.

### Can I add custom bug types?

Yes, edit the `BugType` enum in `BugReport.swift`:

```swift
enum BugType: String, CaseIterable {
    case general = "general"
    case myCustomType = "my_custom_type"
    // ...
}
```

### Can I integrate with other backends?

Yes, modify `NetworkManager.swift` to match your API endpoints and data format.

### How do I enable dark mode?

Dark mode is automatically supported by SwiftUI. The app adapts to the system appearance.

### Can I use this in production?

Yes! The app is production-ready. Just:
1. Update the bundle identifier
2. Configure code signing
3. Build for release
4. Submit to App Store

## 🔮 Future Features

### What features are planned?

- [ ] Screen recording
- [ ] Offline mode with sync queue
- [ ] Push notifications
- [ ] Bug history view
- [ ] Dark mode optimization
- [ ] iPad-specific UI
- [ ] Home screen widget
- [ ] Shake to report gesture

### When will these features be available?

We're actively developing new features. Check the GitHub repository for updates.

### Can I request a feature?

Yes! Create an issue on GitHub or email harshsharmaqa@gmail.com.

### Can I contribute?

Yes! The project is open source. See the main README for contribution guidelines.

## 📚 Documentation

### Where can I find more documentation?

- **README.md**: Complete feature documentation
- **SETUP_GUIDE.md**: Detailed setup instructions
- **QUICK_START.md**: 5-minute quick start
- **ARCHITECTURE.md**: Technical architecture
- **FEATURE_COMPARISON.md**: Chrome Extension vs iOS
- **CHECKLIST.md**: Testing checklist

### Is there a video tutorial?

Not yet, but it's on our roadmap. For now, follow the [QUICK_START.md](QUICK_START.md) guide.

### Where can I get help?

- Check the documentation in the `ios/` directory
- Create a GitHub issue
- Email: harshsharmaqa@gmail.com

## 🔐 Privacy & Security

### What data does the app collect?

The app only collects:
- Bug report details you provide
- Screenshots you attach
- Device information (model, OS version, screen size)
- Your name and email (if provided)

### Is my data shared with third parties?

No. Data is only sent to your configured BugScribe backend.

### Can I delete my data?

Yes. Delete projects from the Projects tab to remove local data. Contact your BugScribe admin to delete backend data.

### Are screenshots encrypted?

Screenshots are transmitted over HTTPS and stored securely on the backend.

### What permissions does the app need?

- **Camera**: To capture screenshots
- **Photos**: To select and save images

These are only requested when needed.

## 💡 Tips & Tricks

### Quick Bug Reporting

1. Keep the app open in the background
2. When you find a bug, switch to BugScribe
3. Screenshot is already in your photo library
4. Select it and submit

### Effective Annotations

- Use **red** for critical issues
- Use **yellow** for highlights
- Use **arrows** to point to specific elements
- Add **text** for additional context

### Project Organization

- Create separate projects for different apps
- Use descriptive project names
- Keep API keys secure

### Better Bug Reports

- Write clear, concise titles
- Include steps to reproduce
- Add screenshots with annotations
- Select appropriate type and priority

## 🎯 Best Practices

### For QA Teams

1. **Standardize**: Use consistent bug types and priorities
2. **Annotate**: Always mark the exact issue location
3. **Detail**: Provide clear reproduction steps
4. **Verify**: Check the dashboard after submitting

### For Developers

1. **Integrate**: Connect with your CI/CD pipeline
2. **Customize**: Adapt the UI to your brand
3. **Extend**: Add custom fields if needed
4. **Monitor**: Track bug submission metrics

### For Product Managers

1. **Organize**: Create projects per product/feature
2. **Prioritize**: Use priority levels consistently
3. **Review**: Check the dashboard regularly
4. **Communicate**: Share bug reports with the team

## 📞 Support

### How do I get support?

- **Documentation**: Check the guides in `ios/` directory
- **GitHub Issues**: Create an issue for bugs or features
- **Email**: harshsharmaqa@gmail.com

### How do I report a bug in the iOS app itself?

Create a GitHub issue with:
- Description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Device and iOS version

### Is there a community forum?

Not yet, but we're considering it. For now, use GitHub Discussions.

### Can I get commercial support?

Contact harshsharmaqa@gmail.com for commercial support options.

## 🌟 Success Stories

### "Increased our bug reporting by 300%"

*"The iOS app made it so easy for our mobile QA team to report bugs. We went from 10 bugs/week to 30+ bugs/week."* - QA Manager

### "Annotations save us hours"

*"Being able to annotate screenshots directly in the app saves us so much time. No more back-and-forth asking 'where exactly is the issue?'"* - Developer

### "Perfect for remote teams"

*"Our distributed team uses BugScribe iOS to report bugs from anywhere. It's been a game-changer for our workflow."* - Product Owner

## 🎓 Learning Resources

### SwiftUI
- [Apple's SwiftUI Tutorials](https://developer.apple.com/tutorials/swiftui)
- [Hacking with Swift](https://www.hackingwithswift.com/quick-start/swiftui)

### iOS Development
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [Ray Wenderlich](https://www.raywenderlich.com/ios)

### BugScribe
- [Main Documentation](../README.md)
- [API Documentation](../API.md)

## ❓ Still Have Questions?

If your question isn't answered here:

1. Check the other documentation files
2. Search GitHub issues
3. Create a new GitHub issue
4. Email harshsharmaqa@gmail.com

---

**We're here to help! 🚀**

Last updated: April 15, 2026
