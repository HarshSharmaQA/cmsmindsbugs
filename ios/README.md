# BugScribe iOS App 🐛📱

Native iOS application for BugScribe - Visual feedback & bug tracking for software teams.

## Features

- ✅ **Project Management**: Add and manage multiple BugScribe projects
- 📸 **Screenshot Capture**: Take screenshots or select from photo library
- ✏️ **Annotation Tools**: Draw, highlight, and annotate screenshots with multiple tools
- 🎨 **Color Selection**: Choose from multiple colors for annotations
- 📝 **Bug Reporting**: Submit detailed bug reports with type, priority, and descriptions
- 🔄 **Real-time Sync**: Integrates with BugScribe backend API
- 💾 **Local Storage**: Securely stores project credentials and user information

## Requirements

- iOS 16.0+
- Xcode 15.0+
- Swift 5.9+

## Installation

1. Open the project in Xcode:
   ```bash
   cd ios/BugScribe
   open BugScribe.xcodeproj
   ```

2. Select your development team in the project settings

3. Build and run the app on your device or simulator

## Configuration

### Adding a Project

1. Launch the app
2. Tap the "+" button in the Projects tab
3. Enter your project details:
   - **Project Name**: A friendly name for your project
   - **Project ID**: Your BugScribe project ID from the dashboard
   - **API Key**: Your project's API key
   - **Connection Key** (optional): Additional connection key if required

### Setting User Information

1. Go to the Settings tab
2. Enter your name and email
3. Tap "Save User Information"

## Usage

### Reporting a Bug

1. Select an active project from the Projects tab
2. Navigate to the "Report Bug" tab
3. Fill in the bug details:
   - Title
   - Type (General, UI/UX, Performance, Security, Crash, Network)
   - Priority (Low, Medium, High, Critical)
   - Description
4. Add a screenshot:
   - Take a new screenshot with the camera
   - Choose from your photo library
5. Optionally annotate the screenshot with drawing tools
6. Tap "Submit Bug Report"

### Annotation Tools

The annotation view provides several tools:

- **Pen**: Draw freehand lines
- **Marker**: Draw thick highlighted lines
- **Pencil**: Draw thin precise lines
- **Eraser**: Remove annotations

Available colors:
- Red
- Yellow
- Green
- Blue
- Purple
- Black

## Architecture

### Project Structure

```
BugScribe/
├── BugScribeApp.swift          # App entry point
├── Views/
│   ├── ContentView.swift       # Main tab navigation
│   ├── ProjectListView.swift   # Project management
│   ├── BugReportView.swift     # Bug report form
│   ├── AnnotationView.swift    # Screenshot annotation
│   └── DrawingCanvas.swift     # Custom drawing canvas
├── Models/
│   ├── Project.swift           # Project data model
│   └── BugReport.swift         # Bug report data model
├── Services/
│   ├── StorageManager.swift    # Local data persistence
│   └── NetworkManager.swift    # API communication
└── Utilities/
    └── ScreenshotCapture.swift # Screenshot utilities
```

### Key Components

#### StorageManager
Manages local data persistence using UserDefaults:
- Projects list
- Active project selection
- User information (name, email)

#### NetworkManager
Handles API communication with the BugScribe backend:
- Submit bug reports
- Check reporting status
- Base64 image encoding

#### Models
- **Project**: Stores project credentials and metadata
- **BugReport**: Contains bug details, screenshots, and device info
- **DeviceInfo**: Automatically captures device metadata

## API Integration

The app communicates with the BugScribe backend at:
```
https://cmsmindsqa.vercel.app
```

### Endpoints Used

- `POST /api/submit-bug`: Submit a new bug report
- `POST /api/check-reporting-status`: Check if reporting is enabled

### Request Format

Bug reports are submitted as JSON with the following structure:

```json
{
  "projectId": "string",
  "apiKey": "string",
  "title": "string",
  "description": "string",
  "type": "general|ui_ux|performance|security|crash|network",
  "priority": "low|medium|high|critical",
  "reporterName": "string",
  "reporterEmail": "string",
  "screenshot": "data:image/png;base64,...",
  "deviceInfo": {
    "deviceModel": "string",
    "osVersion": "string",
    "appVersion": "string",
    "screenSize": "string",
    "platform": "iOS"
  },
  "createdAt": "ISO8601 timestamp"
}
```

## Permissions

The app requires the following permissions:

- **Camera**: To capture screenshots
- **Photo Library**: To select and save screenshots

These permissions are requested at runtime when needed.

## Development

### Building for Development

```bash
# Open in Xcode
open ios/BugScribe/BugScribe.xcodeproj

# Or use xcodebuild
xcodebuild -project BugScribe.xcodeproj -scheme BugScribe -configuration Debug
```

### Testing

The app includes SwiftUI previews for rapid development:

```swift
#Preview {
    ContentView()
        .environmentObject(StorageManager.shared)
}
```

## Troubleshooting

### Common Issues

**"No active project selected"**
- Make sure you've added at least one project
- Check that a project is selected (green checkmark) in the Projects tab

**"Please set your name in Settings"**
- Go to Settings tab and enter your name
- Tap "Save User Information"

**Network errors**
- Verify your project ID and API key are correct
- Check your internet connection
- Ensure the backend server is running

**Screenshot not appearing**
- Grant camera/photo library permissions when prompted
- Check Settings > BugScribe > Photos permission

## Future Enhancements

- [ ] Screen recording support
- [ ] Offline mode with sync queue
- [ ] Push notifications for bug updates
- [ ] Dark mode support
- [ ] iPad optimization
- [ ] Widget for quick bug reporting
- [ ] Shake to report gesture
- [ ] Bug history and tracking

## License

This project is part of the BugScribe ecosystem. See the main project README for license information.

## Support

For issues or questions:
- Check the main BugScribe documentation
- Open an issue on GitHub
- Contact support at harshsharmaqa@gmail.com
