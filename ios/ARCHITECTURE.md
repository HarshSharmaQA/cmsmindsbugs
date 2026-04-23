# BugScribe iOS - Architecture

Detailed architecture documentation for the BugScribe iOS application.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     BugScribe iOS App                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Projects   │  │  Report Bug  │  │   Settings   │      │
│  │     Tab      │  │     Tab      │  │     Tab      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┴──────────────────┘              │
│                            │                                  │
│                    ┌───────▼────────┐                        │
│                    │  ContentView   │                        │
│                    │  (Tab Router)  │                        │
│                    └───────┬────────┘                        │
│                            │                                  │
│         ┌──────────────────┴──────────────────┐             │
│         │                                       │             │
│  ┌──────▼────────┐                    ┌───────▼────────┐   │
│  │ StorageManager│◄───────────────────┤ NetworkManager │   │
│  │  (Local Data) │                    │  (API Calls)   │   │
│  └───────────────┘                    └────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              BugScribe Backend (Convex)                      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Database   │  │  File Storage│  │     API      │      │
│  │   (Convex)   │  │   (Convex)   │  │  Endpoints   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Layer Architecture

### 1. Presentation Layer (Views)

```
Views/
├── ContentView.swift           # Main tab navigation
├── ProjectListView.swift       # Project management UI
│   ├── EmptyProjectsView       # Empty state
│   ├── ProjectRow              # Project list item
│   └── AddProjectView          # Add project form
├── BugReportView.swift         # Bug report form
│   └── ImagePicker             # Camera/library picker
├── AnnotationView.swift        # Screenshot annotation
│   ├── CanvasViewRepresentable # PencilKit wrapper
│   ├── ToolButton              # Annotation tool button
│   └── ColorButton             # Color selector
└── DrawingCanvas.swift         # Custom drawing canvas
```

**Responsibilities**:
- User interface rendering
- User input handling
- Navigation flow
- State presentation

**Technologies**:
- SwiftUI for declarative UI
- UIKit integration (UIImagePickerController)
- PencilKit for advanced drawing

### 2. Business Logic Layer (Services)

```
Services/
├── StorageManager.swift        # Local data persistence
│   ├── Projects management
│   ├── User information
│   └── Active project selection
└── NetworkManager.swift        # API communication
    ├── Submit bug reports
    ├── Check reporting status
    └── Error handling
```

**Responsibilities**:
- Data persistence
- Network communication
- Business rules
- State management

**Technologies**:
- UserDefaults for storage
- URLSession for networking
- Combine for reactive updates

### 3. Data Layer (Models)

```
Models/
├── Project.swift               # Project data structure
│   ├── id: String
│   ├── name: String
│   ├── projectId: String
│   ├── apiKey: String
│   ├── connectionKey: String
│   └── addedAt: Date
└── BugReport.swift             # Bug report structure
    ├── id: String
    ├── title: String
    ├── description: String
    ├── type: BugType
    ├── priority: BugPriority
    ├── screenshot: Data?
    ├── deviceInfo: DeviceInfo
    └── createdAt: Date
```

**Responsibilities**:
- Data structure definitions
- Type safety
- Codable conformance
- Business entities

### 4. Utilities Layer

```
Utilities/
└── ScreenshotCapture.swift     # Screenshot utilities
    ├── captureScreen()
    └── captureView()
```

**Responsibilities**:
- Helper functions
- Shared utilities
- Cross-cutting concerns

## Data Flow

### 1. App Launch Flow

```
┌─────────────┐
│ App Launch  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ BugScribeApp    │
│ (Entry Point)   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ StorageManager  │
│ .shared init    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Load Projects   │
│ Load User Info  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ ContentView     │
│ (Tab Router)    │
└─────────────────┘
```

### 2. Add Project Flow

```
User Taps "+" Button
       │
       ▼
┌─────────────────┐
│ AddProjectView  │
│ (Sheet)         │
└──────┬──────────┘
       │
       ▼
User Fills Form
       │
       ▼
┌─────────────────┐
│ Validate Input  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Create Project  │
│ Model           │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ StorageManager  │
│ .addProject()   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Save to         │
│ UserDefaults    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Update UI       │
│ (Reactive)      │
└─────────────────┘
```

### 3. Submit Bug Report Flow

```
User Fills Bug Form
       │
       ▼
User Adds Screenshot
       │
       ▼
User Taps "Submit"
       │
       ▼
┌─────────────────┐
│ Validate Form   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Create          │
│ BugReport Model │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Convert Image   │
│ to Base64       │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ NetworkManager  │
│ .submitBug()    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Build JSON      │
│ Request         │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ POST to API     │
│ /api/submit-bug │
└──────┬──────────┘
       │
       ├─Success──┐
       │          │
       │          ▼
       │    ┌─────────────┐
       │    │ Show Success│
       │    │ Alert       │
       │    └─────────────┘
       │
       └─Error────┐
                  │
                  ▼
            ┌─────────────┐
            │ Show Error  │
            │ Alert       │
            └─────────────┘
```

### 4. Screenshot Annotation Flow

```
User Selects Screenshot
       │
       ▼
┌─────────────────┐
│ Tap "Annotate"  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ AnnotationView  │
│ (Sheet)         │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Load Image into │
│ PencilKit Canvas│
└──────┬──────────┘
       │
       ▼
User Draws Annotations
       │
       ▼
User Taps "Done"
       │
       ▼
┌─────────────────┐
│ Merge Image +   │
│ Annotations     │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Return Annotated│
│ Image           │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Update Bug      │
│ Report View     │
└─────────────────┘
```

## State Management

### ObservableObject Pattern

```swift
class StorageManager: ObservableObject {
    @Published var projects: [Project] = []
    @Published var activeProject: Project?
    @Published var userName: String?
    @Published var userEmail: String?
    
    // Changes to @Published properties
    // automatically update all views
}
```

### Environment Object Injection

```swift
// App level
@main
struct BugScribeApp: App {
    @StateObject private var storageManager = StorageManager.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(storageManager)
        }
    }
}

// View level
struct ProjectListView: View {
    @EnvironmentObject var storageManager: StorageManager
    // Automatically receives updates
}
```

## Network Architecture

### API Communication

```
┌─────────────────────────────────────────────┐
│           NetworkManager                     │
├─────────────────────────────────────────────┤
│                                              │
│  submitBugReport()                          │
│  ├─ Build JSON payload                      │
│  ├─ Convert image to base64                 │
│  ├─ Create URLRequest                       │
│  ├─ Set headers                             │
│  ├─ Execute URLSession.dataTask             │
│  └─ Handle response/error                   │
│                                              │
│  checkReportingStatus()                     │
│  ├─ Build JSON payload                      │
│  ├─ Create URLRequest                       │
│  ├─ Execute URLSession.dataTask             │
│  └─ Parse response                          │
│                                              │
└─────────────────────────────────────────────┘
```

### Request/Response Flow

```
iOS App                    Backend API
   │                           │
   │  POST /api/submit-bug    │
   ├──────────────────────────>│
   │                           │
   │  {                        │
   │    projectId,             │
   │    apiKey,                │
   │    title,                 │
   │    description,           │
   │    screenshot (base64),   │
   │    deviceInfo,            │
   │    ...                    │
   │  }                        │
   │                           │
   │                           ├─ Validate
   │                           ├─ Store in DB
   │                           ├─ Upload image
   │                           └─ Send email
   │                           │
   │  { success: true }        │
   │<──────────────────────────┤
   │                           │
   │  Update UI                │
   │                           │
```

## Storage Architecture

### UserDefaults Structure

```
UserDefaults
├── bugscribe_projects          # [Project] (JSON encoded)
│   └── [
│       {
│         id: "uuid",
│         name: "My Project",
│         projectId: "proj_123",
│         apiKey: "key_456",
│         connectionKey: "",
│         addedAt: Date
│       },
│       ...
│     ]
├── bugscribe_active_project    # String (project ID)
├── bugscribe_user_name         # String
└── bugscribe_user_email        # String
```

### Data Persistence Flow

```
┌─────────────────┐
│ User Action     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update @Published│
│ Property        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Encode to JSON  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save to         │
│ UserDefaults    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ UI Updates      │
│ Automatically   │
└─────────────────┘
```

## Security Architecture

### Data Protection

```
┌─────────────────────────────────────────┐
│         Security Layers                  │
├─────────────────────────────────────────┤
│                                          │
│  1. iOS Sandbox                         │
│     └─ App data isolated                │
│                                          │
│  2. UserDefaults                        │
│     └─ Encrypted at rest (iOS)          │
│                                          │
│  3. HTTPS Communication                 │
│     └─ TLS 1.3 encryption               │
│                                          │
│  4. API Key Validation                  │
│     └─ Server-side verification         │
│                                          │
│  5. Input Validation                    │
│     └─ Client-side checks               │
│                                          │
└─────────────────────────────────────────┘
```

### Future: Keychain Integration

```swift
// Planned enhancement
class SecureStorage {
    func saveAPIKey(_ key: String, for project: String) {
        // Store in iOS Keychain
        // More secure than UserDefaults
    }
    
    func getAPIKey(for project: String) -> String? {
        // Retrieve from Keychain
    }
}
```

## Error Handling

### Error Flow

```
┌─────────────────┐
│ User Action     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validate Input  │
└────────┬────────┘
         │
         ├─Valid────┐
         │          │
         │          ▼
         │    ┌─────────────┐
         │    │ Execute     │
         │    │ Operation   │
         │    └──────┬──────┘
         │           │
         │           ├─Success──┐
         │           │          │
         │           │          ▼
         │           │    ┌─────────┐
         │           │    │ Update  │
         │           │    │ UI      │
         │           │    └─────────┘
         │           │
         │           └─Error────┐
         │                      │
         └─Invalid──────────────┤
                                │
                                ▼
                          ┌─────────┐
                          │ Show    │
                          │ Alert   │
                          └─────────┘
```

### Error Types

```swift
enum NetworkError: LocalizedError {
    case invalidURL
    case invalidResponse
    case serverError(statusCode: Int)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .serverError(let code):
            return "Server error: \(code)"
        }
    }
}
```

## Performance Optimization

### Image Handling

```
Original Image
     │
     ▼
┌─────────────────┐
│ Resize if needed│
│ (max 1920x1080) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Convert to PNG  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Compress        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Base64 Encode   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Send to API     │
└─────────────────┘
```

### Memory Management

- Lazy loading of views
- Image compression before upload
- Automatic reference counting (ARC)
- No retain cycles in closures

## Testing Architecture

### Test Pyramid

```
        ┌─────────┐
        │   UI    │  ← Manual testing
        │  Tests  │     SwiftUI Previews
        └─────────┘
       ┌───────────┐
       │Integration│  ← API integration tests
       │   Tests   │
       └───────────┘
      ┌─────────────┐
      │    Unit     │  ← Model & service tests
      │    Tests    │
      └─────────────┘
```

### SwiftUI Previews

```swift
#Preview {
    ProjectListView()
        .environmentObject(StorageManager.shared)
}

// Provides instant visual feedback
// No need to run full app
```

## Deployment Architecture

```
┌─────────────────┐
│  Development    │
│   (Xcode)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Build & Sign   │
│  (Xcode)        │
└────────┬────────┘
         │
         ├─────────────┬─────────────┐
         │             │             │
         ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Simulator  │ │  TestFlight │ │  App Store  │
│  (Testing)  │ │   (Beta)    │ │ (Production)│
└─────────────┘ └─────────────┘ └─────────────┘
```

## Scalability Considerations

### Current Architecture
- ✅ Supports multiple projects
- ✅ Handles large screenshots
- ✅ Efficient local storage
- ✅ Async network calls

### Future Enhancements
- 📅 Core Data for complex queries
- 📅 Background upload queue
- 📅 Offline mode with sync
- 📅 Push notifications
- 📅 Widget support

## Conclusion

The BugScribe iOS app follows modern iOS development best practices with:

- **Clean Architecture**: Separation of concerns
- **Reactive Programming**: Combine framework
- **Type Safety**: Swift's strong typing
- **Modern UI**: SwiftUI declarative syntax
- **Scalability**: Easy to extend and maintain

---

**Questions about the architecture?** Contact: harshsharmaqa@gmail.com
