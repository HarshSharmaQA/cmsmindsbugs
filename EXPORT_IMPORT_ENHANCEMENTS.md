# Export/Import Enhancements - Complete Package

## 🎉 What's New

Enhanced the BugScribe export and import functionality to include **all bug details**, **images**, and **assignee person selection** in a popup.

---

## ✨ Export Enhancements

### 1. **Comprehensive Data Export**

#### CSV Export Now Includes:
- ✅ **Issue Number** - Sequential issue tracking
- ✅ **Assignee Name** - Full name of assigned person
- ✅ **Assignee Email** - Email of assigned person
- ✅ **Assignee ID** - Internal user ID
- ✅ **Updated At** - Last modification timestamp
- ✅ **Tags** - All associated tags
- ✅ **Console Errors** - JavaScript errors captured
- ✅ **Network Logs** - Network requests captured
- ✅ **All metadata** - Browser, OS, screen size, etc.

#### ZIP Export with Images Includes:
- ✅ **All CSV data** - Complete bug information
- ✅ **Screenshots** - All bug screenshots (PNG format)
- ✅ **Screen Recordings** - Video captures (MP4 format)
- ✅ **Comprehensive README** - Detailed documentation
- ✅ **Proper file naming** - `screenshot_[issueNumber]_[bugId].png`
- ✅ **Progress logging** - Console feedback during export
- ✅ **Error handling** - Graceful failure for missing images

### 2. **Enhanced Export Data Structure**

**Before:**
```csv
ID, Title, Status, Priority, Assignee, ...
bug123, "Login fails", open, high, user@email.com, ...
```

**After:**
```csv
Issue Number, ID, Title, Status, Priority, Assignee Name, Assignee Email, Assignee ID, ...
42, bug123, "Login fails", open, high, "John Doe", "john@company.com", "user_abc123", ...
```

### 3. **Export Features**

#### CSV Export (Fast)
- **Speed:** Instant download
- **Size:** Small file size
- **Use Case:** Quick data backup, spreadsheet analysis
- **Includes:** All bug data, assignee names, tags, timestamps

#### ZIP Export with Images (Complete)
- **Speed:** Takes longer (downloads all media)
- **Size:** Larger file size (includes images/videos)
- **Use Case:** Complete backup, migration, archival
- **Includes:** Everything + screenshots + videos + README

---

## 📥 Import Enhancements

### 1. **Assignee Selection Popup**

#### New Feature: Default Assignee Selector
- ✅ **Popup interface** - Beautiful modal for selecting assignee
- ✅ **Search functionality** - Find team members quickly
- ✅ **Member avatars** - Visual identification
- ✅ **Unassigned option** - Leave bugs unassigned
- ✅ **Smart assignment** - Only applies to bugs without assignee

#### How It Works:
1. Click "Select Assignee" button in import modal
2. Search for team member by name or email
3. Select member or choose "Unassigned"
4. Import bugs - unassigned bugs get the default assignee

### 2. **Enhanced Import Support**

#### Now Supports:
- ✅ **Screenshot URLs** - Direct image links
- ✅ **Assignee by Email** - Match by email address
- ✅ **Assignee by ID** - Match by user ID
- ✅ **Console Errors** - Pipe-separated error logs
- ✅ **Network Logs** - Pipe-separated network data
- ✅ **Estimated Hours** - Time tracking data
- ✅ **Actual Hours** - Time tracking data
- ✅ **Due Dates** - ISO 8601 format
- ✅ **All metadata** - Coordinates, selectors, etc.

### 3. **Import CSV Format**

**Required Fields:**
- `title` - Bug title (required)

**Optional Fields:**
- `description` - Bug description
- `status` - Bug status
- `priority` - low, medium, high, critical
- `type` - Bug type/category
- `category` - Additional categorization
- `assigneeEmail` - Email to match assignee
- `assigneeId` - User ID to match assignee
- `tags` - Comma-separated tags
- `reporterName` - Reporter's name
- `reporterEmail` - Reporter's email
- `browser` - Browser information
- `os` - Operating system
- `url` - Page URL
- `screenshotUrl` - Direct image URL
- `dueDate` - Due date (YYYY-MM-DD or ISO 8601)
- `estimatedHours` - Estimated time
- `actualHours` - Actual time spent
- `consoleErrors` - Pipe-separated errors
- `networkLogs` - Pipe-separated logs

---

## 🎨 UI/UX Improvements

### Assignee Selector Popup
```
┌─────────────────────────────────────┐
│  Select Assignee              [X]   │
├─────────────────────────────────────┤
│  [🔍 Search members...]             │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 Unassigned               │   │
│  │    No assignee              │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ JD John Doe                 │   │
│  │    john@company.com         │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ JS Jane Smith               │   │
│  │    jane@company.com         │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Import Modal Features
- 🎨 **Beautiful gradient cards** - Visual hierarchy
- 🔍 **Search in assignee popup** - Quick filtering
- 📊 **Progress feedback** - Import status updates
- ⚠️ **Error reporting** - Detailed error messages
- ✅ **Success confirmation** - Import results summary

---

## 📊 Export Data Comparison

| Field | Old Export | New Export |
|-------|-----------|-----------|
| Issue Number | ❌ | ✅ |
| Assignee Name | ❌ | ✅ |
| Assignee Email | ❌ | ✅ |
| Assignee ID | ❌ | ✅ |
| Updated At | ❌ | ✅ |
| Tags | ❌ | ✅ |
| Console Errors | ✅ | ✅ |
| Network Logs | ❌ | ✅ |
| Screenshot URL | ✅ | ✅ |
| Media Type | ❌ | ✅ |
| Estimated Hours | ❌ | ✅ |
| Actual Hours | ❌ | ✅ |
| Coordinates | ❌ | ✅ |
| Element Selector | ❌ | ✅ |

---

## 🚀 Usage Examples

### Export with Images
```typescript
// Automatically includes assignee name and email
await exportBugsWithImages(
    bugs,
    "My Project",
    memberMap // { userId: { name: "John", email: "john@..." } }
);

// Creates ZIP with:
// - bugs.csv (with assignee names)
// - screenshots/ (all images)
// - README.txt (documentation)
```

### Import with Default Assignee
```typescript
// User selects assignee in popup
// Import applies assignee to unassigned bugs
await importBugs({
    projectId,
    bugs: parsedBugs,
    devToken
});
```

---

## 📝 CSV Export Example

```csv
Issue Number,ID,Title,Status,Priority,Assignee Name,Assignee Email,Assignee ID,Reporter Name,Reporter Email,Created At,Updated At,URL,Browser,OS,Screen Size,Description,Console Errors,Tags
42,bug_abc123,"Login button not working",open,high,"John Doe","john@company.com","user_123","Widget","",2026-04-24T10:30:00Z,2026-04-24T11:00:00Z,"https://app.example.com/login","Chrome 120","Windows 11","1920x1080","The login button does not respond to clicks","TypeError: Cannot read property 'submit' | Network timeout","ui,critical,login"
43,bug_def456,"Dashboard loads slowly",in_progress,medium,"Jane Smith","jane@company.com","user_456","Widget","",2026-04-24T09:15:00Z,2026-04-24T10:45:00Z,"https://app.example.com/dashboard","Firefox 121","macOS","2560x1440","Dashboard takes 5+ seconds to load","","performance,dashboard"
```

---

## 🎯 Benefits

### For Teams
- ✅ **Complete data export** - Never lose information
- ✅ **Easy migration** - Move between projects/systems
- ✅ **Backup & restore** - Full project backups
- ✅ **Assignee tracking** - Know who's responsible
- ✅ **Time tracking** - Estimated vs actual hours

### For Developers
- ✅ **All metadata** - Console errors, network logs
- ✅ **Visual context** - Screenshots and recordings
- ✅ **Coordinates** - Exact bug locations
- ✅ **Element selectors** - CSS selectors for debugging

### For Managers
- ✅ **Assignee reports** - Who's working on what
- ✅ **Time tracking** - Project estimates
- ✅ **Complete audit trail** - All timestamps
- ✅ **Easy imports** - Bulk bug creation

---

## 🔧 Technical Details

### Export Function Signature
```typescript
export async function exportBugsWithImages(
    bugs: BugExportData[],
    projectName: string,
    memberMap: Record<string, { name?: string; email?: string }>
): Promise<void>
```

### Import Function Signature
```typescript
export function ImportBugsModal({
    projectId: Id<"projects">,
    devToken: string | null,
    onClose: () => void,
    onSuccess?: () => void
}): JSX.Element
```

### Member Map Structure
```typescript
const memberMap: Record<string, { name?: string; email?: string }> = {
    "user_123": { name: "John Doe", email: "john@company.com" },
    "user_456": { name: "Jane Smith", email: "jane@company.com" }
};
```

---

## 📦 Files Modified

1. **`lib/exportWithImages.ts`**
   - Enhanced export data structure
   - Added assignee name and email fields
   - Added all metadata fields
   - Improved CSV escaping
   - Added progress logging

2. **`components/ImportBugsModal.tsx`**
   - Added AssigneeSelector popup component
   - Added search functionality
   - Enhanced CSV parsing
   - Added support for new fields

3. **`app/dashboard/[projectId]/page.tsx`**
   - Updated export handlers
   - Fixed member map structure
   - Added all bug fields to export

---

## ✅ Testing Checklist

- [x] Export CSV with assignee names
- [x] Export ZIP with images
- [x] Import CSV with assignee emails
- [x] Import with default assignee selection
- [x] Assignee popup search functionality
- [x] All metadata fields exported
- [x] Proper CSV escaping
- [x] Progress logging during export
- [x] Error handling for missing images

---

## 🎉 Summary

The export/import functionality now provides:
- **Complete data export** with assignee names and all metadata
- **Image/video export** in ZIP format with proper organization
- **Assignee selection popup** for easy bulk assignment during import
- **Enhanced CSV format** with 30+ fields
- **Better UX** with search, progress feedback, and error handling

All bugs can now be exported with full context (assignee names, images, metadata) and imported with easy assignee selection! 🚀

---

**Last Updated:** April 24, 2026  
**Version:** 2.0  
**Status:** ✅ Complete
