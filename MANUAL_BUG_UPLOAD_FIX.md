# Manual Bug Upload Fix

## Issue Fixed
**Problem**: Manual bug creation from dashboard was failing to save screenshots, assignees, tags, due dates, and URLs.

**Root Cause**: The `dashboardManualCreateBug` mutation only accepted basic fields (title, description, priority, type, category) but the UI was trying to set additional fields through a separate `updateBug` call, which didn't accept `url` or `screenshotStorageId`.

## Solution

### 1. Enhanced `dashboardManualCreateBug` Mutation
**File**: `convex/bugs.ts`

**Added Fields**:
- ✅ `assigneeId` - Assign bug to team member
- ✅ `tags` - Add tags during creation
- ✅ `dueDate` - Set due date
- ✅ `url` - Custom URL for the bug
- ✅ `screenshotStorageId` - Uploaded screenshot/video
- ✅ `mediaType` - Type of media (image/video)

**Before**:
```typescript
args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.optional(...),
    type: v.optional(v.string()),
    category: v.optional(v.string()),
    devToken: v.string(),
}
```

**After**:
```typescript
args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.optional(...),
    type: v.optional(v.string()),
    category: v.optional(v.string()),
    assigneeId: v.optional(v.string()),      // NEW
    tags: v.optional(v.array(v.string())),   // NEW
    dueDate: v.optional(v.number()),         // NEW
    url: v.optional(v.string()),             // NEW
    screenshotStorageId: v.optional(v.id("_storage")), // NEW
    mediaType: v.optional(v.string()),       // NEW
    devToken: v.string(),
}
```

### 2. Updated CreateBugModal Component
**File**: `app/dashboard/[projectId]/page.tsx`

**Changes**:
- ✅ Upload screenshot and get storage ID
- ✅ Pass all fields to `createBug` in single call
- ✅ Removed separate `updateBug` call
- ✅ Properly detect media type (image/video)
- ✅ Handle upload errors gracefully

**Before** (2 API calls):
```typescript
// 1. Create bug with basic fields
const newBugId = await createBug({
    projectId,
    title,
    description,
    priority,
    type,
    category,
    devToken
});

// 2. Update with additional fields (FAILED - url/screenshot not accepted)
await updateBug({
    bugId: newBugId,
    assigneeId,
    tags,
    dueDate,
    url,
    screenshotUrl, // ❌ Not accepted by updateBug
    devToken
});
```

**After** (1 API call):
```typescript
// Create bug with ALL fields at once
const newBugId = await createBug({
    projectId,
    title,
    description,
    priority,
    type,
    category,
    assigneeId,           // ✅ Now included
    tags,                 // ✅ Now included
    dueDate,              // ✅ Now included
    url,                  // ✅ Now included
    screenshotStorageId,  // ✅ Now included
    mediaType,            // ✅ Now included
    devToken
});
```

## Features Now Working

### 1. Screenshot/Video Upload
- ✅ Upload images (PNG, JPG, GIF, etc.)
- ✅ Upload videos (MP4, WebM, etc.)
- ✅ File size validation (max 10MB)
- ✅ Preview before submission
- ✅ Remove uploaded file
- ✅ Proper storage in Convex

### 2. Assignee Selection
- ✅ Assign to team members
- ✅ Dropdown with all project members
- ✅ Shows member name and email
- ✅ Optional (can leave unassigned)

### 3. Tags Management
- ✅ Add multiple tags
- ✅ Remove tags
- ✅ Tag input with Enter key
- ✅ Visual tag chips

### 4. Due Date
- ✅ Date picker
- ✅ Optional field
- ✅ Stored as Unix timestamp

### 5. Custom URL
- ✅ Add custom URL for bug
- ✅ Optional field
- ✅ Useful for linking to external resources

### 6. All Basic Fields
- ✅ Title (required)
- ✅ Description
- ✅ Priority (low/medium/high/critical)
- ✅ Type (general/ui/performance/etc.)
- ✅ Category

## Testing

### Test Cases Verified
1. ✅ Create bug with title only
2. ✅ Create bug with all fields
3. ✅ Upload screenshot
4. ✅ Upload video
5. ✅ Assign to team member
6. ✅ Add multiple tags
7. ✅ Set due date
8. ✅ Add custom URL
9. ✅ Create in specific status column
10. ✅ Handle upload errors gracefully

### Error Handling
- ✅ File size validation (max 10MB)
- ✅ File type validation (images/videos only)
- ✅ Upload failure handling (continues without screenshot)
- ✅ Network error handling
- ✅ Validation error messages

## Usage

### Creating a Manual Bug

1. **Open Modal**
   - Click "New Issue" button
   - Or click "+" in any Kanban column

2. **Fill Required Fields**
   - Title (required)

3. **Fill Optional Fields**
   - Description
   - Priority (default: medium)
   - Type (default: general)
   - Category
   - Assignee (select from dropdown)
   - Tags (add multiple)
   - Due Date (date picker)
   - URL (custom link)

4. **Upload Media** (optional)
   - Click "Upload Screenshot/Video"
   - Select file (max 10MB)
   - Preview appears
   - Can remove and re-upload

5. **Submit**
   - Click "Create Issue"
   - Bug appears in dashboard immediately
   - All fields saved correctly

## Benefits

### For Users
1. **Single Step Creation** - All fields in one form
2. **Visual Feedback** - Preview screenshots before upload
3. **Flexible** - All fields optional except title
4. **Fast** - Single API call instead of two
5. **Reliable** - Proper error handling

### For Developers
1. **Cleaner Code** - Single mutation call
2. **Better Performance** - One API call instead of two
3. **Type Safe** - Full TypeScript validation
4. **Maintainable** - All logic in one place
5. **Extensible** - Easy to add more fields

## Technical Details

### Screenshot Upload Flow
```
1. User selects file
   ↓
2. Validate file (size, type)
   ↓
3. Generate upload URL (Convex)
   ↓
4. Upload file to Convex storage
   ↓
5. Get storage ID
   ↓
6. Pass storage ID to createBug
   ↓
7. Bug created with screenshot reference
```

### Media Type Detection
```typescript
mediaType: screenshot ? 
    (screenshot.type.startsWith('video/') ? 'video' : 'image') 
    : undefined
```

### Data Storage
- **Screenshots**: Stored in Convex `_storage`
- **Storage ID**: Saved as `screenshotStorageId` in bug document
- **Media Type**: Saved as `mediaType` ('image' or 'video')
- **URL**: Saved as `url` field
- **Tags**: Saved as array of strings
- **Due Date**: Saved as Unix timestamp (milliseconds)

## Migration Notes

### Backward Compatibility
- ✅ Existing bugs unaffected
- ✅ Old bugs without screenshots still work
- ✅ All existing fields preserved
- ✅ No database migration needed

### API Changes
- ✅ `dashboardManualCreateBug` now accepts more fields
- ✅ All new fields are optional
- ✅ Existing code continues to work
- ✅ No breaking changes

## Future Enhancements

### Potential Additions
1. **Multiple Screenshots** - Upload multiple images
2. **Drag & Drop** - Drag files to upload
3. **Paste from Clipboard** - Paste screenshots directly
4. **Image Editing** - Crop/annotate before upload
5. **Video Recording** - Record screen directly
6. **Bulk Upload** - Upload multiple files at once

### Performance Optimizations
1. **Image Compression** - Compress before upload
2. **Lazy Loading** - Load images on demand
3. **Thumbnail Generation** - Generate thumbnails
4. **CDN Integration** - Serve from CDN

## Troubleshooting

### Upload Fails
**Problem**: Screenshot upload fails
**Solutions**:
- Check file size (must be < 10MB)
- Verify file type (images/videos only)
- Check network connection
- Try smaller file
- Check browser console for errors

### Fields Not Saving
**Problem**: Assignee/tags/date not saving
**Solutions**:
- Ensure fields are filled before submit
- Check browser console for errors
- Verify user has permissions
- Try refreshing page

### Preview Not Showing
**Problem**: Screenshot preview doesn't appear
**Solutions**:
- Check file is valid image/video
- Try different file
- Check browser supports FileReader API
- Clear browser cache

## Support

### Getting Help
1. Check browser console for errors
2. Verify file meets requirements
3. Test with different file
4. Check network tab for failed requests
5. Contact support with error details

### Reporting Issues
Include:
- File type and size
- Browser and version
- Error messages
- Steps to reproduce
- Screenshots of issue

## Conclusion

The manual bug upload feature is now **fully functional** with:
- ✅ Complete field support
- ✅ Screenshot/video upload
- ✅ Proper error handling
- ✅ Single API call
- ✅ Type safety
- ✅ User-friendly interface

All manually created bugs now save with complete data including screenshots, assignees, tags, due dates, and custom URLs! 🎉
