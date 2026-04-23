# Final Manual Fix Required

## Issue
The `app/dashboard/[projectId]/page.tsx` file has leftover code from the old BugDetailDrawer implementation that's causing build errors.

## Manual Fix Steps

1. Open `app/dashboard/[projectId]/page.tsx` in your editor

2. Find the line with `// ─── Quick Add Module Modal ───────────────────────────────────────────────────` (around line 1537)

3. Delete ALL code between that comment line and the line `function QuickAddModuleModal`

4. The file should look like this:
   ```typescript
   }

   // ─── Quick Add Module Modal ───────────────────────────────────────────────────

   function QuickAddModuleModal({ devToken, onClose, onCreated }: {
       devToken: string | null; onClose: () => void; onCreated: (slug: string) => void;
   }) {
   ```

5. Save the file

## What to Delete
Remove any code that looks like:
- `{bug.mediaType === "video" ? (`
- `<video src={bug.screenshotUrl}`
- `{activeTab === "env" && (`
- Any other JSX fragments or incomplete code blocks

## Result
Once cleaned up, the BugDetailDrawer will display with the new clean design:
- White background
- Two-column layout
- Clean tabs
- Metadata sidebar
- No build errors

## Alternative
If manual editing is difficult, you can:
1. Search for `// ─── Quick Add Module Modal`
2. Delete everything from after that comment until you see `function QuickAddModuleModal`
3. Make sure there's just a blank line between the comment and the function
