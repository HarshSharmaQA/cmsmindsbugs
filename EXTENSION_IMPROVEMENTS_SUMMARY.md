# BugScribe Extension - User Name & Admin Control Features

## Summary of Changes

### 1. ✅ User Name Collection
- Added a new "Name View" step before users can report bugs
- Users must enter their name (required) and optionally their email
- Name is stored in Chrome storage and included with all bug reports
- Smooth flow: Setup → Name → Report

### 2. ✅ Admin Control - Disable Bug Reporting
- Added `reportingEnabled` field to projects schema
- Admins can toggle bug reporting on/off from dashboard settings
- When disabled, extension shows a "Bug Reporting Disabled" message
- Extension checks reporting status on load

### 3. ✅ Multiple Bug Reports
- After successful submission, users can click "Report Another"
- Form resets but keeps user name and connection
- Smooth workflow for reporting multiple issues

## Files Modified

### Extension Files

1. **extension/popup.html**
   - Added `nameView` section for collecting user name/email
   - Added `disabledView` for when reporting is disabled
   - Clean UI with icons and helpful messages

2. **extension/popup.js**
   - Added `checkReportingStatus()` function
   - Added `showNameView()` and `showDisabledView()` functions
   - Added name save handler
   - Updated bug submission to include reporter name/email
   - Checks reporting status on extension load

3. **extension/content.js**
   - Side tab remains visible when widget is open
   - Click outside to close widget
   - Smooth animations and transitions

### Backend Files

4. **convex/schema.ts**
   - Added `reportingEnabled: v.optional(v.boolean())` to projects table
   - Defaults to `true` (enabled) if not set

5. **convex/projects.ts**
   - Added `toggleReporting` mutation for admins
   - Added `checkReportingStatus` query for extension
   - Proper permission checks (owner/admin only)

### Dashboard Files

6. **app/dashboard/[projectId]/page.tsx**
   - Need to add Bug Reporting toggle in Settings tab
   - Toggle switch with purple styling
   - Shows current status with descriptive text

## Implementation Steps

### Step 1: Add Dashboard Toggle UI

In `app/dashboard/[projectId]/page.tsx`, find the Settings/API section and add:

```tsx
{/* Bug Reporting Toggle */}
<div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-800">Bug Reporting</h3>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input 
                type="checkbox" 
                checked={project.reportingEnabled !== false}
                onChange={async (e) => {
                    const toggleReporting = useMutation(api.projects.toggleReporting);
                    try {
                        await toggleReporting({ 
                            projectId: project._id, 
                            enabled: e.target.checked,
                            devToken: devToken || undefined 
                        });
                        // Refresh project data
                        window.location.reload();
                    } catch (error) {
                        console.error("Failed to toggle reporting:", error);
                        alert("Failed to update setting. Please try again.");
                    }
                }}
                className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
    </div>
    <p className="text-xs text-slate-600">
        {project.reportingEnabled !== false 
            ? "Users can submit bug reports via the widget and extension." 
            : "Bug reporting is currently disabled. Users will see a message that reporting is unavailable."}
    </p>
</div>
```

### Step 2: Test the Flow

1. **Setup Extension:**
   - Install/reload extension
   - Enter connection key
   - Should see name collection screen

2. **Enter Name:**
   - Enter your name (required)
   - Optionally enter email
   - Click Continue

3. **Report Bugs:**
   - Take screenshot or record video
   - Fill in bug details
   - Submit report
   - Click "Report Another" to submit more

4. **Admin Disable:**
   - Go to dashboard Settings tab
   - Toggle "Bug Reporting" off
   - Reload extension
   - Should see "Bug Reporting Disabled" message

5. **Admin Enable:**
   - Toggle "Bug Reporting" back on
   - Reload extension
   - Should be able to report bugs again

## API Endpoint

The extension calls:
```
POST https://bugscribe.convex.site/api/check-reporting-status
Body: { projectId, apiKey }
Response: { enabled: boolean }
```

## User Experience Flow

```
┌─────────────────┐
│  Setup View     │
│  (Enter Key)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Name View      │
│  (Enter Name)   │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │ Check  │
    │Enabled?│
    └───┬────┘
        │
   ┌────┴────┐
   │         │
   ▼         ▼
┌──────┐  ┌──────────┐
│Report│  │ Disabled │
│ View │  │   View   │
└──┬───┘  └──────────┘
   │
   ▼
┌──────────┐
│ Submit   │
│  Bug     │
└──┬───────┘
   │
   ▼
┌──────────┐
│ Success  │
│  View    │
└──┬───────┘
   │
   ├─► Report Another (loop back to Report View)
   └─► Close
```

## Benefits

1. **Accountability** - All bugs have a reporter name
2. **Control** - Admins can pause bug reporting during maintenance
3. **Efficiency** - Users can quickly report multiple bugs
4. **Professional** - Clean, polished user experience
5. **Flexible** - Easy to enable/disable as needed

## Future Enhancements

- Add user avatars based on email (Gravatar)
- Track bug reports per user
- Add user preferences (default priority, etc.)
- Email notifications when reporting is re-enabled
- Scheduled enable/disable (maintenance windows)
