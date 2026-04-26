# Complete Export/Import Guide

## Overview
BugScribe now supports **100% complete** export and import of ALL bug data, including:
- ✅ All manually added issues
- ✅ All widget-captured issues  
- ✅ Screenshots and media URLs
- ✅ Complete environment metadata
- ✅ Performance data and logs
- ✅ All timestamps and custom fields

## Export Features

### CSV Export (Fast)
Exports all bugs to a CSV file with **ALL fields**:

**Included Fields:**
- Core: Issue Number, ID, Title, Description
- Workflow: Status, Priority, Type, Category, Tags
- Assignment: Assignee Name, Email, ID
- Reporter: Reporter Name, Email
- Timestamps: Created At, Updated At, Due Date
- Environment: URL, Page URL, Browser, OS, User Agent, Device Type
- Screen Data: Width, Height, Resolution, Scroll positions, Coordinates
- Performance: Page Load Time, Console Errors, Network Logs
- Media: Screenshot URL, Media Type, Steps
- Additional: Environment Data, Custom Fields, Tracker URL

**Usage:**
1. Go to project dashboard
2. Click "Export" dropdown
3. Select "CSV Export"
4. File downloads instantly

### ZIP Export with Images
Exports bugs to ZIP containing:
- CSV file with all data
- All screenshots/media files
- Organized folder structure

**Usage:**
1. Go to project dashboard
2. Click "Export" dropdown
3. Select "Export with Images"
4. Wait for ZIP generation
5. Download complete package

## Import Features

### Supported Formats
- **CSV** - Comma-separated values
- **JSON** - JavaScript Object Notation

### All Supported Fields

#### Required Fields
- `title` - Bug title/summary

#### Optional Fields (use any combination)

**Core Fields:**
- `description` - Detailed description
- `status` - Bug status (must match project statuses)
- `priority` - low | medium | high | critical
- `type` - Bug type/category
- `category` - Additional categorization

**Assignment & Workflow:**
- `assigneeEmail` - Assignee's email (must match project member)
- `tags` - Array of tags (CSV: comma-separated)
- `dueDate` - Due date (YYYY-MM-DD or ISO 8601)

**Reporter Information:**
- `reporterName` - Who reported the bug
- `reporterEmail` - Reporter's email

**Environment Metadata:**
- `browser` - Browser name and version
- `os` - Operating system
- `url` - Page URL where bug occurred
- `page_url` - Alternative page URL field
- `userAgent` - Full user agent string
- `deviceType` - mobile | desktop | tablet
- `screenResolution` - e.g., "1920x1080"

**Screen & Scroll Data:**
- `screenWidth` - Screen width in pixels
- `screenHeight` - Screen height in pixels
- `scrollX` - Horizontal scroll position
- `scrollY` - Vertical scroll position
- `x_coordinate` - Click X coordinate
- `y_coordinate` - Click Y coordinate
- `scroll_position` - Scroll position
- `element_selector` - CSS selector of element

**Performance & Logs:**
- `pageLoadTime` - Page load time in ms
- `consoleErrors` - Array of console errors
- `networkLogs` - Array of network requests

**Media & Evidence:**
- `screenshotUrl` - External screenshot URL
- `mediaType` - image | video
- `steps` - Array of reproduction steps

**Timestamps:**
- `createdAt` - Creation timestamp (Unix ms or ISO date)
- `issueNumber` - Issue number (auto-increments if not provided)

**Additional Data:**
- `environmentData` - Custom environment data (JSON)
- `customField` - Any custom data (JSON)
- `trackerUrl` - External tracker URL

### CSV Import Example

```csv
title,description,status,priority,type,assigneeEmail,tags,browser,os,url,screenshotUrl,dueDate
"Login fails","Cannot login on mobile","open","high","ui","john@example.com","login,mobile","Chrome","iOS","https://example.com/login","https://example.com/screenshot.png","2024-12-31"
"Slow load","Homepage slow","in_progress","medium","performance","","performance","Chrome","Windows","https://example.com","","2024-12-25"
```

### JSON Import Example

```json
[
  {
    "title": "Login button not working",
    "description": "Users cannot click the login button on mobile devices",
    "status": "open",
    "priority": "high",
    "type": "ui",
    "category": "authentication",
    "assigneeEmail": "john@example.com",
    "tags": ["login", "mobile"],
    "reporterName": "Jane Doe",
    "reporterEmail": "jane@example.com",
    "browser": "Chrome Mobile",
    "os": "iOS 17",
    "url": "https://example.com/login",
    "screenshotUrl": "https://example.com/screenshot.png",
    "mediaType": "image",
    "pageLoadTime": 2500,
    "consoleErrors": ["Error: Cannot read property 'click' of null"],
    "steps": ["Navigate to login", "Click button", "Observe error"],
    "dueDate": "2024-12-31",
    "createdAt": 1705318200000,
    "issueNumber": 1
  }
]
```

## Import Process

### Step 1: Prepare Your Data
1. Export existing bugs (optional - for backup)
2. Prepare CSV or JSON file with your data
3. Ensure all required fields are present
4. Validate assignee emails match project members

### Step 2: Import
1. Go to project dashboard
2. Click "Import" button
3. Select your CSV or JSON file
4. Review import preview
5. Click "Import" to proceed

### Step 3: Verify
1. Check import results summary
2. Review imported bugs in dashboard
3. Verify all fields imported correctly
4. Check for any errors in import log

## Data Validation

### Automatic Validation
- **Status**: Must match project statuses (defaults to "open" if invalid)
- **Priority**: Must be low/medium/high/critical (defaults to "medium")
- **Assignee**: Email must match project member (ignored if not found)
- **Dates**: Parsed automatically (ISO 8601 or YYYY-MM-DD)
- **Issue Numbers**: Auto-increments if not provided

### Error Handling
- Invalid rows are skipped
- Errors are logged with row numbers
- Valid rows are imported successfully
- Summary shows: imported count, failed count, error details

## Manually Added Issues

### Full Support
All manually created issues are:
- ✅ Exported with complete data
- ✅ Include all custom fields
- ✅ Preserve timestamps
- ✅ Maintain issue numbers
- ✅ Include assignee information

### Re-importing
When re-importing exported data:
- Issue numbers are preserved (if provided)
- Timestamps are preserved (if provided)
- All metadata is restored
- Screenshots URLs are maintained

## Best Practices

### Before Export
1. **Clean up data** - Remove test/duplicate bugs
2. **Update statuses** - Ensure all bugs have correct status
3. **Assign owners** - Assign bugs to team members
4. **Add tags** - Tag bugs for better organization

### Before Import
1. **Backup first** - Export current data before importing
2. **Validate format** - Check CSV/JSON structure
3. **Test small batch** - Import 5-10 bugs first
4. **Check members** - Ensure assignee emails exist in project

### After Import
1. **Verify counts** - Check total bug count
2. **Spot check** - Review random bugs for accuracy
3. **Check assignments** - Verify assignees are correct
4. **Review errors** - Fix any failed imports

## Common Use Cases

### 1. Backup & Restore
```
Export → Store safely → Import when needed
```

### 2. Migration
```
Export from old system → Transform data → Import to BugScribe
```

### 3. Bulk Updates
```
Export → Edit in Excel/Sheets → Import updated data
```

### 4. Data Analysis
```
Export → Analyze in BI tools → Generate insights
```

### 5. Integration
```
Export → Send to external tools → Process results
```

## Troubleshooting

### Import Fails
**Problem**: Import button doesn't work
**Solution**: 
- Check file format (CSV or JSON)
- Verify file size (< 10MB recommended)
- Check browser console for errors

### Missing Fields
**Problem**: Some fields not imported
**Solution**:
- Check field names match exactly
- Verify data types are correct
- Review import error log

### Assignee Not Set
**Problem**: Assignee email not working
**Solution**:
- Verify email matches project member exactly
- Check member has access to project
- Use lowercase email addresses

### Screenshots Not Showing
**Problem**: Screenshot URLs not displaying
**Solution**:
- Ensure URLs are publicly accessible
- Check URL format is correct
- Verify mediaType is set to "image"

### Date Format Issues
**Problem**: Dates not parsing correctly
**Solution**:
- Use ISO 8601 format: "2024-12-31T10:30:00Z"
- Or simple format: "2024-12-31"
- For timestamps: Unix milliseconds (1705318200000)

## Advanced Features

### Preserving Issue Numbers
Include `issueNumber` field to maintain sequential numbering:
```json
{
  "title": "Bug 1",
  "issueNumber": 1
}
```

### Custom Fields
Store additional data in `customField`:
```json
{
  "title": "Bug with custom data",
  "customField": {
    "externalId": "JIRA-123",
    "severity": "blocker",
    "customMetric": 42
  }
}
```

### External Tracker Links
Link to external bug trackers:
```json
{
  "title": "Linked bug",
  "trackerUrl": "https://jira.example.com/browse/BUG-123"
}
```

### Bulk Tag Management
Add multiple tags efficiently:
```csv
title,tags
"Bug 1","urgent,mobile,login"
"Bug 2","performance,api"
```

## API Integration

### Programmatic Export
```javascript
// Export all bugs
const response = await fetch('/api/export', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ projectId: 'xxx' })
});
const data = await response.json();
```

### Programmatic Import
```javascript
// Import bugs
const response = await fetch('/api/import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'xxx',
    bugs: [/* bug data */]
  })
});
const result = await response.json();
console.log(`Imported: ${result.imported}, Failed: ${result.failed}`);
```

## Support

### Getting Help
1. Check this documentation
2. Review import error messages
3. Check browser console
4. Contact support with:
   - Import file (sample)
   - Error messages
   - Steps to reproduce

### Reporting Issues
Include:
- File format (CSV/JSON)
- Number of bugs
- Error messages
- Browser and version
- Screenshots of issue
