# BugScribe iOS - Quick Start 🚀

Get up and running with BugScribe iOS in 5 minutes!

## TL;DR

```bash
# 1. Open the project
cd ios/BugScribe
open BugScribe.xcodeproj

# 2. In Xcode: Select a simulator and press Cmd+R
# 3. In the app: Add your project credentials
# 4. Start reporting bugs!
```

## Prerequisites Checklist

- [ ] macOS computer
- [ ] Xcode 15+ installed
- [ ] BugScribe backend running (or use production URL)
- [ ] Project ID and API Key from BugScribe dashboard

## 5-Minute Setup

### 1️⃣ Open Project (30 seconds)

```bash
cd ios/BugScribe
open BugScribe.xcodeproj
```

### 2️⃣ Run App (1 minute)

1. Select **iPhone 15 Pro** simulator from the device menu
2. Press **▶️** or `Cmd + R`
3. Wait for the app to build and launch

### 3️⃣ Add Project (2 minutes)

**Get credentials from web dashboard:**
1. Go to `http://localhost:3000`
2. Sign in and create/select a project
3. Copy the Project ID and API Key

**Add to iOS app:**
1. Tap the **"+"** button
2. Enter:
   - Name: "My Project"
   - Project ID: (paste)
   - API Key: (paste)
3. Tap **"Add Project"**

### 4️⃣ Set Your Name (30 seconds)

1. Go to **Settings** tab
2. Enter your name
3. Tap **"Save User Information"**

### 5️⃣ Report First Bug (1 minute)

1. Go to **"Report Bug"** tab
2. Fill in:
   - Title: "Test bug"
   - Description: "Testing iOS app"
3. Tap **"Choose from Library"** and select any image
4. Tap **"Submit Bug Report"**
5. ✅ Success!

## Verify It Works

1. Open web dashboard at `http://localhost:3000`
2. Go to your project
3. See your bug report in the "New Issues" column

## Common Issues

| Problem | Solution |
|---------|----------|
| Can't build | Clean build folder: `Cmd + Shift + K` |
| No projects showing | Tap the "+" button to add one |
| Submit fails | Check project ID and API key |
| Camera not working | Grant permissions in iOS Settings |

## What's Next?

- ✏️ Try the annotation tools
- 📸 Test with different screenshot types
- 🎨 Experiment with colors and drawing tools
- 🔄 Submit multiple bugs and see them in the dashboard

## Features at a Glance

| Feature | Description |
|---------|-------------|
| 📁 Projects | Manage multiple BugScribe projects |
| 📸 Screenshots | Camera or photo library |
| ✏️ Annotations | Draw, highlight, and mark up |
| 🎨 Colors | 6 colors for annotations |
| 🐛 Bug Types | 6 types: General, UI/UX, Performance, etc. |
| ⚡ Priorities | Low, Medium, High, Critical |
| 📱 Device Info | Automatically captured |
| 🔄 Real-time | Syncs with backend instantly |

## Pro Tips

💡 **Shake to Report**: (Coming soon) Shake your device to quickly report a bug

💡 **Annotation Shortcuts**: 
- Use the pen for freehand drawing
- Use the marker for highlighting areas
- Use the eraser to fix mistakes

💡 **Multiple Projects**: Switch between projects in the Projects tab

💡 **Offline Mode**: (Coming soon) Reports will queue and sync when online

## Need Help?

- 📖 Full guide: [SETUP_GUIDE.md](SETUP_GUIDE.md)
- 📚 Documentation: [README.md](README.md)
- 🐛 Issues: Create a GitHub issue
- 📧 Email: harshsharmaqa@gmail.com

---

**You're all set! Start catching bugs! 🐛✨**
