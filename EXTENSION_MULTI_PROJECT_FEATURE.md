# BugScribe Extension - Multiple Projects Feature

## Overview
Users can now add and manage multiple project connections in the extension, making it easy to report bugs across different projects without re-entering credentials.

## Features

### 1. ✅ Settings Icon in Header
- Gear icon visible in top-right corner
- Rotates on hover for visual feedback
- Opens project management view

### 2. ✅ Multiple Project Support
- Add unlimited projects
- Each project stored with:
  - Custom name (optional)
  - Project ID
  - API Key
  - Connection Key
  - Timestamp

### 3. ✅ Project Management
- **View All Projects**: List of all added projects
- **Switch Projects**: Click any project card to switch
- **Active Indicator**: Current project highlighted with purple border
- **Remove Projects**: Delete button on each card
- **Project Info**: Shows project name and truncated ID

### 4. ✅ Smart Project Cards
- Hover effects with smooth animations
- Active project has purple gradient background
- Delete button appears on hover
- Click card to switch projects
- Prevents duplicate projects

## User Interface

### Setup View
```
┌─────────────────────────────────┐
│ 🗂️ Your Projects                │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ ● My Website                │ │ ← Active (purple)
│ │   jd7ea6x3...               │ │
│ │                         🗑️  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │   Client Project            │ │
│ │   kd7636j...                │ │
│ │                         🗑️  │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 🔑 Add New Project              │
│ [Connection Key Input]          │
│ [Project Name (optional)]       │
│ [➕ Add Project]                │
└─────────────────────────────────┘
```

### Project Card States
- **Default**: White background, gray border
- **Hover**: Light background, purple border, slight lift
- **Active**: Purple gradient, purple border, glow effect
- **Delete Hover**: Red tint on delete button

## How It Works

### Adding a Project
1. Click settings icon (⚙️)
2. Paste connection key
3. Optionally enter project name
4. Click "Add Project"
5. Project added to list and set as active

### Switching Projects
1. Click settings icon
2. Click any project card
3. Extension switches to that project
4. Automatically checks if reporting is enabled
5. Shows appropriate view (name/report/disabled)

### Removing a Project
1. Hover over project card
2. Click delete button (🗑️)
3. Confirm deletion
4. If active project removed, switches to first available
5. If last project removed, shows setup view

## Storage Structure

```javascript
{
  bugscribeProjects: [
    {
      id: "1234567890",
      name: "My Website",
      projectId: "jd7ea6x3...",
      apiKey: "abc123...",
      connectionKey: "base64...",
      addedAt: 1234567890000
    },
    // ... more projects
  ],
  bugscribeActiveProject: "1234567890",
  
  // Legacy compatibility
  bugscribeProjectId: "jd7ea6x3...",
  bugscribeApiKey: "abc123...",
  bugscribeConnectionKey: "base64..."
}
```

## Benefits

1. **Multi-Client Support**: Freelancers/agencies can manage multiple clients
2. **Easy Switching**: One click to switch between projects
3. **No Re-authentication**: Credentials saved securely
4. **Project Organization**: Custom names for easy identification
5. **Clean Interface**: Intuitive project management
6. **Backward Compatible**: Works with existing single-project setup

## User Workflow

```
Install Extension
       ↓
Add First Project
       ↓
Enter Name (if new user)
       ↓
Report Bugs
       ↓
Need Different Project?
       ↓
Click Settings → Select Project
       ↓
Continue Reporting
```

## Technical Details

### Data Migration
- Existing single-project users automatically migrated
- First project created from existing credentials
- Named "Project 1" by default
- Seamless upgrade experience

### Security
- All credentials stored in Chrome's secure storage
- No credentials sent to external servers
- Each project isolated
- API keys never exposed in UI

### Performance
- Instant project switching
- No page reloads required
- Efficient storage usage
- Fast project list rendering

## Future Enhancements

- Project search/filter
- Project tags/categories
- Recently used projects
- Project usage statistics
- Bulk project import
- Project sync across devices
- Team project sharing
- Project templates

## Testing Checklist

- [ ] Add first project
- [ ] Add second project
- [ ] Switch between projects
- [ ] Remove a project
- [ ] Remove active project
- [ ] Remove last project
- [ ] Add duplicate project (should fail)
- [ ] Invalid connection key (should fail)
- [ ] Project name with special characters
- [ ] Long project names (truncation)
- [ ] Hover effects work
- [ ] Active indicator shows correctly
- [ ] Settings icon rotates on hover
- [ ] Smooth animations
- [ ] Mobile responsive

## Support

If users have issues:
1. Check Chrome storage isn't full
2. Verify connection keys are valid
3. Try removing and re-adding project
4. Clear extension data and start fresh
5. Check console for errors
