# Bug Import Guide

## Overview
The import functionality allows you to bulk import bugs from CSV or JSON files into your BugScribe project.

## Access
- Navigate to your project dashboard
- Click the **IMPORT** button in the toolbar (admin only)
- The import modal will open

## Supported Formats

### CSV Format
```csv
title,description,status,priority,type,category,assigneeEmail,tags,reporterName,reporterEmail,browser,os,url,dueDate
"Login button not working","Users cannot click the login button","open","high","ui_ux","authentication","john@example.com","login,mobile","Jane Doe","jane@example.com","Chrome","iOS 17","https://example.com/login","2024-12-31"
```

### JSON Format
```json
[
  {
    "title": "Login button not working",
    "description": "Users cannot click the login button",
    "status": "open",
    "priority": "high",
    "type": "ui_ux",
    "category": "authentication",
    "assigneeEmail": "john@example.com",
    "tags": ["login", "mobile"],
    "reporterName": "Jane Doe",
    "reporterEmail": "jane@example.com",
    "browser": "Chrome",
    "os": "iOS 17",
    "url": "https://example.com/login",
    "dueDate": "2024-12-31"
  }
]
```

## Field Reference

### Required Fields
- **title** (string): Bug title/summary

### Optional Fields
- **description** (string): Detailed description
- **status** (string): Must match one of your project's statuses (e.g., "open", "in_progress", "resolved", "closed")
- **priority** (string): One of: "low", "medium", "high", "critical"
- **type** (string): Bug type (e.g., "general", "ui_ux", "performance", "security", "crash")
- **category** (string): Custom category label
- **assigneeEmail** (string): Email of team member (must be a project member)
- **tags** (array/string): Tags for the bug (comma-separated in CSV, array in JSON)
- **reporterName** (string): Name of person who reported the bug
- **reporterEmail** (string): Email of reporter
- **browser** (string): Browser name and version
- **os** (string): Operating system
- **url** (string): URL where bug was found
- **dueDate** (string): Due date in YYYY-MM-DD or ISO 8601 format

## How to Import

1. **Download Template**
   - Click "CSV Template" or "JSON Template" to download a pre-formatted template
   - Fill in your bug data following the format

2. **Prepare Your File**
   - Ensure all required fields are present
   - Validate that statuses match your project's statuses
   - Verify assignee emails match project members
   - Check date formats (YYYY-MM-DD)

3. **Upload and Import**
   - Click "Select File" and choose your CSV or JSON file
   - Review the file details
   - Click "Import Bugs"
   - Wait for the import to complete

4. **Review Results**
   - The modal will show:
     - Number of successfully imported bugs
     - Number of failed imports
     - Detailed error messages for failed rows

## Tips

- **Start Small**: Test with a few bugs first to ensure your format is correct
- **Use Templates**: Always start with the downloaded template to ensure correct formatting
- **Validate Data**: Check that all emails, statuses, and dates are valid before importing
- **Assignees**: Only team members already added to the project can be assigned
- **Statuses**: Use your project's custom statuses or the defaults (open, in_progress, resolved, closed)
- **Tags**: Keep tags short and consistent for better organization

## Common Errors

### "Row X: Project not found"
- The project ID is invalid or you don't have access

### "Row X: Invalid status"
- The status doesn't match any of your project's statuses
- Check your project's status buckets and use the exact value

### "Row X: Assignee not found"
- The email doesn't match any project member
- Add the team member to the project first, or leave assigneeEmail empty

### "Row X: Invalid date format"
- Use YYYY-MM-DD format (e.g., "2024-12-31")
- Or use ISO 8601 format (e.g., "2024-12-31T23:59:59Z")

### "Row X: Missing required field 'title'"
- Every bug must have a title
- Check that the title column/field is not empty

## Limits

- Maximum file size: 10MB
- Recommended batch size: 1000 bugs per import
- For larger imports, split into multiple files

## After Import

- Imported bugs will appear immediately in your dashboard
- Issue numbers are automatically assigned sequentially
- All bugs are logged in the activity feed
- Team members will see the new bugs in their assigned views

## Export and Re-import

You can export bugs to CSV and re-import them to another project:
1. Export bugs from source project (CSV button)
2. Modify the CSV if needed
3. Import into target project using the IMPORT button

Note: Screenshots and attachments are not included in CSV exports and must be re-uploaded manually.
