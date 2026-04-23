# BugScribe iOS - Testing Checklist

Complete checklist to verify all features are working correctly.

## 📋 Pre-Flight Checklist

Before you start testing, ensure:

- [ ] Xcode 15.0+ is installed
- [ ] iOS 16.0+ simulator or device is available
- [ ] BugScribe backend is running (or using production URL)
- [ ] You have valid project credentials (Project ID & API Key)

## 🚀 Installation Checklist

### Step 1: Project Setup
- [ ] Navigate to `ios/BugScribe` directory
- [ ] Open `BugScribe.xcodeproj` in Xcode
- [ ] Project opens without errors
- [ ] All files are visible in Project Navigator

### Step 2: Build Configuration
- [ ] Select a target device/simulator
- [ ] Build succeeds (Cmd+B) without errors
- [ ] No warnings in build log (or only minor warnings)

### Step 3: Code Signing
- [ ] Team is selected in Signing & Capabilities
- [ ] Provisioning profile is valid
- [ ] Bundle identifier is unique

### Step 4: First Launch
- [ ] App launches successfully (Cmd+R)
- [ ] No crash on launch
- [ ] Tab bar is visible with 3 tabs
- [ ] Projects tab shows empty state

## ✅ Feature Testing Checklist

### Projects Tab

#### Add Project
- [ ] Tap "+" button opens Add Project sheet
- [ ] All form fields are visible
- [ ] Can enter project name
- [ ] Can enter project ID
- [ ] Can enter API key
- [ ] Can enter connection key (optional)
- [ ] "Add Project" button is disabled when fields are empty
- [ ] "Add Project" button is enabled when required fields are filled
- [ ] Tapping "Add Project" saves the project
- [ ] Sheet dismisses after adding
- [ ] New project appears in the list
- [ ] Green checkmark shows on active project

#### Project List
- [ ] Projects are displayed in a list
- [ ] Each project shows name and truncated ID
- [ ] Active project has green checkmark
- [ ] Can tap a project to select it
- [ ] Selected project becomes active
- [ ] Swipe left reveals delete button

#### Delete Project
- [ ] Swipe left on project shows delete button
- [ ] Tap delete shows confirmation alert
- [ ] "Cancel" dismisses alert without deleting
- [ ] "Delete" removes the project
- [ ] If deleted project was active, another becomes active
- [ ] If last project deleted, empty state shows

#### Empty State
- [ ] Shows when no projects exist
- [ ] Displays folder icon
- [ ] Shows "No Projects" message
- [ ] Shows descriptive text
- [ ] "Add Project" button is visible
- [ ] Tapping button opens Add Project sheet

### Report Bug Tab

#### Tab Visibility
- [ ] Tab is hidden when no projects exist
- [ ] Tab appears when at least one project exists
- [ ] Tab is accessible after adding a project

#### Bug Form
- [ ] Title field is visible and editable
- [ ] Type picker shows all 6 types:
  - [ ] General
  - [ ] UI/UX
  - [ ] Performance
  - [ ] Security
  - [ ] Crash
  - [ ] Network
- [ ] Priority picker shows all 4 levels:
  - [ ] Low
  - [ ] Medium
  - [ ] High
  - [ ] Critical
- [ ] Description text editor is visible
- [ ] Description placeholder text shows when empty
- [ ] Can type in description field
- [ ] Text wraps correctly in description

#### Screenshot Section
- [ ] "Take Screenshot" button is visible
- [ ] "Choose from Library" button is visible
- [ ] Tapping "Take Screenshot" opens camera (on device)
- [ ] Tapping "Choose from Library" opens photo picker
- [ ] Can select an image from library
- [ ] Selected image displays in preview
- [ ] Image scales to fit preview area
- [ ] "Annotate" button appears after selecting image
- [ ] "Remove" button appears after selecting image
- [ ] Tapping "Remove" clears the screenshot

#### Annotation
- [ ] Tapping "Annotate" opens annotation view
- [ ] Selected image loads in canvas
- [ ] Toolbar shows all tools:
  - [ ] Pen
  - [ ] Marker
  - [ ] Pencil
  - [ ] Eraser
- [ ] Color palette shows 6 colors:
  - [ ] Red
  - [ ] Yellow
  - [ ] Green
  - [ ] Blue
  - [ ] Purple
  - [ ] Black
- [ ] Can select different tools
- [ ] Selected tool is highlighted
- [ ] Can draw on the image
- [ ] Can change colors
- [ ] Selected color is highlighted
- [ ] Undo button removes last stroke
- [ ] "Cancel" button closes without saving
- [ ] "Done" button saves annotated image
- [ ] Annotated image appears in bug report

#### Form Validation
- [ ] Submit button is disabled when title is empty
- [ ] Submit button is disabled when description is empty
- [ ] Submit button is enabled when all required fields are filled
- [ ] Can submit without a screenshot

#### Submission
- [ ] Tapping "Submit" shows loading state
- [ ] Button text changes to "Submitting..."
- [ ] Progress indicator is visible
- [ ] Button is disabled during submission
- [ ] Success alert shows on successful submission
- [ ] Error alert shows on failed submission
- [ ] Form resets after successful submission
- [ ] Can submit another bug after success

#### Error Handling
- [ ] Shows error if no active project
- [ ] Shows error if user name not set
- [ ] Shows error if network request fails
- [ ] Error messages are descriptive
- [ ] Can retry after error

### Settings Tab

#### User Information
- [ ] Name field is visible
- [ ] Email field is visible
- [ ] Can enter name
- [ ] Can enter email
- [ ] Email keyboard type is correct
- [ ] "Save User Information" button is visible
- [ ] Button is disabled when name is empty
- [ ] Button is enabled when name is filled
- [ ] Tapping save shows success alert
- [ ] Information persists after app restart

#### Active Project Display
- [ ] Shows active project name
- [ ] Shows truncated project ID
- [ ] Shows "No active project" when none selected

#### About Section
- [ ] Version number is displayed
- [ ] Version is "1.0.0"

### Navigation

#### Tab Bar
- [ ] All tabs are visible
- [ ] Tab icons are correct:
  - [ ] Projects: folder icon
  - [ ] Report Bug: ladybug icon
  - [ ] Settings: gear icon
- [ ] Tab labels are correct
- [ ] Can switch between tabs
- [ ] Selected tab is highlighted
- [ ] Tab state persists when switching

## 🔄 Integration Testing

### Backend Integration
- [ ] Can submit bug to backend
- [ ] Bug appears in web dashboard
- [ ] Screenshot is uploaded correctly
- [ ] Device info is captured correctly
- [ ] Timestamp is correct
- [ ] Reporter name is correct
- [ ] Reporter email is correct (if provided)

### Data Persistence
- [ ] Projects persist after app restart
- [ ] Active project persists after app restart
- [ ] User information persists after app restart
- [ ] Can add multiple projects
- [ ] Can switch between projects
- [ ] Each project maintains its own credentials

## 📱 Device Testing

### iPhone Testing
- [ ] Works on iPhone 15 Pro simulator
- [ ] Works on iPhone 14 simulator
- [ ] Works on iPhone SE simulator
- [ ] Works on physical iPhone (if available)
- [ ] Portrait orientation works
- [ ] Landscape orientation works

### iPad Testing
- [ ] Works on iPad Pro simulator
- [ ] Works on iPad Air simulator
- [ ] Works on physical iPad (if available)
- [ ] Portrait orientation works
- [ ] Landscape orientation works
- [ ] Split view works (if applicable)

### iOS Versions
- [ ] Works on iOS 16.0
- [ ] Works on iOS 17.0
- [ ] Works on latest iOS version

## 🎨 UI/UX Testing

### Visual Design
- [ ] Colors match BugScribe brand (red accent)
- [ ] Fonts are readable
- [ ] Spacing is consistent
- [ ] Buttons are appropriately sized
- [ ] Touch targets are at least 44x44 points
- [ ] Images scale correctly
- [ ] No visual glitches

### Animations
- [ ] Sheet presentations are smooth
- [ ] Tab transitions are smooth
- [ ] Alert presentations are smooth
- [ ] No janky animations

### Accessibility
- [ ] Text is readable at default size
- [ ] Buttons have clear labels
- [ ] Form fields have labels
- [ ] Error messages are clear
- [ ] Success messages are clear

## 🔐 Security Testing

### Permissions
- [ ] Camera permission is requested when needed
- [ ] Photo library permission is requested when needed
- [ ] Permission alerts have descriptive messages
- [ ] App handles denied permissions gracefully

### Data Security
- [ ] API keys are not logged
- [ ] Credentials are stored securely
- [ ] Network requests use HTTPS
- [ ] No sensitive data in screenshots

## ⚡ Performance Testing

### App Performance
- [ ] App launches in < 2 seconds
- [ ] Tab switching is instant
- [ ] Form inputs are responsive
- [ ] Image loading is fast
- [ ] No memory leaks
- [ ] No excessive battery drain

### Network Performance
- [ ] Bug submission completes in reasonable time
- [ ] Large screenshots upload successfully
- [ ] Network errors are handled gracefully
- [ ] Timeout errors are handled

## 🐛 Edge Cases

### Empty States
- [ ] No projects: shows empty state
- [ ] No screenshot: can still submit
- [ ] No email: can still submit
- [ ] No connection key: works fine

### Error States
- [ ] Invalid project ID: shows error
- [ ] Invalid API key: shows error
- [ ] Network offline: shows error
- [ ] Server error: shows error

### Boundary Cases
- [ ] Very long project name: truncates correctly
- [ ] Very long bug title: handles correctly
- [ ] Very long description: handles correctly
- [ ] Very large screenshot: compresses correctly
- [ ] Many projects (20+): scrolls correctly

## 📊 Test Results

### Summary

| Category | Tests | Passed | Failed | Notes |
|----------|-------|--------|--------|-------|
| Installation | | | | |
| Projects | | | | |
| Bug Reporting | | | | |
| Settings | | | | |
| Navigation | | | | |
| Integration | | | | |
| Device Support | | | | |
| UI/UX | | | | |
| Security | | | | |
| Performance | | | | |
| Edge Cases | | | | |
| **TOTAL** | | | | |

### Issues Found

| # | Issue | Severity | Status | Notes |
|---|-------|----------|--------|-------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

## ✅ Sign-Off

### Tester Information
- **Name**: ___________________________
- **Date**: ___________________________
- **Device**: ___________________________
- **iOS Version**: ___________________________

### Approval
- [ ] All critical features working
- [ ] No blocking bugs found
- [ ] Ready for deployment

**Signature**: ___________________________

---

## 📝 Notes

Use this section for additional observations, suggestions, or feedback:

```
[Your notes here]
```

---

**Testing Complete! 🎉**

If all items are checked, the app is ready for:
- [ ] TestFlight beta testing
- [ ] App Store submission
- [ ] Production deployment

For issues or questions, contact: harshsharmaqa@gmail.com
