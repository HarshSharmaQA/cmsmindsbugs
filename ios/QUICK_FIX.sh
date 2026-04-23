#!/bin/bash

# BugScribe iOS - Quick Fix Script
# This script helps diagnose and fix common iOS app issues

echo "🔍 BugScribe iOS Diagnostic Tool"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -d "ios/BugScribe" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Found iOS project directory"
echo ""

# Check Xcode installation
echo "📱 Checking Xcode installation..."
if command -v xcodebuild &> /dev/null; then
    XCODE_VERSION=$(xcodebuild -version | head -n 1)
    echo "✅ $XCODE_VERSION"
else
    echo "❌ Xcode not found. Please install Xcode from the App Store."
    exit 1
fi
echo ""

# Check Swift version
echo "🔧 Checking Swift version..."
SWIFT_VERSION=$(swift --version | head -n 1)
echo "✅ $SWIFT_VERSION"
echo ""

# Check if all required files exist
echo "📂 Checking project files..."
REQUIRED_FILES=(
    "ios/BugScribe/BugScribe/BugScribeApp.swift"
    "ios/BugScribe/BugScribe/Views/ContentView.swift"
    "ios/BugScribe/BugScribe/Views/ProjectListView.swift"
    "ios/BugScribe/BugScribe/Views/BugReportView.swift"
    "ios/BugScribe/BugScribe/Views/AnnotationView.swift"
    "ios/BugScribe/BugScribe/Views/DrawingCanvas.swift"
    "ios/BugScribe/BugScribe/Models/Project.swift"
    "ios/BugScribe/BugScribe/Models/BugReport.swift"
    "ios/BugScribe/BugScribe/Services/NetworkManager.swift"
    "ios/BugScribe/BugScribe/Services/StorageManager.swift"
    "ios/BugScribe/BugScribe/Utilities/ScreenshotCapture.swift"
)

MISSING_FILES=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $(basename $file)"
    else
        echo "  ❌ Missing: $file"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ $MISSING_FILES -gt 0 ]; then
    echo ""
    echo "❌ $MISSING_FILES file(s) missing. Please restore them."
    exit 1
fi
echo ""

# Try to build the project
echo "🔨 Attempting to build the project..."
echo "This may take a minute..."
echo ""

cd ios/BugScribe

# Clean build folder
echo "Cleaning build folder..."
xcodebuild clean -project BugScribe.xcodeproj -scheme BugScribe &> /dev/null

# Try to build
BUILD_OUTPUT=$(xcodebuild -project BugScribe.xcodeproj -scheme BugScribe -destination 'platform=iOS Simulator,name=iPhone 15 Pro' build 2>&1)
BUILD_RESULT=$?

if [ $BUILD_RESULT -eq 0 ]; then
    echo "✅ BUILD SUCCESSFUL!"
    echo ""
    echo "🎉 Your iOS app is working correctly!"
    echo ""
    echo "To run the app:"
    echo "1. Open ios/BugScribe/BugScribe.xcodeproj in Xcode"
    echo "2. Select a simulator (iPhone 15 Pro recommended)"
    echo "3. Press Cmd+R to run"
    echo ""
else
    echo "❌ BUILD FAILED"
    echo ""
    echo "Common issues found:"
    echo ""
    
    # Check for PencilKit error
    if echo "$BUILD_OUTPUT" | grep -q "PencilKit"; then
        echo "⚠️  PencilKit framework issue detected"
        echo ""
        echo "FIX:"
        echo "1. Open BugScribe.xcodeproj in Xcode"
        echo "2. Select the BugScribe target"
        echo "3. Go to 'Build Phases' tab"
        echo "4. Expand 'Link Binary With Libraries'"
        echo "5. Click '+' and add 'PencilKit.framework'"
        echo "6. Clean (Cmd+Shift+K) and Build (Cmd+B)"
        echo ""
    fi
    
    # Check for signing issues
    if echo "$BUILD_OUTPUT" | grep -q "signing"; then
        echo "⚠️  Code signing issue detected"
        echo ""
        echo "FIX:"
        echo "1. Open BugScribe.xcodeproj in Xcode"
        echo "2. Select the BugScribe target"
        echo "3. Go to 'Signing & Capabilities' tab"
        echo "4. Check 'Automatically manage signing'"
        echo "5. Select your team"
        echo ""
    fi
    
    # Show first error
    echo "First error from build log:"
    echo "$BUILD_OUTPUT" | grep "error:" | head -n 3
    echo ""
    echo "For full build log, run:"
    echo "cd ios/BugScribe && xcodebuild -project BugScribe.xcodeproj -scheme BugScribe build"
fi

cd ../..

echo ""
echo "📚 For more help, see:"
echo "  - ios/FIX_COMMON_ISSUES.md"
echo "  - ios/TROUBLESHOOTING.md"
echo "  - ios/README.md"
echo ""
